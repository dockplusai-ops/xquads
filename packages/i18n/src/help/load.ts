/**
 * One language's help pages, loaded on their own: the web's help route fetches the language it shows (and English,
 * where that language has no translation of a page) instead of carrying all fourteen.
 */

import { type AppLocale, appLocale } from "../locale";
import type { HelpSlug } from "./core";
import type { HelpDocument } from "./types";

type Pages = Partial<Record<HelpSlug, HelpDocument>>;

const LOAD: Record<AppLocale, () => Promise<Pages>> = {
  en: () => import("./pages.en").then((m) => m.helpEn),
  "pt-BR": () => import("./pages.pt-BR").then((m) => m.helpPtBR),
  es: () => import("./pages.es").then((m) => m.helpEs),
  fr: () => import("./pages.fr").then((m) => m.helpFr),
  de: () => import("./pages.de").then((m) => m.helpDe),
  it: () => import("./pages.it").then((m) => m.helpIt),
  nl: () => import("./pages.nl").then((m) => m.helpNl),
  ja: () => import("./pages.ja").then((m) => m.helpJa),
  ko: () => import("./pages.ko").then((m) => m.helpKo),
  "zh-Hans": () => import("./pages.zh-Hans").then((m) => m.helpZhHans),
  id: () => import("./pages.id").then((m) => m.helpId),
  tr: () => import("./pages.tr").then((m) => m.helpTr),
  pl: () => import("./pages.pl").then((m) => m.helpPl),
  ru: () => import("./pages.ru").then((m) => m.helpRu),
};

/** The page in `locale` ("pt-PT" reads pt-BR), or in English where that language has none; `shown` says which. */
export async function loadHelpDocument(
  slug: HelpSlug,
  locale: string,
): Promise<{ doc: HelpDocument; shown: AppLocale }> {
  const code = appLocale([locale], true) ?? "en";
  const own = (await LOAD[code]())[slug];
  if (own) return { doc: own, shown: code };
  const en = (await LOAD.en())[slug];
  if (!en) throw new Error(`help page ${slug} has no English text`);
  return { doc: en, shown: "en" };
}
