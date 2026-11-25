/**
 * @agenteschat/tokens: the design system's values for platforms without CSS
 * (the phone app). `docs/design/design-system/tokens.css` is the source of
 * truth; a test keeps these equal to it. Names are the CSS custom properties
 * in camelCase (`--line2` → `line2`, `--raised-2` → `raised2`).
 */

export interface ThemeColors {
  bg: string;
  raised: string;
  raised2: string;
  sunken: string;
  /** The app shell: the sidebar's paper and the work area beside it. */
  side: string;
  pane: string;
  glass: string;
  glassSolid: string;
  line: string;
  line2: string;
  lineStrong: string;
  ink: string;
  ink2: string;
  muted: string;
  faint: string;
  /** The keyboard focus ring's color (`--focus-color`, the strong line). */
  focusColor: string;
  agent: string;
  agent2: string;
  agentSoft: string;
  onAgent: string;
  ok: string;
  warn: string;
  warnSoft: string;
  onWarn: string;
  danger: string;
  info: string;
  plate: string;
  plateSoft: string;
  scrim: string;
  /** Each agent's color (its rounded square), by the color's name. */
  agentCamelo: string;
  agentArdosia: string;
  agentAreia: string;
  agentSalvia: string;
  agentArgila: string;
  agentNevoa: string;
  /** The phone's Liquid Glass: its fill and its dark inner edge. */
  glassTint: string;
  glassEdge: string;
  /** Names from v1 (aliases that follow the theme). */
  surface: string;
  surfaceRaised: string;
  surfaceSunken: string;
  inkMuted: string;
  action: string;
  onAction: string;
  attention: string;
  onAttention: string;
  attentionSoft: string;
  success: string;
}

/** xquads is dark only (DESIGN.md): petrol and camel, the same values under both names. */
const xquads: ThemeColors = {
  bg: "#0e1c22",
  raised: "#15282f",
  raised2: "#1f353d",
  sunken: "#0a161b",
  side: "#0b171c",
  pane: "#112229",
  glass: "rgba(21, 40, 47, 0.72)",
  glassSolid: "#15282f",
  line: "rgba(237, 230, 225, 0.10)",
  line2: "rgba(237, 230, 225, 0.16)",
  lineStrong: "#6f8189",
  ink: "#ede6e1",
  ink2: "#d9d0ca",
  muted: "#beb5b0",
  faint: "#a39b97",
  focusColor: "#6f8189",
  agent: "#c79d70",
  agent2: "#ddbe9c",
  agentSoft: "#2b2722",
  onAgent: "#0e1c22",
  ok: "#8fbb9c",
  warn: "#d9a55b",
  warnSoft: "#33291a",
  onWarn: "#1f1404",
  danger: "#e08476",
  info: "#8aa3ae",
  plate: "rgba(237, 230, 225, 0.08)",
  plateSoft: "rgba(237, 230, 225, 0.05)",
  scrim: "rgba(4, 10, 13, 0.6)",
  agentCamelo: "#c79d70",
  agentArdosia: "#8aa3ae",
  agentAreia: "#d3c3b9",
  agentSalvia: "#8fbb9c",
  agentArgila: "#cf9580",
  agentNevoa: "#a9b3ce",
  glassTint: "rgba(255, 255, 255, 0.08)",
  glassEdge: "rgba(0, 0, 0, 0.32)",
  surface: "#0e1c22",
  surfaceRaised: "#15282f",
  surfaceSunken: "#0a161b",
  inkMuted: "#beb5b0",
  action: "#c79d70",
  onAction: "#0e1c22",
  attention: "#d9a55b",
  onAttention: "#1f1404",
  attentionSoft: "#33291a",
  success: "#ede6e1",
};

/** Whether people pick a theme: off, as both themes hold the same petrol. The apps stay on dark and hide the choice. */
export const THEME_CHOICE = false;

export const light: ThemeColors = xquads;
export const dark: ThemeColors = xquads;

export const themes = { light, dark } as const;
export type ThemeName = keyof typeof themes;

/** One layer of a CSS `box-shadow` (px). */
export interface ShadowLayer {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  inset?: boolean;
}

export type ShadowName = "e1" | "e2" | "e3" | "top";

const xquadsShadows: Record<ShadowName, ShadowLayer[]> = {
  e1: [
    { x: 0, y: 1, blur: 2, spread: 0, color: "rgba(0, 0, 0, 0.5)" },
    { x: 0, y: 0, blur: 0, spread: 1, color: "rgba(237, 230, 225, 0.10)" },
  ],
  e2: [
    { x: 0, y: 8, blur: 20, spread: -6, color: "rgba(0, 0, 0, 0.6)" },
    { x: 0, y: 0, blur: 0, spread: 1, color: "rgba(237, 230, 225, 0.10)" },
  ],
  e3: [
    { x: 0, y: 28, blur: 64, spread: -16, color: "rgba(0, 0, 0, 0.8)" },
    { x: 0, y: 0, blur: 0, spread: 1, color: "rgba(237, 230, 225, 0.16)" },
  ],
  top: [{ x: 0, y: 1, blur: 0, spread: 0, color: "rgba(237, 230, 225, 0.08)", inset: true }],
};

/** Elevations (`--e1`…`--e3`) and the raised top edge (`--top`), per theme, as layer lists: one dark set. */
export const shadows: Record<ThemeName, Record<ShadowName, ShadowLayer[]>> = {
  light: xquadsShadows,
  dark: xquadsShadows,
};

/** Corner radii (px). */
export const radius = {
  xs: 4,
  sm: 6,
  item: 10,
  md: 10,
  btn: 12,
  lg: 14,
  xl: 18,
  section: 20,
  cut: 2,
  full: 999,
} as const;

/** The agent symbol's corners (`--radius-agent`), as fractions of its size: top-left, top-right, bottom-right, bottom-left. */
export const agentRadius = [0.28, 0.28, 0.28, 0.28] as const;

/** Spacing steps (px), by `--space-N`. */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
} as const;

/** Type sizes (px). */
export const text = {
  xs: 12,
  sm: 13,
  md: 14.5,
  base: 15,
  lg: 16,
  h3: 17,
  h2: 20,
  h1: 28,
  display: 32,
} as const;

/** Letter spacing (em). */
export const tracking = {
  tight: -0.025,
  tighter: -0.035,
} as const;

/** Font families (the first family of each CSS stack; display and dot come from the brand pages). */
export const fonts = {
  sans: "Onest",
  display: "Funnel Display",
  dot: "Doto",
  mono: "Martian Mono",
} as const;

/** Cubic bezier curves `[x1, y1, x2, y2]`: `spring` and `out` from the tokens; `ios` for sheets (`--drawer`). */
export const motion = {
  spring: [0.34, 1.4, 0.5, 1],
  out: [0.2, 0.8, 0.2, 1],
  ios: [0.32, 0.72, 0, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** Durations in ms (`--dur-*`): fast for presses, menus and exits, base for dialogs, toasts and arrivals, panel for a
 *  side panel's slide. */
export const durations = { fast: 140, base: 180, panel: 240 } as const;
