import { isTopEffect, type RarityEffect } from "./rarity";

/**
 * What a card's reveal is made of, as plain data. A renderer follows it instead of asking "is this one epic?", so a
 * game with three tiers or seven gets the right show for each from its `effect` alone.
 */
export interface ShowPlan {
  /** The place the card was found answers the find: a flash over the panel and a short shake. */
  jolt: boolean;
  /** What the face-down card does before it turns. Nothing when motion is reduced. */
  hum: { kind: "hop" | "shake"; seconds: number } | null;
  /** A wheel of rays opens behind the card as it turns. */
  rays: boolean;
  /** The full show: a flash, shockwaves, a second ray wheel, a turning foil border, a shine and sparkles. */
  legendary: boolean;
  flightSeconds: number;
  flipSeconds: number;
  /** The least a card stays face up, however little there is to read: its own show needs this long to play out. */
  minHoldSeconds: number;
}

export function showFor(effect: RarityEffect, reduced = false): ShowPlan {
  const loud = effect !== "quiet";
  const legendary = isTopEffect(effect) && !reduced;
  let minHoldSeconds = legendary ? 2.65 : 1.75;
  // A mythic's show runs longer than any other, and the card stays up for all of it.
  if (effect === "mythic" && !reduced) minHoldSeconds = 3.4;
  if (reduced) minHoldSeconds = 1;
  let humSeconds = 0.4;
  if (effect === "legendary") humSeconds = 0.7;
  // The longest wait of all: long enough for whatever is being drawn in around the card to arrive.
  if (effect === "mythic") humSeconds = 1.15;
  return {
    jolt: loud,
    hum: reduced ? null : { kind: loud ? "shake" : "hop", seconds: humSeconds },
    rays: loud,
    legendary,
    flightSeconds: reduced ? 0.01 : 0.75,
    flipSeconds: reduced ? 0.01 : 0.6,
    minHoldSeconds,
  };
}
