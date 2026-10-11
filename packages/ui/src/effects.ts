import { gsap } from "gsap";

import type { RarityTier } from "@react-cards-opening/core";
import { type EffectInput, playEffects, type PlayOptions } from "@react-cards-opening/effects";

// Which effects a card gets. The effects themselves are a package of their own (`@react-cards-opening/effects`);
// what is here is what ties them to rarity: a plan per tier, and the moment of the reveal each step belongs to.

/** When in a reveal an effect starts: while the card hums face down, or as it turns over. */
export type EffectMoment = "hum" | "turn";

/** An effect with a place in the show: which moment it belongs to, and how long after that moment it starts. */
export interface EffectCue {
  effect: EffectInput;
  /** `turn` unless told otherwise. */
  on?: EffectMoment;
  /** Seconds after its moment. */
  delay?: number;
}

/** A step of a tier's show: an effect to play as the card turns, or a cue that says when. */
export type EffectStep = EffectInput | EffectCue;

/**
 * The effects each kind of card gets, on top of the card's own show. A key is a tier's id (`legendary`) or what a
 * tier does (`quiet`, `loud`, `legendary`, `mythic`); an id wins when both are there, so one plan fits a game with
 * any tiers.
 */
export type EffectPlan = Partial<Record<string, readonly EffectStep[]>>;

/** The steps a plan gives a card of this tier. None when the plan says nothing about it. */
export function effectsFor(plan: EffectPlan | false | undefined, tier: RarityTier): readonly EffectStep[] {
  if (!plan) return [];
  // A plan written for three levels still has something for a mythic: its loudest.
  return plan[tier.id] ?? plan[tier.effect] ?? (tier.effect === "mythic" ? plan.legendary : undefined) ?? [];
}

const isCue = (step: EffectStep): step is EffectCue => typeof step === "object" && "effect" in step;

/**
 * Plays the steps that belong to one moment, each after its own delay. Answers one timeline for all of them, and
 * nothing when no step belongs to the moment.
 */
export function playSteps(
  layer: HTMLElement,
  steps: readonly EffectStep[],
  { moment, ...options }: PlayOptions & { moment: EffectMoment },
): gsap.core.Timeline | null {
  const byDelay = new Map<number, EffectInput[]>();
  for (const step of steps) {
    const cue: EffectCue = isCue(step) ? step : { effect: step };
    if ((cue.on ?? "turn") !== moment) continue;
    const delay = (cue.delay ?? 0) + (options.delay ?? 0);
    byDelay.set(delay, [...(byDelay.get(delay) ?? []), cue.effect]);
  }
  if (byDelay.size === 0) return null;
  const timeline = gsap.timeline();
  for (const [delay, effects] of byDelay) timeline.add(playEffects(layer, effects, { ...options, delay }), 0);
  return timeline;
}

/**
 * What every opener plays when it is told nothing: a show of its own for each of the six default tiers, each
 * built from different effects so that a tier is known by how it arrives and not only by its colour.
 *
 * - Common is set down: a ring along the floor and dust.
 * - Uncommon is alive: ripples, leaves on an updraft, fireflies.
 * - Rare is ice: rings close in, then a crystal, a hex wave and shards.
 * - Epic is arcane: light is drawn in, then a turning sigil, a spiral and things in orbit.
 * - Legendary is the sun: a flash, a pillar of light, a sunburst, coins and embers.
 * - Mythic is a cataclysm: the lights fail, everything is pulled in, and the card arrives in an impact frame with
 *   a nova, cracks in the air, lightning, a quake, and then it burns.
 *
 * The last four keys are for tiers of your own: a tier that is not one of the six gets the show of what it does.
 */
export const SIGNATURE_EFFECTS = {
  common: ["slam", "dust"],
  uncommon: ["ripples", "leaves", { effect: "fireflies", delay: 0.25 }],
  rare: [
    { effect: "converge", on: "hum" },
    "frost",
    "hex",
    "shards",
    { effect: "rim", delay: 0.1 },
    { effect: "glitter", delay: 0.35 },
  ],
  epic: [
    { effect: "implosion", on: "hum" },
    "sigil",
    "diamond",
    "starburst",
    "punch",
    { effect: "spiral", delay: 0.1 },
    { effect: "orbit", delay: 0.5 },
  ],
  legendary: [
    { effect: "halo", on: "hum" },
    "flash",
    "sunburst",
    "pillar",
    "shake",
    { effect: "starburst", delay: 0.12 },
    { effect: "coins", delay: 0.1 },
    { effect: "beams", delay: 0.25 },
    { effect: "embers", delay: 0.4 },
  ],
  mythic: [
    { effect: "flicker", on: "hum" },
    { effect: "vignette", on: "hum", delay: 0.1 },
    { effect: "converge", on: "hum", delay: 0.15 },
    { effect: "implosion", on: "hum", delay: 0.3 },
    "negative",
    "nova",
    "cracks",
    "lightning",
    "quake",
    "chroma",
    { effect: "comets", delay: 0.05 },
    { effect: "flames", delay: 0.15 },
    { effect: "lightning", delay: 0.5 },
    { effect: "smoke", delay: 0.7 },
  ],
  quiet: ["slam", "dust"],
  loud: [
    { effect: "implosion", on: "hum" },
    "sigil",
    "diamond",
    "starburst",
    "punch",
    { effect: "spiral", delay: 0.1 },
  ],
} as const satisfies EffectPlan;

/** Ready-made plans, each a mood. Hand one to an opener's `effects`, or take one apart and build your own. */
export const EFFECT_SETS = {
  radiant: {
    quiet: ["sparks"],
    loud: ["shockwave", "halo", "sparks"],
    legendary: ["flash", "nova", "pillar", "stardust", "embers", "quake"],
  },
  arcade: {
    quiet: ["pixels"],
    loud: ["ring-of-pixels", "pixels", "punch"],
    legendary: ["negative", "ring-of-pixels", "pixels", "coins", "speedlines", "shake"],
  },
  festive: {
    quiet: ["glitter"],
    loud: ["pulse", "confetti"],
    legendary: ["flash", "starburst", "fireworks", "confetti", "punch"],
  },
  storm: {
    quiet: ["ripples"],
    loud: ["lightning", "shockwave", "shake"],
    legendary: ["flicker", "lightning", "heatwave", "comets", "rain", "quake"],
  },
  frost: {
    quiet: ["glitter"],
    loud: ["hex", "shards", "halo"],
    legendary: ["flash", "hex", "shards", "aurora", "snow", "rim"],
  },
  cinema: {
    quiet: ["rim"],
    loud: ["flare", "echo", "focus"],
    legendary: ["letterbox", "flare", "bloom", "beams", "stardust", "echo"],
  },
} as const satisfies Record<string, EffectPlan>;

export type EffectSetId = keyof typeof EFFECT_SETS;
