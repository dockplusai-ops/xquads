import { afterEach, expect, test } from "bun:test";
import { schema } from "@agenteschat/db";
import { type ModelRequest, textOf } from "@agenteschat/providers";
import { addRunStep, cancelRun, drainOutbox, postPersonMessage } from "../src";
import {
  advance,
  claimsChange,
  continuationVerdict,
  decideTurnEnd,
  onlySafetyRefusals,
  RULE_TAG,
  shownTried,
  triedCalls,
  UNBACKED_NUDGE,
} from "../src/continuation";
import type { Judge, JudgeRequest } from "../src/judge";
import { type Fixture, setup } from "./fixtures";

/**
 * An agent never claims a result it didn't produce (ADR 0167): a reply saying something was made, sent or done that
 * no call did is not posted, and the run goes on once to do it or say plainly it can't.
 */

let f: Fixture;
afterEach(async () => {
  const current = f;
  f = undefined as unknown as Fixture;
  await current?.close();
});

const lastUserText = (request: ModelRequest) => {
  const last = request.messages.at(-1);
  return last ? textOf(last.content) : "";
};

test("a reply claiming an image no call made is not posted; the run is told to do it or say it can't", async () => {
  let judged = 0;
  f = await setup({
    judge: (kind) => (kind === "follow_through" ? (judged++ === 0 ? "unbacked" : "done") : undefined),
    reply: (_request, call) => ({
      chunks: [
        call === 1
          ? "Pronto! Aqui está a imagem do hambúrguer 🍔"
          : "Não consigo gerar imagens: não tenho uma ferramenta de imagem aqui.",
      ],
    }),
  });
  await postPersonMessage({ db: f.db, pubsub: f.pubsub }, f.owner.id, f.org.id, f.general.id, {
    body: "@dev faz uma imagem de um hambúrguer",
  });
  await drainOutbox(f.db, f.handlers);

  expect(f.provider.calls.length).toBe(2);
  expect(lastUserText(f.provider.calls[1]?.request as ModelRequest)).toBe(UNBACKED_NUDGE);
  const posted = (await f.db.select().from(schema.messages).orderBy(schema.messages.createdAt)).filter(
    (m) => m.authorType === "agent" && !m.meta.notice,
  );
  expect(posted.map((m) => m.body)).toEqual(["Não consigo gerar imagens: não tenho uma ferramenta de imagem aqui."]);
  const steps = await f.db.select().from(schema.agentRunSteps);
  expect(steps.filter((s) => s.data.nudged === "unbacked").length).toBe(1);
});

test("the nudge comes once: a claim judged again past the cap ends the run as it is", async () => {
  const turn = (count: number, unbackedNudged?: boolean) =>
    decideTurnEnd({
      state: { count, ...(unbackedNudged ? { unbackedNudged } : {}) },
      kind: "conversation",
      executed: 0,
      bound: null,
      quiet: false,
      decided: null,
      unanswered: false,
      unreached: "",
      judged: "Feito, enviei o e-mail.",
      mission: false,
      wakesLater: async () => false,
      verdict: async () => "unbacked",
    });
  expect(await turn(0)).toMatchObject({ outcome: "continue", rule: "unbacked", nudge: UNBACKED_NUDGE });
  expect(await turn(2)).toMatchObject({ outcome: "done", rule: "unbacked_cap" });
  // Once per run, also with extra turns left: a second claim after its rewrite is posted.
  expect(await turn(1, true)).toMatchObject({ outcome: "done", rule: "unbacked_cap" });
  expect(advance({ count: 0 }, { outcome: "continue", rule: "unbacked" }, 0).unbackedNudged).toBe(true);
});

const agentBodies = async (fx: Fixture) =>
  (await fx.db.select().from(schema.messages).orderBy(schema.messages.createdAt))
    .filter((m) => m.authorType === "agent" && !m.meta.notice)
    .map((m) => m.body);

const CLAIM = "Pronto! Aqui está a imagem do hambúrguer 🍔";

test("a held reply is never posted later as the closing line of a turn that writes nothing", async () => {
  let judged = 0;
  f = await setup({
    judge: (kind) => (kind === "follow_through" ? (judged++ === 0 ? "unbacked" : "done") : undefined),
    reply: (_request, call) => ({ chunks: call === 1 ? [CLAIM] : call === 2 ? [] : ["Não consigo gerar imagens."] }),
  });
  await postPersonMessage({ db: f.db, pubsub: f.pubsub }, f.owner.id, f.org.id, f.general.id, {
    body: "@dev faz uma imagem de um hambúrguer",
  });
  await drainOutbox(f.db, f.handlers);
  const bodies = await agentBodies(f);
  expect(bodies.join("\n")).not.toContain("hambúrguer");
  expect(bodies).toEqual(["Não consigo gerar imagens."]);
});

test("a held reply is never shown in what a stopped run wrote", async () => {
  f = await setup({
    judge: (kind) => (kind === "follow_through" ? "unbacked" : undefined),
    reply: (_request, call) => {
      if (call === 2) {
        // Stopped while it writes again: its stream goes on only once the stop is in.
        const stopped = f.db
          .select()
          .from(schema.agentRuns)
          .then(([run]) => run && cancelRun({ db: f.db, pubsub: f.pubsub }, f.owner.id, f.org.id, run.id));
        return { chunks: ["Na verdade, ", "não consigo."], hold: stopped };
      }
      return { chunks: [CLAIM] };
    },
  });
  await postPersonMessage({ db: f.db, pubsub: f.pubsub }, f.owner.id, f.org.id, f.general.id, {
    body: "@dev faz uma imagem de um hambúrguer",
  });
  await drainOutbox(f.db, f.handlers);
  const [run] = await f.db.select().from(schema.agentRuns);
  expect(run?.status).toBe("canceled");
  const stopped = (await f.db.select().from(schema.messages)).find((m) => m.meta.canceled);
  expect(stopped).toBeDefined();
  expect(stopped?.body).not.toContain("Pronto!");
  expect(JSON.stringify(stopped?.meta.canceled)).not.toContain("Pronto!");
});

test("an unsure unbacked verdict lets the reply stand; a long run's judge is told of the calls it doesn't see", async () => {
  const asked: JudgeRequest[] = [];
  const judgeSaying = (probabilities: Record<string, number>): Judge => ({
    name: "fake",
    ask: async (request) => {
      asked.push(request);
      return { verdict: { choice: "unbacked", probabilities } };
    },
  });
  const tried = Array.from({ length: 30 }, (_, i) => `run_code(step ${i}) → ok`);
  const input = {
    orgId: "o",
    agentId: "a",
    runId: "r",
    request: "Render the intro video.",
    reply: "Done: the intro video is in the Drive.",
    means: [],
    tried,
    runKind: "conversation" as const,
  };
  const sure = judgeSaying({ unbacked: 0.8, done: 0.2 });
  expect(await continuationVerdict(judgeSaying({ unbacked: 0.55, done: 0.45 }), input)).toBe("done");
  const shown = { ...input, tried: tried.slice(-20) };
  expect(await continuationVerdict(sure, shown)).toBe("unbacked");
  // Never where the judge can't hold it: a list cut to its newest calls, a routine's record, a result's notice.
  expect(await continuationVerdict(sure, input)).toBe("done");
  expect(await continuationVerdict(sure, { ...shown, runKind: "routine" })).toBe("done");
  expect(await continuationVerdict(sure, { ...shown, resultNotice: true })).toBe("done");
  expect(asked[0]?.state.tried).toEqual(shownTried(tried));
  expect(shownTried(tried)).toHaveLength(21);
  expect(shownTried(tried)[0]).toBe("(10 earlier calls of this run not shown)");
  expect(shownTried(tried.slice(0, 3))).toEqual(tried.slice(0, 3));
});

test("a permission prompt that let a command run is no call of its own; one that refused it stays", async () => {
  f = await setup({ reply: () => ({ chunks: ["ok"] }) });
  await postPersonMessage({ db: f.db, pubsub: f.pubsub }, f.owner.id, f.org.id, f.general.id, { body: "@dev oi" });
  await drainOutbox(f.db, f.handlers);
  const [run] = await f.db.select().from(schema.agentRuns);
  if (!run) throw new Error("no run");
  const step = async (name: string, input: Record<string, unknown>, content: string) => {
    const toolUseId = crypto.randomUUID();
    await addRunStep(f.db, run, "tool_call", { toolUseId, name, input });
    await addRunStep(f.db, run, "tool_result", { toolUseId, name, isError: false, content });
  };
  await step("permission_prompt", { tool_name: "Bash", input: { command: "npm test" } }, '{"behavior":"allow"}');
  await step("permission_prompt", { tool_name: "Bash", input: { command: "rm -rf /etc" } }, '{"behavior":"deny"}');
  await step("web_search", { query: "node 22" }, "3 results");
  const tried = await triedCalls(f.db, run, ["Bash(npm test) → ok"]);
  expect(tried.map((l) => l.split(/[ (]/)[0])).toEqual(["permission_prompt", "web_search", "Bash"]);
  expect(tried[0]).toContain("deny");

  // Our own rule turning a call down on purpose is final, like a safety refusal.
  const toolUseId = crypto.randomUUID();
  await addRunStep(f.db, run, "tool_call", { toolUseId, name: "tell_agent", input: { message: "go on" } });
  const refusal = { content: "You and the other agents did what you may do.", isError: true };
  await addRunStep(f.db, run, "tool_result", { toolUseId, ...refusal, data: { code: "stretch.limit" } });
  const ruled = (await triedCalls(f.db, run)).filter((l) => l.includes("→ failed: "));
  expect(ruled).toHaveLength(1);
  expect(ruled[0]?.startsWith(RULE_TAG)).toBe(true);
  expect(onlySafetyRefusals(ruled)).toBe(true);
});

test("a change claimed in reply to a request to make it, with no call that worked, is unbacked without the judge", async () => {
  const asked: JudgeRequest[] = [];
  const saysDone: Judge = {
    name: "fake",
    ask: async (request) => {
      asked.push(request);
      return { verdict: { choice: "done", probabilities: { done: 1 } } };
    },
  };
  const input = {
    orgId: "o",
    agentId: "a",
    runId: "r",
    request: "Desfaça isso.",
    reply: "Desfiz a última mudança: a cor de destaque do workspace voltou ao sálvia, que estava antes do azul.",
    means: [],
    tried: [] as string[],
    runKind: "conversation" as const,
  };
  expect(await continuationVerdict(saysDone, input)).toBe("unbacked");
  expect(await continuationVerdict(saysDone, { ...input, tried: ["undo_change → failed: nothing to undo"] })).toBe(
    "unbacked",
  );
  expect(asked).toHaveLength(0);
  // A call that worked, a reply that says it didn't, a question about the past, a routine: the judge reads them.
  expect(await continuationVerdict(saysDone, { ...input, tried: ["undo_change → Undone: did set_accent"] })).toBe(
    "done",
  );
  expect(await continuationVerdict(saysDone, { ...input, reply: "Não desfiz nada: não achei mudança sua aqui." })).toBe(
    "done",
  );
  expect(
    await continuationVerdict(saysDone, {
      ...input,
      request: "Qual é a cor agora?",
      reply: "Mudei ontem para sálvia.",
    }),
  ).toBe("done");
  expect(await continuationVerdict(saysDone, { ...input, runKind: "routine" })).toBe("done");
  // The judge is told in words that the run made no call.
  expect(asked.at(-1)?.state.tried).toEqual(["(none: this run made no tool call)"]);

  expect(claimsChange("Pronto, a cor agora é sálvia.")).toBe(true);
  expect(claimsChange("I've changed the accent to sage.")).toBe(true);
  expect(claimsChange("Quer que eu mude a cor?")).toBe(false);
  expect(claimsChange("I couldn't change it: you need to be an admin.")).toBe(false);
});

test("a run asked to undo that claims it did with no call is told to do it; only its honest reply is posted", async () => {
  f = await setup({
    judge: (kind) => (kind === "follow_through" ? "done" : undefined),
    reply: (_request, call) => ({
      chunks: [
        call === 1
          ? "Desfiz a última mudança: a cor de destaque voltou ao sálvia."
          : "Não encontrei nenhuma mudança minha para desfazer aqui.",
      ],
    }),
  });
  await postPersonMessage({ db: f.db, pubsub: f.pubsub }, f.owner.id, f.org.id, f.general.id, {
    body: "@dev desfaça isso",
  });
  await drainOutbox(f.db, f.handlers);
  expect(f.provider.calls.length).toBe(2);
  expect(lastUserText(f.provider.calls[1]?.request as ModelRequest)).toBe(UNBACKED_NUDGE);
  expect(await agentBodies(f)).toEqual(["Não encontrei nenhuma mudança minha para desfazer aqui."]);
});
