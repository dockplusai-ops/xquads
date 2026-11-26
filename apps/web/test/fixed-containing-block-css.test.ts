import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

const SHEETS = [
  "apps/web/src/layout.css",
  "apps/web/src/pages/wiki.css",
  "apps/web/src/pages/new-agent.css",
  "apps/web/src/pages/drive.css",
  "packages/ui/src/styles/components.css",
].map(read);
const ALL = SHEETS.join("\n");

/** Each `@keyframes` name with its body. */
const keyframes = new Map(
  [...ALL.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)].map((m) => [m[1], m[2] ?? ""]),
);

/** Every `animation` written for `selector`, inside a media query too, but reduced motion's `none`. */
const animationsOf = (selector: string) =>
  [...ALL.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((m) => (m[1] ?? "").split(",").some((s) => s.trim() === selector))
    .flatMap((m) => [...(m[2] ?? "").matchAll(/(?:^|;|\s)animation:\s*([^;]+);/g)].map((a) => a[1] ?? ""))
    .filter((value) => value.trim() !== "none");

/*
 * A fixed box takes the nearest transformed ancestor as its containing block, and Chromium keeps an animation that
 * moved a transform and fills forwards (`both`, `forwards`) as such an ancestor even after it lands on
 * `transform: none`. A float placed at a caret's or a pointer's window point inside one shows shifted by the
 * ancestor's offset (the sidebar's width) and clipped. These wrappers hold whole pages, panes or message rows, so
 * their entrance fills only backwards: at rest they are what reduced motion already draws.
 */
const WRAPPERS = [
  ".wiki-home",
  ".wiki-doc",
  ".agp-view",
  ".newag__content > *",
  ".newag__aside",
  ".drive-group",
  ".ac-msg--enter",
];

describe("entrances never leave a page a containing block for fixed floats", () => {
  for (const selector of WRAPPERS) {
    test(`${selector} comes in moving and rests without a kept transform`, () => {
      const written = animationsOf(selector);
      expect(written.length).toBeGreaterThan(0);
      for (const value of written) {
        const name = value.split(/\s+/).find((w) => keyframes.has(w));
        expect(name).toBeDefined();
        expect(keyframes.get(name ?? "")).toMatch(/transform\s*:/);
        expect(value).not.toMatch(/\b(both|forwards)\b/);
      }
    });
  }
});
