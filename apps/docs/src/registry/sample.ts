import { createRng } from "@react-cards-opening/core";
import { GLYPHS, type GlyphCard } from "@react-cards-opening/ui";

/*
 * The made-up card set every preview on the site deals from. No real game and no real brand: ten creatures drawn
 * with the library's own pixel glyphs.
 */

export interface SampleCard extends GlyphCard {
  rarity: "common" | "rare" | "epic" | "legendary";
  line: string;
  art: (typeof GLYPHS)[keyof typeof GLYPHS];
}

export const SAMPLE_CARDS: readonly SampleCard[] = [
  {
    id: "paper-duck",
    name: "Paper Duck",
    rarity: "common",
    line: "Floats. Does not do much else, and is at peace with that.",
    art: GLYPHS.duck,
  },
  {
    id: "moss-hedgehog",
    name: "Moss Hedgehog",
    rarity: "common",
    line: "Rolls into a ball at the first sign of a meeting.",
    art: GLYPHS.hedgehog,
  },
  {
    id: "window-plant",
    name: "Window Plant",
    rarity: "common",
    line: "Grows toward whatever you were about to do next.",
    art: GLYPHS.plant,
  },
  {
    id: "night-owl",
    name: "Night Owl",
    rarity: "rare",
    line: "Sees everything you shipped after midnight.",
    art: GLYPHS.owl,
  },
  {
    id: "tide-octopus",
    name: "Tide Octopus",
    rarity: "rare",
    line: "Eight arms, and one of them is always on the keyboard.",
    art: GLYPHS.octopus,
  },
  {
    id: "lantern-fox",
    name: "Lantern Fox",
    rarity: "rare",
    line: "Knows a shortcut. Will not say where it comes out.",
    art: GLYPHS.fox,
  },
  {
    id: "storm-bolt",
    name: "Storm Bolt",
    rarity: "epic",
    line: "Strikes the same place twice, on purpose.",
    art: GLYPHS.bolt,
  },
  {
    id: "ember-cat",
    name: "Ember Cat",
    rarity: "epic",
    line: "Sleeps on warm machines and wakes up when they fail.",
    art: GLYPHS.cat,
  },
  {
    id: "ash-phoenix",
    name: "Ash Phoenix",
    rarity: "legendary",
    line: "Burns down once a century and starts again from the first line.",
    art: GLYPHS.phoenix,
  },
  {
    id: "vault-dragon",
    name: "Vault Dragon",
    rarity: "legendary",
    line: "Keeps one of every card ever dealt. This one is its own.",
    art: GLYPHS.dragon,
  },
];

const byId = (id: string) => SAMPLE_CARDS.find((card) => card.id === id) as SampleCard;

/** One card of each tier, quietest first: what the "four tiers" shelf turns over. */
export const TIER_CARDS: readonly SampleCard[] = [
  byId("paper-duck"),
  byId("night-owl"),
  byId("storm-bolt"),
  byId("ash-phoenix"),
];

/** A deal of five, the way a hunt would hand them out: mostly quiet, one of each loud tier. */
export const HUNT_DEAL: readonly SampleCard[] = [
  byId("moss-hedgehog"),
  byId("lantern-fox"),
  byId("ember-cat"),
  byId("tide-octopus"),
  byId("vault-dragon"),
];

/** The first card of a tier in the set. */
export const cardOfTier = (tier: string): SampleCard =>
  SAMPLE_CARDS.find((card) => card.rarity === tier) ?? SAMPLE_CARDS[0];

/** A grid of `columns` by seven, lit in a pattern that is the same on the server and in the browser. */
export function sampleLevels(columns: number, seed = "docs-grid"): number[] {
  const rng = createRng(seed);
  return Array.from({ length: columns * 7 }, (_unused, cell) => {
    const row = cell % 7;
    const column = Math.floor(cell / 7);
    // A quiet top and bottom row and a swell two thirds of the way across, so the grid reads as a shape.
    const swell = Math.exp(-(((column / columns - 0.66) * 3.2) ** 2)) * 0.34;
    const roll = rng.next() + swell - (row === 0 || row === 6 ? 0.3 : 0);
    if (roll < 0.34) return 0;
    if (roll < 0.58) return 1;
    if (roll < 0.8) return 2;
    if (roll < 0.97) return 3;
    return 4;
  });
}

/** How a cell reads on a card: its column and row, the way a seat is called. */
export const describeCell = (cell: number) => `row ${(cell % 7) + 1}, column ${Math.floor(cell / 7) + 1}`;
