import type { RarityEffect } from "./rarity";

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
  const legendary = effect === "legendary" && !reduced;
  let minHoldSeconds = legendary ? 2.65 : 1.75;
  if (reduced) minHoldSeconds = 1;
  return {
    jolt: loud,
    hum: reduced ? null : { kind: loud ? "shake" : "hop", seconds: effect === "legendary" ? 0.7 : 0.4 },
    rays: loud,
    legendary,
    flightSeconds: reduced ? 0.01 : 0.75,
    flipSeconds: reduced ? 0.01 : 0.6,
    minHoldSeconds,
  };
}
