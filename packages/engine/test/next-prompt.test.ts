import { afterEach, expect, test } from "bun:test";
import { eq, schema } from "@agenteschat/db";
import {
  type ChannelEvent,
  drainOutbox,
  type NextPromptInput,
  nextPromptText,
  openDm,
  postPersonMessage,
} from "../src";
import { type Fixture, setup } from "./fixtures";

/** The next message suggested after an agent's reply in a person's DM (ADR 0220). */

let f: Fixture;
afterEach(() => f?.close());

type SuggestionEvent = Extract<ChannelEvent, { type: "message.suggestion" }>;
const suggestions = (events: { type: string }[]) =>
  (events as SuggestionEvent[]).filter((e) => e.type === "message.suggestion");

test("the suggestion is one short line: quotes go, a long one is cut at a word, nothing is none", () => {
  expect(nextPromptText('  "Pode enviar a proposta para o cliente?"  ')).toBe(
    "Pode enviar a proposta para o cliente?",
  );
  expect(nextPromptText("Manda o\nrelatório")).toBe("Manda o relatório");
  expect(nextPromptText("")).toBeNull();
  expect(nextPromptText(null)).toBeNull();
  const long = nextPromptText("palavra ".repeat(40)) ?? "";
  expect(long.length).toBeLessThanOrEqual(100);
  expect(long.endsWith(" ")).toBe(false);
});

test("after a reply in my DM, my next message is suggested, kept on the reply and told to the apps", async () => {
  f = await setup({ reply: () => ({ chunks: ["Montei a proposta da Clínica Sorriso. Quer que eu envie?"] }) });
  const asked: NextPromptInput[] = [];
  f.context.nextPrompts = {
    write: async (input) => {
      asked.push(input);
      return "Pode enviar para o cliente";
    },
  };
  const dm = await openDm(f.db, f.owner.id, f.org.id, { agentId: f.agent.id });
  const events = f.listen(dm.id);
  await postPersonMessage({ db: f.db, pubsub: f.pubsub }, f.owner.id, f.org.id, dm.id, {
    body: "monta a proposta da Clínica Sorriso",
  });
  await drainOutbox(f.db, f.handlers);
  // It runs after the reply, unawaited: give it a turn.
  await new Promise((r) => setTimeout(r, 50));

  expect(asked).toHaveLength(1);
  expect(asked[0]?.conversation.map((m) => m.from)).toEqual(["person", "agent"]);
  const [event] = suggestions(events);
  expect(event?.nextPrompt).toEqual({ text: "Pode enviar para o cliente", forUserId: f.owner.id });
  const [reply] = await f.db.select().from(schema.messages).where(eq(schema.messages.id, event?.messageId ?? ""));
  expect(reply?.authorType).toBe("agent");
  expect(reply?.meta.nextPrompt).toEqual({ text: "Pode enviar para o cliente", forUserId: f.owner.id });
});

test("none in a channel, none when the workspace turned it off, and a failing writer changes nothing", async () => {
  f = await setup({ reply: () => ({ chunks: ["Feito."] }) });
  let calls = 0;
  let answer: () => Promise<string | null> = async () => "Próximo passo";
  f.context.nextPrompts = {
    write: () => {
      calls++;
      return answer();
    },
  };
  // A channel: replies there are read by everyone, no one's next message.
  const channelEvents = f.listen(f.general.id);
  await postPersonMessage({ db: f.db, pubsub: f.pubsub }, f.owner.id, f.org.id, f.general.id, { body: "@dev oi" });
  await drainOutbox(f.db, f.handlers);
  await new Promise((r) => setTimeout(r, 50));
  expect(calls).toBe(0);
  expect(suggestions(channelEvents)).toEqual([]);

  // Turned off for the workspace: no model call at all.
  const dm = await openDm(f.db, f.owner.id, f.org.id, { agentId: f.agent.id });
  const events = f.listen(dm.id);
  await f.db
    .insert(schema.organizationSettings)
    .values({ orgId: f.org.id, nextPrompts: false })
    .onConflictDoUpdate({ target: schema.organizationSettings.orgId, set: { nextPrompts: false } });
  await postPersonMessage({ db: f.db, pubsub: f.pubsub }, f.owner.id, f.org.id, dm.id, { body: "faz o relatório" });
  await drainOutbox(f.db, f.handlers);
  await new Promise((r) => setTimeout(r, 50));
  expect(calls).toBe(0);

  // Back on, the writer fails: the reply stays as it was.
  await f.db.update(schema.organizationSettings).set({ nextPrompts: true });
  answer = async () => {
    throw new Error("no small model");
  };
  await postPersonMessage({ db: f.db, pubsub: f.pubsub }, f.owner.id, f.org.id, dm.id, { body: "e o outro?" });
  await drainOutbox(f.db, f.handlers);
  await new Promise((r) => setTimeout(r, 50));
  expect(calls).toBe(1);
  expect(suggestions(events)).toEqual([]);
});
