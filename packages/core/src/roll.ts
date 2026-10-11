import type { OpeningCard } from "./opening";
import { DEFAULT_RARITIES, type RarityTier, tierOf } from "./rarity";
import { createRng } from "./rng";

/**
 * The chance of each card being the next one drawn from a pool, from 0 to 1. A card's share is its tier's weight
 * over the weights of every card in the pool, so two legendaries in a pool each come up half as often as one would.
 */
export function chances<C extends OpeningCard>(
  pool: readonly C[],
  rarities: readonly RarityTier[] = DEFAULT_RARITIES,
): Map<string, number> {
  const weights = pool.map((card) => Math.max(0, tierOf(rarities, card.rarity).weight));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return new Map(pool.map((card, index) => [card.id, total > 0 ? weights[index] / total : 0]));
}

/**
 * Deals `count` different cards from a pool, rarer tiers coming up less often. With a `seed` the same pool deals the
 * same cards every time, on any device. A card whose tier weighs nothing is never dealt.
 */
export function rollCards<C extends OpeningCard>({
  pool,
  count,
  rarities = DEFAULT_RARITIES,
  seed,
}: {
  pool: readonly C[];
  count: number;
  rarities?: readonly RarityTier[];
  /** Leave it out for a roll that differs every time. */
  seed?: string;
}): C[] {
  const random = seed === undefined ? Math.random : createRng(seed).next;
  const left = pool.map((card) => ({ card, weight: Math.max(0, tierOf(rarities, card.rarity).weight) }));
  const dealt: C[] = [];
  while (dealt.length < count) {
    const total = left.reduce((sum, entry) => sum + entry.weight, 0);
    if (total <= 0) break;
    let mark = random() * total;
    let at = left.findIndex((entry) => {
      mark -= entry.weight;
      return mark < 0;
    });
    // Rounding can leave the mark a hair past the last card: that card it is.
    if (at === -1) at = left.findLastIndex((entry) => entry.weight > 0);
    dealt.push(left[at].card);
    left.splice(at, 1);
  }
  return dealt;
}
