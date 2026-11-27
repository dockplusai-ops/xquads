/**
 * "(editada)" after an edited message's words (ADR 0221), as markdown in italics: on the words' last line, or on a
 * line of its own after a closing code fence (text after the fence would reopen it as code).
 */
export function withEditedMark(body: string, label: string): string {
  const words = body.trimEnd();
  if (!words) return words;
  return /```\s*$/.test(words) ? `${words}\n\n_${label}_` : `${words} _${label}_`;
}
