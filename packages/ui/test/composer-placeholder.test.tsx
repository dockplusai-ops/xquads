import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { setupDom } from "../testing/dom";

setupDom();

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Composer } from "../src/components/Composer";

afterEach(cleanup);

const box = () => (
  <Composer
    value=""
    onChange={() => {}}
    onSend={() => {}}
    label="Mensagem para #geral"
    placeholder="Mensagem para #geral · use @ para chamar um agente"
    sendLabel="Enviar"
  />
);

/** A box `width` px wide, its text 8px a character. */
function sized(width: number) {
  const pen = spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => ({ font: "", measureText: (text: string) => ({ width: text.length * 8 }) }) as never,
  );
  const was = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => width });
  return () => {
    pen.mockRestore();
    if (was) Object.defineProperty(HTMLElement.prototype, "clientWidth", was);
  };
}

describe("the composer's placeholder", () => {
  test("whole when it fits on one line; in a narrow box (a phone, a task's panel), without the tip after its ·", () => {
    // 50 characters: 400px of text.
    const wide = sized(600);
    render(box());
    expect(screen.getByRole("textbox").getAttribute("placeholder")).toBe(
      "Mensagem para #geral · use @ para chamar um agente",
    );
    cleanup();
    wide();
    const narrow = sized(300);
    render(box());
    expect(screen.getByRole("textbox").getAttribute("placeholder")).toBe("Mensagem para #geral");
    narrow();
  });
});

describe("the next message suggested (ADR 0220)", () => {
  const suggesting = (value: string, onChange: (v: string) => void) => (
    <Composer
      value={value}
      onChange={onChange}
      onSend={() => {}}
      label="Mensagem para Lodi"
      placeholder="Mensagem para Lodi"
      sendLabel="Enviar"
      suggestion="Pode enviar a proposta"
    />
  );

  test("grey in the empty box with its key; Tab or → puts it in the box; once typed, the placeholder is back", () => {
    const restore = sized(600);
    let typed = "";
    const view = render(suggesting("", (v) => (typed = v)));
    const field = screen.getByRole("textbox");
    expect(field.getAttribute("placeholder")).toBe("Pode enviar a proposta · Tab");
    fireEvent.keyDown(field, { key: "Tab" });
    expect(typed).toBe("Pode enviar a proposta");
    typed = "";
    fireEvent.keyDown(field, { key: "ArrowRight" });
    expect(typed).toBe("Pode enviar a proposta");
    // Shift+Tab still leaves the box.
    typed = "";
    fireEvent.keyDown(field, { key: "Tab", shiftKey: true });
    expect(typed).toBe("");
    view.rerender(suggesting("ok", (v) => (typed = v)));
    expect(field.getAttribute("placeholder")).toBe("Mensagem para Lodi");
    fireEvent.keyDown(field, { key: "Tab" });
    expect(typed).toBe("");
    restore();
  });
});
