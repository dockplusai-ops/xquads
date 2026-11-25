/**
 * Pixel art for the installers' pictures (installer-art.ts for Windows, dmg-art.ts for the macOS .dmg), drawn from
 * the agent engine and the sky's tones so the installers show the same agent and sky as the app's cover.
 *
 * No dependencies: the wordmark is outlines as path data (Funnel Display Light for "agentes", Doto Rounded
 * SemiBold for the dotted ".chat", both SIL Open Font License 1.1), filled here, and small BMP and PNG writers.
 */
import { deflateSync } from "node:zlib";
import { bodyTones, EYE_COLOR, eyeShapes, inBody, toneAt } from "../../../packages/ui/src/agent/engine.js";
import { NAME } from "../../../packages/ui/src/components/Logo.tsx";
import { SKY_TONES } from "../../../packages/ui/src/sky/math";

export type RGB = [number, number, number];

export const hex = (h: string): RGB => {
  const n = Number.parseInt(h.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const WHITE: RGB = [255, 255, 255];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/**
 * The background's run from deep to light: one flat petrol in xquads (DESIGN.md: no sky, no dither), as many steps as
 * the original's sky had.
 */
export const SKY = Array.from({ length: 8 }, () => hex("#0e1c22"));
void SKY_TONES;

const PIXEL_CLOUDS = false;

/** A picture `w`×`h` pixels, drawn in points of `k` pixels each (2 = twice the size it shows at). */
export class Picture {
  readonly px: Float64Array;
  constructor(
    readonly w: number,
    readonly h: number,
    readonly k = 2,
  ) {
    this.px = new Float64Array(w * h * 3);
  }

  /** Paints (x, y) with `c` at `alpha` over what is there. */
  blend(x: number, y: number, c: RGB, alpha = 1) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || alpha <= 0) return;
    const i = (y * this.w + x) * 3;
    for (let k = 0; k < 3; k++) this.px[i + k] = (this.px[i + k] as number) * (1 - alpha) + (c[k] as number) * alpha;
  }

  rect(x: number, y: number, w: number, h: number, c: RGB) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.blend(xx, yy, c);
  }

  /** A rect in points (rounded to whole pixels), at `alpha`. */
  box(x: number, y: number, w: number, h: number, c: RGB, alpha = 1) {
    const x0 = Math.round(x * this.k);
    const y0 = Math.round(y * this.k);
    const x1 = Math.round((x + w) * this.k);
    const y1 = Math.round((y + h) * this.k);
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) this.blend(xx, yy, c, alpha);
  }

  /** 24-bit BMP, rows bottom-up, each padded to 4 bytes. */
  bmp(): Uint8Array {
    const row = Math.ceil((this.w * 3) / 4) * 4;
    const size = 54 + row * this.h;
    const out = new Uint8Array(size);
    const v = new DataView(out.buffer);
    out[0] = 0x42; // "BM"
    out[1] = 0x4d;
    v.setUint32(2, size, true);
    v.setUint32(10, 54, true);
    v.setUint32(14, 40, true);
    v.setInt32(18, this.w, true);
    v.setInt32(22, this.h, true);
    v.setUint16(26, 1, true);
    v.setUint16(28, 24, true);
    v.setUint32(34, row * this.h, true);
    v.setInt32(38, 3780, true); // 96 dpi
    v.setInt32(42, 3780, true);
    for (let y = 0; y < this.h; y++) {
      const at = 54 + (this.h - 1 - y) * row;
      for (let x = 0; x < this.w; x++) {
        const i = (y * this.w + x) * 3;
        for (let k = 0; k < 3; k++) out[at + x * 3 + (2 - k)] = Math.round(this.px[i + k] as number); // BGR
      }
    }
    return out;
  }

  /** 8-bit RGB PNG at 72 dpi per point (a 2× picture says 144 dpi, as macOS expects of a Retina image). */
  png(): Uint8Array {
    const raw = new Uint8Array((this.w * 3 + 1) * this.h);
    for (let y = 0; y < this.h; y++) {
      const at = y * (this.w * 3 + 1); // filter byte 0 (none), then the row
      for (let x = 0; x < this.w * 3; x++) raw[at + 1 + x] = Math.round(this.px[y * this.w * 3 + x] as number);
    }
    const ihdr = new Uint8Array(13);
    const hv = new DataView(ihdr.buffer);
    hv.setUint32(0, this.w);
    hv.setUint32(4, this.h);
    ihdr.set([8, 2, 0, 0, 0], 8); // 8 bits, RGB, deflate, no filter set, not interlaced
    const phys = new Uint8Array(9);
    const pv = new DataView(phys.buffer);
    const perMeter = Math.round((72 * this.k) / 0.0254);
    pv.setUint32(0, perMeter);
    pv.setUint32(4, perMeter);
    phys[8] = 1; // meters
    const chunks = [
      chunk("IHDR", ihdr),
      chunk("pHYs", phys),
      chunk("IDAT", deflateSync(raw)),
      chunk("IEND", new Uint8Array()),
    ];
    const sig = [137, 80, 78, 71, 13, 10, 26, 10];
    const out = new Uint8Array(sig.length + chunks.reduce((n, c) => n + c.length, 0));
    out.set(sig);
    let at = sig.length;
    for (const c of chunks) {
      out.set(c, at);
      at += c.length;
    }
    return out;
  }
}

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

/** One PNG chunk: length, type, data and the CRC of type + data. */
function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const v = new DataView(out.buffer);
  v.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  let c = 0xffffffff;
  for (let i = 4; i < 8 + data.length; i++) c = (CRC[(c ^ (out[i] as number)) & 255] as number) ^ (c >>> 8);
  v.setUint32(8 + data.length, (c ^ 0xffffffff) >>> 0);
  return out;
}

/* ---------- The sky: ordered dither over a run of tones ---------- */

/** Dithers `tones` over the picture in cells of `cell` points; `at(u, v)` (0..1) picks along the tones. */
export function dither(p: Picture, tones: RGB[], at: (u: number, v: number) => number, cell = 2) {
  const size = cell * p.k;
  const cw = Math.ceil(p.w / size);
  const ch = Math.ceil(p.h / size);
  for (let y = 0; y < ch; y++)
    for (let x = 0; x < cw; x++) {
      const val = Math.max(0, Math.min(0.999, at((x + 0.5) / cw, (y + 0.5) / ch))) * (tones.length - 1);
      const lo = Math.floor(val);
      const th = ((BAYER[(y & 3) * 4 + (x & 3)] as number) + 0.5) / 16;
      const tone = tones[val - lo > th ? Math.min(lo + 1, tones.length - 1) : lo] as RGB;
      p.rect(x * size, y * size, size, size, tone);
    }
}

/** A small pixel cloud (the landing's), at (x, y) in points, `cell` points per block. */
export function cloud(p: Picture, x: number, y: number, cell: number, tone: RGB) {
  // xquads draws no pixel clouds (DESIGN.md).
  if (!PIXEL_CLOUDS) return;
  const shape = ["..XXX...", ".XXXXXX.", "XXXXXXXX"];
  shape.forEach((line, j) => {
    [...line].forEach((c, i) => {
      if (c === "X") p.rect((x + i * cell) * p.k, (y + j * cell) * p.k, cell * p.k, cell * p.k, tone);
    });
  });
}

/* ---------- The agent: the engine's body, tones and eyes, still ---------- */

const SS = 4; // samples per axis on the edges

function inPill(u: number, v: number, e: { x: number; y: number; w: number; h: number }): boolean {
  if (u < e.x || u > e.x + e.w || v < e.y || v > e.y + e.h) return false;
  const r = Math.min(e.w, e.h) / 2;
  const cx = Math.min(Math.max(u, e.x + r), e.x + e.w - r);
  const cy = Math.min(Math.max(v, e.y + r), e.y + e.h - r);
  return (u - cx) ** 2 + (v - cy) ** 2 <= r * r;
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** The engine's "arc" eye (drawEyes): the top half of an ellipse, stroked with round ends, in body units. */
function onArc(u: number, v: number, e: { x: number; y: number; w: number; h: number }, line: number): boolean {
  const lw = line;
  const rx = Math.max(0.5 / 128, e.w / 2 - lw / 2);
  const ry = e.h;
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h;
  const steps = 24;
  for (let k = 0; k < steps; k++) {
    const a0 = Math.PI + (Math.PI * k) / steps;
    const a1 = Math.PI + (Math.PI * (k + 1)) / steps;
    const d = distToSegment(
      u,
      v,
      cx + rx * Math.cos(a0),
      cy + ry * Math.sin(a0),
      cx + rx * Math.cos(a1),
      cy + ry * Math.sin(a1),
    );
    if (d <= lw / 2) return true;
  }
  return false;
}

/** The agent (round eyes, as the cover) at (x, y) in points, `size` points wide; sky and 12 cells unless told. */
export function agent(p: Picture, x: number, y: number, size: number, happy = false, color = "sky", n = 12) {
  const s = Math.round(size * p.k);
  const ox = Math.round(x * p.k);
  const oy = Math.round(y * p.k);
  const tones = (bodyTones(color) as string[]).map(hex);
  const eyes = eyeShapes("round", happy ? { expression: "happy" } : {}) as {
    x: number;
    y: number;
    w: number;
    h: number;
    kind: string;
  }[];
  const line = Math.max(1.4, s * 0.055) / s;
  const eye = (u: number, v: number) => eyes.some((e) => (e.kind === "arc" ? onArc(u, v, e, line) : inPill(u, v, e)));
  for (let py = 0; py < s; py++)
    for (let px = 0; px < s; px++) {
      let hits = 0;
      let white = 0;
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const u = (px + (sx + 0.5) / SS) / s;
          const v = (py + (sy + 0.5) / SS) / s;
          if (!inBody(u, v)) continue;
          hits++;
          if (eye(u, v)) white++;
        }
      if (!hits) continue;
      const u = (px + 0.5) / s;
      const v = (py + 0.5) / s;
      const tone = tones[toneAt(Math.min(n - 1, Math.floor(u * n)), Math.min(n - 1, Math.floor(v * n)), n)] as RGB;
      p.blend(ox + px, oy + py, tone, hits / (SS * SS));
      if (white) p.blend(ox + px, oy + py, hex(EYE_COLOR), white / hits);
    }
}

/* ---------- The wordmark: "xquads" in Onest (the logo's name, Logo.tsx) ---------- */

/** Outlines at 100 px, baseline at y = 0. `agentes` keeps the field's name for its callers: it holds "xquads". */
export const WORDMARK = {
  width: 331.6,
  agentes: NAME,
  chat: "",
};

/** ".chat" in Doto Rounded SemiBold (the logo's dotted ".chat", Logo.tsx), at 100 px from x = 0, baseline y = 0. */
export const DOTTED_CHAT = {
  width: 300,
  d: "M24.9-18.4L24.9-18.4Q23.6-18.4 22.6-17.4Q21.6-16.4 21.6-15.1L21.6-14.9Q21.6-13.6 22.6-12.6Q23.6-11.6 24.9-11.6L25.1-11.6Q26.4-11.6 27.4-12.6Q28.4-13.6 28.4-14.9L28.4-15.1Q28.4-16.4 27.4-17.4Q26.4-18.4 25.1-18.4L24.9-18.4ZM14.9-8.4L14.9-8.4Q13.6-8.4 12.6-7.4Q11.6-6.4 11.6-5.1L11.6-4.9Q11.6-3.6 12.6-2.6Q13.6-1.6 14.9-1.6L15.1-1.6Q16.4-1.6 17.4-2.6Q18.4-3.6 18.4-4.9L18.4-5.1Q18.4-6.4 17.4-7.4Q16.4-8.4 15.1-8.4L14.9-8.4ZM24.9-8.4L24.9-8.4Q23.6-8.4 22.6-7.4Q21.6-6.4 21.6-5.1L21.6-4.9Q21.6-3.6 22.6-2.6Q23.6-1.6 24.9-1.6L25.1-1.6Q26.4-1.6 27.4-2.6Q28.4-3.6 28.4-4.9L28.4-5.1Q28.4-6.4 27.4-7.4Q26.4-8.4 25.1-8.4L24.9-8.4ZM34.9-8.4L34.9-8.4Q33.6-8.4 32.6-7.4Q31.6-6.4 31.6-5.1L31.6-4.9Q31.6-3.6 32.6-2.6Q33.6-1.6 34.9-1.6L35.1-1.6Q36.4-1.6 37.4-2.6Q38.4-3.6 38.4-4.9L38.4-5.1Q38.4-6.4 37.4-7.4Q36.4-8.4 35.1-8.4L34.9-8.4ZM24.9 1.6L24.9 1.6Q23.6 1.6 22.6 2.6Q21.6 3.6 21.6 4.9L21.6 5.1Q21.6 6.4 22.6 7.4Q23.6 8.4 24.9 8.4L25.1 8.4Q26.4 8.4 27.4 7.4Q28.4 6.4 28.4 5.1L28.4 4.9Q28.4 3.6 27.4 2.6Q26.4 1.6 25.1 1.6L24.9 1.6ZM74.9-48.4L74.9-48.4Q73.6-48.4 72.6-47.4Q71.6-46.4 71.6-45.1L71.6-44.9Q71.6-43.6 72.6-42.6Q73.6-41.6 74.9-41.6L75.1-41.6Q76.4-41.6 77.4-42.6Q78.4-43.6 78.4-44.9L78.4-45.1Q78.4-46.4 77.4-47.4Q76.4-48.4 75.1-48.4L74.9-48.4ZM84.9-48.4L84.9-48.4Q83.6-48.4 82.6-47.4Q81.6-46.4 81.6-45.1L81.6-44.9Q81.6-43.6 82.6-42.6Q83.6-41.6 84.9-41.6L85.1-41.6Q86.4-41.6 87.4-42.6Q88.4-43.6 88.4-44.9L88.4-45.1Q88.4-46.4 87.4-47.4Q86.4-48.4 85.1-48.4L84.9-48.4ZM94.9-48.4L94.9-48.4Q93.6-48.4 92.6-47.4Q91.6-46.4 91.6-45.1L91.6-44.9Q91.6-43.6 92.6-42.6Q93.6-41.6 94.9-41.6L95.1-41.6Q96.4-41.6 97.4-42.6Q98.4-43.6 98.4-44.9L98.4-45.1Q98.4-46.4 97.4-47.4Q96.4-48.4 95.1-48.4L94.9-48.4ZM64.9-38.4L64.9-38.4Q63.6-38.4 62.6-37.4Q61.6-36.4 61.6-35.1L61.6-34.9Q61.6-33.6 62.6-32.6Q63.6-31.6 64.9-31.6L65.1-31.6Q66.4-31.6 67.4-32.6Q68.4-33.6 68.4-34.9L68.4-35.1Q68.4-36.4 67.4-37.4Q66.4-38.4 65.1-38.4L64.9-38.4ZM104.9-38.4L104.9-38.4Q103.6-38.4 102.6-37.4Q101.6-36.4 101.6-35.1L101.6-34.9Q101.6-33.6 102.6-32.6Q103.6-31.6 104.9-31.6L105.1-31.6Q106.4-31.6 107.4-32.6Q108.4-33.6 108.4-34.9L108.4-35.1Q108.4-36.4 107.4-37.4Q106.4-38.4 105.1-38.4L104.9-38.4ZM64.9-28.4L64.9-28.4Q63.6-28.4 62.6-27.4Q61.6-26.4 61.6-25.1L61.6-24.9Q61.6-23.6 62.6-22.6Q63.6-21.6 64.9-21.6L65.1-21.6Q66.4-21.6 67.4-22.6Q68.4-23.6 68.4-24.9L68.4-25.1Q68.4-26.4 67.4-27.4Q66.4-28.4 65.1-28.4L64.9-28.4ZM64.9-18.4L64.9-18.4Q63.6-18.4 62.6-17.4Q61.6-16.4 61.6-15.1L61.6-14.9Q61.6-13.6 62.6-12.6Q63.6-11.6 64.9-11.6L65.1-11.6Q66.4-11.6 67.4-12.6Q68.4-13.6 68.4-14.9L68.4-15.1Q68.4-16.4 67.4-17.4Q66.4-18.4 65.1-18.4L64.9-18.4ZM104.9-18.4L104.9-18.4Q103.6-18.4 102.6-17.4Q101.6-16.4 101.6-15.1L101.6-14.9Q101.6-13.6 102.6-12.6Q103.6-11.6 104.9-11.6L105.1-11.6Q106.4-11.6 107.4-12.6Q108.4-13.6 108.4-14.9L108.4-15.1Q108.4-16.4 107.4-17.4Q106.4-18.4 105.1-18.4L104.9-18.4ZM74.9-8.4L74.9-8.4Q73.6-8.4 72.6-7.4Q71.6-6.4 71.6-5.1L71.6-4.9Q71.6-3.6 72.6-2.6Q73.6-1.6 74.9-1.6L75.1-1.6Q76.4-1.6 77.4-2.6Q78.4-3.6 78.4-4.9L78.4-5.1Q78.4-6.4 77.4-7.4Q76.4-8.4 75.1-8.4L74.9-8.4ZM84.9-8.4L84.9-8.4Q83.6-8.4 82.6-7.4Q81.6-6.4 81.6-5.1L81.6-4.9Q81.6-3.6 82.6-2.6Q83.6-1.6 84.9-1.6L85.1-1.6Q86.4-1.6 87.4-2.6Q88.4-3.6 88.4-4.9L88.4-5.1Q88.4-6.4 87.4-7.4Q86.4-8.4 85.1-8.4L84.9-8.4ZM94.9-8.4L94.9-8.4Q93.6-8.4 92.6-7.4Q91.6-6.4 91.6-5.1L91.6-4.9Q91.6-3.6 92.6-2.6Q93.6-1.6 94.9-1.6L95.1-1.6Q96.4-1.6 97.4-2.6Q98.4-3.6 98.4-4.9L98.4-5.1Q98.4-6.4 97.4-7.4Q96.4-8.4 95.1-8.4L94.9-8.4ZM124.9-68.4L124.9-68.4Q123.6-68.4 122.6-67.4Q121.6-66.4 121.6-65.1L121.6-64.9Q121.6-63.6 122.6-62.6Q123.6-61.6 124.9-61.6L125.1-61.6Q126.4-61.6 127.4-62.6Q128.4-63.6 128.4-64.9L128.4-65.1Q128.4-66.4 127.4-67.4Q126.4-68.4 125.1-68.4L124.9-68.4ZM124.9-58.4L124.9-58.4Q123.6-58.4 122.6-57.4Q121.6-56.4 121.6-55.1L121.6-54.9Q121.6-53.6 122.6-52.6Q123.6-51.6 124.9-51.6L125.1-51.6Q126.4-51.6 127.4-52.6Q128.4-53.6 128.4-54.9L128.4-55.1Q128.4-56.4 127.4-57.4Q126.4-58.4 125.1-58.4L124.9-58.4ZM124.9-48.4L124.9-48.4Q123.6-48.4 122.6-47.4Q121.6-46.4 121.6-45.1L121.6-44.9Q121.6-43.6 122.6-42.6Q123.6-41.6 124.9-41.6L125.1-41.6Q126.4-41.6 127.4-42.6Q128.4-43.6 128.4-44.9L128.4-45.1Q128.4-46.4 127.4-47.4Q126.4-48.4 125.1-48.4L124.9-48.4ZM144.9-48.4L144.9-48.4Q143.6-48.4 142.6-47.4Q141.6-46.4 141.6-45.1L141.6-44.9Q141.6-43.6 142.6-42.6Q143.6-41.6 144.9-41.6L145.1-41.6Q146.4-41.6 147.4-42.6Q148.4-43.6 148.4-44.9L148.4-45.1Q148.4-46.4 147.4-47.4Q146.4-48.4 145.1-48.4L144.9-48.4ZM154.9-48.4L154.9-48.4Q153.6-48.4 152.6-47.4Q151.6-46.4 151.6-45.1L151.6-44.9Q151.6-43.6 152.6-42.6Q153.6-41.6 154.9-41.6L155.1-41.6Q156.4-41.6 157.4-42.6Q158.4-43.6 158.4-44.9L158.4-45.1Q158.4-46.4 157.4-47.4Q156.4-48.4 155.1-48.4L154.9-48.4ZM124.9-38.4L124.9-38.4Q123.6-38.4 122.6-37.4Q121.6-36.4 121.6-35.1L121.6-34.9Q121.6-33.6 122.6-32.6Q123.6-31.6 124.9-31.6L125.1-31.6Q126.4-31.6 127.4-32.6Q128.4-33.6 128.4-34.9L128.4-35.1Q128.4-36.4 127.4-37.4Q126.4-38.4 125.1-38.4L124.9-38.4ZM134.9-38.4L134.9-38.4Q133.6-38.4 132.6-37.4Q131.6-36.4 131.6-35.1L131.6-34.9Q131.6-33.6 132.6-32.6Q133.6-31.6 134.9-31.6L135.1-31.6Q136.4-31.6 137.4-32.6Q138.4-33.6 138.4-34.9L138.4-35.1Q138.4-36.4 137.4-37.4Q136.4-38.4 135.1-38.4L134.9-38.4ZM164.9-38.4L164.9-38.4Q163.6-38.4 162.6-37.4Q161.6-36.4 161.6-35.1L161.6-34.9Q161.6-33.6 162.6-32.6Q163.6-31.6 164.9-31.6L165.1-31.6Q166.4-31.6 167.4-32.6Q168.4-33.6 168.4-34.9L168.4-35.1Q168.4-36.4 167.4-37.4Q166.4-38.4 165.1-38.4L164.9-38.4ZM124.9-28.4L124.9-28.4Q123.6-28.4 122.6-27.4Q121.6-26.4 121.6-25.1L121.6-24.9Q121.6-23.6 122.6-22.6Q123.6-21.6 124.9-21.6L125.1-21.6Q126.4-21.6 127.4-22.6Q128.4-23.6 128.4-24.9L128.4-25.1Q128.4-26.4 127.4-27.4Q126.4-28.4 125.1-28.4L124.9-28.4ZM164.9-28.4L164.9-28.4Q163.6-28.4 162.6-27.4Q161.6-26.4 161.6-25.1L161.6-24.9Q161.6-23.6 162.6-22.6Q163.6-21.6 164.9-21.6L165.1-21.6Q166.4-21.6 167.4-22.6Q168.4-23.6 168.4-24.9L168.4-25.1Q168.4-26.4 167.4-27.4Q166.4-28.4 165.1-28.4L164.9-28.4ZM124.9-18.4L124.9-18.4Q123.6-18.4 122.6-17.4Q121.6-16.4 121.6-15.1L121.6-14.9Q121.6-13.6 122.6-12.6Q123.6-11.6 124.9-11.6L125.1-11.6Q126.4-11.6 127.4-12.6Q128.4-13.6 128.4-14.9L128.4-15.1Q128.4-16.4 127.4-17.4Q126.4-18.4 125.1-18.4L124.9-18.4ZM164.9-18.4L164.9-18.4Q163.6-18.4 162.6-17.4Q161.6-16.4 161.6-15.1L161.6-14.9Q161.6-13.6 162.6-12.6Q163.6-11.6 164.9-11.6L165.1-11.6Q166.4-11.6 167.4-12.6Q168.4-13.6 168.4-14.9L168.4-15.1Q168.4-16.4 167.4-17.4Q166.4-18.4 165.1-18.4L164.9-18.4ZM124.9-8.4L124.9-8.4Q123.6-8.4 122.6-7.4Q121.6-6.4 121.6-5.1L121.6-4.9Q121.6-3.6 122.6-2.6Q123.6-1.6 124.9-1.6L125.1-1.6Q126.4-1.6 127.4-2.6Q128.4-3.6 128.4-4.9L128.4-5.1Q128.4-6.4 127.4-7.4Q126.4-8.4 125.1-8.4L124.9-8.4ZM164.9-8.4L164.9-8.4Q163.6-8.4 162.6-7.4Q161.6-6.4 161.6-5.1L161.6-4.9Q161.6-3.6 162.6-2.6Q163.6-1.6 164.9-1.6L165.1-1.6Q166.4-1.6 167.4-2.6Q168.4-3.6 168.4-4.9L168.4-5.1Q168.4-6.4 167.4-7.4Q166.4-8.4 165.1-8.4L164.9-8.4ZM194.9-48.4L194.9-48.4Q193.6-48.4 192.6-47.4Q191.6-46.4 191.6-45.1L191.6-44.9Q191.6-43.6 192.6-42.6Q193.6-41.6 194.9-41.6L195.1-41.6Q196.4-41.6 197.4-42.6Q198.4-43.6 198.4-44.9L198.4-45.1Q198.4-46.4 197.4-47.4Q196.4-48.4 195.1-48.4L194.9-48.4ZM204.9-48.4L204.9-48.4Q203.6-48.4 202.6-47.4Q201.6-46.4 201.6-45.1L201.6-44.9Q201.6-43.6 202.6-42.6Q203.6-41.6 204.9-41.6L205.1-41.6Q206.4-41.6 207.4-42.6Q208.4-43.6 208.4-44.9L208.4-45.1Q208.4-46.4 207.4-47.4Q206.4-48.4 205.1-48.4L204.9-48.4ZM214.9-48.4L214.9-48.4Q213.6-48.4 212.6-47.4Q211.6-46.4 211.6-45.1L211.6-44.9Q211.6-43.6 212.6-42.6Q213.6-41.6 214.9-41.6L215.1-41.6Q216.4-41.6 217.4-42.6Q218.4-43.6 218.4-44.9L218.4-45.1Q218.4-46.4 217.4-47.4Q216.4-48.4 215.1-48.4L214.9-48.4ZM224.9-38.4L224.9-38.4Q223.6-38.4 222.6-37.4Q221.6-36.4 221.6-35.1L221.6-34.9Q221.6-33.6 222.6-32.6Q223.6-31.6 224.9-31.6L225.1-31.6Q226.4-31.6 227.4-32.6Q228.4-33.6 228.4-34.9L228.4-35.1Q228.4-36.4 227.4-37.4Q226.4-38.4 225.1-38.4L224.9-38.4ZM194.9-28.4L194.9-28.4Q193.6-28.4 192.6-27.4Q191.6-26.4 191.6-25.1L191.6-24.9Q191.6-23.6 192.6-22.6Q193.6-21.6 194.9-21.6L195.1-21.6Q196.4-21.6 197.4-22.6Q198.4-23.6 198.4-24.9L198.4-25.1Q198.4-26.4 197.4-27.4Q196.4-28.4 195.1-28.4L194.9-28.4ZM204.9-28.4L204.9-28.4Q203.6-28.4 202.6-27.4Q201.6-26.4 201.6-25.1L201.6-24.9Q201.6-23.6 202.6-22.6Q203.6-21.6 204.9-21.6L205.1-21.6Q206.4-21.6 207.4-22.6Q208.4-23.6 208.4-24.9L208.4-25.1Q208.4-26.4 207.4-27.4Q206.4-28.4 205.1-28.4L204.9-28.4ZM214.9-28.4L214.9-28.4Q213.6-28.4 212.6-27.4Q211.6-26.4 211.6-25.1L211.6-24.9Q211.6-23.6 212.6-22.6Q213.6-21.6 214.9-21.6L215.1-21.6Q216.4-21.6 217.4-22.6Q218.4-23.6 218.4-24.9L218.4-25.1Q218.4-26.4 217.4-27.4Q216.4-28.4 215.1-28.4L214.9-28.4ZM224.9-28.4L224.9-28.4Q223.6-28.4 222.6-27.4Q221.6-26.4 221.6-25.1L221.6-24.9Q221.6-23.6 222.6-22.6Q223.6-21.6 224.9-21.6L225.1-21.6Q226.4-21.6 227.4-22.6Q228.4-23.6 228.4-24.9L228.4-25.1Q228.4-26.4 227.4-27.4Q226.4-28.4 225.1-28.4L224.9-28.4ZM184.9-18.4L184.9-18.4Q183.6-18.4 182.6-17.4Q181.6-16.4 181.6-15.1L181.6-14.9Q181.6-13.6 182.6-12.6Q183.6-11.6 184.9-11.6L185.1-11.6Q186.4-11.6 187.4-12.6Q188.4-13.6 188.4-14.9L188.4-15.1Q188.4-16.4 187.4-17.4Q186.4-18.4 185.1-18.4L184.9-18.4ZM224.9-18.4L224.9-18.4Q223.6-18.4 222.6-17.4Q221.6-16.4 221.6-15.1L221.6-14.9Q221.6-13.6 222.6-12.6Q223.6-11.6 224.9-11.6L225.1-11.6Q226.4-11.6 227.4-12.6Q228.4-13.6 228.4-14.9L228.4-15.1Q228.4-16.4 227.4-17.4Q226.4-18.4 225.1-18.4L224.9-18.4ZM194.9-8.4L194.9-8.4Q193.6-8.4 192.6-7.4Q191.6-6.4 191.6-5.1L191.6-4.9Q191.6-3.6 192.6-2.6Q193.6-1.6 194.9-1.6L195.1-1.6Q196.4-1.6 197.4-2.6Q198.4-3.6 198.4-4.9L198.4-5.1Q198.4-6.4 197.4-7.4Q196.4-8.4 195.1-8.4L194.9-8.4ZM204.9-8.4L204.9-8.4Q203.6-8.4 202.6-7.4Q201.6-6.4 201.6-5.1L201.6-4.9Q201.6-3.6 202.6-2.6Q203.6-1.6 204.9-1.6L205.1-1.6Q206.4-1.6 207.4-2.6Q208.4-3.6 208.4-4.9L208.4-5.1Q208.4-6.4 207.4-7.4Q206.4-8.4 205.1-8.4L204.9-8.4ZM214.9-8.4L214.9-8.4Q213.6-8.4 212.6-7.4Q211.6-6.4 211.6-5.1L211.6-4.9Q211.6-3.6 212.6-2.6Q213.6-1.6 214.9-1.6L215.1-1.6Q216.4-1.6 217.4-2.6Q218.4-3.6 218.4-4.9L218.4-5.1Q218.4-6.4 217.4-7.4Q216.4-8.4 215.1-8.4L214.9-8.4ZM224.9-8.4L224.9-8.4Q223.6-8.4 222.6-7.4Q221.6-6.4 221.6-5.1L221.6-4.9Q221.6-3.6 222.6-2.6Q223.6-1.6 224.9-1.6L225.1-1.6Q226.4-1.6 227.4-2.6Q228.4-3.6 228.4-4.9L228.4-5.1Q228.4-6.4 227.4-7.4Q226.4-8.4 225.1-8.4L224.9-8.4ZM254.9-68.4L254.9-68.4Q253.6-68.4 252.6-67.4Q251.6-66.4 251.6-65.1L251.6-64.9Q251.6-63.6 252.6-62.6Q253.6-61.6 254.9-61.6L255.1-61.6Q256.4-61.6 257.4-62.6Q258.4-63.6 258.4-64.9L258.4-65.1Q258.4-66.4 257.4-67.4Q256.4-68.4 255.1-68.4L254.9-68.4ZM254.9-58.4L254.9-58.4Q253.6-58.4 252.6-57.4Q251.6-56.4 251.6-55.1L251.6-54.9Q251.6-53.6 252.6-52.6Q253.6-51.6 254.9-51.6L255.1-51.6Q256.4-51.6 257.4-52.6Q258.4-53.6 258.4-54.9L258.4-55.1Q258.4-56.4 257.4-57.4Q256.4-58.4 255.1-58.4L254.9-58.4ZM244.9-48.4L244.9-48.4Q243.6-48.4 242.6-47.4Q241.6-46.4 241.6-45.1L241.6-44.9Q241.6-43.6 242.6-42.6Q243.6-41.6 244.9-41.6L245.1-41.6Q246.4-41.6 247.4-42.6Q248.4-43.6 248.4-44.9L248.4-45.1Q248.4-46.4 247.4-47.4Q246.4-48.4 245.1-48.4L244.9-48.4ZM254.9-48.4L254.9-48.4Q253.6-48.4 252.6-47.4Q251.6-46.4 251.6-45.1L251.6-44.9Q251.6-43.6 252.6-42.6Q253.6-41.6 254.9-41.6L255.1-41.6Q256.4-41.6 257.4-42.6Q258.4-43.6 258.4-44.9L258.4-45.1Q258.4-46.4 257.4-47.4Q256.4-48.4 255.1-48.4L254.9-48.4ZM264.9-48.4L264.9-48.4Q263.6-48.4 262.6-47.4Q261.6-46.4 261.6-45.1L261.6-44.9Q261.6-43.6 262.6-42.6Q263.6-41.6 264.9-41.6L265.1-41.6Q266.4-41.6 267.4-42.6Q268.4-43.6 268.4-44.9L268.4-45.1Q268.4-46.4 267.4-47.4Q266.4-48.4 265.1-48.4L264.9-48.4ZM274.9-48.4L274.9-48.4Q273.6-48.4 272.6-47.4Q271.6-46.4 271.6-45.1L271.6-44.9Q271.6-43.6 272.6-42.6Q273.6-41.6 274.9-41.6L275.1-41.6Q276.4-41.6 277.4-42.6Q278.4-43.6 278.4-44.9L278.4-45.1Q278.4-46.4 277.4-47.4Q276.4-48.4 275.1-48.4L274.9-48.4ZM254.9-38.4L254.9-38.4Q253.6-38.4 252.6-37.4Q251.6-36.4 251.6-35.1L251.6-34.9Q251.6-33.6 252.6-32.6Q253.6-31.6 254.9-31.6L255.1-31.6Q256.4-31.6 257.4-32.6Q258.4-33.6 258.4-34.9L258.4-35.1Q258.4-36.4 257.4-37.4Q256.4-38.4 255.1-38.4L254.9-38.4ZM254.9-28.4L254.9-28.4Q253.6-28.4 252.6-27.4Q251.6-26.4 251.6-25.1L251.6-24.9Q251.6-23.6 252.6-22.6Q253.6-21.6 254.9-21.6L255.1-21.6Q256.4-21.6 257.4-22.6Q258.4-23.6 258.4-24.9L258.4-25.1Q258.4-26.4 257.4-27.4Q256.4-28.4 255.1-28.4L254.9-28.4ZM254.9-18.4L254.9-18.4Q253.6-18.4 252.6-17.4Q251.6-16.4 251.6-15.1L251.6-14.9Q251.6-13.6 252.6-12.6Q253.6-11.6 254.9-11.6L255.1-11.6Q256.4-11.6 257.4-12.6Q258.4-13.6 258.4-14.9L258.4-15.1Q258.4-16.4 257.4-17.4Q256.4-18.4 255.1-18.4L254.9-18.4ZM284.9-18.4L284.9-18.4Q283.6-18.4 282.6-17.4Q281.6-16.4 281.6-15.1L281.6-14.9Q281.6-13.6 282.6-12.6Q283.6-11.6 284.9-11.6L285.1-11.6Q286.4-11.6 287.4-12.6Q288.4-13.6 288.4-14.9L288.4-15.1Q288.4-16.4 287.4-17.4Q286.4-18.4 285.1-18.4L284.9-18.4ZM264.9-8.4L264.9-8.4Q263.6-8.4 262.6-7.4Q261.6-6.4 261.6-5.1L261.6-4.9Q261.6-3.6 262.6-2.6Q263.6-1.6 264.9-1.6L265.1-1.6Q266.4-1.6 267.4-2.6Q268.4-3.6 268.4-4.9L268.4-5.1Q268.4-6.4 267.4-7.4Q266.4-8.4 265.1-8.4L264.9-8.4ZM274.9-8.4L274.9-8.4Q273.6-8.4 272.6-7.4Q271.6-6.4 271.6-5.1L271.6-4.9Q271.6-3.6 272.6-2.6Q273.6-1.6 274.9-1.6L275.1-1.6Q276.4-1.6 277.4-2.6Q278.4-3.6 278.4-4.9L278.4-5.1Q278.4-6.4 277.4-7.4Q276.4-8.4 275.1-8.4L274.9-8.4Z",
};

type Edge = [number, number, number, number];

/** M/L/Q/Z path data (absolute, as the outlines above) to line edges, curves flattened. */
export function edges(d: string, scale: number, dx: number, dy: number): Edge[] {
  const out: Edge[] = [];
  const tokens = d.match(/[MLQZHV]|-?\d*\.?\d+/g) ?? [];
  let i = 0;
  let cmd = "";
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  const num = () => Number(tokens[i++]);
  const P = (px: number, py: number): [number, number] => [dx + px * scale, dy + py * scale];
  while (i < tokens.length) {
    const t = tokens[i] as string;
    if (/[MLQZHV]/.test(t)) {
      cmd = t;
      i++;
      if (cmd === "Z") {
        out.push([...P(x, y), ...P(sx, sy)]);
        x = sx;
        y = sy;
      }
      continue;
    }
    if (cmd === "M") {
      x = sx = num();
      y = sy = num();
      cmd = "L";
    } else if (cmd === "L") {
      const nx = num();
      const ny = num();
      out.push([...P(x, y), ...P(nx, ny)]);
      x = nx;
      y = ny;
    } else if (cmd === "H" || cmd === "V") {
      const v = num();
      const nx = cmd === "H" ? v : x;
      const ny = cmd === "V" ? v : y;
      out.push([...P(x, y), ...P(nx, ny)]);
      x = nx;
      y = ny;
    } else if (cmd === "Q") {
      const cx = num();
      const cy = num();
      const nx = num();
      const ny = num();
      let px = x;
      let py = y;
      for (let k = 1; k <= 8; k++) {
        const s = k / 8;
        const qx = (1 - s) ** 2 * x + 2 * (1 - s) * s * cx + s * s * nx;
        const qy = (1 - s) ** 2 * y + 2 * (1 - s) * s * cy + s * s * ny;
        out.push([...P(px, py), ...P(qx, qy)]);
        px = qx;
        py = qy;
      }
      x = nx;
      y = ny;
    } else i++;
  }
  return out;
}

/** Coverage (0..1) per pixel of the shapes in `e` (non-zero winding), 4×4 samples. */
export function coverage(e: Edge[], w: number, h: number): Float64Array {
  const cov = new Float64Array(w * h);
  const n = 4;
  for (let row = 0; row < h * n; row++) {
    const sy = (row + 0.5) / n;
    const hits: [number, number][] = [];
    for (const [x0, y0, x1, y1] of e) {
      if (y0 === y1 || sy < Math.min(y0, y1) || sy >= Math.max(y0, y1)) continue;
      hits.push([x0 + ((sy - y0) / (y1 - y0)) * (x1 - x0), y1 > y0 ? 1 : -1]);
    }
    hits.sort((a, b) => a[0] - b[0]);
    for (let col = 0; col < w * n; col++) {
      const sx = (col + 0.5) / n;
      let wind = 0;
      for (const [hx, dir] of hits) {
        if (hx > sx) break;
        wind += dir;
      }
      if (wind !== 0) cov[Math.floor(row / n) * w + Math.floor(col / n)] += 1 / (n * n);
    }
  }
  return cov;
}

/** A soft shadow under a coverage mask: box-blurred three times, `radius` px. */
export function blur(src: Float64Array, w: number, h: number, radius: number): Float64Array {
  let a = src;
  for (let pass = 0; pass < 3; pass++) {
    const b = new Float64Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let k = -radius; k <= radius; k++) sum += a[y * w + Math.min(w - 1, Math.max(0, x + k))] as number;
        b[y * w + x] = sum / (2 * radius + 1);
      }
    const c = new Float64Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let k = -radius; k <= radius; k++) sum += b[Math.min(h - 1, Math.max(0, y + k)) * w + x] as number;
        c[y * w + x] = sum / (2 * radius + 1);
      }
    a = c;
  }
  return a;
}

/** The cover's text shadow under `mask` (rgba(4,32,63,.5), 8 points of blur, 1 point down), then `mask` in white. */
function whiteWithShadow(p: Picture, layers: [Float64Array, number][]) {
  const both = (layers[0] as [Float64Array, number])[0].map((_, i) =>
    Math.min(
      1,
      layers.reduce((s, [m, a]) => s + (m[i] as number) * a, 0),
    ),
  );
  const shadow = blur(both, p.w, p.h, Math.round((8 * p.k) / 3));
  for (let yy = 0; yy < p.h; yy++)
    for (let xx = 0; xx < p.w; xx++) {
      const s = (shadow[Math.max(0, yy - p.k) * p.w + xx] as number) * 0.5;
      if (s > 0.002) p.blend(xx, yy, [4, 32, 63], s);
    }
  for (let i = 0; i < p.w * p.h; i++) {
    const x = i % p.w;
    const yy = Math.floor(i / p.w);
    for (const [m, a] of layers) p.blend(x, yy, WHITE, (m[i] as number) * a);
  }
}

/** The wordmark centred on `cx`, its baseline at `y` (points), `size` points tall, white with the cover's shadow. */
export function wordmark(p: Picture, cx: number, y: number, size: number) {
  const scale = (size * p.k) / 100;
  const dx = cx * p.k - (WORDMARK.width * scale) / 2;
  const dy = y * p.k;
  const main = coverage(edges(WORDMARK.agentes, scale, dx, dy), p.w, p.h);
  const dim = coverage(edges(WORDMARK.chat, scale, dx, dy), p.w, p.h);
  whiteWithShadow(p, [
    [main, 1],
    [dim, 0.6],
  ]);
}

/** "agentes" then the dotted ".chat" (0.72 of the size, 0.08 after it: a little larger than Logo.tsx, whose dots
 *  get thin on a picture), centred on `cx`. */
export function dottedWordmark(p: Picture, cx: number, y: number, size: number) {
  const scale = (size * p.k) / 100;
  // xquads' name alone, centred (no dotted ".chat").
  const dx = cx * p.k - (WORDMARK.width * scale) / 2;
  const dy = y * p.k;
  const main = coverage(edges(WORDMARK.agentes, scale, dx, dy), p.w, p.h);
  whiteWithShadow(p, [[main, 1]]);
}
