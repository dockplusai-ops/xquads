/**
 * xquads's Terms of Use and Privacy Policy. Portuguese prevails (the operator is a Brazilian company), English is a
 * courtesy translation that says so, and every other language shows the English page.
 */
import { type AppLocale, appLocale } from "../locale";
import { privacyEn } from "./privacy.en";
import { privacyPtBR } from "./privacy.pt-BR";
import { termsEn } from "./terms.en";
import { termsPtBR } from "./terms.pt-BR";
import type { LegalDocument, LegalKind } from "./types";

export type { LegalBlock, LegalDocument, LegalKind, LegalSection } from "./types";

type ByLocale = Partial<Record<AppLocale, LegalDocument>> & Record<"en" | "pt-BR", LegalDocument>;

/** Each page in every language that has it (English and Portuguese). */
export const legalDocuments: Record<LegalKind, ByLocale> = {
  terms: { en: termsEn, "pt-BR": termsPtBR },
  privacy: { en: privacyEn, "pt-BR": privacyPtBR },
};

/** The page in `locale`, or in English where that language has none. */
export function legalDocument(kind: LegalKind, locale: string): LegalDocument {
  return legalDocuments[kind][appLocale([locale], true) ?? "en"] ?? legalDocuments[kind].en;
}

/** A piece of inline legal text: plain, `**bold**`, or a link (email or https). */
export type LegalInline = { kind: "text" | "bold"; text: string } | { kind: "link"; text: string; href: string };

const LINKS = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+|https:\/\/[^\s)]+[^\s).,;])/g;

/** Splits a line into text, bold and links, for any renderer (React in the apps, HTML at build time). */
export function legalInline(line: string): LegalInline[] {
  const out: LegalInline[] = [];
  line.split("**").forEach((part, i) => {
    if (!part) return;
    if (i % 2 === 1) {
      out.push({ kind: "bold", text: part });
      return;
    }
    let last = 0;
    for (const m of part.matchAll(LINKS)) {
      const at = m.index ?? 0;
      if (at > last) out.push({ kind: "text", text: part.slice(last, at) });
      const text = m[0];
      out.push({ kind: "link", text, href: text.startsWith("https://") ? text : `mailto:${text}` });
      last = at + text.length;
    }
    if (last < part.length) out.push({ kind: "text", text: part.slice(last) });
  });
  return out;
}
