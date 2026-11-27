import { afterEach, expect, test } from "bun:test";
import { and, eq, schema } from "@agenteschat/db";
import {
  addChannelMember,
  type ChannelEvent,
  deleteMessage,
  drainOutbox,
  editMessage,
  listMessages,
  postPersonMessage,
} from "../src";
import { addMember, type Fixture, setup } from "./fixtures";

/** Editing and deleting a message (ADR 0221). */

let f: Fixture;
afterEach(() => f?.close());

const of = <T extends ChannelEvent["type"]>(events: { type: string }[], type: T) =>
  events.filter((e) => e.type === type) as Extract<ChannelEvent, { type: T }>[];
const deps = () => ({ db: f.db, pubsub: f.pubsub });
const post = (userId: string, body: string, threadId?: string) =>
  postPersonMessage(deps(), userId, f.org.id, f.general.id, { body, threadId });
const stored = async (id: string) => (await f.db.select().from(schema.messages).where(eq(schema.messages.id, id)))[0];

test("my own message: its words change, it says when, and nothing runs again", async () => {
  f = await setup({ reply: () => ({ chunks: ["Feito."] }) });
  const events = f.listen(f.general.id);
  const m = await post(f.owner.id, "@dev resume a reunião de ontem");
  await drainOutbox(f.db, f.handlers);
  const runsBefore = (await f.db.select().from(schema.agentRuns)).length;

  const edited = await editMessage(deps(), f.owner.id, f.org.id, m.id, { body: "  @dev resume a reunião de hoje  " });
  await drainOutbox(f.db, f.handlers);

  expect(edited.body).toBe("@dev resume a reunião de hoje");
  const row = await stored(m.id);
  expect(row?.body).toBe("@dev resume a reunião de hoje");
  expect(row?.editedAt).toBeInstanceOf(Date);
  expect(of(events, "message.edited")).toMatchObject([{ messageId: m.id, body: "@dev resume a reunião de hoje" }]);
  // No agent woken again by the edit.
  expect((await f.db.select().from(schema.agentRuns)).length).toBe(runsBefore);
  const [listed] = (await listMessages(f.db, f.owner.id, f.org.id, f.general.id, {})).filter((x) => x.id === m.id);
  expect(listed?.editedAt).toBe(edited.editedAt);
});

test("someone else's message is theirs to edit; mine to delete only as an administrator", async () => {
  f = await setup();
  const bia = await addMember(f.db, f.org.id, "member", "bia");
  await addChannelMember(f.db, f.owner.id, f.org.id, f.general.id, { userId: bia.id });
  const mine = await post(f.owner.id, "do dono");
  await expect(editMessage(deps(), bia.id, f.org.id, mine.id, { body: "outro" })).rejects.toMatchObject({
    code: "message.not_yours",
  });
  await expect(deleteMessage(deps(), bia.id, f.org.id, mine.id)).rejects.toMatchObject({ code: "message.not_yours" });
  // The owner (an administrator) deletes Bia's, and it is in the audit log.
  const hers = await postPersonMessage(deps(), bia.id, f.org.id, f.general.id, { body: "da Bia" });
  expect(await deleteMessage(deps(), f.owner.id, f.org.id, hers.id)).toEqual({ kept: false });
  const audit = await f.db
    .select()
    .from(schema.auditLog)
    .where(and(eq(schema.auditLog.orgId, f.org.id), eq(schema.auditLog.action, "message.deleted")));
  expect(audit).toHaveLength(1);
});

test("deleted: gone from the conversation; a thread's root with replies stays as a deleted mark", async () => {
  f = await setup();
  const events = f.listen(f.general.id);
  const alone = await post(f.owner.id, "sem respostas");
  const root = await post(f.owner.id, "abre a thread");
  await post(f.owner.id, "uma resposta", root.id);

  expect(await deleteMessage(deps(), f.owner.id, f.org.id, alone.id)).toEqual({ kept: false });
  expect(await deleteMessage(deps(), f.owner.id, f.org.id, root.id)).toEqual({ kept: true });

  expect((await stored(alone.id))?.deletedAt).toBeInstanceOf(Date);
  const kept = await stored(root.id);
  expect(kept?.deletedAt).toBeNull();
  expect(kept?.body).toBe("");
  expect(kept?.meta.deleted).toMatchObject({ byUserId: f.owner.id });
  const listed = (await listMessages(f.db, f.owner.id, f.org.id, f.general.id, {})).map((x) => x.id);
  expect(listed).not.toContain(alone.id);
  expect(listed).toContain(root.id);
  expect(of(events, "message.deleted").map((e) => [e.messageId, e.kept])).toEqual([
    [alone.id, false],
    [root.id, true],
  ]);
  // Deleted is deleted: neither edited nor deleted again.
  await expect(editMessage(deps(), f.owner.id, f.org.id, root.id, { body: "volta" })).rejects.toThrow();
});
