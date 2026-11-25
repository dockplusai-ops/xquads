/**
 * What a help page needs besides its words: the pages' list, links into them and the inline markup. Light on purpose:
 * the web loads each language's pages on its own (`./load`), so the help route never carries all fourteen.
 */
import { docsUrl } from "../docs";
import { type LegalInline, legalInline } from "../legal";

export type { HelpBlock, HelpDocument, HelpSection } from "./types";

/** Each page and the edition it speaks to (tests hold a Cloud page to the Cloud's words). */
export const HELP_PAGES = {
  "install-on-a-server": "selfhost",
  "run-on-your-computer": "selfhost",
  "workspace-computer": "cloud",
  import: "both",
  wiki: "both",
  memory: "both",
  approvals: "both",
  "who-answers": "both",
  jev: "selfhost",
  "apps-de-ia": "both",
  computers: "both",
} as const;

export type HelpSlug = keyof typeof HELP_PAGES;

/**
 * Where every self-hosted pointer sends a reader: the installer, the setup, the server's messages and settings. The
 * files that can't import this (`install.sh`, the MIT setup package, the desktop app's Rust, `.env` descriptions)
 * hold the URL as text, and a test keeps them equal.
 */
export const INSTALL_PAGE = "install-on-a-server" satisfies HelpSlug;
export const INSTALL_DOCS_URL = docsUrl("en", INSTALL_PAGE);

export const isHelpSlug = (slug: string): slug is HelpSlug => Object.hasOwn(HELP_PAGES, slug);

/** A piece of inline help text: plain, `**bold**`, `` `code` `` or a link. */
export type HelpInline = LegalInline | { kind: "code"; text: string };

/** Code spans, then `[text](href)` links; what's between them goes to `legalInline` (bold and bare links). */
const CODE_OR_LINK = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * Splits a line into text, bold, code and links. A URL inside code or a link is never linked twice, and `[[note]]`
 * (the wiki's own syntax) stays plain text.
 */
export function helpInline(line: string): HelpInline[] {
  const out: HelpInline[] = [];
  let last = 0;
  for (const m of line.matchAll(CODE_OR_LINK)) {
    const at = m.index ?? 0;
    if (at > last) out.push(...legalInline(line.slice(last, at)));
    if (m[1] !== undefined) out.push({ kind: "code", text: m[1] });
    else out.push({ kind: "link", text: m[2] ?? "", href: m[3] ?? "" });
    last = at + m[0].length;
  }
  if (last < line.length) out.push(...legalInline(line.slice(last)));
  return out;
}
