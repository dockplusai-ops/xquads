import { afterEach, expect, test } from "bun:test";
import {
  type ConnectorDeps,
  createApiKeyConnection,
  createNativeConnectorToolSource,
  createRoutine,
  handleTwilioWebhook,
  revokeAtProvider,
  type ToolContext,
} from "../src";
import { twilioSignature } from "../src/connectors/native/twilio";
import { type Fixture, setup } from "./fixtures";
import { runContext } from "./mail-fixtures";
import { routineDeps } from "./routine-fixtures";

let f: Fixture;
afterEach(async () => {
  await f?.close();
  f = undefined as unknown as Fixture;
});

const SID = `AC${"0".repeat(31)}1`;
const TOKEN = "fake-fixture-auth-token-0001";
const KEY = `${SID}:${TOKEN}`;
const OURS = "+15550001111";
const PUBLIC = "https://chat.example.com";

/** Twilio's REST API, in memory: each call's method, path and form, and its answer. */
interface Num {
  sid: string;
  phone_number: string;
  sms_url: string | null;
  capabilities: { sms: boolean };
}

function fakeTwilio(numbers: Num[] = [{ sid: "PN1", phone_number: OURS, sms_url: null, capabilities: { sms: true } }]) {
  const calls: { method: string; path: string; form: Record<string, string> }[] = [];
  const http = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = new URL(String(url));
    const path = u.pathname.replace(`/2010-04-01/Accounts/${SID}`, "");
    const form = Object.fromEntries(new URLSearchParams(String(init?.body ?? "")));
    calls.push({ method: init?.method ?? "GET", path: `${path}${u.search}`, form });
    const auth = new Headers(init?.headers).get("authorization");
    if (auth !== `Basic ${Buffer.from(KEY).toString("base64")}`) {
      return Response.json({ code: 20003, message: "Authenticate" }, { status: 401 });
    }
    if (path === "/IncomingPhoneNumbers.json") return Response.json({ incoming_phone_numbers: numbers });
    if (path.startsWith("/IncomingPhoneNumbers/")) return Response.json({ sid: "PN1" });
    if (path === "/Messages.json" && init?.method === "POST") {
      if (form.To === "+15559990000") {
        return Response.json({ code: 21610, message: "Attempt to send to unsubscribed recipient" }, { status: 400 });
      }
      return Response.json({ sid: "SM1", to: form.To, from: form.From, body: form.Body, status: "queued" });
    }
    if (path === "/Messages.json") {
      const q = u.searchParams;
      const m = (sid: string, from: string, to: string, body: string, at: string) => ({
        sid,
        from,
        to,
        body,
        direction: from === OURS ? "outbound-api" : "inbound",
        status: from === OURS ? "delivered" : "received",
        date_created: at,
      });
      const all = [
        m("SM10", "+15552223333", OURS, "Can you come Tuesday?", "Tue, 24 Nov 2026 10:00:00 +0000"),
        m("SM11", OURS, "+15552223333", "Yes, at 9am.", "Tue, 24 Nov 2026 10:05:00 +0000"),
      ];
      return Response.json({
        messages: all.filter((x) => (!q.get("From") || x.from === q.get("From")) && x.to === q.get("To")),
      });
    }
    return Response.json({ message: "not found" }, { status: 404 });
  }) as typeof fetch;
  return { http, calls };
}

function deps(http: typeof fetch, publicUrl = PUBLIC): ConnectorDeps {
  return { db: f.db, keyWrappers: [f.keyWrapper], publicUrl, http, resolveHost: async () => ["93.184.216.34"] };
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

const signedText = (connectionId: string, params: Record<string, string>, token = TOKEN) => {
  const body = new URLSearchParams(params);
  return {
    raw: body.toString(),
    signature: twilioSignature(token, `${PUBLIC}/api/webhooks/twilio/${connectionId}`, body),
  };
};

test("the signature is Twilio's: its documented example", () => {
  const params = new URLSearchParams({
    CallSid: "CA1234567890ABCDE",
    Caller: "+12349013030",
    Digits: "1234",
    From: "+12349013030",
    To: "+18005551212",
  });
  expect(twilioSignature("12345", "https://mycompany.com/myapp.php?foo=1&bar=2", params)).toBe(
    "0/KCTR6DLpKmkAf8muzZqo1nDgQ=",
  );
});

test("SID and token connect the account's number and point its SMS webhook here; disconnecting takes it off", async () => {
  const tw = fakeTwilio();
  await world(tw.http);
  const row = await createApiKeyConnection(deps(tw.http), f.owner.id, f.org.id, { connector: "twilio", apiKey: KEY });
  expect(row).toMatchObject({ accountLabel: OURS, accountId: "PN1" });
  const hook = tw.calls.find((c) => c.path === "/IncomingPhoneNumbers/PN1.json");
  expect(hook?.form).toEqual({ SmsUrl: `${PUBLIC}/api/webhooks/twilio/${row.id}`, SmsMethod: "POST" });
  await expect(
    createApiKeyConnection(deps(tw.http), f.owner.id, f.org.id, {
      connector: "twilio",
      apiKey: `${SID}:wrong-token-0000000`,
    }),
  ).rejects.toThrow("Twilio refused the Account SID or Auth Token");
  await expect(
    createApiKeyConnection(deps(tw.http), f.owner.id, f.org.id, { connector: "twilio", apiKey: "not-a-twilio-key" }),
  ).rejects.toThrow("Account SID and the Auth Token");

  const pointed = fakeTwilio([
    { sid: "PN1", phone_number: OURS, sms_url: hook?.form.SmsUrl ?? null, capabilities: { sms: true } },
  ]);
  expect(await revokeAtProvider(deps(pointed.http), f.org.id, row.id)).toBe(true);
  expect(pointed.calls.at(-1)).toMatchObject({ path: "/IncomingPhoneNumbers/PN1.json", form: { SmsUrl: "" } });
});

test("an account with several numbers needs the one to use", async () => {
  const two = fakeTwilio([
    { sid: "PN1", phone_number: OURS, sms_url: null, capabilities: { sms: true } },
    { sid: "PN2", phone_number: "+15550002222", sms_url: null, capabilities: { sms: true } },
  ]);
  await world(two.http);
  await expect(
    createApiKeyConnection(deps(two.http), f.owner.id, f.org.id, { connector: "twilio", apiKey: KEY }),
  ).rejects.toThrow("has 2 SMS numbers");
});

test("a signed text fires the routines once; an unsigned one is nobody", async () => {
  const tw = fakeTwilio();
  await world(tw.http);
  const row = await createApiKeyConnection(deps(tw.http), f.owner.id, f.org.id, { connector: "twilio", apiKey: KEY });
  await createRoutine(routineDeps(f), f.owner.id, f.org.id, {
    agentId: f.agent.id,
    prompt: "Answer customers who text us.",
    target: { type: "channel", channelId: f.general.id },
    trigger: { type: "event", event: "sms.received" },
  });
  const text = {
    MessageSid: "SM42",
    From: "+15552223333",
    To: OURS,
    Body: "Do you clean on Saturdays?",
    NumMedia: "0",
  };
  const good = signedText(row.id, text);
  const forged = signedText(row.id, text, "someone-elses-token-000");
  await expect(handleTwilioWebhook(deps(tw.http), row.id, forged.signature, good.raw)).rejects.toThrow(
    "No Twilio number",
  );
  await expect(handleTwilioWebhook(deps(tw.http), row.id, null, good.raw)).rejects.toThrow("No Twilio number");
  expect(await handleTwilioWebhook(deps(tw.http), row.id, good.signature, good.raw)).toEqual({ fired: 1 });
  // Twilio retries: the same MessageSid fires nothing more.
  expect(await handleTwilioWebhook(deps(tw.http), row.id, good.signature, good.raw)).toEqual({ fired: 0 });
});

test("the tools: a conversation both ways, and a text asks a person first", async () => {
  const tw = fakeTwilio();
  const ctx = await world(tw.http);
  await createApiKeyConnection(deps(tw.http), f.owner.id, f.org.id, { connector: "twilio", apiKey: KEY });
  const read = await call(ctx, "twilio_read_messages", { with: "+15552223333" });
  if (read?.type !== "result") throw new Error(`expected a result, got ${read?.type}`);
  expect(read.output.content.indexOf('"text":"Can you come Tuesday?"')).toBeGreaterThan(-1);
  expect(read.output.content.indexOf('"from":"us"')).toBeGreaterThan(read.output.content.indexOf("Tuesday"));

  const ask = await call(ctx, "twilio_send_sms", {
    to: "+15552223333",
    text: "Yes, Saturday at 9am works.",
    why: "The customer asked for Saturday and the calendar has 9am free.",
  });
  expect(ask?.type).toBe("approval");
  expect(tw.calls.some((c) => c.method === "POST" && c.path === "/Messages.json")).toBe(false);
});
