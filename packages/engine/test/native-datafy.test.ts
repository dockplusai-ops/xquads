import { afterEach, expect, test } from "bun:test";
import { createHmac } from "node:crypto";
import {
  type ConnectorDeps,
  createApiKeyConnection,
  createNativeConnectorToolSource,
  createRoutine,
  handleDatafyWebhook,
  type ToolContext,
} from "../src";
import { datafySigned } from "../src/connectors/native/datafy";
import { type Fixture, setup } from "./fixtures";
import { runContext } from "./mail-fixtures";
import { routineDeps } from "./routine-fixtures";

let f: Fixture;
afterEach(async () => {
  await f?.close();
  f = undefined as unknown as Fixture;
});

const TOKEN = "sk_live_fixture0000000001";
const SECRET = "whsec_fixture0000000001";
const KEY = `${TOKEN}:${SECRET}`;
const PHONE_ID = "106540352242922";

/** Datafy's API, in memory: each call's method, path and body, and its answer. */
function fakeDatafy() {
  const calls: { method: string; path: string; body: Record<string, unknown> | null }[] = [];
  const http = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = new URL(String(url));
    calls.push({
      method: init?.method ?? "GET",
      path: `${u.pathname}${u.search}`,
      body: init?.body ? JSON.parse(String(init.body)) : null,
    });
    if (new Headers(init?.headers).get("authorization") !== `Bearer ${TOKEN}`) {
      return Response.json({ statusCode: 401, message: "Token inválido" }, { status: 401 });
    }
    if (u.pathname === "/me") return Response.json({ phone_number_id: PHONE_ID, waba_id: "366634483210360" });
    if (u.pathname === "/v1/366634483210360/phone_numbers") {
      return Response.json({ data: [{ id: PHONE_ID, display_phone_number: "+1 555-000-1111" }] });
    }
    if (u.pathname === "/v1/366634483210360/message_templates") {
      return Response.json({
        data: [
          {
            name: "visit_reminder",
            language: "en_US",
            category: "UTILITY",
            components: [{ type: "BODY", text: "Hi {{1}}, see you {{2}}." }],
          },
        ],
      });
    }
    if (u.pathname === `/v1/${PHONE_ID}/messages`) {
      return Response.json({ messaging_product: "whatsapp", messages: [{ id: "wamid.out1" }] });
    }
    return Response.json({ message: "not found" }, { status: 404 });
  }) as typeof fetch;
  return { http, calls };
}

function deps(http: typeof fetch): ConnectorDeps {
  return {
    db: f.db,
    keyWrappers: [f.keyWrapper],
    publicUrl: "https://chat.example.com",
    http,
    resolveHost: async () => ["93.184.216.34"],
  };
}

async function world(http: typeof fetch) {
  f = await setup({
    toolSources: [{ name: "native", tools: (ctx) => createNativeConnectorToolSource(deps(http)).tools(ctx) }],
  });
  return runContext(f);
}

async function call(ctx: ToolContext, name: string, input: Record<string, unknown>) {
  return f.tools?.invoke(ctx, { toolUseId: `tu_${Math.random()}`, name, input });
}

/** A delivery as Datafy signs it: `sha256=` HMAC of `{timestamp}.{raw body}`. */
function signed(payload: unknown, secret = SECRET, at = Math.floor(Date.now() / 1000)) {
  const raw = JSON.stringify(payload);
  const timestamp = String(at);
  const signature = `sha256=${createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex")}`;
  return { raw, headers: { timestamp, signature } };
}

const inbound = (id: string, body: string, phoneId = PHONE_ID) => ({
  object: "whatsapp_business_account",
  entry: [
    {
      id: "366634483210360",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: "15550001111", phone_number_id: phoneId },
            contacts: [{ wa_id: "15552223333", profile: { name: "Ada" } }],
            messages: [{ id, from: "15552223333", timestamp: "1800000000", type: "text", text: { body } }],
          },
        },
      ],
    },
  ],
});

test("a signature is fresh and the number's own, or nothing", () => {
  const { raw, headers } = signed({ a: 1 }, SECRET, 1_800_000_000);
  expect(datafySigned(SECRET, raw, headers.timestamp, headers.signature, 1_800_000_000)).toBe(true);
  expect(datafySigned(SECRET, `${raw} `, headers.timestamp, headers.signature, 1_800_000_000)).toBe(false);
  expect(datafySigned("whsec_other00000000", raw, headers.timestamp, headers.signature, 1_800_000_000)).toBe(false);
  expect(datafySigned(SECRET, raw, headers.timestamp, headers.signature, 1_800_000_301)).toBe(false);
  expect(datafySigned(SECRET, raw, null, headers.signature, 1_800_000_000)).toBe(false);
});

test("the token and secret connect the number by its phone_number_id; a wrong key says what to paste", async () => {
  const d = fakeDatafy();
  await world(d.http);
  const row = await createApiKeyConnection(deps(d.http), f.owner.id, f.org.id, { connector: "datafy", apiKey: KEY });
  expect(row).toMatchObject({ accountLabel: "+1 555-000-1111", accountId: PHONE_ID });
  await expect(
    createApiKeyConnection(deps(d.http), f.owner.id, f.org.id, { connector: "datafy", apiKey: TOKEN }),
  ).rejects.toThrow("sk_live_…:whsec_…");
  await expect(
    createApiKeyConnection(deps(d.http), f.owner.id, f.org.id, {
      connector: "datafy",
      apiKey: `sk_live_wrong000000000:${SECRET}`,
    }),
  ).rejects.toThrow("Datafy refused the number's token");
});

test("a signed message fires the routines once by its id; statuses, other numbers and bad signatures fire nothing", async () => {
  const d = fakeDatafy();
  await world(d.http);
  await createApiKeyConnection(deps(d.http), f.owner.id, f.org.id, { connector: "datafy", apiKey: KEY });
  await createRoutine(routineDeps(f), f.owner.id, f.org.id, {
    agentId: f.agent.id,
    prompt: "Answer customers on WhatsApp.",
    target: { type: "channel", channelId: f.general.id },
    trigger: { type: "event", event: "whatsapp.received" },
  });
  const good = signed(inbound("wamid.in1", "Can you come Tuesday?"));
  const forged = signed(inbound("wamid.in1", "Can you come Tuesday?"), "whsec_someone_else00");
  await expect(handleDatafyWebhook(deps(d.http), forged.headers, forged.raw)).rejects.toThrow("No Datafy number");
  const stranger = signed(inbound("wamid.in2", "hi", "999"));
  await expect(handleDatafyWebhook(deps(d.http), stranger.headers, stranger.raw)).rejects.toThrow("No Datafy number");
  expect(await handleDatafyWebhook(deps(d.http), good.headers, good.raw)).toEqual({ fired: 1 });
  // Datafy retries a delivery: the same message fires nothing more.
  expect(await handleDatafyWebhook(deps(d.http), good.headers, good.raw)).toEqual({ fired: 0 });
  const status = signed({
    entry: [
      {
        changes: [
          {
            field: "messages",
            value: {
              metadata: { phone_number_id: PHONE_ID },
              statuses: [{ id: "wamid.out1", status: "delivered" }],
            },
          },
        ],
      },
    ],
  });
  expect(await handleDatafyWebhook(deps(d.http), status.headers, status.raw)).toEqual({ fired: 0 });
});

test("the tools: approved templates to read, and every message asks a person first", async () => {
  const d = fakeDatafy();
  const ctx = await world(d.http);
  await createApiKeyConnection(deps(d.http), f.owner.id, f.org.id, { connector: "datafy", apiKey: KEY });
  const listed = await call(ctx, "datafy_list_templates", {});
  if (listed?.type !== "result") throw new Error(`expected a result, got ${listed?.type}`);
  expect(listed.output.content).toContain('"name":"visit_reminder"');
  expect(listed.output.content).toContain('"body":"Hi {{1}}, see you {{2}}."');

  const ask = await call(ctx, "datafy_send_message", {
    to: "+1 555 222 3333",
    text: "Yes, Tuesday at 9am works.",
    why: "The customer asked for Tuesday and the calendar has 9am free.",
  });
  expect(ask?.type).toBe("approval");
  expect(d.calls.some((c) => c.method === "POST" && c.path.endsWith("/messages"))).toBe(false);
});
