import { type CSSProperties, useEffect, useRef } from "react";
import { bodyTones } from "../agent/engine.js";
import { cx } from "../cx";
import type { AgentColor } from "./AgentLook";

/**
 * Our working indicator, the pixel orbit: a 3×3 grid where one lit cell walks the ring with a fading
 * trail. Tied to an agent it is drawn in that agent's own `bodyTones`;
 * otherwise in the text color around it (ink, the same tones as the words).
 * Still under prefers-reduced-motion. Decorative unless `label` is given:
 * the chip or button next to it says what is happening.
 */
export type PixelSpinnerSize = 14 | 16 | 24 | 32;

export interface PixelSpinnerProps {
  /** 14 (chips, rows), 16 (buttons), 24, 32. */
  size?: PixelSpinnerSize;
  /** The agent's color when the work is an agent's; neutral ink otherwise. */
  color?: AgentColor;
  /** Accessible name; without it the spinner is `aria-hidden`. */
  label?: string;
  className?: string;
}

/** The ring, clockwise from the top-left cell (the center stays dark). */
export const ORBIT_RING = [
  [0, 0],
  [1, 0],
  [2, 0],
  [2, 1],
  [2, 2],
  [1, 2],
  [0, 2],
  [0, 1],
] as const;
/** One step of the lit cell (110 ms). */
export const ORBIT_STEP_MS = 110;

/** Which shade each ring cell takes when the lit cell is at `head` (0 lit, 1 and 2 the trail, 3 the rest). */
export function orbitShades(head: number): number[] {
  const n = ORBIT_RING.length;
  return ORBIT_RING.map((_, i) => Math.min(3, (((head - i) % n) + n) % n));
}

/**
 * xquads' working indicator: a thin ring and a quarter arc in the agent's color (or the words' ink), turned by CSS
 * (`.ac-pixspin`). The original's pixel orbit is gone (DESIGN.md: no pixel art); `orbitShades` stays for its callers.
 */
function paint(canvas: HTMLCanvasElement, color: AgentColor | undefined) {
  const ctx = canvas.getContext?.("2d");
  if (!ctx) return;
  const w = canvas.width;
  const line = Math.max(1.5, w * 0.12);
  const r = w / 2 - line / 2;
  const ink = color ? (bodyTones(color)[1] ?? "#c79d70") : getComputedStyle(canvas).color || "#ede6e1";
  ctx.clearRect(0, 0, w, w);
  ctx.lineWidth = line;
  ctx.lineCap = "round";
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.arc(w / 2, w / 2, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(w / 2, w / 2, r, -Math.PI / 2, 0);
  ctx.stroke();
}

export function PixelSpinner({ size = 16, color, label, className }: PixelSpinnerProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = typeof devicePixelRatio === "number" && devicePixelRatio > 0 ? devicePixelRatio : 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    paint(canvas, color);
    return undefined;
  }, [size, color]);
  return (
    <canvas
      ref={ref}
      className={cx("ac-pixspin", className)}
      style={{ width: size, height: size, "--mark-size": `${size}px` } as CSSProperties}
      data-color={color}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
