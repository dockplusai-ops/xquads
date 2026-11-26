import { afterEach, describe, expect, test } from "bun:test";
import { and, eq, schema } from "@agenteschat/db";
import {
  actionsFor,
  createIssueToolSource,
  createScheduleToolSource,
  createSetupToolSource,
  createToolGateway,
  createWorkspaceToolSource,
  describeCapabilities,
  getAgent,
  getIssue,
  HOW_YOU_WORK,
  insertMessage,
  linkRunActions,
  openPersonAgentDm,
  PROPOSE_SETTINGS_TOOL,
  postPersonMessage,
  RIGHT_HAND,
  rightHandPrompt,
  type ToolContext,
  type ToolDefinition,
  UNDO_CHANGE_TOOL,
  WORKSPACE_ACTION_TOOL,
} from "../src";
import { toolKind, toolPolicy } from "../src/tools/run-policy";
import { addMember, type Fixture, setup } from "./fixtures";

/** Agents undo their own changes when the person asks (ADR 0037 addendum of 2026-11-26). */

let f: Fixture;
afterEach(async () => {
  const current = f;
  f = undefined as unknown as Fixture;
  await current?.close();
});

const SERVER = { publicUrl: "https://agentes.test" };

const lodiOf = async (fx: Fixture) => {
  const [lodi] = await fx.db
    .select()
    .from(schema.agents)
    .where(and(eq(schema.agents.orgId, fx.org.id), eq(schema.agents.builtin, RIGHT_HAND)));
  if (!lodi) throw new Error("no right hand");
  return lodi;
};

/** A run of the right hand on what `userId` wrote in their DM with it, in their own words. */
async function lodiRun(fx: Fixture, userId: string, body: string, outside = false): Promise<ToolContext> {
  const lodi = await lodiOf(fx);
  const dm = await openPersonAgentDm(fx.db, fx.org.id, userId, lodi.id);
  // The run before has ended: this message starts a run of its own.
  await fx.db.update(schema.agentRuns).set({ status: "done" }).where(eq(schema.agentRuns.orgId, fx.org.id));
  const trigger = await postPersonMessage({ db: fx.db, pubsub: fx.pubsub }, userId, fx.org.id, dm.id, { body });
  // `outside`: their message relays outside content (sent through an AI app, ADR 0119).
  if (outside)
    await fx.db
      .update(schema.messages)
      .set({ meta: { readOutside: true } })
      .where(eq(schema.messages.id, trigger.id));
  const [run] = await fx.db.select().from(schema.agentRuns).where(eq(schema.agentRuns.triggerMessageId, trigger.id));
  if (!run) throw new Error("no run");
  return {
    db: fx.db,
    orgId: fx.org.id,
    agentId: lodi.id,
    runId: run.id,
    channelId: dm.id,
    threadRootId: run.threadRootId,
    triggerMessageId: trigger.id,
  };
}

/** A run of `@dev` in #general on what `userId` wrote there. */
async function devRun(fx: Fixture, userId: string, body: string): Promise<ToolContext> {
  const trigger = await insertMessage(fx.db, {
    orgId: fx.org.id,
    channelId: fx.general.id,
    author: { type: "person", userId },
    body,
  });
  const [run] = await fx.db
    .insert(schema.agentRuns)
    .values({
      orgId: fx.org.id,
      agentId: fx.agent.id,
      channelId: fx.general.id,
      threadRootId: trigger.id,
      triggerMessageId: trigger.id,
      trigger: "mention",
      hop: 1,
      status: "running",
    })
    .returning();
  if (!run) throw new Error("no run");
  return {
    db: fx.db,
    orgId: fx.org.id,
    agentId: fx.agent.id,
    runId: run.id,
    channelId: fx.general.id,
    threadRootId: trigger.id,
    triggerMessageId: trigger.id,
  };
}

/** The run's reply, carrying its receipts. */
async function reply(fx: Fixture, ctx: ToolContext) {
  const m = await insertMessage(fx.db, {
    orgId: fx.org.id,
    channelId: ctx.channelId,
    author: { type: "agent", agentId: ctx.agentId, runId: ctx.runId, hop: 0 },
    body: "Pronto.",
  });
  await linkRunActions(fx.db, fx.org.id, ctx.runId, m.id);
  return m.id;
}

const gatewayOf = (fx: Fixture) =>
  createToolGateway({
    sources: [
      createWorkspaceToolSource({ pubsub: fx.pubsub }),
      createSetupToolSource({ pubsub: fx.pubsub, server: SERVER }),
    ],
  });

async function invoke(fx: Fixture, ctx: ToolContext, name: string, input: Record<string, unknown>) {
  const res = await gatewayOf(fx).invoke(ctx, { toolUseId: `tu_${crypto.randomUUID()}`, name, input });
  if (res.type !== "result") throw new Error(`not a result: ${res.type}`);
  return res.output;
}

const accent = async (fx: Fixture) =>
  (await fx.db.select().from(schema.organizations).where(eq(schema.organizations.id, fx.org.id)))[0]?.accent;

const setAccent = (fx: Fixture, ctx: ToolContext, color: string) =>
  invoke(fx, ctx, WORKSPACE_ACTION_TOOL, { action: "set_accent", input: { color } });

describe("undo_change", () => {
  test("the right hand undoes its last change on request, once", async () => {
    f = await setup({ rightHand: true });
    await f.db.update(schema.organizations).set({ accent: "#2563eb" }).where(eq(schema.organizations.id, f.org.id));
    const first = await lodiRun(f, f.owner.id, "muda a cor de destaque para ardósia");
    const done = await setAccent(f, first, "slate");
    expect(done.content).toContain("undo_change");
    expect(done.content).not.toContain("with Undo");
    await reply(f, first);
    expect(await accent(f)).toBe("#8aa3ae");

    const asked = await lodiRun(f, f.owner.id, "desfaça isso, volta como estava");
    const out = await invoke(f, asked, UNDO_CHANGE_TOOL, {});
    expect(out.isError).toBeFalsy();
    expect(out.content).toContain("Undone: did set_accent");
    expect(await accent(f)).toBe("#2563eb");

    const again = await invoke(f, asked, UNDO_CHANGE_TOOL, {});
    expect(again).toMatchObject({ isError: true });
    expect(again.content).toContain("already undone");
    expect(await accent(f)).toBe("#2563eb");
  });

  test("the person's own request undoes; a turn that read outside content undoes nothing", async () => {
    f = await setup({ rightHand: true });
    await f.db.update(schema.organizations).set({ accent: "#2563eb" }).where(eq(schema.organizations.id, f.org.id));
    const first = await lodiRun(f, f.owner.id, "muda a cor de destaque para ardósia");
    await setAccent(f, first, "slate");
    await reply(f, first);
    const own = await invoke(f, await lodiRun(f, f.owner.id, "desfaça isso"), UNDO_CHANGE_TOOL, {});
    expect(own.content).toContain("Undone:");
    expect(await accent(f)).toBe("#2563eb");

    const second = await lodiRun(f, f.owner.id, "agora ardósia de novo");
    await setAccent(f, second, "slate");
    await reply(f, second);
    // Their message relays outside content (sent through an AI app): no undo from this turn.
    const relayed = await lodiRun(f, f.owner.id, "desfaça isso", true);
    const refused = await invoke(f, relayed, UNDO_CHANGE_TOOL, {});
    expect(refused).toMatchObject({ isError: true });
    expect(refused.content).toContain("read content from outside");
    expect(await accent(f)).toBe("#8aa3ae");
    // Looking stays open: the list undoes nothing.
    expect((await invoke(f, relayed, UNDO_CHANGE_TOOL, { list: true })).content).toContain("(can be undone)");
    expect(await accent(f)).toBe("#8aa3ae");
  });

  test("the accent goes back to the default with `default` and the words people use", async () => {
    f = await setup({ rightHand: true });
    for (const color of ["default", "padrão", "original"]) {
      await f.db.update(schema.organizations).set({ accent: "#2563eb" }).where(eq(schema.organizations.id, f.org.id));
      const ctx = await lodiRun(f, f.owner.id, "volte a cor de destaque para a padrão");
      expect((await setAccent(f, ctx, color)).content).toContain("Done at once");
      expect(await accent(f)).toBeNull();
    }
    const found = await invoke(f, await lodiRun(f, f.owner.id, "cor padrão"), WORKSPACE_ACTION_TOOL, {
      find: "accent color back to default",
    });
    expect(String(found.content)).toContain("`default`");
  });

  test("an agent settings change from the right hand's card comes back", async () => {
    f = await setup({ rightHand: true });
    const ctx = await lodiRun(f, f.owner.id, "chama o dev de Ada");
    const out = await invoke(f, ctx, PROPOSE_SETTINGS_TOOL, {
      changes: [{ agent: "@dev", name: "Ada" }],
      reason: "pediu",
    });
    expect(out.content).toContain("applied at once");
    expect(out.content).toContain("undo_change");
    expect((await getAgent(f.db, f.org.id, f.agent.id))?.name).toBe("Ada");

    const undo = await invoke(f, await lodiRun(f, f.owner.id, "desfaz, volta o nome"), UNDO_CHANGE_TOOL, {});
    expect(undo.isError).toBeFalsy();
    expect(undo.content).toContain("Undone:");
    expect((await getAgent(f.db, f.org.id, f.agent.id))?.name).toBe("Dev");
  });

  test("too late, a later change on top, and one change by id from the list", async () => {
    f = await setup({ rightHand: true });
    const one = await lodiRun(f, f.owner.id, "ardósia");
    await setAccent(f, one, "slate");
    await reply(f, one);
    const two = await lodiRun(f, f.owner.id, "agora azul");
    await setAccent(f, two, "#2563eb");
    await reply(f, two);
    const asked = await lodiRun(f, f.owner.id, "desfaz a primeira");

    const listed = await invoke(f, asked, UNDO_CHANGE_TOOL, { list: true });
    const ids = [...String(listed.content).matchAll(/^- ([0-9a-f-]{36}):/gm)].map((m) => m[1] ?? "");
    expect(ids).toHaveLength(2);
    const [newer, older] = ids;

    // The older can't jump over the newer: the accent moved since.
    const blocked = await invoke(f, asked, UNDO_CHANGE_TOOL, { action_id: older });
    expect(blocked).toMatchObject({ isError: true });
    expect(blocked.content).toContain("changed after you did it");
    expect(await accent(f)).toBe("#2563eb");

    // The newer, past its window.
    await f.db
      .update(schema.agentActions)
      .set({ undoableUntil: new Date(Date.now() - 1000) })
      .where(eq(schema.agentActions.id, newer ?? ""));
    const late = await invoke(f, asked, UNDO_CHANGE_TOOL, { action_id: newer });
    expect(late).toMatchObject({ isError: true });
    expect(late.content).toContain("too late");
    expect(await accent(f)).toBe("#2563eb");

    const unknown = await invoke(f, asked, UNDO_CHANGE_TOOL, { action_id: crypto.randomUUID() });
    expect(unknown).toMatchObject({ isError: true, content: "No change of yours here with that id." });
  });

  test("a person who may not undo it gets nothing undone through the agent", async () => {
    f = await setup();
    const ctx = await devRun(f, f.owner.id, "@dev cria a tarefa Uma");
    const issues = createIssueToolSource(f.artifactDeps);
    const create = (await issues.tools(ctx)).find((t) => t.name === "create_issue") as ToolDefinition;
    expect((await create.execute({ title: "Uma" }, ctx)).isError).toBeFalsy();
    const messageId = await reply(f, ctx);
    const [receipt] = (await actionsFor(f.db, f.org.id, [messageId])).get(messageId) ?? [];

    const bia = await addMember(f.db, f.org.id, "member", "Bia");
    const out = await invoke(f, await devRun(f, bia.id, "@dev desfaz isso"), UNDO_CHANGE_TOOL, {});
    expect(out).toMatchObject({ isError: true });
    expect(out.content).toContain("Nothing was undone");
    const issue = await getIssue(f.db, { type: "person", userId: f.owner.id }, f.org.id, { id: receipt?.target.id });
    expect(issue.status).not.toBe("canceled");

    // The person it worked for may.
    const own = await invoke(f, await devRun(f, f.owner.id, "@dev desfaz isso"), UNDO_CHANGE_TOOL, {});
    expect(own.content).toContain("Undone: created issue #1");
  });

  test("an internal change; nobody behind the run undoes nothing", async () => {
    f = await setup();
    const tool = { name: UNDO_CHANGE_TOOL, scope: "", connectionId: null };
    expect(toolKind(tool)).toEqual({ kind: "internal", area: "undo" });
    expect(toolPolicy({ kind: "person", personId: "u" }, tool, "always").action).toBe("approve");
    // A run nobody is behind (an agent's message started it).
    const said = await insertMessage(f.db, {
      orgId: f.org.id,
      channelId: f.general.id,
      author: { type: "agent", agentId: f.agent.id, runId: null, hop: 0, stretchId: null },
      body: "desfaz",
    });
    const out = await invoke(
      f,
      {
        db: f.db,
        orgId: f.org.id,
        agentId: f.agent.id,
        runId: "",
        channelId: f.general.id,
        threadRootId: said.id,
        triggerMessageId: said.id,
      },
      UNDO_CHANGE_TOOL,
      {},
    );
    expect(out).toMatchObject({ isError: true });
    expect(out.content).toContain("Only a person's request");
  });
});

describe("agents are never sent to an Undo button under their reply", () => {
  const BUTTON = /with (an )?Undo\b|Undo under your reply|botão Undo|pelo botão/;

  test("rules, the right hand's prompt and tool descriptions", async () => {
    f = await setup({ rightHand: true });
    const how = String(HOW_YOU_WORK);
    expect(how).not.toMatch(BUTTON);
    expect(how).toContain("undo_change");
    const lodi = await lodiOf(f);
    const prompt = await rightHandPrompt(
      { db: f.db },
      { orgId: f.org.id, agent: lodi, personId: f.owner.id, inDm: true },
    );
    expect(prompt).not.toMatch(BUTTON);
    expect(prompt).toContain("undo_change");
    const ctx = await lodiRun(f, f.owner.id, "oi");
    const sources = [
      createWorkspaceToolSource({ pubsub: f.pubsub }),
      createSetupToolSource({ pubsub: f.pubsub, server: SERVER }),
      createIssueToolSource(f.artifactDeps),
      createScheduleToolSource({ pubsub: f.pubsub, context: f.context }),
    ];
    const tools = (await Promise.all(sources.map((s) => s.tools(ctx)))).flat();
    expect(tools.map((t) => t.name)).toContain(UNDO_CHANGE_TOOL);
    expect(tools.filter((t) => BUTTON.test(t.description)).map((t) => t.name)).toEqual([]);
    expect(describeCapabilities(tools)).not.toMatch(BUTTON);
  });
});
