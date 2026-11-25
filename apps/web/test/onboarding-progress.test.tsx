import { describe, expect, test } from "bun:test";
import { setupDom } from "@agenteschat/ui/testing";

setupDom();

import { cleanup, render } from "@testing-library/react";
import { OnboardingProgress } from "../src/components/Sky";

/** The fill's width as rendered: xquads' plain bar (no pixel sky), a share of the track. */
const fillOf = (progress: number) => {
  const { container } = render(<OnboardingProgress progress={progress} />);
  const fill = container.querySelector<HTMLElement>(".onb__progress-fill");
  const width = fill?.style.width;
  cleanup();
  return width;
};

describe("the setup's progress bar", () => {
  test("a plain bar: its fill is the share of the steps done, from empty to full", () => {
    expect(fillOf(0)).toBe("0%");
    expect(fillOf(0.5)).toBe("50%");
    expect(fillOf(1)).toBe("100%");
  });

  test("out of range is held at its ends", () => {
    expect(fillOf(-0.2)).toBe("0%");
    expect(fillOf(1.4)).toBe("100%");
  });

  test("decorative: the steps' list says where the person is", () => {
    const { container } = render(<OnboardingProgress progress={0.3} />);
    expect(container.querySelector(".onb__progress-sky")?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("canvas")).toBeNull();
    cleanup();
  });
});
