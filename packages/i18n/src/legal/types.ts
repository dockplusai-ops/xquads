/**
 * A legal page (Terms of Use, Privacy Policy) as data, rendered by the app at
 * `/terms` and `/privacy`. Inline text may carry `**bold**`; email addresses
 * and `https://` links become links when rendered (`legalInline`).
 */
export type LegalBlock = string | { list: string[] };

export interface LegalSection {
  /** Anchor on the page (`#retention`), the same in every language. */
  id: string;
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  title: string;
  /** One line under the title. */
  summary: string;
  /**
   * A translation's notice at the top, in its language: "This is a courtesy translation. If it differs from the
   * Portuguese version, the Portuguese version prevails." Portuguese, the version that prevails, has none.
   */
  courtesy?: string;
  /** ISO date of the last change (`2026-11-28`). */
  updated: string;
  sections: LegalSection[];
}

export type LegalKind = "terms" | "privacy";
