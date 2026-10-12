import type { Demo } from "../content/types";
import type { EffectStep } from "@react-cards-opening/ui";

/*
 * What the galleries show. Data only: the site draws it as walls of live tiles, and the Markdown twin of a page
 * writes it out as lists, so both say the same thing.
 */

/** A named stack of effects, played as one small reveal on a card of a tier. */
export interface Combo {
  name: string;
  /** The tier whose card and colour it plays on. */
  tier: string;
  steps: readonly EffectStep[];
}

/** Stacks worth stealing. Between them they use most of the library. */
export const COMBOS: readonly Combo[] = [
  {
    name: "Dragon hoard",
    tier: "legendary",
    steps: [
      { effect: "halo", on: "hum" },
      "flash",
      "sunburst",
      "shake",
      { effect: "coins", delay: 0.08 },
      { effect: "embers", delay: 0.3 },
    ],
  },
  {
    name: "Frozen lake",
    tier: "rare",
    steps: [
      { effect: "converge", on: "hum" },
      "frost",
      "hex",
      "snow",
      { effect: "shards", delay: 0.1 },
      { effect: "rim", delay: 0.15 },
    ],
  },
  {
    name: "Arcane circle",
    tier: "epic",
    steps: [
      { effect: "implosion", on: "hum" },
      "sigil",
      "starburst",
      { effect: "spiral", delay: 0.1 },
      { effect: "orbit", delay: 0.4 },
    ],
  },
  {
    name: "Thunderhead",
    tier: "mythic",
    steps: [
      { effect: "flicker", on: "hum" },
      { effect: "vignette", on: "hum" },
      "lightning",
      "quake",
      "rain",
      "chroma",
      { effect: "lightning", delay: 0.45 },
    ],
  },
  {
    name: "Garden party",
    tier: "uncommon",
    steps: ["ripples", "bloom", "leaves", { effect: "petals", delay: 0.15 }, { effect: "fireflies", delay: 0.3 }],
  },
  {
    name: "Arcade jackpot",
    tier: "legendary",
    steps: ["negative", "ring-of-pixels", "pixels", "speedlines", "punch", { effect: "coins", delay: 0.1 }],
  },
  {
    name: "New year",
    tier: "epic",
    steps: ["flash", "pulse", "fireworks", { effect: "confetti", delay: 0.15 }, { effect: "glitter", delay: 0.3 }],
  },
  {
    name: "Deep sea",
    tier: "rare",
    steps: [{ effect: "tint", on: "hum" }, "sonar", "aurora", "bubbles", { effect: "ripples", delay: 0.2 }],
  },
  {
    name: "Phoenix",
    tier: "mythic",
    steps: [
      { effect: "implosion", on: "hum" },
      "nova",
      "heatwave",
      "quake",
      "flames",
      { effect: "embers", delay: 0.2 },
      { effect: "smoke", delay: 0.6 },
    ],
  },
  {
    name: "Supernova",
    tier: "legendary",
    steps: [
      { effect: "converge", on: "hum" },
      "flash",
      "nova",
      "starburst",
      "shake",
      "stardust",
      { effect: "comets", delay: 0.1 },
    ],
  },
  {
    name: "Glitch drop",
    tier: "epic",
    steps: [
      { effect: "flicker", on: "hum" },
      "glitch",
      "scanlines",
      "chroma",
      "pixels",
      { effect: "echo", delay: 0.1 },
    ],
  },
  {
    name: "Spotlight",
    tier: "common",
    steps: [{ effect: "letterbox", on: "hum" }, "spotlight", "slam", { effect: "dust", delay: 0.05 }],
  },
  {
    name: "Northern lights",
    tier: "uncommon",
    steps: [{ effect: "halo", on: "hum" }, "aurora", "stardust", { effect: "glitter", delay: 0.3 }],
  },
  {
    name: "Shattered",
    tier: "rare",
    steps: ["cracks", "shockwave", "punch", "shards", { effect: "dust", delay: 0.15 }],
  },
  {
    name: "Wishing well",
    tier: "common",
    steps: ["ripples", "bloom", "fountain", { effect: "coins", delay: 0.2 }],
  },
  {
    name: "Comet shower",
    tier: "epic",
    steps: [{ effect: "focus", on: "hum" }, "flare", "speedlines", "comets", { effect: "echo", delay: 0.15 }],
  },
  {
    name: "Holy light",
    tier: "legendary",
    steps: [
      { effect: "halo", on: "hum" },
      "pillar",
      "rays",
      { effect: "beams", delay: 0.1 },
      { effect: "sparks", delay: 0.15 },
    ],
  },
  {
    name: "Fairy ring",
    tier: "uncommon",
    steps: ["pulse", "orbit", "fireflies", { effect: "glitter", delay: 0.2 }],
  },
  {
    name: "Blizzard",
    tier: "rare",
    steps: [{ effect: "vignette", on: "hum" }, "frost", "diamond", "snow", { effect: "rim", delay: 0.1 }],
  },
  {
    name: "Impact",
    tier: "mythic",
    steps: ["negative", "slam", "shockwave", "cracks", "quake", "speedlines", { effect: "dust", delay: 0.1 }],
  },
  {
    name: "Rose garden",
    tier: "epic",
    steps: [{ effect: "halo", on: "hum" }, "bloom", "petals", { effect: "glitter", delay: 0.2 }],
  },
  {
    name: "Smoke and mirrors",
    tier: "common",
    steps: [{ effect: "focus", on: "hum" }, "flare", "echo", "smoke"],
  },
  {
    name: "Sunrise",
    tier: "legendary",
    steps: [{ effect: "tint", on: "hum" }, "sunburst", "rays", "flare", { effect: "embers", delay: 0.2 }],
  },
  {
    name: "Storm of sparks",
    tier: "rare",
    steps: ["lightning", "pulse", "shake", "sparks", { effect: "rim", delay: 0.1 }],
  },
];

/** A component shown live in the components gallery. */
export interface Part {
  path: string;
  name: string;
  line: string;
  /** What plays in its tile. A part with no demo of its own plays a combo instead. */
  demo: Demo | null;
}

/** The five ways to open a card: each gets the full width of the page. */
export const OPENER_PARTS: readonly Part[] = [
  {
    path: "/docs/components/card-pack/",
    name: "CardPack",
    line: "A sealed pack. It bursts, deals face down, and each card turns on a press.",
    demo: { type: "pack" },
  },
  {
    path: "/docs/components/card-wheel/",
    name: "CardWheel",
    line: "A prize wheel that spins under a pointer and lands on your card.",
    demo: { type: "wheel" },
  },
  {
    path: "/docs/components/card-spin/",
    name: "CardSpin",
    line: "A reel that races under a marker and stops on the card that was dealt.",
    demo: { type: "spin" },
  },
  {
    path: "/docs/components/card-case/",
    name: "CardCase",
    line: "A case that opens and gives up its cards one after another.",
    demo: { type: "case" },
  },
  {
    path: "/docs/components/card-hunt/",
    name: "CardHunt",
    line: "A grid, a scan that hunts it, and the list of finds.",
    demo: { type: "hunt" },
  },
];

/** The pieces the openers are built from. */
export const PIECE_PARTS: readonly Part[] = [
  {
    path: "/docs/components/card-opening/",
    name: "CardOpening",
    line: "The reveal over the page. Six tiers, six shows: open each.",
    demo: { type: "tiers" },
  },
  {
    path: "/docs/components/effect-layer/",
    name: "EffectLayer",
    line: "A place to play any effect, on anything.",
    demo: null,
  },
  {
    path: "/docs/components/scan-grid/",
    name: "ScanGrid",
    line: "The grid, and the scan that hunts a cell down.",
    demo: { type: "scan", tier: "epic" },
  },
  {
    path: "/docs/components/card/",
    name: "Card",
    line: "A card standing still, for a collection or a shop.",
    demo: { type: "cards" },
  },
  {
    path: "/docs/components/pixel-glyph/",
    name: "PixelGlyph",
    line: "Pixel art from nine strings of nine.",
    demo: { type: "glyphs" },
  },
  {
    path: "/docs/theming/",
    name: "Themes",
    line: "Ten themes, dark and light, and room for your own.",
    demo: { type: "themes" },
  },
];

/** The effect names a stack uses, each once, in the order they play. */
export function namesIn(steps: readonly EffectStep[]): string[] {
  const names = steps.map((step) => {
    const effect = typeof step === "object" && "effect" in step ? step.effect : step;
    return typeof effect === "string" ? effect : effect.name;
  });
  return [...new Set(names)];
}
