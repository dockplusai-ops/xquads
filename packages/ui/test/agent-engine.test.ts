import { describe, expect, test } from "bun:test";
import {
  AGENT_GRADIENTS,
  bodyPath,
  bodyTones,
  contrastOf,
  customGradient,
  drawSleep,
  EYE_COLOR,
  EYE_STYLES,
  eyeShapes,
  faceInk,
  gradientOf,
  hexToHsv,
  hsvToHex,
  inBody,
  luminance,
  mentionTone,
  nearestPreset,
  pickerStart,
  SLEEP_SPOTS,
  sleepPose,
  spriteBody,
  spriteGrid,
} from "../src/agent/engine.js";
import { agentGradient, appearanceStyle, normalizeAppearance } from "../src/components/AgentLook";
import { SPRITE } from "../src/sky/engine";

describe("agent engine: one agent everywhere", () => {
  test("the eyes are petrol ovals and mirror each other around the middle, in every style and pose", () => {
    expect(EYE_COLOR).toBe("#0e1c22");
    for (const style of Object.keys(EYE_STYLES)) {
      for (const pose of [{}, { writing: true }, { blink: true }]) {
        const [l, r] = eyeShapes(style, pose);
        expect(l && r).toBeTruthy();
        if (!l || !r) continue;
        expect(l.x + l.w / 2 + (r.x + r.w / 2)).toBeCloseTo(1, 6);
        expect(l.y).toBe(r.y);
        expect(l.w).toBe(r.w);
      }
    }
  });

  test("each eye style is its own (the brand's oval by default), and an expression replaces it", () => {
    const shapes = Object.keys(EYE_STYLES).map((style) => JSON.stringify(eyeShapes(style)));
    expect(new Set(shapes).size).toBe(Object.keys(EYE_STYLES).length);
    expect(eyeShapes("happy")[0]?.kind).toBe("arc");
    expect(eyeShapes("sleepy")[0]?.kind).toBe("lid");
    for (const [expression, kind] of [
      ["star", "star"],
      ["heart", "heart"],
      ["surprised", "ring"],
      ["dizzy", "spiral"],
      ["happy", "arc"],
      ["closed", "cup"],
    ] as const)
      expect(eyeShapes("round", { expression })[0]?.kind).toBe(kind);
    const [left, right] = eyeShapes("round", { expression: "wink" });
    expect([left?.kind, right?.kind]).toEqual(["pill", "cup"]);
  });

  test("writing turns any style into short dashes; blinking closes them", () => {
    const [dash] = eyeShapes("happy", { writing: true });
    expect(dash?.kind).toBe("pill");
    expect(dash && dash.w > dash.h).toBe(true);
    const [open] = eyeShapes("round");
    const [closed] = eyeShapes("round", { blink: true });
    expect((closed?.h ?? 1) < (open?.h ?? 0)).toBe(true);
  });

  test("the small agent is the same shape: four rounded corners, two eyes, symmetric", () => {
    const g = spriteGrid(9);
    expect(SPRITE).toEqual(g);
    for (const [y, x] of [
      [0, 0],
      [0, 8],
      [8, 0],
      [8, 8],
    ])
      expect(g[y as number]?.[x as number]).toBe(".");
    const eyes = g.flatMap((row, y) => [...row].flatMap((c, x) => (c === "o" ? [[x, y]] : [])));
    expect(eyes.length).toBeGreaterThanOrEqual(2);
    for (const [x, y] of eyes) expect(g[y as number]?.[8 - (x as number)]).toBe("o");
  });

  test("colors, tones and shape agree with the components", () => {
    expect(agentGradient("rose")).toEqual(AGENT_GRADIENTS.rose);
    const light = (c: string) => [1, 3, 5].reduce((s, i) => s + Number.parseInt(c.slice(i, i + 2), 16), 0);
    const tones = bodyTones("teal");
    expect(light(tones[0] ?? "")).toBeLessThan(light(tones[4] ?? ""));
    expect(light(bodyTones("teal", true)[4] ?? "")).toBeLessThan(light(tones[4] ?? ""));
    expect(spriteBody("sky")).toBe(AGENT_GRADIENTS.sky[1]);
    expect(inBody(0.5, 0.5)).toBe(true);
    expect(inBody(0.01, 0.01)).toBe(false);
    expect(inBody(0.04, 0.96)).toBe(false);
    expect(bodyPath(0, 0, 1).startsWith("M")).toBe(true);
  });

  test("a custom #rrggbb is built like the presets and kept readable", () => {
    // A preset's own bottom comes back as the bottom, with a lighter top of the same hue.
    for (const [top, bottom] of Object.values(AGENT_GRADIENTS)) {
      const [ctop, cbottom] = customGradient(bottom);
      expect(cbottom).toBe(bottom);
      expect(luminance(ctop)).toBeGreaterThan(luminance(bottom));
      expect(Math.abs(hexToHsv(ctop)[0] - hexToHsv(top)[0]) % 360).toBeLessThan(12);
    }
    // Kept as picked, lifted only to read on the petrol page; the face's ink reads on it (petrol or sand).
    for (const hex of ["#ffffff", "#ffff00", "#00ff00", "#000000", "#00ffff", "#7f7f7f", "#00008f"]) {
      const [top, bottom] = customGradient(hex);
      expect(luminance(bottom)).toBeGreaterThanOrEqual(0.09);
      expect(luminance(top)).toBeGreaterThanOrEqual(luminance(bottom));
      expect(contrastOf(faceInk(hex), bottom)).toBeGreaterThanOrEqual(3);
    }
    expect(gradientOf("#0063D1")).toEqual(customGradient("#0063d1"));
    expect(gradientOf("rose")).toEqual(AGENT_GRADIENTS.rose);
    expect(gradientOf("#12345")).toEqual(AGENT_GRADIENTS.sky);
  });

  test("a custom color maps to the closest preset by hue, graphite when nearly gray", () => {
    for (const name of Object.keys(AGENT_GRADIENTS)) expect(nearestPreset(name)).toBe(name as never);
    expect(nearestPreset("#e0457b")).toBe("rose");
    expect(nearestPreset("#20c060")).toBe("green");
    expect(nearestPreset("#808080")).toBe("graphite");
    expect(nearestPreset("nonsense")).toBe("sky");
  });

  test("the picker starts from the current color: a preset's own tone, a custom one as is", () => {
    expect(pickerStart("amber")).toBe(AGENT_GRADIENTS.amber[1]);
    expect(pickerStart("#ABCDEF")).toBe("#abcdef");
    expect(pickerStart(undefined)).toBe(AGENT_GRADIENTS.sky[1]);
  });

  test("hex and hsv round-trip (the picker's area and hue slider)", () => {
    for (const hex of ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#1a2b3c", "#c07d0b", "#808080"]) {
      const [h, s, v] = hexToHsv(hex);
      expect(hsvToHex(h, s, v)).toBe(hex);
    }
    expect(hexToHsv("#ff0000")).toEqual([0, 1, 1]);
    expect(hsvToHex(240, 1, 1)).toBe("#0000ff");
  });

  test("a stored custom color survives normalizing and paints the symbol", () => {
    expect(normalizeAppearance({ color: "#ABCDEF" }).color).toBe("#abcdef");
    expect(normalizeAppearance({ color: "#abc" }).color).toBeUndefined();
    expect(normalizeAppearance({ color: "teal" }).color).toBe("teal");
    const [top, bottom] = customGradient("#abcdef");
    expect(appearanceStyle({ color: "#abcdef" })).toEqual({ "--av-top": top, "--av-bottom": bottom } as never);
  });
});

describe("a sleeping agent (paused until its plan or budget is back)", () => {
  const rects = (t?: number) => {
    const out: [number, number][] = [];
    const ctx = { fillStyle: "", fillRect: (x: number, y: number) => out.push([x, y]) };
    drawSleep(ctx as never, 16, undefined, "#000000", t);
    return out;
  };
  test("eyes closed and still; no pixel z's (xquads draws none)", () => {
    expect(sleepPose(undefined).expression).toBe("closed");
    expect(sleepPose(undefined).squash).toBe(0);
    expect(rects()).toHaveLength(0);
    expect(rects(0.9)).toHaveLength(0);
    expect(SLEEP_SPOTS).toHaveLength(2);
  });
});

describe("an agent's @mention tone", () => {
  const colors = [...Object.keys(AGENT_GRADIENTS), "#ffff00", "#00ffff", "#ff0000", "#101010", "#808080", "#f0f0f0"];

  test("passes WCAG AA in both themes, for every preset and for custom colors at the extremes", () => {
    for (const color of colors) {
      for (const dark of [false, true]) {
        const { ink, background } = mentionTone(color, dark);
        expect(contrastOf(ink, background)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test("a light tint in the light theme, a dark one in the dark, and each agent keeps its own", () => {
    expect(luminance(mentionTone("rose").background)).toBeGreaterThan(0.6);
    expect(luminance(mentionTone("rose", true).background)).toBeLessThan(0.2);
    expect(mentionTone("rose").background).not.toBe(mentionTone("teal").background);
    expect(mentionTone("rose").ink).not.toBe(mentionTone("teal").ink);
  });

  test("contrastOf is the WCAG ratio", () => {
    expect(contrastOf("#000000", "#ffffff")).toBeCloseTo(21);
    expect(contrastOf("#ffffff", "#ffffff")).toBe(1);
  });
});

describe("a workspace's accent is its default agent color (ADR 0193)", () => {
  test("sky resolves to the accent's pair everywhere it is drawn, back to camelo when cleared", async () => {
    const {
      AGENT_GRADIENTS: G,
      gradientOf,
      mentionTone,
      setSkyColors,
      spriteBody,
    } = await import("../src/agent/engine.js");
    const { accentSky, contrastRatio } = await import("@agenteschat/tokens/accent");
    const sky = gradientOf("sky");
    const rose = gradientOf("rose");
    const custom = gradientOf("#123456");
    const pair = accentSky("#7c3aed");
    setSkyColors(pair);
    try {
      expect(gradientOf("sky")).toEqual(pair);
      expect(gradientOf(undefined)).toEqual(pair);
      expect(agentGradient()).toEqual(pair);
      expect(spriteBody("sky")).toBe(pair[1]);
      expect(mentionTone("sky").ink).not.toBe(mentionTone("rose").ink);
      // An agent's own color stays its own.
      expect(gradientOf("rose")).toEqual(rose);
      expect(gradientOf("#123456")).toEqual(custom);
    } finally {
      setSkyColors(null);
    }
    expect(gradientOf("sky")).toEqual(sky);
    expect(G.sky).toEqual(["#ddbe9c", "#c79d70"]);
    expect(spriteBody("sky")).toBe("#c79d70");
    // Agents' white eyes and text read on the bottom whatever was picked.
    for (const hex of ["#fdfdfd", "#050505", "#ffff00"])
      expect(contrastRatio(accentSky(hex)[1], "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
});
