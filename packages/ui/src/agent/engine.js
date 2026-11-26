/**
 * The agent, defined once. Every place that draws an agent reads its shape,
 * eyes, colors and dither from here: the avatar (`Avatar`), the logo and the
 * favicon, the pixel agents in the sky, the landing's giant and plain HTML
 * pages that import this file as is (so it stays plain JavaScript with types
 * in engine.d.ts and no imports).
 *
 * Coordinates are fractions of the body's box (0..1, y down). The body is
 * xquads' agent (DESIGN.md): a flat square with radius 28% in the agent's
 * color, two oval eyes (or the agent's chosen eyes) and a smile in petrol. Idle
 * it only blinks; its eyes turn to dashes while it writes, and an expression
 * (a sticker's mood, a reaction) draws in the same ink.
 */

/**
 * Top and bottom of each agent color: the bottom is the color an agent is drawn in, the top a lighter step of it. The
 * names stay the ones stored on agents; each now holds one of xquads' six agent colors (DESIGN.md): sky camelo,
 * indigo ardósia, violet névoa, rose argila, amber areia, green and teal sálvia, graphite the strong line's slate.
 */
export const AGENT_GRADIENTS = {
  sky: ["#ddbe9c", "#c79d70"],
  indigo: ["#b5c5cc", "#8aa3ae"],
  violet: ["#c9d0e1", "#a9b3ce"],
  rose: ["#e2bbac", "#cf9580"],
  amber: ["#e5dbd5", "#d3c3b9"],
  green: ["#bcd7c4", "#8fbb9c"],
  teal: ["#bcd7c4", "#8fbb9c"],
  graphite: ["#9aa7ad", "#6f8189"],
};

/** Camelo: what `sky` is in a workspace without an accent. */
export const DEFAULT_SKY = AGENT_GRADIENTS.sky;

/**
 * A workspace's accent (ADR 0193) is its default agent color: while one is shown, `sky` (every agent with no color of
 * its own, and the sky art) resolves to the accent's [top, bottom], or back to the landing's blue with null. Set by the
 * apps' workspace shell, which also tells the canvases to repaint.
 */
export function setSkyColors(pair) {
  AGENT_GRADIENTS.sky = pair ?? DEFAULT_SKY;
}

/**
 * A color as it is drawn now, for a cache's or a memo's key: `sky` (and no color) by the pair it resolves to, which
 * follows the workspace's accent; any other color as is.
 */
export function drawnKey(color) {
  return !color || color === "sky" ? AGENT_GRADIENTS.sky.join() : color;
}

/** The face's ink: petrol on every agent color (DESIGN.md). */
export const EYE_COLOR = "#0e1c22";
/** The face's ink on a color too dark for petrol (a picked accent): the app's sand. */
const LIGHT_INK = "#ede6e1";

/** The face's ink on `color`: petrol, or sand where petrol would not read (3:1). */
export function faceInk(color) {
  const body = gradientOf(color)[1];
  return contrastOf(EYE_COLOR, body) >= 3 ? EYE_COLOR : LIGHT_INK;
}

/** The body: the same radius on all four corners (28%, `--radius-agent`), as fractions of the side. */
export const BODY_RADIUS = 0.28;
export const BODY_CUT = 0.28;

/**
 * Eye centers (x) and each eye style: size and vertical center. `round` is the brand's oval
 * (`brand/assets/agentes/avatares`), the default; the others are the agent's chosen eyes in the same petrol ink:
 * `dots` small round dots, `wide` big ovals, `arc` = happy (∩), `lid` = sleepy (half).
 */
export const EYE_X = [0.359, 0.641];
const OVAL = { w: 0.102, h: 0.141, cy: 0.453 };
export const EYE_STYLES = {
  round: OVAL,
  dots: { w: 0.085, h: 0.085, cy: 0.46 },
  wide: { w: 0.13, h: 0.2, cy: 0.44 },
  happy: { w: 0.15, h: 0.09, cy: 0.45, kind: "arc" },
  sleepy: { w: 0.13, h: 0.07, cy: 0.5, kind: "lid" },
};

/** The smile under the eyes: a quadratic curve and its stroke, in body fractions. */
export const SMILE = { from: [0.422, 0.625], control: [0.5, 0.6875], to: [0.578, 0.625], width: 0.047 };
/** While words arrive the eyes are short dashes. */
export const WRITING_EYE = { w: 0.13, h: 0.05, cy: 0.47 };

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

/** "#rrggbb" → [r, g, b]. */
export function rgbOf(hex) {
  const n = Number.parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** `a` → `b` by `k` (0..1), as "#rrggbb". */
export function mixHex(a, b, k) {
  const A = rgbOf(a);
  const B = rgbOf(b);
  return `#${A.map((v, i) =>
    Math.round(v + (B[i] - v) * k)
      .toString(16)
      .padStart(2, "0"),
  ).join("")}`;
}

/** Whether `v` is a custom agent color: "#rrggbb". */
export function isHexColor(v) {
  return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
}

/** A color's name under `look.colors.*`: a preset's own, or "custom" for a "#rrggbb". */
export function colorKey(color) {
  return isHexColor(color) ? "custom" : color;
}

/** "#rrggbb" → [hue 0..360, saturation 0..1, value 0..1] (the picker's space). */
export function hexToHsv(hex) {
  const [r, g, b] = rgbOf(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, max ? d / max : 0, max];
}

/** [hue 0..360, saturation 0..1, value 0..1] → "#rrggbb". */
export function hsvToHex(h, s, v) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return `#${[f(5), f(3), f(1)]
    .map((c) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function hexToHsl(hex) {
  const [h, s, v] = hexToHsv(hex);
  const l = v * (1 - s / 2);
  return [h, l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l), l];
}

function hslToHex(h, s, l) {
  const v = l + s * Math.min(l, 1 - l);
  return hsvToHex(h, v ? 2 * (1 - l / v) : 0, v);
}

/** WCAG relative luminance of "#rrggbb" (0 black .. 1 white). */
export function luminance(hex) {
  const [r, g, b] = rgbOf(hex).map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio of two "#rrggbb" (1 to 21). */
export function contrastOf(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * An agent's @mention chip in a theme: a solid tint of its color, so the chip reads the same on a page, a row or a
 * bubble, and its own color pushed toward black (or white in the dark) until the text passes WCAG AA on that tint.
 */
export function mentionTone(color, dark = false) {
  const [top, bottom] = gradientOf(color);
  const background = dark ? mixHex("#181817", bottom, 0.34) : mixHex("#ffffff", bottom, 0.16);
  const base = dark ? top : bottom;
  let ink = base;
  for (let k = 0.05; k <= 1 && contrastOf(ink, background) < 4.5; k += 0.05) {
    ink = mixHex(base, dark ? "#ffffff" : "#000000", k);
  }
  return { background, ink };
}

/**
 * A custom color's [top, bottom], built like the presets: the bottom is the color itself, lifted only until it reads
 * on the petrol page (luminance 0.09, about 3:1); the top is a lighter step of it. The face's ink follows (`faceInk`):
 * petrol, or sand on a color too dark for it.
 */
export function customGradient(hex) {
  const [h, s, l0] = hexToHsl(hex);
  let l = l0;
  let bottom = hex;
  while (luminance(bottom) < 0.09 && l < 1) {
    l = Math.min(1, l + 0.01);
    bottom = hslToHex(h, s, l);
  }
  return [mixHex(bottom, "#ffffff", 0.3), bottom];
}

/** Where the custom color picker starts: the custom color itself, or the current preset's own tone. */
export function pickerStart(color) {
  return isHexColor(color) ? color.toLowerCase() : gradientOf(color)[1];
}

/** The preset closest to a color by hue (graphite when nearly gray): for places that only have the presets' pictures. */
export function nearestPreset(color) {
  if (!isHexColor(color)) return color in AGENT_GRADIENTS ? color : "sky";
  const [h, s] = hexToHsl(color.toLowerCase());
  if (s < 0.15) return "graphite";
  let best = "sky";
  let gap = 360;
  for (const [name, [, bottom]] of Object.entries(AGENT_GRADIENTS)) {
    if (name === "graphite") continue;
    const d = Math.abs(hexToHsl(bottom)[0] - h) % 360;
    const dd = Math.min(d, 360 - d);
    if (dd < gap) [best, gap] = [name, dd];
  }
  return best;
}

/** An agent color's [top, bottom]: a preset, a custom "#rrggbb", a [top, bottom] pair as is, or sky for anything else. */
export function gradientOf(color) {
  if (Array.isArray(color)) return color;
  return AGENT_GRADIENTS[color] ?? (isHexColor(color) ? customGradient(color.toLowerCase()) : AGENT_GRADIENTS.sky);
}

/**
 * Five body tones, deep (0) to light (4). `deep` runs one step deeper, for a
 * big agent on a light halo (the landing's giant), so its top still reads.
 */
export function bodyTones(color, deep = false) {
  const [top, bottom] = gradientOf(color);
  if (deep)
    return [mixHex(bottom, "#000000", 0.5), mixHex(bottom, "#000000", 0.22), bottom, mixHex(bottom, top, 0.5), top];
  return [mixHex(bottom, "#000000", 0.38), bottom, mixHex(bottom, top, 0.5), top, mixHex(top, "#ffffff", 0.5)];
}

/** A small agent's body: its own color, flat (xquads draws no navy sprite). */
export function spriteBody(color) {
  return gradientOf(color || "sky")[1];
}

/** Dither cells per side for a body of `px` pixels: about 2.5–15 screen pixels per cell. */
export function ditherCells(px) {
  return px <= 20 ? 8 : px <= 28 ? 10 : px <= 40 ? 14 : px <= 64 ? 18 : px <= 160 ? 22 : 26;
}

/** Whether (u, v) is inside the body. */
export function inBody(u, v) {
  const r = BODY_RADIUS;
  const c = BODY_CUT;
  if (u < 0 || u > 1 || v < 0 || v > 1) return false;
  if (u < r && v < r) return (u - r) ** 2 + (v - r) ** 2 <= r * r;
  if (u > 1 - r && v < r) return (u - 1 + r) ** 2 + (v - r) ** 2 <= r * r;
  if (u > 1 - r && v > 1 - r) return (u - 1 + r) ** 2 + (v - 1 + r) ** 2 <= r * r;
  if (u < c && v > 1 - c) return (u - c) ** 2 + (v - 1 + c) ** 2 <= c * c;
  return true;
}

/** The body's outline as an SVG path at (x, y), side `s`. */
export function bodyPath(x = 0, y = 0, s = 1) {
  const r = BODY_RADIUS * s;
  const c = BODY_CUT * s;
  const f = (n) => Number(n.toFixed(3));
  return [
    `M${f(x + r)} ${f(y)}`,
    `H${f(x + s - r)}`,
    `A${f(r)} ${f(r)} 0 0 1 ${f(x + s)} ${f(y + r)}`,
    `V${f(y + s - r)}`,
    `A${f(r)} ${f(r)} 0 0 1 ${f(x + s - r)} ${f(y + s)}`,
    `H${f(x + c)}`,
    `A${f(c)} ${f(c)} 0 0 1 ${f(x)} ${f(y + s - c)}`,
    `V${f(y + r)}`,
    `A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}`,
    "Z",
  ].join("");
}

/**
 * Tone index (0..4) of the cell (x, y) of an n×n body: light top-left to deep
 * bottom-right, Bayer-dithered. `turn` [tx, ty] (-1..1) moves the light: the
 * side turned away gets darker, which reads as the head turning (pseudo-3D).
 */
export function toneAt(x, y, n, turn) {
  const u = (x + 0.5) / n;
  const v = (y + 0.5) / n;
  const tx = turn ? turn[0] : 0;
  const ty = turn ? turn[1] : 0;
  const f = 0.92 - 0.75 * v - 0.12 * u - 0.16 * tx * (u - 0.5) - 0.12 * ty * (v - 0.5);
  const k = Math.max(0, Math.min(4, f * 4));
  const lo = Math.floor(k);
  return Math.min(4, k - lo > BAYER[(x & 3) + (y & 3) * 4] ? lo + 1 : lo);
}

/** The body as an SVG string: n×n cells, one rect per run of a tone in a row (the shape is clipped by whoever shows it). */
export function bodySvg(color, n, deep = false) {
  const tones = bodyTones(color, deep);
  const rects = [];
  for (let y = 0; y < n; y++) {
    let start = 0;
    let run = -1;
    for (let x = 0; x <= n; x++) {
      const idx = x < n ? toneAt(x, y, n) : -1;
      if (idx !== run) {
        if (run >= 0) rects.push(`<rect x="${start}" y="${y}" width="${x - start}" height="1" fill="${tones[run]}"/>`);
        start = x;
        run = idx;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" preserveAspectRatio="none" shape-rendering="crispEdges">${rects.join("")}</svg>`;
}

/**
 * Passing expressions (a pose, not the agent's look): they replace the eye
 * style for a moment. Each eye gets a kind the renderers know how to draw.
 */
export const EXPRESSIONS = {
  closed: { w: 0.17, h: 0.08, cy: 0.5, kind: "cup" },
  happy: { w: 0.17, h: 0.1, cy: 0.45, kind: "arc" },
  dizzy: { w: 0.23, h: 0.23, cy: 0.465, kind: "spiral" },
  heart: { w: 0.2, h: 0.19, cy: 0.465, kind: "heart" },
  star: { w: 0.22, h: 0.22, cy: 0.465, kind: "star" },
  cross: { w: 0.16, h: 0.16, cy: 0.465, kind: "cross" },
  surprised: { w: 0.17, h: 0.23, cy: 0.46, kind: "ring" },
  angry: { w: 0.12, h: 0.22, cy: 0.48, kind: "slant" },
  wink: { ...OVAL, kind: "pill", right: { w: 0.17, h: 0.08, cy: 0.5, kind: "cup" } },
};

/**
 * The two eyes for a style and a pose, as boxes in body fractions:
 * `{ x, y, w, h, kind, side }`. Kinds: "pill", "arc" (∩), "lid" (half),
 * "cup" (∪, closed), "spiral" (@), "heart", "star", "cross" (×), "ring" (O),
 * "slant" (angry). Pose: `writing` (dashes), `blink`, `expression` (one of
 * EXPRESSIONS), `look` [dx, dy] in fractions and `turn` [tx, ty] in -1..1:
 * the eyes slide toward the turn and the far one narrows (pseudo-3D).
 */
export function eyeShapes(style = "round", pose = {}) {
  // An expression (a sticker's mood, a reaction, a sleeping agent) replaces the eyes; the idle agent shows none.
  const ex = pose.writing ? null : EXPRESSIONS[pose.expression];
  const base = pose.writing ? { ...WRITING_EYE, kind: "pill" } : (ex ?? EYE_STYLES[style] ?? EYE_STYLES.round);
  const [lx, ly] = pose.look ?? [0, 0];
  const [tx, ty] = pose.turn ?? [0, 0];
  // The face turns with the body (drawAgent); the eyes only lean a little toward where it looks.
  const dx = lx + 0.025 * tx;
  const dy = ly + 0.02 * ty;
  const spread = 1;
  return EYE_X.map((cx, side) => {
    const e = side === 1 && base.right ? base.right : base;
    const kind = e.kind ?? "pill";
    const blink = pose.blink && (kind === "pill" || kind === "ring" || kind === "slant");
    // The eye on the side the head turns to is farther away: narrower.
    const far = (side === 1 && tx > 0) || (side === 0 && tx < 0) ? Math.abs(tx) : 0;
    const w = e.w * (1 - 0.12 * far);
    const h = blink ? Math.max(0.03, e.h * 0.12) : e.h;
    const center = 0.5 + (cx - 0.5) * spread + dx;
    return { x: center - w / 2, y: e.cy - h / 2 + dy, w, h, kind: blink ? "pill" : kind, side };
  });
}

/** Draws the eyes on a 2D canvas for a body at (x, y), side `s`. */
export function drawEyes(ctx, x, y, s, shapes, color = EYE_COLOR) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1.4, s * 0.055);
  for (const e of shapes) {
    const ex = x + e.x * s;
    const ey = y + e.y * s;
    const w = e.w * s;
    const h = e.h * s;
    const cx = ex + w / 2;
    const cy = ey + h / 2;
    const lw = ctx.lineWidth;
    ctx.beginPath();
    switch (e.kind) {
      case "arc":
        ctx.ellipse(cx, ey + h, Math.max(0.5, w / 2 - lw / 2), h, 0, Math.PI, 0);
        ctx.stroke();
        break;
      case "cup":
        ctx.ellipse(cx, ey, Math.max(0.5, w / 2 - lw / 2), h, 0, 0, Math.PI);
        ctx.stroke();
        break;
      case "lid":
        ctx.ellipse(cx, ey, w / 2, h, 0, 0, Math.PI);
        ctx.fill();
        break;
      case "spiral": {
        // @: one and a half turns from a small core, a thinner line so it stays open.
        const turns = 1.6;
        ctx.lineWidth = lw * 0.75;
        const r = Math.min(w, h) / 2 - lw / 2;
        for (let i = 0; i <= 48; i++) {
          const a = (i / 48) * turns * Math.PI * 2;
          const rr = r * (0.18 + 0.82 * (i / 48));
          const px = cx + Math.cos(a) * rr;
          const py = cy + Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.lineWidth = lw;
        break;
      }
      case "heart": {
        const t = ey + h * 0.3;
        ctx.moveTo(cx, ey + h);
        ctx.bezierCurveTo(ex - w * 0.1, ey + h * 0.55, ex, ey - h * 0.1, cx, t);
        ctx.bezierCurveTo(ex + w, ey - h * 0.1, ex + w * 1.1, ey + h * 0.55, cx, ey + h);
        ctx.fill();
        break;
      }
      case "star": {
        const r = Math.min(w, h) / 2;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
          const rr = i % 2 ? r * 0.32 : r;
          const px = cx + Math.cos(a) * rr;
          const py = cy + Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "cross":
        ctx.moveTo(ex + lw / 2, ey + lw / 2);
        ctx.lineTo(ex + w - lw / 2, ey + h - lw / 2);
        ctx.moveTo(ex + w - lw / 2, ey + lw / 2);
        ctx.lineTo(ex + lw / 2, ey + h - lw / 2);
        ctx.stroke();
        break;
      case "ring":
        ctx.ellipse(cx, cy, Math.max(0.5, w / 2 - lw / 2), Math.max(0.5, h / 2 - lw / 2), 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case "slant": {
        // A pill with its top cut down toward the middle (brows pulled in).
        const inner = e.side === 0 ? ex + w : ex;
        const outer = e.side === 0 ? ex : ex + w;
        ctx.moveTo(outer, ey);
        ctx.lineTo(inner, ey + h * 0.38);
        ctx.lineTo(inner, ey + h - w / 2);
        ctx.quadraticCurveTo(inner, ey + h, cx, ey + h);
        ctx.quadraticCurveTo(outer, ey + h, outer, ey + h - w / 2);
        ctx.closePath();
        ctx.fill();
        break;
      }
      default:
        // The brand's oval; a blink or a writing dash is a flat pill.
        if (h > w) ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
        else ctx.roundRect(ex, ey, w, h, Math.min(w, h) / 2);
        ctx.fill();
    }
  }
}

const hash = (a, b) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);

/**
 * An agent's idle life at time `t` (seconds): it turns its head toward a new
 * spot every couple of seconds (faster while `active`), blinks, breathes
 * (`squash`), and now and then shows an expression for a moment. `seed`
 * keeps several agents out of step; `every` (seconds, default 6.5) spaces the
 * expressions (each lasts 1.7 s). Returns a pose for drawAgent/eyeShapes.
 */
export function idlePose(t, seed = 0, opts = {}) {
  const period = opts.active ? 1.2 : 2.6;
  const at = t / period + seed * 3.1;
  const i = Math.floor(at);
  const target = (j) => [(hash(j, seed) * 2 - 1) * 0.85, (hash(j + 0.5, seed + 1) * 2 - 1) * 0.5];
  const a = target(i);
  const b = target(i + 1);
  const k = ease(Math.min(1, (at - i) * 2.4));
  const turn = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const blink = (t + seed * 1.7) % 3.9 < 0.12;
  // ponytail: xquads' agent only blinks (DESIGN.md); `turn` stays computed for callers that read it, never drawn.
  void turn;
  return { turn: [0, 0], blink, squash: 0, expression: undefined };
}

/**
 * How the body sits for a pose: scale and shift (pseudo-3D turn and breath),
 * around the bottom middle. Accessories use `head` (a parallax shift in body
 * fractions, smaller than the eyes').
 */
export function bodyFrame(pose = {}) {
  const [tx, ty] = pose.turn ?? [0, 0];
  const sq = pose.squash ?? 0;
  return {
    sx: 1 + 0.035 * sq,
    sy: 1 - 0.045 * sq,
    dx: 0,
    // Accessories sit on the turning face; a touch of lean so hats feel on top of the head.
    head: [0.02 * tx, 0.015 * ty - 0.03 * sq],
  };
}

const noise = (x, y) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/**
 * Draws a whole agent on a 2D canvas at (x, y), side `s` (canvas pixels).
 * Options: `color`, `eyes` (style), `pose` (see eyeShapes; `turn` and
 * `squash` also turn and breathe the body), `cells` (dither grid, default
 * from the size), `deep` tones, `progress` (0..1: the body forming from the
 * sky, cells arriving from the bottom-left with noise; eyes show once formed),
 * `withEyes` (default true) and `after(ctx, s, frame)`, called in the body's
 * own space (0..s) to draw on it (accessories).
 */
export function drawAgent(ctx, x, y, s, opts = {}) {
  const progress = opts.progress ?? 1;
  // Forming (the original's cells arriving from the sky): the flat face shows once it is mostly there.
  if (progress < 0.5) return;
  const pose = opts.pose ?? {};
  const frame = bodyFrame({});
  const body = gradientOf(opts.color)[1];
  const ink = faceInk(opts.color);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(0, 0, s, s, s * BODY_RADIUS);
  ctx.fill();
  if (opts.withEyes !== false) {
    drawEyes(ctx, 0, 0, s, eyeShapes(opts.eyes, pose), ink);
    if (!pose.writing && pose.expression !== "closed") drawSmile(ctx, s, ink);
  }
  if (opts.after) opts.after(ctx, s, frame);
  ctx.restore();
}

/** The smile (`SMILE`) on a body of side `s` drawn at (0, 0). */
function drawSmile(ctx, s, ink) {
  ctx.strokeStyle = ink;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1, SMILE.width * s);
  ctx.beginPath();
  ctx.moveTo(SMILE.from[0] * s, SMILE.from[1] * s);
  ctx.quadraticCurveTo(SMILE.control[0] * s, SMILE.control[1] * s, SMILE.to[0] * s, SMILE.to[1] * s);
  ctx.stroke();
}

/**
 * A small pixel agent for the skies: n×n rows of "X" (body), "o" (eye) and
 * "." (empty), from the same shape and eyes (n = 9 gives the classic sprite).
 */
export function spriteGrid(n = 9, style = "round") {
  const eyes = eyeShapes(style);
  const rows = [];
  for (let y = 0; y < n; y++) {
    let row = "";
    for (let x = 0; x < n; x++) {
      const u = (x + 0.5) / n;
      const v = (y + 0.5) / n;
      if (!inBody(u, v)) row += ".";
      else row += eyes.some((e) => u >= e.x && u <= e.x + e.w && v >= e.y && v <= e.y + e.h) ? "o" : "X";
    }
    rows.push(row);
  }
  return rows;
}

/* ---------- Accessories: pixel art on the body's 16×16 grid ---------- */

/** Accessory colors. A lowercase letter in CHECK is a 2-tone checker (dither) of two of these. */
export const ACCESSORY_PALETTE = {
  K: "#1d1d1b",
  k: "#3a3a37",
  W: "#ffffff",
  R: "#d0473c",
  r: "#9e3029",
  Y: "#f2c14e",
  y: "#c99a2e",
  P: "#ec6f9a",
  p: "#b9466f",
  B: "#3b82c4",
  G: "#23272e",
  g: "#7d8796",
  N: "#e0604f",
  n: "#a84436",
  V: "#8f6ff0",
  F: "#ffffff",
  f: "#f7c9da",
  O: "#f2c14e",
  M: "#5b6270",
  L: "#3fae6a",
};
export const ACCESSORY_CHECK = { c: ["K", "k"], h: ["Y", "y"], s: ["R", "r"], m: ["N", "n"] };
const CHECK = ACCESSORY_CHECK;

/**
 * Each accessory as rows of palette letters on the body's 16×16 grid: (ox, oy)
 * is where row 0 starts, (0, 0) being the body's top-left; they may reach
 * past the body. "A" is the antenna's light (it blinks while the agent works).
 */
export const ACCESSORIES = {
  hat: {
    ox: 2,
    oy: -6,
    rows: [
      "  KKKKKKKK  ",
      "  KkKKKKKK  ",
      "  KkKKKKKK  ",
      "  KKKKKKKK  ",
      "  RRRRRRRR  ",
      "KKKKKKKKKKKK",
      " KKKKKKKKKK ",
    ],
  },
  cap: {
    ox: 1,
    oy: -3,
    rows: ["    GGgGGG        ", "  GGGgGGGGGG      ", " GGGGGGGGGGGG     ", " GGGGGGGGGGGGKKKKK"],
  },
  headphones: {
    ox: -1,
    oy: -3,
    rows: [
      "     KKKKKKKK     ",
      "   KK        KK   ",
      "  K            K  ",
      " K              K ",
      " K              K ",
      "K                K",
      "K                K",
      "K                K",
      "KKK            KKK",
      "KgK            KgK",
      "KgK            KgK",
      "KgK            KgK",
      "KKK            KKK",
    ],
  },
  bow: {
    ox: 10,
    oy: -3,
    rows: ["PP   PP", "PPP PPP", "PPPpPPP", "PPP PPP", "PP   PP"],
  },
  crown: {
    ox: 3,
    oy: -5,
    rows: ["Y   YY   Y", "YY  YY  YY", "YhYYYYYYhY", "YYYRYYBYYY", "yyyyyyyyyy"],
  },
  antenna: {
    ox: 6,
    oy: -6,
    rows: [" AA ", "AAAA", " AA ", " kk ", " kk ", " kk ", "KKKK"],
  },
  headset: {
    ox: -1,
    oy: -3,
    rows: [
      "     kkkkkkkk     ",
      "   kk        kk   ",
      "  k            k  ",
      " k              k ",
      " k              k ",
      "k                k",
      "k                k",
      "k                k",
      "KKK              k",
      "KgK               ",
      "KgK               ",
      "KgK               ",
      "KKK               ",
      " k                ",
      " k                ",
      "  k               ",
      "   kkMM           ",
    ],
  },
  beanie: {
    ox: 1,
    oy: -5,
    rows: [
      "      WW      ",
      "     WWWW     ",
      "   NNNNNNNN   ",
      "  NNNNNNNNNN  ",
      " NNNNNNNNNNNN ",
      "mmmmmmmmmmmmmm",
      "mmmmmmmmmmmmmm",
    ],
  },
  party: {
    ox: 7,
    oy: -8,
    rows: ["   W   ", "  WWW  ", "   V   ", "  VVV  ", "  YYY  ", " VVVVV ", " YYYYY ", "VVVVVVV"],
  },
  flower: {
    ox: 10,
    oy: -3,
    rows: [" FfF ", "FFOFF", "fOOOf", "FFOFF", " FfF ", "  L  ", " LL  "],
  },
  scarf: {
    ox: -1,
    oy: 12,
    rows: [
      " ssssssssssssssss ",
      "RRRRRRRRRRRRRRRRRR",
      "ssssssssssssssssRR",
      "             RRR  ",
      "             sss  ",
      "             RRR  ",
      "             R R  ",
    ],
  },
};

/** The accessories an agent can wear ("none" first). */
export const ACCESSORY_NAMES = ["none", ...Object.keys(ACCESSORIES)];

/** How far an accessory reaches past the body, in body fractions: room to leave around a drawn agent. */
/** Whether accessories are drawn: off, xquads' agents have one face. */
const DRAW_ACCESSORIES = false;

/** The room an accessory takes around the body: none in xquads, which draws none (`DRAW_ACCESSORIES`). */
export const ACCESSORY_REACH = DRAW_ACCESSORIES
  ? { top: 9 / 16, left: 1 / 16, right: 2 / 16, bottom: 7 / 16 }
  : { top: 0, left: 0, right: 0, bottom: 0 };

/**
 * Draws an accessory on a body of side `s` in the body's own space (inside
 * drawAgent's `after`): `frame` adds the head's parallax, `t` and `active`
 * blink the antenna.
 */
export function drawAccessory(ctx, s, name, frame, t = 0, active = false) {
  // xquads' agents wear nothing (DESIGN.md): the stored accessory is kept, never drawn.
  const a = DRAW_ACCESSORIES ? ACCESSORIES[name] : undefined;
  if (!a) return;
  const u = s / 16;
  const hx = (frame?.head?.[0] ?? 0) * s;
  const hy = (frame?.head?.[1] ?? 0) * s;
  for (let j = 0; j < a.rows.length; j++) {
    const row = a.rows[j];
    for (let i = 0; i < row.length; i++) {
      let ch = row[i];
      if (ch === " ") continue;
      const gx = a.ox + i;
      const gy = a.oy + j;
      if (CHECK[ch]) ch = CHECK[ch][(gx + gy) & 1];
      ctx.fillStyle =
        ch === "A" ? (active && Math.floor(t * 3) % 2 ? "#ffd0c9" : "#ff6b5e") : (ACCESSORY_PALETTE[ch] ?? "#000000");
      ctx.fillRect(gx * u + hx, gy * u + hy, u + 0.6, u + 0.6);
    }
  }
}

/**
 * The two pixel z's of a sleeping agent, on the body's 16×16 grid: in the cut of the head's rounded top-right corner and
 * up and right from it. A tile leaves a bare head 4.8 cells above and 4.1 to its right: both fit there.
 */
const SLEEP_Z = ["###", "  #", " # ", "###"];
export const SLEEP_SPOTS = [
  [14.5, -2.6],
  [17, -4.8],
];

/**
 * A sleeping agent's "zz" (paused until its plan or budget is back), drawn in the body's own space like an accessory
 * (inside drawAgent's `after`), in `color`. With `t` the high one comes and goes; without it (still frames, reduced
 * motion) both show.
 */
export function drawSleep(ctx, s, frame, color, t) {
  // xquads: a sleeping agent shows closed eyes, no pixel zz.
  if (!DRAW_ACCESSORIES) return;
  const u = s / 16;
  const hx = (frame?.head?.[0] ?? 0) * s;
  const hy = (frame?.head?.[1] ?? 0) * s;
  // The high z comes and goes (a third of the time away): both stay readable as "zz", not one "z" alone.
  const rising = t !== undefined && Math.floor(t / 0.8) % 3 === 0;
  ctx.fillStyle = color;
  SLEEP_SPOTS.forEach(([ox, oy], k) => {
    if (rising && k === 1) return;
    for (let j = 0; j < SLEEP_Z.length; j++)
      for (let i = 0; i < SLEEP_Z[j].length; i++)
        if (SLEEP_Z[j][i] === "#") ctx.fillRect((ox + i) * u + hx, (oy + j) * u + hy, u + 0.6, u + 0.6);
  });
}

/** A sleeping agent's pose: eyes closed, the head a little down, breathing slowly (still: no breath). */
export function sleepPose(t, seed = 0) {
  void t;
  void seed;
  return { expression: "closed", turn: [0, 0], squash: 0 };
}
