/**
 * The test files a change reaches, for the quick check (`.github/workflows/quick.yml`). Reads changed paths on
 * stdin, one per line, and prints test files: each changed test file, each test file that imports a changed
 * source file by its name, and a component's own test by its kebab-case name (`ReconnectPill.tsx` →
 * `reconnect-pill.test.tsx`). A change to the translations also runs `packages/i18n/test`.
 *
 * ponytail: matched by import name, not by the module graph. A file reached only through a re-export is missed,
 * which the full CI (ci.yml, run before a release) still catches. A name more than `WIDE` test files import
 * (`types`, `utils`) is left to the typecheck: running them all is the full CI's job.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, extname } from "node:path";

const TEST = /\.test\.tsx?$/;
const SOURCE = /\.(tsx?|jsx?|mjs)$/;
const WIDE = 40;

const changed = (await Bun.stdin.text())
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && existsSync(l));

const tests = new Set<string>();
const names = new Set<string>();
for (const file of changed) {
  if (TEST.test(file)) tests.add(file);
  else if (SOURCE.test(file) && !file.includes("/test/")) {
    const name = basename(file, extname(file));
    // An index file is imported by its folder's name.
    names.add(name === "index" ? basename(dirname(file)) : name);
  }
  if (file.startsWith("packages/i18n/")) tests.add("packages/i18n/test");
}

if (names.size) {
  const all = Bun.spawnSync(["git", "ls-files", "*.test.ts", "*.test.tsx"])
    .stdout.toString()
    .split("\n")
    .filter(Boolean);
  const texts = all.map((file) => [file, readFileSync(file, "utf8")] as const);
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
    const imports = new RegExp(`/${escaped}(\\.[a-z]+)?["']`);
    const kebab = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    const hits = texts.filter(([file, text]) => imports.test(text) || basename(file).startsWith(`${kebab}.`));
    if (hits.length > WIDE) console.error(`${name}: ${hits.length} test files import it, left to the full CI`);
    else for (const [file] of hits) tests.add(file);
  }
}

// Nothing printed when nothing is reached: an empty argument would make `bun test` run every file.
if (tests.size) console.log([...tests].sort().join("\n"));
