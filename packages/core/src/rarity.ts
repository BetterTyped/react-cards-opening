/**
 * How loud a tier's show is. Colour is not part of it: two quiet tiers look alike except for their colour, which is
 * what keeps the loud ones special.
 */
export type RarityEffect = "quiet" | "loud" | "legendary";

export interface RarityTier {
  id: string;
  /** The tier as a word, written the way it is shown on a card: "Legendary", not "LEGENDARY". */
  label: string;
  /** How often a card of this tier comes up next to the others. Only the ratio between weights matters. */
  weight: number;
  effect: RarityEffect;
}

/** The four tiers most card games ship with. A legendary comes up about once in twenty-five. */
export const DEFAULT_RARITIES = [
  { id: "common", label: "Common", weight: 55, effect: "quiet" },
  { id: "rare", label: "Rare", weight: 28, effect: "quiet" },
  { id: "epic", label: "Epic", weight: 13, effect: "loud" },
  { id: "legendary", label: "Legendary", weight: 4, effect: "legendary" },
] as const satisfies readonly RarityTier[];

export type DefaultRarity = (typeof DEFAULT_RARITIES)[number]["id"];

/**
 * The tier a card names. A card whose tier is not in the list still opens: quietly, and never from a roll, because a
 * typo in a rarity id should not take the whole reveal down with it.
 */
export function tierOf(rarities: readonly RarityTier[], id: string): RarityTier {
  return rarities.find((tier) => tier.id === id) ?? { id, label: id, weight: 0, effect: "quiet" };
}
