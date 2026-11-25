import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { and, type Database, eq, gte, isNull, schema, sql } from "@agenteschat/db";
import { type ArtifactDeps, fileBytesOf } from "../../artifacts";
import { UUID } from "../../authority";
import { NotFoundError } from "../../errors";
import { connectorBudgetLeft } from "../../limits";
import { fireRoutineEvent } from "../../routines";
import { replyThreadOf } from "../../runs";
import type { ToolContext, ToolDefinition, ToolOutput, ToolSource } from "../../tools/types";
import { CONNECTOR_CATALOG, connectorScope, fillTitle } from "../catalog";
import {
  activeConnections,
  type ConnectorConnection,
  type ConnectorDeps,
  connectionSecret,
  dropVendorAccount,
  markToReconnect,
  openConnectionSecret,
  toolPrefixOfConnection,
} from "../connections";
import { exposedToolName } from "../mcp";
import { auditLabel, personalTool, usableConnections } from "../personal";
import { datafySecret, datafySigned } from "./datafy";
import { NATIVE_SERVICES } from "./services";
import { ingestTelegramUpdates, pollTelegram, type TgUpdate } from "./telegram";
import { twilioSigned, twilioToken, twilioWebhookPath } from "./twilio";
import { type NativeCall, NativeError } from "./types";

/** The answer an agent reads for a vendor's refusal: its words and one way out (`data.code`). */
export async function nativeFailure(
  deps: Pick<ConnectorDeps, "db">,
  connection: ConnectorConnection,
  error: unknown,
): Promise<ToolOutput> {
  if (!(error instanceof NativeError)) {
    return { content: `Failed: ${error instanceof Error ? error.message : String(error)}`, isError: true };
  }
  if (error.code === "connector.needs_reconnect") await markToReconnect(deps.db, connection, error.message);
  return {
    content: error.message,
    isError: true,
    data: { code: error.code, ...(error.retryAt ? { retryAt: error.retryAt.toISOString() } : {}) },
  };
}

/**
 * The tools of our own connectors (ADR 0170), one set per live connection of a `native` catalog entry, built as the
 * git tools are: the connection's scope, label and prefix, usage `via: "native"`, the catalog's `sensitive` and
 * approval title. "Aprovar sempre" is offered on a sensitive tool unless its catalog entry says `askAlways`.
 */
export function createNativeConnectorToolSource(
  deps: ConnectorDeps & {
    artifacts?: ArtifactDeps;
    /** Calls a workspace may make per month (UTC) by connector, where the vendor bills this server per call (X). */
    monthlyCaps?: Record<string, number>;
    /** Links a vendor fetches a Drive file from (`connectorMediaLinks`); none: no file goes by link. */
    media?: (orgId: string, artifactId: string) => Promise<string | null>;
  },
): ToolSource {
  const http = deps.http ?? fetch;
  return {
    name: "native-connectors",
    async tools(ctx) {
      const all = await activeConnections(ctx.db, ctx.orgId);
      const run = await usableConnections(
        ctx,
        all.filter((c) => CONNECTOR_CATALOG[c.connector]?.native && c.status !== "needs_reconnect"),
      );
      return run.connections.flatMap((connection) => {
        const def = CONNECTOR_CATALOG[connection.connector];
        const service = NATIVE_SERVICES[connection.connector];
        if (!def || !service) return [];
        // `meta-ads_…` would read as two words to the model: tool names take underscores only.
        const prefix = toolPrefixOfConnection(connection).replace(/-/g, "_");
        const named = auditLabel(connection);
        return Object.entries(service.tools).flatMap(([verb, tool]) => {
          const mapped = def.tools[verb];
          if (!mapped) return [];
          const built: ToolDefinition = {
            name: exposedToolName(prefix, verb),
            description: `[${named}${connection.accountLabel ? ` ${connection.accountLabel}` : ""}] ${tool.description}`,
            inputSchema: {
              type: "object",
              properties: tool.input.properties,
              ...(tool.input.required ? { required: tool.input.required } : {}),
              additionalProperties: false,
            },
            scope: connectorScope(def.id, mapped.scope),
            connectionId: connection.id,
            connector: { key: def.id, via: "native", tool: verb },
            connectorLabel: named,
            service: def.id,
            toolPrefix: prefix,
            sensitive: mapped.sensitive === true,
            ...(mapped.sensitive && !mapped.askAlways ? { rememberAs: verb } : {}),
            ahead: true,
            ...(tool.external ? { external: true } : {}),
            describe: (input) => ({
              title: mapped.title ? fillTitle(mapped.title, input) : `${def.label}: ${verb}`,
              detail: Object.entries(input)
                .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
                .join(" · "),
            }),
            execute: (input, c) => runNative(connection, verb, input, c),
          };
          const held = personalTool(built, connection, run, mapped.scope.endsWith(".read"));
          return held ? [held] : [];
        });
      });
    },
  };

  async function runNative(
    connection: ConnectorConnection,
    verb: string,
    input: Record<string, unknown>,
    ctx: ToolContext,
  ) {
    const tool = NATIVE_SERVICES[connection.connector]?.tools[verb];
    if (!tool) return { content: `Unknown tool ${verb}`, isError: true };
    try {
      const cap = deps.monthlyCaps?.[connection.connector] ?? 0;
      if (cap > 0 && (await callsThisMonth(ctx.db, connection)) >= cap) {
        throw new NativeError(
          "connector.capped",
          `This workspace used its ${cap.toLocaleString("en")} ${connection.label} calls for this month (whoever runs this server set that cap). They come back on the 1st (UTC). Nothing was done.`,
        );
      }
      const most = tool.most?.(input) ?? 0;
      if (most > 0) {
        const vendor = CONNECTOR_CATALOG[connection.connector]?.label ?? connection.label;
        const refused = await connectorBudgetLeft(ctx.db, ctx.orgId, vendor, most);
        if (refused) throw new NativeError("connector.capped", refused);
      }
      const secret = await connectionSecret({ ...deps, db: ctx.db }, connection);
      if (!secret)
        throw new NativeError("connector.needs_reconnect", `${connection.label} has no sign-in: reconnect it.`);
      const actor = {
        type: "agent" as const,
        agentId: ctx.agentId,
        channelId: ctx.channelId,
        threadId: replyThreadOf(ctx),
        runId: ctx.runId,
      };
      const call: NativeCall = {
        secret,
        connection,
        http,
        db: ctx.db,
        ctx,
        file: async (id) => {
          if (!deps.artifacts) throw new NativeError("connector.failed", "The Drive isn't available on this server.");
          return fileBytesOf({ ...deps.artifacts, db: ctx.db }, actor, ctx.orgId, id);
        },
        mediaLink: async (id) => {
          await call.file(id);
          return deps.media ? deps.media(ctx.orgId, id) : null;
        },
      };
      const out = await tool.run(input, call);
      return { ...out, data: { connector: connection.connector, tool: verb, ...out.data } };
    } catch (error) {
      return nativeFailure({ db: ctx.db }, connection, error);
    }
  }
}

/** The workspace's calls of a connector this month, as the gateway counts them (`connector_usage_days`). */
async function callsThisMonth(db: Database, connection: ConnectorConnection) {
  const u = schema.connectorUsageDays;
  const month = new Date().toISOString().slice(0, 7);
  const [row] = await db
    .select({ calls: sql<number>`coalesce(sum(${u.calls}), 0)::int` })
    .from(u)
    .where(and(eq(u.orgId, connection.orgId), eq(u.connector, connection.connector), gte(u.day, `${month}-01`)));
  return row?.calls ?? 0;
}

// ── Telegram's updates (ADR 0170 §5) ─────────────────────────────────────────

const { connectorConnections } = schema;

/** The messages to the bot fire the routines listening to `telegram.message`, each once. */
async function fireTelegramRoutines(
  db: Database,
  connection: ConnectorConnection,
  heard: Awaited<ReturnType<typeof ingestTelegramUpdates>>,
) {
  let fired = 0;
  for (const m of heard) {
    fired += await fireRoutineEvent(
      { db },
      connection.orgId,
      "telegram.message",
      {
        summary: `${m.sender ?? "Someone"} wrote to ${connection.accountLabel ?? "the bot"} on Telegram${m.chatTitle ? ` (${m.chatTitle})` : ""}: ${m.text.slice(0, 200)}`,
        chat_id: m.chatId,
        chat: m.chatTitle,
        from: m.sender,
        text: m.text,
        message_id: m.messageId,
      },
      { dedupeKey: `telegram:${connection.id}:${m.updateId}` },
    );
  }
  return fired;
}

/**
 * `POST /api/webhooks/telegram/{connectionId}`: an update Telegram sends, with the secret `setWebhook` gave it in
 * `X-Telegram-Bot-Api-Secret-Token` (compared in constant time). Unknown connection or wrong secret: `NotFoundError`.
 */
export async function handleTelegramWebhook(
  deps: Pick<ConnectorDeps, "db" | "keyWrappers">,
  connectionId: string,
  given: string | null,
  raw: string,
): Promise<{ fired: number }> {
  const [connection] = UUID.test(connectionId)
    ? await deps.db
        .select()
        .from(connectorConnections)
        .where(
          and(
            eq(connectorConnections.id, connectionId),
            eq(connectorConnections.connector, "telegram"),
            isNull(connectorConnections.revokedAt),
          ),
        )
    : [];
  const secret = connection ? await openConnectionSecret(deps.keyWrappers, connection).catch(() => null) : null;
  const expected = secret?.webhookSecret ?? "";
  const same =
    !!given &&
    expected.length > 0 &&
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!connection || !same) throw new NotFoundError("No Telegram bot is listening here");
  const update = JSON.parse(raw) as TgUpdate;
  const heard = await ingestTelegramUpdates(deps.db, connection, [update]);
  return { fired: await fireTelegramRoutines(deps.db, connection, heard) };
}

/**
 * `POST /api/webhooks/twilio/{connectionId}`: a text to the connected number, form-encoded, signed by Twilio with the
 * account's Auth Token over this exact address (`X-Twilio-Signature`). A text fires the routines listening to
 * `sms.received`, each once by its MessageSid. Unknown connection or bad signature: `NotFoundError`.
 */
export async function handleTwilioWebhook(
  deps: Pick<ConnectorDeps, "db" | "keyWrappers" | "publicUrl">,
  connectionId: string,
  signature: string | null,
  raw: string,
): Promise<{ fired: number }> {
  const [connection] = UUID.test(connectionId)
    ? await deps.db
        .select()
        .from(connectorConnections)
        .where(
          and(
            eq(connectorConnections.id, connectionId),
            eq(connectorConnections.connector, "twilio"),
            isNull(connectorConnections.revokedAt),
          ),
        )
    : [];
  const secret = connection ? await openConnectionSecret(deps.keyWrappers, connection).catch(() => null) : null;
  const params = new URLSearchParams(raw);
  const url = `${deps.publicUrl.replace(/\/$/, "")}${twilioWebhookPath(connectionId)}`;
  const token = secret ? twilioToken(secret) : null;
  if (!connection || !token || !twilioSigned(token, url, params, signature)) {
    throw new NotFoundError("No Twilio number is listening here");
  }
  const sid = params.get("MessageSid") ?? params.get("SmsSid");
  if (!sid) return { fired: 0 };
  const from = params.get("From") ?? "";
  const text = params.get("Body") ?? "";
  const media = Number(params.get("NumMedia") ?? 0);
  const fired = await fireRoutineEvent(
    { db: deps.db },
    connection.orgId,
    "sms.received",
    {
      summary: `${from || "Someone"} texted ${connection.accountLabel ?? "the Twilio number"}: ${text.slice(0, 200)}${media > 0 ? ` [${media} picture${media > 1 ? "s" : ""}]` : ""}`,
      from,
      to: params.get("To"),
      text,
      media,
      message_id: sid,
    },
    { dedupeKey: `twilio:${connection.id}:${sid}` },
  );
  return { fired };
}

interface WaChange {
  field?: string;
  value?: {
    metadata?: { phone_number_id?: string };
    contacts?: { wa_id?: string; profile?: { name?: string } }[];
    messages?: {
      id: string;
      from: string;
      type: string;
      text?: { body?: string };
      button?: { text?: string };
      interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
      image?: { caption?: string };
      video?: { caption?: string };
      document?: { caption?: string; filename?: string };
      location?: { name?: string; address?: string };
    }[];
  };
}

/** What a WhatsApp message says, in words: its text, a button's title, or what it holds ("[photo] caption"). */
function waBody(m: NonNullable<NonNullable<WaChange["value"]>["messages"]>[number]) {
  const said =
    m.text?.body ??
    m.button?.text ??
    m.interactive?.button_reply?.title ??
    m.interactive?.list_reply?.title ??
    m.image?.caption ??
    m.video?.caption ??
    m.document?.caption ??
    (m.location ? [m.location.name, m.location.address].filter(Boolean).join(", ") : "");
  const kind: Record<string, string> = {
    image: "[photo]",
    video: "[video]",
    audio: "[voice message]",
    document: `[file ${m.document?.filename ?? ""}]`.replace(" ]", "]"),
    sticker: "[sticker]",
    location: "[location]",
  };
  return [kind[m.type], said].filter(Boolean).join(" ");
}

/**
 * `POST /api/webhooks/datafy`: the events of every Datafy number connected on this server, with Meta's payload. The
 * number's `phone_number_id` names the connection, whose secret checks `x-datafy-signature-256` over the raw body.
 * A message people sent fires the routines listening to `whatsapp.received`, each once by its id; statuses and the
 * number's own echoes fire nothing. Unknown number or bad signature: `NotFoundError`.
 */
export async function handleDatafyWebhook(
  deps: Pick<ConnectorDeps, "db" | "keyWrappers">,
  headers: { timestamp: string | null; signature: string | null },
  raw: string,
): Promise<{ fired: number }> {
  const payload = JSON.parse(raw) as { entry?: { changes?: WaChange[] }[] };
  const changes = (payload.entry ?? []).flatMap((e) => e.changes ?? []);
  const phoneId = changes.find((c) => c.value?.metadata?.phone_number_id)?.value?.metadata?.phone_number_id;
  const [connection] = phoneId
    ? await deps.db
        .select()
        .from(connectorConnections)
        .where(
          and(
            eq(connectorConnections.connector, "datafy"),
            eq(connectorConnections.accountId, phoneId),
            isNull(connectorConnections.revokedAt),
          ),
        )
    : [];
  const secret = connection ? await openConnectionSecret(deps.keyWrappers, connection).catch(() => null) : null;
  const key = secret ? datafySecret(secret) : null;
  if (!connection || !key || !datafySigned(key, raw, headers.timestamp, headers.signature)) {
    throw new NotFoundError("No Datafy number is listening here");
  }
  let fired = 0;
  for (const change of changes) {
    const value = change.value;
    if (change.field !== "messages" || !value || value.metadata?.phone_number_id !== phoneId) continue;
    const names = new Map((value.contacts ?? []).map((c) => [c.wa_id, c.profile?.name]));
    for (const m of value.messages ?? []) {
      const text = waBody(m).slice(0, 4096);
      const from = `+${m.from}`;
      const name = names.get(m.from) ?? null;
      fired += await fireRoutineEvent(
        { db: deps.db },
        connection.orgId,
        "whatsapp.received",
        {
          summary: `${name ? `${name} (${from})` : from} wrote on WhatsApp to ${connection.accountLabel ?? "the number"}: ${text.slice(0, 200)}`,
          from,
          name,
          text,
          message_id: m.id,
        },
        { dedupeKey: `datafy:${connection.id}:${m.id}` },
      );
    }
  }
  return { fired };
}

/** Bots on a server the internet doesn't reach: their updates by `getUpdates`, on the worker loop. */
export async function pollTelegramBots(deps: ConnectorDeps): Promise<number> {
  const bots = await deps.db
    .select()
    .from(connectorConnections)
    .where(
      and(
        eq(connectorConnections.connector, "telegram"),
        isNull(connectorConnections.revokedAt),
        eq(connectorConnections.status, "active"),
      ),
    );
  let fired = 0;
  for (const bot of bots) {
    const secret = await openConnectionSecret(deps.keyWrappers, bot).catch(() => null);
    if (!secret?.apiKey || secret.webhookSecret) continue;
    try {
      const heard = await pollTelegram(deps.db, bot, secret, deps.http ?? fetch);
      fired += await fireTelegramRoutines(deps.db, bot, heard);
    } catch (error) {
      if (error instanceof NativeError && error.code === "connector.needs_reconnect") {
        await markToReconnect(deps.db, bot, error.message);
      }
    }
  }
  return fired;
}

// ── Meta's callbacks (ADR 0170 §8) ──────────────────────────────────────────

/** Meta's `signed_request`: `<signature>.<payload>`, the signature an HMAC-SHA256 of the payload with an app's secret. */
export function metaSignedRequest(raw: string, appSecrets: string[]): { user_id?: string } | null {
  const [signature = "", payload = ""] = raw.split(".");
  const given = Buffer.from(signature, "base64url");
  const ok = appSecrets.some((secret) => {
    const expected = createHmac("sha256", secret).update(payload).digest();
    return expected.length === given.length && timingSafeEqual(expected, given);
  });
  if (!ok) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as { user_id?: string };
  } catch {
    return null;
  }
}

const META_CONNECTORS = ["threads", "meta-ads"];

/**
 * `POST /api/webhooks/meta/deauthorize` and `/data-deletion`: a person removed this server's Threads or Meta Ads app
 * on Meta's side. Their connections go (nothing of theirs is kept but the audit's names); the data deletion answer
 * carries a confirmation code Meta shows them. `NotFoundError` for a request no app of ours signed.
 */
export async function handleMetaCallback(deps: Pick<ConnectorDeps, "db" | "oauthApps">, signedRequest: string) {
  const secrets = META_CONNECTORS.flatMap((c) => {
    const app = deps.oauthApps?.[c];
    return app ? [app.clientSecret] : [];
  });
  const claims = metaSignedRequest(signedRequest, secrets);
  if (!claims?.user_id) throw new NotFoundError("Not a request from this server's Meta apps");
  const removed = await dropVendorAccount(deps.db, META_CONNECTORS, String(claims.user_id));
  return {
    removed,
    confirmationCode: createHash("sha256").update(`${claims.user_id}:${Date.now()}`).digest("hex").slice(0, 16),
  };
}
