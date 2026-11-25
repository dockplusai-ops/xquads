import { type BadgePresence, type BadgeTone, badgeCells } from "@agenteschat/ui/presence/badge";

/**
 * The presence badge (ADR 0084) as the phone draws it (pure: no React Native import, so it is unit-tested): the
 * shared cells (`@agenteschat/ui/presence/badge`) as one path per tone, its colors, and how big a cell is beside
 * an avatar. Each tone lies on a layer under it (the ring under the whole badge, the base under its marks), so
 * no seam of the surface shows between two tones.
 */

export type { BadgePresence };

export interface BadgePath {
  tone: BadgeTone;
  /** In cells: one rect per run of the layer in a row. */
  d: string;
}

/** Bottom to top. */
const LAYERS: readonly BadgeTone[] = ["ring", "base", "light", "deep", "mark"];

/** Which cells each layer covers: the ring the whole badge, the base every cell of its shape, the rest their own. */
const covers = (layer: BadgeTone, tone: BadgeTone) =>
  layer === "ring" ? true : layer === "base" ? tone !== "ring" : layer === tone;

/** The badge's paths, bottom first; `size` is its side in cells (9, or 11 with the ring). */
export function badgePaths(presence: BadgePresence, ring = true): { size: number; paths: BadgePath[] } {
  const { size, cells } = badgeCells(presence, ring);
  const grid: (BadgeTone | undefined)[] = new Array(size * size);
  for (const c of cells) grid[c.y * size + c.x] = c.tone;
  const paths: BadgePath[] = [];
  for (const layer of LAYERS) {
    if (layer === "ring" && !ring) continue;
    let d = "";
    for (let y = 0; y < size; y++) {
      let x = 0;
      while (x < size) {
        const tone = grid[y * size + x];
        if (!tone || !covers(layer, tone)) {
          x++;
          continue;
        }
        let end = x + 1;
        while (end < size) {
          const next = grid[y * size + end];
          if (!next || !covers(layer, next)) break;
          end++;
        }
        d += `M${x} ${y}h${end - x}v1h${x - end}z`;
        x = end;
      }
    }
    if (d) paths.push({ tone: layer, d });
  }
  return { size, paths };
}

/**
 * The badge's color per presence, the same in both themes (xquads is dark only): the app's states, sálvia online,
 * argila busy, amber away, ardósia out, the faint sand offline, an agent at work camel, one waiting on you amber.
 */
const TONES: Record<BadgePresence, readonly [light: string, dark: string]> = {
  online: ["#8fbb9c", "#8fbb9c"],
  busy: ["#e08476", "#e08476"],
  away: ["#d9a55b", "#d9a55b"],
  out: ["#8aa3ae", "#8aa3ae"],
  offline: ["#a39b97", "#a39b97"],
  hidden: ["#a39b97", "#a39b97"],
  working: ["#c79d70", "#c79d70"],
  waiting: ["#d9a55b", "#d9a55b"],
};

/** Each tone's fill: one flat color (no dither in xquads), the white mark, the ring. */
export function badgeFills(presence: BadgePresence, dark: boolean, ring: string): Record<BadgeTone, string> {
  const base = TONES[presence][dark ? 1 : 0];
  return {
    base,
    light: base,
    deep: base,
    mark: "#0e1c22",
    ring,
  };
}

/**
 * Points per cell beside an avatar of `avatar` points: small faces (a header's pill) 0.9, list rows 1.1 (about 12
 * points with the ring), big profile faces 1.6.
 */
export function badgeCell(avatar: number): number {
  if (avatar <= 32) return 0.9;
  if (avatar <= 56) return 1.1;
  return 1.6;
}

/** How far the badge hangs past the avatar's corner, in points (the ring overlaps the edge). */
export const badgeOverhang = (cell: number) => Math.round(cell * 2.5);
