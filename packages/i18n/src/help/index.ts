/**
 * The help pages on the docs site (`docsUrl`), in English and the languages that translated them: each holds the
 * background reading that a screen of the app links to once, where it helps.
 */
import { type AppLocale, appLocale } from "../locale";
import type { HelpSlug } from "./core";
import { helpDe } from "./pages.de";
import { helpEn } from "./pages.en";
import { helpEs } from "./pages.es";
import { helpFr } from "./pages.fr";
import { helpId } from "./pages.id";
import { helpIt } from "./pages.it";
import { helpJa } from "./pages.ja";
import { helpKo } from "./pages.ko";
import { helpNl } from "./pages.nl";
import { helpPl } from "./pages.pl";
import { helpPtBR } from "./pages.pt-BR";
import { helpRu } from "./pages.ru";
import { helpTr } from "./pages.tr";
import { helpZhHans } from "./pages.zh-Hans";
import type { HelpDocument } from "./types";

export * from "./core";

/** Every language's pages: English has them all, another language what it translated. */
export const HELP: Record<AppLocale, Partial<Record<HelpSlug, HelpDocument>>> = {
  en: helpEn,
  "pt-BR": helpPtBR,
  es: helpEs,
  fr: helpFr,
  de: helpDe,
  it: helpIt,
  nl: helpNl,
  ja: helpJa,
  ko: helpKo,
  "zh-Hans": helpZhHans,
  id: helpId,
  tr: helpTr,
  pl: helpPl,
  ru: helpRu,
};

/** The page in `locale` ("pt-PT" reads pt-BR), or in English where that language has none. */
export function helpDocument(slug: HelpSlug, locale: string): HelpDocument {
  return HELP[appLocale([locale], true) ?? "en"][slug] ?? helpEn[slug];
}
