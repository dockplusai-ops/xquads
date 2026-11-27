import type { Message } from "../api/types";

/**
 * The next message suggested in a DM with an agent (ADR 0220): kept on the agent's reply as `meta.nextPrompt` for the
 * person in that DM, live through `message.suggestion`. The web shows it as grey text in the empty composer (Tab or →
 * takes it), the phone as a button above the composer.
 */
export interface NextPrompt {
  text: string;
  forUserId: string;
}

/** The reply's suggestion for `userId`, or null (none, or someone else's). */
export function nextPromptOf(message: Pick<Message, "meta"> | null | undefined, userId: string | null | undefined) {
  const raw = message?.meta?.nextPrompt as Partial<NextPrompt> | undefined;
  if (!userId || !raw || raw.forUserId !== userId || typeof raw.text !== "string") return null;
  return raw.text.trim() || null;
}

/**
 * What the composer suggests: the newest message's suggestion, only when that message is the agent's reply (a person
 * who already wrote again gets none) and nothing is typed.
 */
export function composerSuggestion(
  newest: Pick<Message, "meta" | "author"> | null | undefined,
  userId: string | null | undefined,
  typed: string,
): string | null {
  if (typed.trim() || newest?.author.type !== "agent") return null;
  return nextPromptOf(newest, userId);
}
