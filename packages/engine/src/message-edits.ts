import type { PubSub } from "@agenteschat/adapters";
import { and, type Database, eq, isNull, schema, sql } from "@agenteschat/db";
import { recordAudit } from "./audit";
import { requireChannelAccess } from "./channels";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors";
import { publishChannelEvent } from "./events";
import { getMessage, MAX_MESSAGE_LENGTH } from "./messages";
import { requirePermission } from "./organizations";
import { enqueueIndex } from "./search";

/**
 * Editing and deleting a message (ADR 0221). A person edits their own message's words: the text changes, `edited_at`
 * says when, and nothing runs again (no agent is woken, nobody mentioned is told again). A person deletes their own
 * message, an administrator anyone's: a message nobody replied to goes (`deleted_at`); a thread's root with replies
 * stays as "Mensagem apagada" (`meta.deleted`, its words and files gone from it), so its replies keep their place. The
 * files it carried stay in the Drive. Agents' messages are neither edited nor deleted here.
 */

/** What `meta.deleted` holds on a thread's root that was deleted with replies under it. */
export interface DeletedMark {
  at: string;
  byUserId: string;
}

/** The stored message a person may change, or why not. */
async function ownedPersonMessage(db: Database, userId: string, orgId: string, messageId: string) {
  const message = await getMessage(db, orgId, messageId);
  if (!message || message.deletedAt || message.meta?.deleted) throw new NotFoundError("Message not found");
  await requireChannelAccess(db, userId, orgId, message.channelId);
  if (message.authorType !== "person") throw new ForbiddenError("Only a person's message", "message.not_editable");
  return message;
}

/** Edits the words of the person's own message. Returns the new text and when. */
export async function editMessage(
  deps: { db: Database; pubsub?: PubSub },
  userId: string,
  orgId: string,
  messageId: string,
  input: { body: string },
): Promise<{ body: string; editedAt: string }> {
  const { db } = deps;
  const message = await ownedPersonMessage(db, userId, orgId, messageId);
  if (message.authorUserId !== userId) throw new ForbiddenError("Only its author edits a message", "message.not_yours");
  const body = input.body.trim();
  // A message with no words of its own (a GIF, a file alone) keeps none: there is nothing to edit.
  if (!body || !message.body.trim())
    throw new ValidationError("A message needs words to be edited", "message.empty_edit");
  if (body.length > MAX_MESSAGE_LENGTH) throw new ValidationError("Message too long", "message.too_long");
  const at = new Date();
  if (body === message.body) return { body, editedAt: (message.editedAt ?? at).toISOString() };
  await db.transaction(async (tx) => {
    await tx
      .update(schema.messages)
      .set({ body, editedAt: at })
      .where(and(eq(schema.messages.orgId, orgId), eq(schema.messages.id, messageId)));
    await enqueueIndex(tx, { orgId, kind: "message", sourceId: messageId });
  });
  await publishChannelEvent(deps.pubsub, {
    type: "message.edited",
    channelId: message.channelId,
    threadId: message.threadId,
    messageId,
    body,
    editedAt: at.toISOString(),
  });
  return { body, editedAt: at.toISOString() };
}

/**
 * Deletes a person's message: its author, or an administrator for anyone's (recorded in the audit log). Returns
 * whether it stays as "Mensagem apagada" (a thread's root with replies).
 */
export async function deleteMessage(
  deps: { db: Database; pubsub?: PubSub },
  userId: string,
  orgId: string,
  messageId: string,
): Promise<{ kept: boolean }> {
  const { db } = deps;
  const message = await ownedPersonMessage(db, userId, orgId, messageId);
  const mine = message.authorUserId === userId;
  if (!mine)
    await requirePermission(db, userId, orgId, "administrator").catch(() => {
      throw new ForbiddenError("Only its author or an administrator deletes a message", "message.not_yours");
    });
  const [reply] = await db
    .select({ id: schema.messages.id })
    .from(schema.messages)
    .where(
      and(eq(schema.messages.orgId, orgId), eq(schema.messages.threadId, messageId), isNull(schema.messages.deletedAt)),
    )
    .limit(1);
  const kept = Boolean(reply) && message.threadId === null;
  const at = new Date();
  await db.transaction(async (tx) => {
    const where = and(eq(schema.messages.orgId, orgId), eq(schema.messages.id, messageId));
    if (kept) {
      const deleted: DeletedMark = { at: at.toISOString(), byUserId: userId };
      await tx
        .update(schema.messages)
        .set({ body: "", meta: sql`jsonb_build_object('deleted', ${JSON.stringify(deleted)}::jsonb)` })
        .where(where);
    } else {
      await tx.update(schema.messages).set({ deletedAt: at }).where(where);
    }
    await enqueueIndex(tx, { orgId, kind: "message", sourceId: messageId });
    if (!mine)
      await recordAudit(tx, {
        orgId,
        actor: { type: "person", id: userId },
        action: "message.deleted",
        target: { type: "message", id: messageId },
        details: { channelId: message.channelId, authorUserId: message.authorUserId },
      });
  });
  await publishChannelEvent(deps.pubsub, {
    type: "message.deleted",
    channelId: message.channelId,
    threadId: message.threadId,
    messageId,
    kept,
  });
  return { kept };
}
