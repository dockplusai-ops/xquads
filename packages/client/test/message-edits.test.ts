import { expect, test } from "bun:test";
import { withEditedMark } from "../src/lib/message-edits";

test('"(editada)" after the words, on a line of its own after a code fence', () => {
  expect(withEditedMark("deploy às 10h", "(editada)")).toBe("deploy às 10h _(editada)_");
  expect(withEditedMark("veja:\n```\nls -la\n```\n", "(editada)")).toBe("veja:\n```\nls -la\n```\n\n_(editada)_");
  expect(withEditedMark("   ", "(editada)")).toBe("");
});
