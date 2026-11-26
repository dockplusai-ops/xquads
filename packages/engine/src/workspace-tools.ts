import { holdEvents, type PubSub } from "@agenteschat/adapters";
import { and, desc, eq, isNull, or, type SQL, schema, sql } from "@agenteschat/db";
import { type ActionRecord, actionView, actWithUndo, describeAction } from "./agent-actions";
import { requireMayUndo, undoAgentAction } from "./agent-undo";
import { currentHandles } from "./agents";
import { invalidateOrg } from "./cache";
import { addChannelMember } from "./channels";
import { getChannelCached } from "./context";
import { personBehindCall } from "./requester";
import { replyThreadOf } from "./runs";
import { noAgentText } from "./team";
import { closeThread, getThread, updateThread } from "./threads";
import type { ToolContext, ToolDefinition, ToolOutput, ToolSource } from "./tools/types";
import { actNow, updateChannelAction } from "./workspace-actions";

export const ADD_TO_CHANNEL_TOOL = "add_agent_to_channel";
export const UPDATE_THREAD_TOOL = "update_thread";
export const UNDO_CHANGE_TOOL = "undo_change";

const str = (v: unknown) => (typeof v === "string" ? v : "");
const failed = (error: unknown): ToolOutput => ({
  content: `Failed: ${error instanceof Error ? error.message : String(error)}`,
  isError: true,
});

/** The person behind this run (`authority.ts`): null for a routine's work and for unattended runs. */
const requesterOf = (ctx: ToolContext): Promise<string | null> => personBehindCall(ctx);

const noRequester: ToolOutput = {
  content: "Only a person's request can change this; nothing was changed.",
  isError: true,
};

/**
 * Organizing the workspace for the person who asked (ADR 0037 round 2), with
 * their rights: `add_agent_to_channel` and `update_thread` (rename, close).
 * Internal and reversible, so no approval: each change is a receipt on the
 * reply, and `undo_change` takes the agent's own back when the person asks.
 */
export function createWorkspaceToolSource(deps: { pubsub?: PubSub }): ToolSource {
  const tools: ToolDefinition[] = [
    {
      name: ADD_TO_CHANNEL_TOOL,
      description:
        "Add an agent (by handle, e.g. @lia) to a channel (by name; default: this one) when the person asks or the work needs it there, and with `lead` make it the channel's responsible agent. Works with the rights of the person who asked (the channel's creator or an admin, and the agent's owner or an admin). No permission needed: the person sees it under your reply, and the person can ask you to undo it (undo_change).",
      scope: "",
      inputSchema: {
        type: "object",
        properties: {
          agent: { type: "string", minLength: 1, maxLength: 100 },
          channel: { type: "string", maxLength: 100, description: "Channel name, with or without #" },
          auto_reply: {
            type: "boolean",
            description: "It may answer there without being mentioned (default true)",
          },
          lead: {
            type: "boolean",
            description:
              "Make it the channel's responsible agent ('responsável pelo canal', always an agent): it takes what is said to the whole channel and moves the work along between the agents. Also for an agent already there.",
          },
        },
        required: ["agent"],
        additionalProperties: false,
      },
      describe: (input) => ({ title: `Add ${str(input.agent)} to #${str(input.channel).replace(/^#/, "") || "here"}` }),
      async execute(input, ctx) {
        try {
          const requester = await requesterOf(ctx);
          if (!requester) return noRequester;
          const [handle = ""] = await currentHandles(ctx.db, ctx.orgId, [
            str(input.agent).trim().replace(/^@/, "").toLowerCase(),
          ]);
          const [agent] = await ctx.db
            .select({ id: schema.agents.id, name: schema.agents.name, handle: schema.agents.handle })
            .from(schema.agents)
            .where(
              and(
                eq(schema.agents.orgId, ctx.orgId),
                isNull(schema.agents.archivedAt),
                sql`lower(${schema.agents.handle}) = ${handle}`,
              ),
            );
          if (!agent) return { content: await noAgentText(ctx, [handle]), isError: true };
          const name = str(input.channel).trim().replace(/^#/, "").toLowerCase();
          const { channels, channelMembers } = schema;
          const [channel] = name
            ? await ctx.db
                .select({ id: channels.id, name: channels.name, kind: channels.kind })
                .from(channels)
                .where(
                  and(
                    eq(channels.orgId, ctx.orgId),
                    eq(channels.name, name),
                    eq(channels.kind, "channel"),
                    isNull(channels.archivedAt),
                  ),
                )
            : [await getChannelCached(ctx.db, ctx.orgId, ctx.channelId)];
          if (channel?.kind !== "channel") {
            return {
              content: name ? `No channel #${name}.` : "Agents join channels, not this conversation.",
              isError: true,
            };
          }
          const [present] = await ctx.db
            .select({ id: channelMembers.id })
            .from(channelMembers)
            .where(and(eq(channelMembers.channelId, channel.id), eq(channelMembers.agentId, agent.id)));
          const added = present
            ? `@${agent.handle} is already in #${channel.name}.`
            : `Added @${agent.handle} to #${channel.name}.`;
          if (!present) {
            const autoReply = input.auto_reply !== false;
            const events = holdEvents(deps.pubsub);
            await actWithUndo(
              ctx,
              (db) => addChannelMember(db, requester, ctx.orgId, channel.id, { agentId: agent.id, autoReply }, events),
              () => ({
                kind: "channel.agent_added",
                target: { type: "channel", id: channel.id, title: channel.name },
                params: { agentId: agent.id, agentName: agent.name, agentHandle: agent.handle, channel: channel.name },
                before: null,
                after: { agentId: agent.id, autoReply },
              }),
            );
            // Cleared inside the transaction too: a run reading in between may have cached the channel as it was.
            invalidateOrg(ctx.orgId);
            await events.flush();
          }
          if (input.lead !== true) return { content: added };
          const [now] = await ctx.db
            .select({ leadAgentId: channels.leadAgentId })
            .from(channels)
            .where(eq(channels.id, channel.id));
          if (now?.leadAgentId === agent.id) return { content: `${added} It already is its responsible agent.` };
          // The channel screen's own change, as the catalog makes it: the person's rights, a receipt with Undo.
          const done = await actNow(deps, ctx, requester, updateChannelAction, {
            channelId: channel.id,
            leadAgentId: agent.id,
          });
          invalidateOrg(ctx.orgId);
          return "refused" in done
            ? { content: `${added} It is not its responsible agent: ${done.refused}`, isError: true }
            : { content: `${added} @${agent.handle} is now its responsible agent.` };
        } catch (error) {
          return failed(error);
        }
      },
    },
    {
      name: UPDATE_THREAD_TOOL,
      description:
        "Rename this thread (`title`) or close it (`close: true`, when its work is done) for the person who asked, with their rights. No permission needed: the person can ask you to undo it (undo_change).",
      scope: "",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 200 },
          close: { type: "boolean" },
        },
        additionalProperties: false,
      },
      describe: (input) => ({ title: input.close ? "Close this thread" : `Rename this thread to ${str(input.title)}` }),
      async execute(input, ctx) {
        try {
          const requester = await requesterOf(ctx);
          if (!requester) return noRequester;
          const title = str(input.title).trim();
          if (!title && input.close !== true) return { content: "Give a new `title` or `close: true`.", isError: true };
          if (replyThreadOf(ctx) === null) {
            return { content: "This conversation is not a thread.", isError: true };
          }
          const rootId = ctx.threadRootId;
          const done: string[] = [];
          await actWithUndo(
            ctx,
            async (db) => {
              const threadDeps = { db, pubsub: deps.pubsub };
              const before = await getThread(db, requester, ctx.orgId, rootId);
              const records: ActionRecord[] = [];
              if (title && title !== before.title) {
                const after = await updateThread(threadDeps, requester, ctx.orgId, rootId, { title });
                records.push({
                  kind: "thread.renamed",
                  target: { type: "thread", id: rootId, title: after.title ?? title },
                  params: { from: before.title ?? before.rootText, to: after.title ?? title },
                  before: { title: before.title },
                  after: { title: after.title },
                });
                done.push(`renamed to "${after.title ?? title}"`);
              }
              if (input.close === true && before.state === "open") {
                const after = await closeThread(threadDeps, requester, ctx.orgId, rootId);
                records.push({
                  kind: "thread.closed",
                  target: { type: "thread", id: rootId, title: after.title ?? after.rootText },
                  params: { title: after.title ?? after.rootText },
                  before: { state: before.state },
                  after: { state: "closed" },
                });
                done.push("closed");
              }
              return records;
            },
            (records) => records,
          );
          return { content: done.length ? `Thread ${done.join(" and ")}.` : "Nothing to change." };
        } catch (error) {
          return failed(error);
        }
      },
    },
    undoChangeTool(deps),
  ];
  return { name: "workspace", tools: async () => tools };
}

// ── Undo on request (ADR 0037, addendum of 2026-11-26) ───────────────────────

type ActionRow = typeof schema.agentActions.$inferSelect;

/** Why a change wasn't undone, for the agent to tell the person, by the engine's code. */
const WHY_NOT: Record<string, string> = {
  "action.already_undone": "it was already undone",
  "action.expired":
    "too late to undo it (the window to undo has passed): if they still want it back, make the opposite change as a new one with your tools, or tell them where in the app to change it",
  "action.changed_since":
    "it changed after you did it (someone edited it, or a later change sits on top: undo that one first), so undoing would overwrite that; change it back by hand if they still want it",
  "action.not_undoable": "nothing undoes this kind of change",
};

const whyNot = (a: ActionRow, error: unknown) => {
  const code = (error as { code?: unknown }).code;
  // A change nothing undoes (a merge) was recorded already closed: say so rather than "too late".
  if (code === "action.expired" && a.undoableUntil.getTime() === a.createdAt.getTime())
    return WHY_NOT["action.not_undoable"];
  if (typeof code === "string" && WHY_NOT[code]) return WHY_NOT[code];
  return error instanceof Error ? error.message : String(error);
};

/** A receipt as the agent reads it: its id and what it did. */
const actionLine = (a: ActionRow, now: Date) => {
  const state = a.undoneAt
    ? "undone"
    : a.undoableUntil.getTime() > now.getTime()
      ? "can be undone"
      : "too late to undo";
  return `- ${a.id}: ${describeAction(actionView(a))} (${state})`;
};

/**
 * `undo_change`: the agent undoes its own changes in this conversation when the person asks, as that person, through
 * the same engine call as the API's Desfazer (`undoAgentAction`): who may undo, the window, a later change blocking an
 * older one and "already undone" are its checks. Receipts under a reply have no button (ADR 0037 addendum of
 * 2026-11-26): asking the agent is the way.
 */
function undoChangeTool(deps: { pubsub?: PubSub }): ToolDefinition {
  return {
    name: UNDO_CHANGE_TOOL,
    description:
      "Undo changes you made in this conversation when the person asks (desfaça isso, desfazer, volta como estava, reverte, undo that, put it back): by default every change of your latest reply here that made changes; `action_id` for one change, `message_id` for all of one reply, `list` to see your recent changes with their ids first. It works as the person who asked, with their rights, while the change can still be undone and nothing changed it since. Say what was undone and what wasn't, and why.",
    scope: "",
    inputSchema: {
      type: "object",
      properties: {
        action_id: { type: "string", description: "One change's id, from `list`." },
        message_id: { type: "string", description: "A reply of yours: undo every change it made." },
        list: { type: "boolean", description: "Only list your recent changes here, with ids; undoes nothing." },
      },
      additionalProperties: false,
    },
    describe: (input) => ({ title: input.list ? "List my recent changes" : "Undo my change" }),
    looksOnly: (input) => input.list === true,
    async execute(input, ctx) {
      try {
        const person = await requesterOf(ctx);
        if (!person) return { content: "Only a person's request undoes a change; nothing was undone.", isError: true };
        const now = new Date();
        const thread = replyThreadOf(ctx);
        const { agentActions, messages } = schema;
        // Its own changes in this conversation: this run's (no reply yet), or on its replies here.
        const mine = and(
          eq(agentActions.orgId, ctx.orgId),
          eq(agentActions.agentId, ctx.agentId),
          eq(agentActions.channelId, ctx.channelId),
          or(
            // A call without a run (a mission task's bridge) has no changes of its own yet.
            ctx.runId ? eq(agentActions.runId, ctx.runId) : sql`false`,
            and(
              sql`${messages.id} is not null`,
              thread === null ? isNull(messages.threadId) : eq(messages.threadId, thread),
            ),
          ),
        );
        const select = (where: SQL | undefined, limit: number) =>
          ctx.db
            .select({ a: agentActions })
            .from(agentActions)
            .leftJoin(messages, and(eq(messages.orgId, agentActions.orgId), eq(messages.id, agentActions.messageId)))
            .where(and(mine, where))
            .orderBy(desc(agentActions.createdAt))
            .limit(limit)
            .then((rows) => rows.map((r) => r.a));
        const actionId = str(input.action_id).trim();
        const messageId = str(input.message_id).trim();
        const uuid = /^[0-9a-f-]{36}$/i;
        if ((actionId && !uuid.test(actionId)) || (messageId && !uuid.test(messageId)))
          return { content: "That isn't an id: call with `list` to see your changes' ids.", isError: true };
        if (input.list === true) {
          const recent = await select(undefined, 15);
          return {
            content: recent.length
              ? `Your recent changes here, newest first:\n${recent.map((a) => actionLine(a, now)).join("\n")}`
              : "You made no changes in this conversation.",
          };
        }
        let group: ActionRow[];
        if (actionId) group = await select(eq(agentActions.id, actionId), 1);
        else if (messageId) group = await select(eq(agentActions.messageId, messageId), 100);
        else {
          // The latest reply that changed something (or this run's changes, before it replies).
          const [last] = await select(undefined, 1);
          group = !last
            ? []
            : await select(
                last.messageId ? eq(agentActions.messageId, last.messageId) : eq(agentActions.runId, last.runId ?? ""),
                100,
              );
        }
        if (group.length === 0)
          return {
            content:
              actionId || messageId ? "No change of yours here with that id." : "You made no changes here to undo.",
            isError: true,
          };
        // Not allowed for one = nothing undone, as the API's Desfazer tudo refuses before it starts.
        for (const a of group.filter((a) => !a.undoneAt && a.undoableUntil.getTime() > now.getTime())) {
          try {
            await requireMayUndo(ctx.db, person, a);
          } catch (error) {
            return {
              content: `Nothing was undone: ${error instanceof Error ? error.message : String(error)}. Tell them who can.`,
              isError: true,
            };
          }
        }
        const undone: string[] = [];
        const kept: string[] = [];
        // Newest first: a later change on the same target goes back before an older one.
        for (const a of group) {
          try {
            await undoAgentAction({ db: ctx.db, pubsub: deps.pubsub }, person, ctx.orgId, a.id);
            undone.push(describeAction(actionView(a)));
          } catch (error) {
            kept.push(`${describeAction(actionView(a))}: ${whyNot(a, error)}`);
          }
        }
        const parts = [
          undone.length ? `Undone: ${undone.join("; ")}.` : "Nothing was undone.",
          kept.length ? `Not undone: ${kept.join("; ")}.` : "",
          "Tell the person.",
        ];
        return { content: parts.filter(Boolean).join(" "), ...(undone.length ? {} : { isError: true }) };
      } catch (error) {
        return failed(error);
      }
    },
  };
}
