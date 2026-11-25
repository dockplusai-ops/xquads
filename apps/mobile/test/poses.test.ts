import { expect, test } from "bun:test";
import { INK_ALPHAS, inkOrbitCells, orbitCells, orbitHead, RING, stopBreath } from "../src/agent/orbit";
import { agentLayout, framedByDefault, framedLayout, poseFor, seedOf } from "../src/agent/poses";

test("run: writing eyes", () => {
  expect(poseFor("run", 1, 0.5).writing).toBe(true);
});

test("think: looks up and aside", () => {
  const p = poseFor("think", 3, 1);
  expect(p.turn?.[1]).toBe(-0.3);
  expect(p.look?.[1]).toBe(-0.14);
});

test("rest: eyes closed, still with reduced motion", () => {
  const p = poseFor("rest", 3, 1, true);
  expect(p.expression).toBe("closed");
  expect(p.squash).toBe(0);
});

test("idle: only happy faces and winks", () => {
  for (let t = 0; t < 60; t += 0.5) {
    const e = poseFor("idle", t, 2).expression;
    if (e) expect(["happy", "wink"]).toContain(e);
  }
});

test("seeds are stable and small", () => {
  expect(seedOf("agent-1")).toBe(seedOf("agent-1"));
  expect(seedOf("agent-1")).toBeLessThan(8);
});

test("layout: xquads' flat face fills its box at every size, with no room kept for an accessory", () => {
  for (const size of [20, 40]) {
    const face = agentLayout(size, true);
    expect(face.withAccessory).toBe(false);
    expect(face).toMatchObject({ x: 0, y: 0, inner: size });
  }
  expect(agentLayout(16, false).cells).toBe(9);
  expect(agentLayout(30, false).cells).toBe(12);
  expect(agentLayout(80, false).cells).toBeUndefined();
});

test("the pixel orbit walks the 3×3 ring with a three-cell tail", () => {
  expect(RING).toHaveLength(8);
  const cells = orbitCells("sky", "#f4f4f1", 3);
  expect(cells.filter((c) => c.opacity === 1)).toHaveLength(3);
  expect(orbitHead(110 * 9)).toBe(1);
  expect(orbitHead(5000, true)).toBe(0);
});

test("framed: list and chat faces get the sky tile, tiny faces and heroes don't (like the web)", () => {
  expect(framedByDefault(18)).toBe(false);
  expect(framedByDefault(32)).toBe(true);
  expect(framedByDefault(50)).toBe(true);
  expect(framedByDefault(78)).toBe(false);
});

test("framed layout: in xquads the agent is the tile itself, an accessory or not", () => {
  expect(framedLayout(50, false)).toMatchObject({ x: 0, y: 0, inner: 50, withAccessory: false });
  expect(framedLayout(50, true)).toEqual(framedLayout(50, false));
  expect(framedLayout(22, true).withAccessory).toBe(false);
});

test("the ink orbit: the head in full ink, a fading trail, the rest faint", () => {
  const cells = inkOrbitCells(2);
  expect(cells).toHaveLength(8);
  expect(cells[2]?.opacity).toBe(INK_ALPHAS[0]);
  expect(cells[1]?.opacity).toBe(INK_ALPHAS[1]);
  expect(cells[0]?.opacity).toBe(INK_ALPHAS[2]);
  expect(cells[3]?.opacity).toBe(INK_ALPHAS[3]);
});

test("the stop square breathes 1 → 0.6 → 1 every 1.6 s, solid when still", () => {
  expect(stopBreath(0)).toBeCloseTo(1);
  expect(stopBreath(800)).toBeCloseTo(0.6);
  expect(stopBreath(1600)).toBeCloseTo(1);
  expect(stopBreath(800, true)).toBe(1);
});

test("sleep: rest's closed eyes (the zz are drawn over it)", () => {
  expect(poseFor("sleep", 3, 1, true)).toEqual(poseFor("rest", 3, 1, true));
  expect(poseFor("sleep", 3, 1).expression).toBe("closed");
});
