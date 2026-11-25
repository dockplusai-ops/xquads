import { createHmac, timingSafeEqual } from "node:crypto";
import type { ConnectionSecret } from "../connections";
import { json, NativeError, type NativeService, type NativeTool, str } from "./types";

/**
 * WhatsApp through Datafy, a Meta partner that serves the official Cloud API under its own address and token: a
 * workspace's own Datafy channel, connected by its channel token and webhook secret pasted as `sk_live_…:whsec_…`.
 * The account pays Datafy and Meta its own messages. Datafy sends every number's events to one address of this server
 * (`DATAFY_WEBHOOK_PATH`, set by the person in Datafy's panel), signed with the number's secret; the number's
 * `phone_number_id` says which connection it is. The Cloud API keeps no history, so nothing is read back.
 */

const API = "https://cloud.datafyapi.com.br";
/** WhatsApp's cap on a text message's body. */
const TEXT_MAX = 4096;
/** How old a signed delivery may be (Datafy's own guidance): an older one may be a captured request sent again. */
const MAX_AGE_S = 300;

/** Where Datafy sends the events of every connected number on this server. */
export const DATAFY_WEBHOOK_PATH = "/api/webhooks/datafy";

interface Keys {
  token: string;
  secret: string;
}

/** The pasted key: `sk_live_…:whsec_…`. */
export function datafyKeys(secret: ConnectionSecret): Keys {
  const [token = "", webhook = ""] = (secret.apiKey ?? "").split(":").map((p) => p.trim());
  if (!/^sk_live_\S{8,}$/.test(token) || !/^whsec_\S{8,}$/.test(webhook)) {
    throw new NativeError(
      "connector.needs_reconnect",
      "The Datafy key should be the number's token and its webhook secret joined by a colon (sk_live_…:whsec_…), from the Datafy panel.",
    );
  }
  return { token, secret: webhook };
}

/** The webhook secret, or null when the stored key isn't a Datafy one. */
export function datafySecret(secret: ConnectionSecret) {
  try {
    return datafyKeys(secret).secret;
  } catch {
    return null;
  }
}

interface DatafyFailure {
  message?: string;
  error?: { message?: string; code?: number };
}

/** One call to Datafy. `writes`: a timeout may have happened on Datafy's side. */
async function datafyCall<T>(
  http: typeof fetch,
  keys: Keys,
  path: string,
  body?: Record<string, unknown>,
  writes = false,
): Promise<T> {
  let res: Response;
  try {
    res = await http(`${API}${path}`, {
      method: body ? "POST" : "GET",
      signal: AbortSignal.timeout(30_000),
      headers: {
        authorization: `Bearer ${keys.token}`,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw writes
      ? new NativeError(
          "connector.unknown_result",
          "Datafy didn't answer in time: the message may have gone. Don't send it again without checking with the person.",
        )
      : new NativeError("connector.failed", "Datafy didn't answer. Try again in a minute.");
  }
  if (res.ok) return (await res.json()) as T;
  const failure = (await res.json().catch(() => ({}))) as DatafyFailure;
  const said = (failure.error?.message ?? failure.message ?? `HTTP ${res.status}`).slice(0, 300);
  if (res.status === 401) {
    throw new NativeError(
      "connector.needs_reconnect",
      "Datafy refused the number's token (changed in its panel?): someone who manages connectors reconnects it.",
    );
  }
  if (res.status === 402) {
    throw new NativeError(
      "connector.refused",
      "The Datafy subscription for this number is inactive: nothing was sent.",
    );
  }
  if (res.status === 409) {
    throw new NativeError("connector.refused", "This number is paused in Datafy: nothing was sent.");
  }
  if (res.status === 429) {
    const seconds = Number(/(\d+)\s*s\b/.exec(said)?.[1] ?? 60);
    const at = new Date(Date.now() + seconds * 1000);
    throw new NativeError(
      "connector.rate_limited",
      `Datafy takes no more for about ${seconds} s. Nothing was sent.`,
      at,
    );
  }
  if (res.status >= 500) throw new NativeError("connector.failed", "Datafy is busy right now. Try again in a minute.");
  throw new NativeError("connector.refused", `WhatsApp refused it: "${said}"`);
}

interface Me {
  phone_number_id?: string;
  waba_id?: string;
}

async function meOf(http: typeof fetch, keys: Keys) {
  const me = await datafyCall<Me>(http, keys, "/me");
  if (!me.phone_number_id || !me.waba_id) {
    throw new NativeError("connector.refused", "This Datafy token has no WhatsApp number connected yet.");
  }
  return { phoneId: me.phone_number_id, wabaId: me.waba_id };
}

/**
 * Datafy's signature: `sha256=` and the hex HMAC-SHA256, keyed by the number's secret, of `{timestamp}.{raw body}`.
 * True only for a fresh delivery (`MAX_AGE_S`).
 */
export function datafySigned(
  secret: string,
  raw: string,
  timestamp: string | null,
  given: string | null,
  nowS = Math.floor(Date.now() / 1000),
) {
  if (!given || !timestamp || !/^\d+$/.test(timestamp) || Math.abs(nowS - Number(timestamp)) > MAX_AGE_S) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex")}`);
  const got = Buffer.from(given);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

/** A WhatsApp number as the Cloud API takes it: digits only, country code first. */
const waNumber = (v: unknown) => str(v).replace(/\D/g, "");

const phoneInput = {
  type: "string",
  pattern: "^\\+?[1-9][0-9 ()-]{6,20}$",
  description: "The person's WhatsApp number with its country code: +5511999999999 or +15551234567.",
} as const;

const WINDOW =
  "WhatsApp takes free text only within 24 hours of the person's last message to this number. Past that, use send_template.";

interface Sent {
  messages?: { id: string }[];
}

const sentText = (what: string, s: Sent): { content: string; data: { messageId: string | null } } => ({
  content: `${what} (message ${s.messages?.[0]?.id ?? "?"}). Accepted by WhatsApp: a failure, such as a closed 24-hour window, can still come later.`,
  data: { messageId: s.messages?.[0]?.id ?? null },
});

const tools: Record<string, NativeTool> = {
  send_message: {
    description: `Send a WhatsApp text from the connected number, up to ${TEXT_MAX} characters. ${WINDOW} Quote the person's message with reply_to.`,
    input: {
      properties: {
        to: phoneInput,
        text: { type: "string", minLength: 1, maxLength: TEXT_MAX },
        reply_to: { type: "string", maxLength: 200, description: "The id (wamid…) of the person's message to quote." },
      },
      required: ["to", "text"],
    },
    async run(input, call) {
      const keys = datafyKeys(call.secret);
      const phoneId = call.connection.accountId ?? (await meOf(call.http, keys)).phoneId;
      const sent = await datafyCall<Sent>(
        call.http,
        keys,
        `/v1/${phoneId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: waNumber(input.to),
          type: "text",
          text: { body: str(input.text) },
          ...(str(input.reply_to) ? { context: { message_id: str(input.reply_to) } } : {}),
        },
        true,
      );
      return sentText("Sent", sent);
    },
  },
  send_template: {
    description:
      "Send an approved WhatsApp template (list_templates) from the connected number: the only message WhatsApp takes when the 24-hour window is closed, billed by Meta to the account. Fill the body's variables in order.",
    input: {
      properties: {
        to: phoneInput,
        name: { type: "string", minLength: 1, maxLength: 512, description: "The template's name." },
        language: { type: "string", minLength: 2, maxLength: 15, description: "Its language code: pt_BR, en_US." },
        params: {
          type: "array",
          maxItems: 20,
          items: { type: "string", maxLength: 1024 },
          description: "The body's variables, in order ({{1}}, {{2}}…).",
        },
      },
      required: ["to", "name", "language"],
    },
    async run(input, call) {
      const keys = datafyKeys(call.secret);
      const phoneId = call.connection.accountId ?? (await meOf(call.http, keys)).phoneId;
      const params = Array.isArray(input.params) ? input.params.map(str) : [];
      const sent = await datafyCall<Sent>(
        call.http,
        keys,
        `/v1/${phoneId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: waNumber(input.to),
          type: "template",
          template: {
            name: str(input.name),
            language: { code: str(input.language) },
            ...(params.length
              ? { components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }] }
              : {}),
          },
        },
        true,
      );
      return sentText(`Sent the template ${str(input.name)}`, sent);
    },
  },
  list_templates: {
    description: "The number's WhatsApp templates Meta approved: name, language, category and body text.",
    input: { properties: {} },
    async run(_input, call) {
      const keys = datafyKeys(call.secret);
      const { wabaId } = await meOf(call.http, keys);
      const page = await datafyCall<{
        data?: { name: string; language: string; category: string; components?: { type: string; text?: string }[] }[];
      }>(
        call.http,
        keys,
        `/v1/${wabaId}/message_templates?status=APPROVED&fields=name,language,category,components&limit=50`,
      );
      const templates = (page.data ?? []).map((t) => ({
        name: t.name,
        language: t.language,
        category: t.category,
        body: t.components?.find((c) => c.type === "BODY")?.text ?? null,
      }));
      if (templates.length === 0) return { content: "This number has no approved template yet." };
      return json(templates);
    },
  },
};

export const datafy: NativeService = {
  tools,
  async account(secret, http) {
    const keys = datafyKeys(secret);
    const { phoneId, wabaId } = await meOf(http, keys);
    const numbers = await datafyCall<{ data?: { id: string; display_phone_number?: string }[] }>(
      http,
      keys,
      `/v1/${wabaId}/phone_numbers`,
    ).catch(() => ({ data: [] }));
    const shown = numbers.data?.find((n) => n.id === phoneId)?.display_phone_number;
    return { label: shown ?? phoneId, id: phoneId };
  },
};
