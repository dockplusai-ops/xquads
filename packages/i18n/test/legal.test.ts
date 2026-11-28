import { describe, expect, test } from "bun:test";
import { en, ptBR } from "../src/index";
import { type LegalKind, legalDocument, legalDocuments, legalInline } from "../src/legal";
import { leaves } from "./leaves";

describe("legal pages", () => {
  for (const [kind, byLocale] of Object.entries(legalDocuments)) {
    test(`${kind}: pt-BR and en have the same sections, date and shape`, () => {
      const pt = byLocale["pt-BR"];
      const en = byLocale.en;
      expect(pt.updated).toBe(en.updated);
      expect(pt.sections.map((s) => s.id)).toEqual(en.sections.map((s) => s.id));
      pt.sections.forEach((s, i) => {
        const shape = (b: unknown) => (typeof b === "string" ? "p" : `list:${(b as { list: string[] }).list.length}`);
        expect(s.blocks.map(shape)).toEqual(en.sections[i]?.blocks.map(shape) ?? []);
      });
      expect(new Set(pt.sections.map((s) => s.id)).size).toBe(pt.sections.length);
    });
  }
});

describe("the privacy policy names the AI providers that receive what people write to agents", () => {
  // The App Store asks an app to say, plainly and where it is easy to find, which third-party AI gets people's data.
  // A provider a workspace connects with its own key or plan is named only as an example (Section 2).
  const section = (locale: "en" | "pt-BR", id: string) =>
    JSON.stringify(legalDocuments.privacy[locale].sections.find((s) => s.id === id)?.blocks);
  for (const locale of ["en", "pt-BR"] as const)
    test(locale, () => {
      expect(legalDocuments.privacy[locale].sections[1]?.id).toBe("ai-providers");
      for (const name of ["OpenAI", "TypeSafe"]) {
        expect(section(locale, "ai-providers")).toContain(name);
        expect(section(locale, "transfers")).toContain(name);
      }
    });
  test("no language names a provider the platform does not use", () => {
    for (const [code, doc] of Object.entries(legalDocuments.privacy))
      expect({ code, named: JSON.stringify(doc).match(/\b(?:OpenRouter|Command Code|Kimi|MiniMax|Z\.ai)\b/g) }).toEqual(
        {
          code,
          named: null,
        },
      );
  });
});

describe("xquads's restriction lines cite the Terms this server serves", () => {
  // The section each line rests on, by its id: when the Terms are renumbered, this fails until the lines follow.
  const RESTS_ON = {
    review: "acceptable-use",
    reviewFor: "acceptable-use",
    blockedAbuse: "acceptable-use",
    agentNetwork: "acceptable-use",
    agentOperator: "acceptable-use",
  };
  for (const [locale, lines] of [
    ["en", en.standing.cloud],
    ["pt-BR", ptBR.standing.cloud],
  ] as const) {
    test(locale, () => {
      const { sections } = legalDocuments.terms[locale];
      const cited = Object.entries(lines).flatMap(([key, line]) => {
        const number = typeof line === "string" ? line.match(/(?:section|seção) (\d+)/)?.[1] : undefined;
        return number ? [[key, number]] : [];
      });
      const served = Object.entries(RESTS_ON).map(([key, id]) => [
        key,
        sections.find((s) => s.id === id)?.heading.match(/^(\d+)\./)?.[1],
      ]);
      expect(Object.fromEntries(cited)).toEqual(Object.fromEntries(served));
    });
  }
});

describe("legalInline", () => {
  test("bold, emails and links", () => {
    expect(legalInline("**Hostinger:** hosting. Write to support@xquads.com, or see https://xquads.com/en.")).toEqual([
      { kind: "bold", text: "Hostinger:" },
      { kind: "text", text: " hosting. Write to " },
      { kind: "link", text: "support@xquads.com", href: "mailto:support@xquads.com" },
      { kind: "text", text: ", or see " },
      { kind: "link", text: "https://xquads.com/en", href: "https://xquads.com/en" },
      { kind: "text", text: "." },
    ]);
  });
});

describe("legal pages in every language", () => {
  for (const [kind, byLocale] of Object.entries(legalDocuments)) {
    test(`${kind}: Portuguese prevails, English says so, and every other language reads English`, () => {
      expect(Object.keys(byLocale).sort()).toEqual(["en", "pt-BR"]);
      expect(byLocale["pt-BR"].courtesy).toBeUndefined();
      expect(byLocale.en.courtesy).toContain("the Portuguese version prevails");
      expect(legalDocument(kind as LegalKind, "ja")).toBe(byLocale.en);
      expect(legalDocument(kind as LegalKind, "pt")).toBe(byLocale["pt-BR"]);
    });
  }
});

test("legal pages: no semicolon and no em dash", () => {
  const found = leaves(legalDocuments).filter(([, text]) => typeof text === "string" && /[;；—]/.test(text));
  expect(found).toEqual([]);
});
