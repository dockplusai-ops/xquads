import { afterEach, expect, test } from "bun:test";
import { setupDom } from "@agenteschat/ui/testing/dom";

setupDom();

import { act, cleanup, fireEvent } from "@testing-library/react";
import { WikiRichEditor } from "@/components/wiki/WikiRichEditor";
import { createFakeApi, seedState } from "./fake-api";
import { renderPage, screen } from "./render";

afterEach(() => cleanup());

test("the editor's block list (/) takes the room on its side of the caret, not a fixed height that scrolls with room left", async () => {
  await renderPage(<WikiRichEditor value="" onChange={() => {}} onSave={() => {}} pages={[]} label="Texto" />, {
    api: createFakeApi(seedState()),
  });
  const box = screen().getByRole("textbox", { name: "Texto" });
  const p = box.querySelector("p") ?? box.appendChild(document.createElement("p"));
  p.textContent = "/";
  const text = p.firstChild as Text;
  const range = document.createRange();
  range.setStart(text, text.length);
  range.collapse(true);
  getSelection()?.removeAllRanges();
  getSelection()?.addRange(range);
  await act(async () => fireEvent.input(box));
  const list = screen().getByRole("listbox");
  // happy-dom has no layout: the caret is at 0, so the whole window under it, less the gap and the edge's room.
  expect(list.style.maxHeight).toBe(`${window.innerHeight - 6 - 12}px`);
  expect(list.style.top).toBe("6px");
});

test("[[ lists the pages on the window's layer (a transformed page would hide it) and links the one picked in its line", async () => {
  let saved = "";
  await renderPage(
    <div style={{ transform: "translateY(0)" }}>
      <WikiRichEditor
        value=""
        onChange={(md) => {
          saved = md;
        }}
        onSave={() => {}}
        pages={[
          {
            id: "g",
            slug: "glossario",
            title: "Glossário",
            folder: "",
            tags: [],
            updatedAt: "2026-11-26T12:00:00Z",
            updatedBy: { type: "person", id: "u" },
          },
        ]}
        label="Texto"
      />
    </div>,
    { api: createFakeApi(seedState()) },
  );
  const box = screen().getByRole("textbox", { name: "Texto" });
  const p = box.querySelector("p") ?? box.appendChild(document.createElement("p"));
  p.textContent = "Ver também [[Gloss";
  const text = p.firstChild as Text;
  const range = document.createRange();
  range.setStart(text, text.length);
  range.collapse(true);
  getSelection()?.removeAllRanges();
  getSelection()?.addRange(range);
  await act(async () => fireEvent.input(box));
  const list = screen().getByRole("listbox", { name: "Páginas" });
  expect(list.parentElement).toBe(document.body);
  expect(list.textContent).toContain("Glossário");
  await act(async () => fireEvent.keyDown(box, { key: "Enter" }));
  expect(screen().queryByRole("listbox")).toBeNull();
  // The link stays in its paragraph.
  expect(box.children).toHaveLength(1);
  expect(p.querySelector("a.wiki-link")?.getAttribute("data-title")).toBe("Glossário");
  await act(async () => fireEvent.blur(box));
  expect(saved).toBe("Ver também [[Glossário]]");
});
