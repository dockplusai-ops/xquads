import { createHmac, timingSafeEqual } from "node:crypto";
import type { ConnectionSecret } from "../connections";
import { json, NativeError, type NativeService, type NativeTool, pageSize, str } from "./types";

/**
 * Twilio SMS (ADR 0170's pattern, as Telegram): a workspace's own Twilio account, connected by its Account SID and
 * Auth Token pasted as `SID:TOKEN`, or `SID:TOKEN:+15551234567` to pick one of several numbers. The account pays its
 * own messages. Texts to the number reach this server by the number's SMS webhook, signed by Twilio with the Auth
 * Token (`X-Twilio-Signature`); Twilio keeps the history, so nothing is stored here.
 */

const API = "https://api.twilio.com/2010-04-01";
/** Twilio's own cap on one message's body (it splits it into segments). */
const BODY_MAX = 1600;
const E164 = /^\+[1-9]\d{6,14}$/;

interface Keys {
  sid: string;
  token: string;
  number: string | null;
}

/** The pasted key: `SID:TOKEN` or `SID:TOKEN:+number`. */
export function twilioKeys(secret: ConnectionSecret): Keys {
  const [sid = "", token = "", number = ""] = (secret.apiKey ?? "").split(":").map((p) => p.trim());
  if (!/^AC[0-9a-f]{32}$/i.test(sid) || token.length < 16) {
    throw new NativeError(
      "connector.needs_reconnect",
      "The Twilio key should be the Account SID and the Auth Token joined by a colon (AC…:…), from the Twilio Console.",
    );
  }
  if (number && !E164.test(number)) {
    throw new NativeError("connector.refused", `"${number}" isn't a phone number in the +15551234567 form.`);
  }
  return { sid, token, number: number || null };
}

/** The Auth Token, or null when the stored key isn't a Twilio one. */
export function twilioToken(secret: ConnectionSecret) {
  try {
    return twilioKeys(secret).token;
  } catch {
    return null;
  }
}

interface TwilioFailure {
  code?: number;
  message?: string;
}

/** One REST call on the account. `writes`: a timeout may have happened on Twilio's side. */
async function twilioCall<T>(
  http: typeof fetch,
  keys: Keys,
  path: string,
  form?: Record<string, string>,
  writes = false,
): Promise<T> {
  let res: Response;
  try {
    res = await http(`${API}/Accounts/${keys.sid}${path}`, {
      method: form ? "POST" : "GET",
      signal: AbortSignal.timeout(30_000),
      headers: {
        authorization: `Basic ${Buffer.from(`${keys.sid}:${keys.token}`).toString("base64")}`,
        ...(form ? { "content-type": "application/x-www-form-urlencoded" } : {}),
      },
      ...(form ? { body: new URLSearchParams(form).toString() } : {}),
    });
  } catch {
    throw writes
      ? new NativeError(
          "connector.unknown_result",
          "Twilio didn't answer in time: the text may have gone. Read the conversation (read_messages) before sending again.",
        )
      : new NativeError("connector.failed", "Twilio didn't answer. Try again in a minute.");
  }
  if (res.ok) return (await res.json()) as T;
  const failure = (await res.json().catch(() => ({}))) as TwilioFailure;
  if (res.status === 401 || res.status === 403) {
    throw new NativeError(
      "connector.needs_reconnect",
      "Twilio refused the Account SID or Auth Token (changed in the Console?): someone who manages connectors reconnects it.",
    );
  }
  if (res.status === 429) {
    const at = new Date(Date.now() + 60_000);
    throw new NativeError("connector.rate_limited", "Twilio takes no more right now. Nothing was sent.", at);
  }
  if (res.status >= 500) throw new NativeError("connector.failed", "Twilio is busy right now. Try again in a minute.");
  if (failure.code === 21610) {
    throw new NativeError(
      "connector.refused",
      "That person texted STOP to this number: Twilio sends them nothing until they text START.",
    );
  }
  throw new NativeError(
    "connector.refused",
    `Twilio refused it: "${(failure.message ?? `HTTP ${res.status}`).slice(0, 300)}"`,
  );
}

interface TwNumber {
  sid: string;
  phone_number: string;
  sms_url: string | null;
  capabilities?: { sms?: boolean };
}

/** The number the connection texts from: the one in the key, else the account's only number that takes SMS. */
async function numberOf(http: typeof fetch, keys: Keys) {
  const query = keys.number ? `?PhoneNumber=${encodeURIComponent(keys.number)}` : "?PageSize=50";
  const page = await twilioCall<{ incoming_phone_numbers: TwNumber[] }>(
    http,
    keys,
    `/IncomingPhoneNumbers.json${query}`,
  );
  const numbers = page.incoming_phone_numbers.filter((n) => n.capabilities?.sms !== false);
  if (keys.number) {
    const found = numbers.find((n) => n.phone_number === keys.number);
    if (!found)
      throw new NativeError("connector.refused", `${keys.number} isn't an SMS number of this Twilio account.`);
    return found;
  }
  const [only, ...more] = numbers;
  if (!only) throw new NativeError("connector.refused", "This Twilio account has no phone number that sends SMS yet.");
  if (more.length > 0) {
    throw new NativeError(
      "connector.refused",
      `This Twilio account has ${numbers.length} SMS numbers: add the one to use after the token (AC…:…:+15551234567).`,
    );
  }
  return only;
}

/** Where Twilio sends a number's incoming texts on this server. */
export const twilioWebhookPath = (connectionId: string) => `/api/webhooks/twilio/${connectionId}`;

/**
 * Twilio's request signature: base64 HMAC-SHA1, keyed by the Auth Token, of the full URL it called followed by every
 * POST parameter's name and value, sorted by name.
 */
export function twilioSignature(token: string, url: string, params: URLSearchParams) {
  const data = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .reduce((acc, [k, v]) => acc + k + v, url);
  return createHmac("sha1", token).update(data).digest("base64");
}

export function twilioSigned(token: string, url: string, params: URLSearchParams, given: string | null) {
  if (!given) return false;
  const expected = Buffer.from(twilioSignature(token, url, params));
  const got = Buffer.from(given);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

interface TwMessage {
  sid: string;
  from: string;
  to: string;
  body: string;
  direction: string;
  status: string;
  num_media?: string;
  date_created: string;
}

const phoneInput = {
  type: "string",
  pattern: E164.source,
  description: "A phone number in the international form, + and country code: +15551234567.",
} as const;

const shown = (m: TwMessage, ours: string) => ({
  message_id: m.sid,
  from: m.from === ours ? "us" : m.from,
  to: m.to === ours ? "us" : m.to,
  text: m.body,
  ...(Number(m.num_media) > 0 ? { media: Number(m.num_media) } : {}),
  ...(m.direction.startsWith("outbound") ? { status: m.status } : {}),
  at: new Date(m.date_created).toISOString(),
});

const ourNumber = (label: string | null) => {
  if (!label || !E164.test(label))
    throw new NativeError("connector.needs_reconnect", "The Twilio number is missing: reconnect it.");
  return label;
};

const tools: Record<string, NativeTool> = {
  read_messages: {
    external: true,
    description:
      "Texts on the connected Twilio number, oldest first: with `with`, the conversation with that number both ways; without, the latest texts people sent to it.",
    input: {
      properties: {
        with: {
          ...phoneInput,
          description: "The other person's number (+15551234567). Leave out for the latest texts in.",
        },
        limit: { type: "integer", minimum: 1, maximum: 50, description: "How many (default 10)." },
      },
    },
    async run(input, call) {
      const keys = twilioKeys(call.secret);
      const ours = ourNumber(call.connection.accountLabel);
      const size = pageSize(input.limit);
      const list = (q: Record<string, string>) =>
        twilioCall<{ messages: TwMessage[] }>(
          call.http,
          keys,
          `/Messages.json?${new URLSearchParams({ ...q, PageSize: String(size) })}`,
        ).then((p) => p.messages);
      const other = str(input.with);
      // Twilio filters by one From and one To: a conversation is both directions, merged.
      const messages = other
        ? [...(await list({ From: other, To: ours })), ...(await list({ From: ours, To: other }))]
        : await list({ To: ours });
      if (messages.length === 0) {
        return { content: other ? `No texts with ${other} yet.` : `Nobody has texted ${ours} yet.` };
      }
      return json(
        messages
          .sort((a, b) => Date.parse(b.date_created) - Date.parse(a.date_created))
          .slice(0, size)
          .reverse()
          .map((m) => shown(m, ours)),
      );
    },
  },
  send_sms: {
    description: `Text someone from the connected Twilio number. Plain text, up to ${BODY_MAX} characters (long texts go as several segments, each billed).`,
    input: {
      properties: {
        to: phoneInput,
        text: { type: "string", minLength: 1, maxLength: BODY_MAX },
      },
      required: ["to", "text"],
    },
    async run(input, call) {
      const keys = twilioKeys(call.secret);
      const m = await twilioCall<TwMessage>(
        call.http,
        keys,
        "/Messages.json",
        { To: str(input.to), From: ourNumber(call.connection.accountLabel), Body: str(input.text) },
        true,
      );
      return { content: `Sent to ${m.to} (message ${m.sid}, ${m.status}).`, data: { messageId: m.sid } };
    },
  },
};

export const twilio: NativeService = {
  tools,
  async account(secret, http) {
    const n = await numberOf(http, twilioKeys(secret));
    return { label: n.phone_number, id: n.sid };
  },
  async connected(secret, connection, http, publicBase) {
    // No polling, unlike Telegram: a server the internet can't reach sends texts but hears none (Twilio only calls).
    if (!publicBase) return undefined;
    const keys = twilioKeys(secret);
    const n = await numberOf(http, keys);
    await twilioCall(http, keys, `/IncomingPhoneNumbers/${n.sid}.json`, {
      SmsUrl: `${publicBase.replace(/\/$/, "")}${twilioWebhookPath(connection.id)}`,
      SmsMethod: "POST",
    });
    return undefined;
  },
  async revoke(secret, http) {
    const keys = twilioKeys(secret);
    const n = await numberOf(http, keys);
    // Only our own webhook comes off: one someone set since stays.
    if (n.sms_url?.includes("/api/webhooks/twilio/")) {
      await twilioCall(http, keys, `/IncomingPhoneNumbers/${n.sid}.json`, { SmsUrl: "" });
    }
  },
};
