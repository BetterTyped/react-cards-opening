// The colours of a card opening: the themes to pick from, each in dark and light, and the colour every rarity wears
// on each. Pure data and pure functions. Every colour is a plain hex, so it draws the same in CSS, on a canvas and
// inside an SVG.

export type ThemeMode = "dark" | "light";

/** What each rarity wears, by tier id. */
export type RarityColors = Record<string, string>;

export interface CardTheme {
  bg: string;
  card: string;
  fg: string;
  muted: string;
  /** Five steps, quietest to loudest. A scan grid ramps through them, and the loudest is the accent. */
  levels: readonly [string, string, string, string, string];
  /** Colours told apart at a glance, chosen to sit well on this theme. A tier with no entry wears `muted`. */
  rarity: RarityColors;
}

/* ---------- colour math, in plain sRGB hex ---------- */

const channels = (hex: string): [number, number, number] => {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((char) => char + char).join("") : value;
  return [0, 2, 4].map((at) => Number.parseInt(full.slice(at, at + 2), 16) || 0) as [number, number, number];
};

const toHex = (rgb: readonly number[]) =>
  `#${rgb
    .map((channel) =>
      Math.round(Math.min(255, Math.max(0, channel)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

/** `amount` of the way from one color to another: 0 is the first, 1 the second. */
export function mixColors(from: string, to: string, amount: number): string {
  const a = channels(from);
  const b = channels(to);
  return toHex(a.map((channel, index) => channel + (b[index] - channel) * amount));
}

/** A color as hue (0 to 360), saturation and lightness (0 to 1). Greys have no hue and answer 0. */
function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = channels(hex).map((channel) => channel / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  if (delta === 0) return [0, 0, lightness];
  const raw = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return [(raw * 60 + 360) % 360, delta / (1 - Math.abs(2 * lightness - 1)), lightness];
}

function fromHsl(hue: number, saturation: number, lightness: number): string {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - chroma / 2;
  const sextant = Math.floor(hue / 60) % 6;
  const [r, g, b] = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x],
  ][sextant];
  return toHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
}

const hueOf = (hex: string) => toHsl(hex)[0];

/** The same color turned around the wheel by `degrees`, at a lightness and saturation that read on a dark ground. */
const neighbour = (hex: string, degrees: number) => fromHsl((hueOf(hex) + degrees + 360) % 360, 0.72, 0.66);

/**
 * A color made for a dark ground, for a light one: the same hue, darker, and at least as vivid. Mixing in black does
 * the darkening but drains the color, and a highlight that is greyer than what it highlights is no highlight.
 */
function deepen(hex: string): string {
  const [hue, saturation, lightness] = toHsl(hex);
  // A near-grey stays a grey: forcing saturation onto it would invent a hue.
  if (saturation < 0.12) return fromHsl(hue, saturation, Math.min(lightness, 0.3));
  return fromHsl(hue, Math.max(saturation, 0.62), Math.min(lightness, 0.42));
}

const WHITE = "#ffffff";
const BLACK = "#000000";
const GOLD = "#f2cc60";

/** Rarity colours made for a dark ground, deepened so they hold on a light one. The quietest tier turns grey. */
const forLight = (rarity: RarityColors): RarityColors =>
  Object.fromEntries(Object.entries(rarity).map(([id, colour]) => [id, id === "common" ? "#6e7781" : deepen(colour)]));

/** A theme's light side, worked out from its dark one: white ground, the ramp running from a tint to a deep tone. */
function lightFrom(dark: CardTheme): CardTheme {
  const key = dark.levels[3];
  return {
    bg: mixColors(WHITE, key, 0.03),
    card: mixColors("#f4f5f7", key, 0.05),
    fg: "#1b1e23",
    muted: "#5d6470",
    levels: [
      mixColors("#ebedf0", key, 0.06),
      mixColors(WHITE, key, 0.45),
      mixColors(WHITE, key, 0.85),
      mixColors(key, BLACK, 0.2),
      mixColors(key, BLACK, 0.45),
    ],
    rarity: forLight(dark.rarity),
  };
}

/*
 * A theme is a color, not a color and a brightness: every one comes in dark and light, and the viewer flips between
 * them with one switch. Rarity is four colors told apart at a glance and chosen for the theme: a quiet neutral for
 * common, a cool and a warm companion of the theme's own color for rare and epic, and gold for legendary. Never one
 * hue for all four (no variety), and never a hue that fights the theme (purple or pink on a green year).
 */
interface ThemeEntry {
  label: string;
  dark: CardTheme;
  /** Only where the worked-out light side is not good enough (a multi-colour ramp needs care). */
  light?: CardTheme;
}

const THEMES = {
  moss: {
    label: "Moss",
    dark: {
      bg: "#0d1117",
      card: "#151b23",
      fg: "#f0f6fc",
      muted: "#9198a1",
      levels: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
      rarity: { common: "#8b949e", rare: "#39c5cf", epic: "#c5e85b", legendary: GOLD },
    },
    light: {
      bg: "#ffffff",
      card: "#f6f8fa",
      fg: "#1f2328",
      muted: "#59636e",
      levels: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
      rarity: { common: "#6e7781", rare: "#1b7c83", epic: "#5b7d0a", legendary: "#9a6700" },
    },
  },
  ice: {
    label: "Ice",
    dark: {
      bg: "#08111f",
      card: "#0f1b2e",
      fg: "#eef5ff",
      muted: "#8ea3bf",
      levels: ["#13213a", "#0c3a6b", "#1366c2", "#3b8eea", "#8cc6ff"],
      rarity: { common: "#8ea3bf", rare: "#5eead4", epic: "#a5b4fc", legendary: "#fde68a" },
    },
  },
  grape: {
    label: "Grape",
    dark: {
      bg: "#110c1d",
      card: "#1a1430",
      fg: "#f4efff",
      muted: "#a497c2",
      levels: ["#1f1835", "#3b1f73", "#6233b8", "#8f5cf0", "#c4a7ff"],
      rarity: { common: "#a497c2", rare: "#7aa2ff", epic: "#f0abfc", legendary: "#ffd580" },
    },
  },
  halloween: {
    label: "Halloween",
    dark: {
      bg: "#0d1117",
      card: "#161b22",
      fg: "#f0f6fc",
      muted: "#9198a1",
      levels: ["#161b22", "#631c03", "#bd561d", "#fa7a18", "#fddf68"],
      rarity: { common: "#9198a1", rare: "#f47067", epic: "#b392f0", legendary: "#fddf68" },
    },
  },
  ocean: {
    label: "Ocean",
    dark: {
      bg: "#061417",
      card: "#0c2024",
      fg: "#eafcfd",
      muted: "#86a9ad",
      levels: ["#0f2226", "#0b4a52", "#0f7c87", "#22b8c4", "#7ef0f5"],
      rarity: { common: "#86a9ad", rare: "#5aa9ff", epic: "#6ee7b7", legendary: "#ffe08a" },
    },
  },
  candy: {
    label: "Candy",
    dark: {
      bg: "#170b12",
      card: "#22121b",
      fg: "#fff0f7",
      muted: "#c29cb0",
      levels: ["#24131c", "#5c1736", "#9c2357", "#de3f7f", "#ff8fc0"],
      rarity: { common: "#c29cb0", rare: "#c4a1ff", epic: "#ff9f7a", legendary: "#ffe08a" },
    },
  },
  sunset: {
    label: "Sunset",
    dark: {
      bg: "#150c0a",
      card: "#21140f",
      fg: "#fff4ea",
      muted: "#c2a493",
      levels: ["#241612", "#7a1f1f", "#c2402a", "#f08a2e", "#ffd166"],
      rarity: { common: "#c2a493", rare: "#ff7a8a", epic: "#b58cff", legendary: "#ffd166" },
    },
  },
  synthwave: {
    label: "Synthwave",
    dark: {
      bg: "#0c0720",
      card: "#160f33",
      fg: "#f7f2ff",
      muted: "#a497d1",
      levels: ["#1b1238", "#3d1a78", "#8a2be2", "#ff2ea6", "#2ef2ff"],
      rarity: { common: "#a497d1", rare: "#a66bff", epic: "#ff2ea6", legendary: "#2ef2ff" },
    },
    light: {
      bg: "#fbf8ff",
      card: "#f2ecfb",
      fg: "#1c1530",
      muted: "#655a85",
      levels: ["#ebe4f7", "#d3b8f5", "#a35ce6", "#e0218f", "#0aa9b5"],
      rarity: { common: "#6e6790", rare: "#7a3fd6", epic: "#c41279", legendary: "#07848e" },
    },
  },
  mono: {
    label: "Mono",
    dark: {
      bg: "#0e0e10",
      card: "#18181b",
      fg: "#fafafa",
      muted: "#a1a1aa",
      levels: ["#1c1c1f", "#3a3a40", "#66666f", "#a0a0aa", "#f4f4f5"],
      rarity: { common: "#8b8b94", rare: "#b4b4bd", epic: "#dcdce2", legendary: "#ffffff" },
    },
    light: {
      bg: "#ffffff",
      card: "#f4f4f5",
      fg: "#111113",
      muted: "#63636b",
      levels: ["#ececee", "#c9c9cf", "#96969e", "#55555c", "#111113"],
      rarity: { common: "#8b8b94", rare: "#63636b", epic: "#3a3a40", legendary: "#000000" },
    },
  },
  paper: {
    label: "Paper",
    dark: {
      bg: "#17130e",
      card: "#211b14",
      fg: "#f6efe2",
      muted: "#a59a88",
      levels: ["#2a2219", "#5a4630", "#8a6d47", "#b8945f", "#e6c592"],
      rarity: { common: "#a59a88", rare: "#7fb3d5", epic: "#e08e79", legendary: "#e6c04f" },
    },
    light: {
      bg: "#faf7f2",
      card: "#f1ece3",
      fg: "#1d1b18",
      muted: "#6b655c",
      levels: ["#e9e2d5", "#d3c6ae", "#a8916b", "#7a6343", "#3f3123"],
      rarity: { common: "#8a8377", rare: "#3f6f8f", epic: "#9c4a3c", legendary: "#a8780a" },
    },
  },
} as const satisfies Record<string, ThemeEntry>;

export type ThemeId = keyof typeof THEMES;
export const DEFAULT_THEME_ID: ThemeId = "moss";

/** Every theme by id with its name, as it looks in the dark: what a picker draws its swatches from. */
export const THEME_LIST: readonly { id: ThemeId; label: string; theme: CardTheme }[] = (
  Object.keys(THEMES) as ThemeId[]
).map((id) => ({ id, label: THEMES[id].label, theme: THEMES[id].dark }));

export const isThemeId = (id: string): id is ThemeId => id in THEMES;

/** A theme in one of its two modes. */
export function themeOf(id: ThemeId = DEFAULT_THEME_ID, mode: ThemeMode = "dark"): CardTheme {
  const entry: ThemeEntry = THEMES[id];
  return mode === "dark" ? entry.dark : (entry.light ?? lightFrom(entry.dark));
}

/** What every component wears when it is given no theme. */
export const DEFAULT_THEME: CardTheme = THEMES.moss.dark;

/**
 * A theme from one accent: a five-step ramp mixed into a dark or light ground, and rarity cut from the same accent, a
 * cool and a warm neighbour on the wheel plus gold. An accent that is already gold takes its own light tint for
 * legendary, so the two never blur.
 */
export function customTheme(accent: string, mode: ThemeMode = "dark"): CardTheme {
  const dark = mode === "dark";
  const base = dark ? "#0e1013" : WHITE;
  const step = (amount: number) => mixColors(base, accent, amount);
  const hue = hueOf(accent);
  const golden = hue >= 28 && hue <= 72;
  const rarity: RarityColors = {
    common: "#9aa1ab",
    rare: neighbour(accent, -48),
    epic: neighbour(accent, 48),
    legendary: golden ? mixColors(accent, WHITE, 0.6) : GOLD,
  };
  return {
    bg: base,
    card: dark ? "#16191e" : "#f5f6f8",
    fg: dark ? "#f3f5f7" : "#16191e",
    muted: dark ? "#9aa1ab" : "#5d6470",
    levels: [dark ? "#1b1f25" : "#ebedf0", step(0.3), step(0.55), step(0.8), accent],
    rarity: dark ? rarity : forLight(rarity),
  };
}

/** The colour a tier wears on a theme. A tier the theme has no colour for wears the muted tone. */
export const rarityColor = (theme: CardTheme, rarity: string): string => theme.rarity[rarity] ?? theme.muted;

/**
 * A theme as CSS custom properties, for the element a component sits in. Components set these themselves from their
 * `theme` prop; reach for this when you draw your own piece and want it to follow the same colours.
 */
export function themeStyle(theme: CardTheme): Record<string, string> {
  return {
    "--rco-bg": theme.bg,
    "--rco-card": theme.card,
    "--rco-fg": theme.fg,
    "--rco-muted": theme.muted,
    ...Object.fromEntries(theme.levels.map((color, index) => [`--rco-l${index}`, color])),
    "--rco-accent": theme.levels[4],
  };
}
