import { afterEach, describe, expect, test } from "bun:test";
import { eq, schema } from "@agenteschat/db";
import { createAskUserToolSource, insertMessage, openPersonAgentDm, type ToolContext } from "../src";
import { type Fixture, setup } from "./fixtures";

/**
 * An agent's question still open where it would ask again is not asked twice: a later run (the right hand raising the
 * same onboarding question at the end of an unrelated reply) is refused, pointing to the open one, while another
 * thread of a channel or a question already answered leaves it free to ask.
 */

let f: Fixture;
afterEach(async () => {
  await f?.close();
});

/** A run of @dev on the owner's message in `channelId` (`threadId`: a reply in that thread). */
async function runIn(channelId: string, threadId: string | null = null): Promise<ToolContext> {
  const trigger = await insertMessage(f.db, {
    orgId: f.org.id,
    channelId,
    threadId,
    author: { type: "person", userId: f.owner.id },
    body: "e o relatório?",
  });
  const root = threadId ?? trigger.id;
  const [run] = await f.db
    .insert(schema.agentRuns)
    .values({
      orgId: f.org.id,
      agentId: f.agent.id,
      channelId,
      threadRootId: root,
      triggerMessageId: trigger.id,
      trigger: "mention",
      hop: 1,
      status: "running",
    })
    .returning();
  if (!run) throw new Error("no run");
  return {
    db: f.db,
    orgId: f.org.id,
    agentId: f.agent.id,
    runId: run.id,
    channelId,
    threadRootId: root,
    triggerMessageId: trigger.id,
  };
}

const QUESTION = "Qual é o seu nicho, o que a empresa vende e quem é o cliente ideal?";

/** The question an earlier run asked here and nobody answered. */
async function askedBefore(ctx: ToolContext, threadId: string | null = null) {
  const [q] = await f.db
    .insert(schema.agentQuestions)
    .values({
      orgId: f.org.id,
      runId: ctx.runId,
      agentId: f.agent.id,
      channelId: ctx.channelId,
      threadId,
      toolUseId: "toolu_first",
      text: QUESTION,
      expiresAt: new Date(Date.now() + 3600_000),
    })
    .returning();
  if (!q) throw new Error("no question");
  return q;
}

async function ask(ctx: ToolContext, question = QUESTION) {
  const [tool] = await createAskUserToolSource().tools(ctx);
  if (!tool) throw new Error("no ask_user");
  return tool.execute({ question }, ctx);
}

describe("ask_user while its question is still open here", () => {
  test("in a DM a later run is refused, pointing to the open one; once answered it may ask", async () => {
    f = await setup();
    const dm = await openPersonAgentDm(f.db, f.org.id, f.owner.id, f.agent.id);
    // Asked under an earlier message: what the person writes in the main timeline since answers it not.
    const earlier = await insertMessage(f.db, {
      orgId: f.org.id,
      channelId: dm.id,
      author: { type: "person", userId: f.owner.id },
      body: "monta o meu time",
    });
    const first = await askedBefore(await runIn(dm.id, earlier.id), earlier.id);
    const later = await runIn(dm.id);
    expect((await f.db.select().from(schema.agentQuestions))[0]?.status).toBe("open");
    const refused = await ask(later);
    expect(refused).toMatchObject({ isError: true });
    expect(refused.content).toContain(`your question "${QUESTION}" is still open here`);
    expect(refused.content).toContain(first.id);
    // Something else entirely: still one card at a time from it here.
    expect((await ask(later, "Posso mandar o relatório agora?")).isError).toBe(true);

    await f.db.update(schema.agentQuestions).set({ status: "answered" }).where(eq(schema.agentQuestions.id, first.id));
    expect(await ask(later)).toMatchObject({ waitForAnswer: { text: QUESTION } });
  });

  test("in a channel, only the same thread holds it", async () => {
    f = await setup();
    const root = await insertMessage(f.db, {
      orgId: f.org.id,
      channelId: f.general.id,
      author: { type: "person", userId: f.owner.id },
      body: "o deploy de hoje",
    });
    const first = await runIn(f.general.id, root.id);
    const sameThread = await runIn(f.general.id, root.id);
    const main = await runIn(f.general.id);
    await askedBefore(first, root.id);
    expect((await ask(sameThread)).isError).toBe(true);
    expect(await ask(main)).toMatchObject({ waitForAnswer: { text: QUESTION } });
  });
});
