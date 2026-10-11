import { gsap } from "gsap";

import { LIGHT_EFFECTS } from "./fx-light-effects";
import { PARTICLE_EFFECTS } from "./fx-particle-effects";
import { createParticleField, type ParticleField } from "./fx-particles";
import { SCREEN_EFFECTS } from "./fx-screen-effects";
import { type Effect, type EffectKind, type EffectStage, tint } from "./fx-stage";
import { WAVE_EFFECTS } from "./fx-wave-effects";
import { prefersReducedMotion, type RarityTier } from "@react-cards-opening/core";

/** Every effect the library ships, particles first, then light, waves and the ones that act on the whole stage. */
export const EFFECT_LIST = [...PARTICLE_EFFECTS, ...LIGHT_EFFECTS, ...WAVE_EFFECTS, ...SCREEN_EFFECTS] as const;

export type EffectName = (typeof EFFECT_LIST)[number]["name"];

/** The same effects, by name. */
export const EFFECTS = Object.fromEntries(EFFECT_LIST.map((effect) => [effect.name, effect])) as Record<
  EffectName,
  Effect<EffectName>
>;

export const EFFECT_KINDS: readonly { kind: EffectKind; label: string }[] = [
  { kind: "particles", label: "Particles" },
  { kind: "light", label: "Light" },
  { kind: "wave", label: "Waves" },
  { kind: "screen", label: "Screen" },
];

/** An effect to play: one of the library's by name, or one of your own. */
export type EffectInput = EffectName | Effect;

export const isEffectName = (name: string): name is EffectName => name in EFFECTS;

export interface PlayOptions {
  /** Where the effect is centred: an element, or a point from the layer's top left corner. The layer's middle if not said. */
  at?: Element | { x: number; y: number } | null;
  /** The width of what is celebrated, in pixels. An element given as `at` answers this itself. 300 otherwise. */
  size?: number;
  /** Height over width of what is celebrated: the outline `rim` and `echo` draw. A card's 4/3 if not said. */
  ratio?: number;
  /** The colour of the effect: a plain hex. The layer's own `--rco-tone` if not said. */
  tone?: string;
  /** A second colour, for the effects that use two. A lighter tint of the tone if not said. */
  accent?: string;
  /** What `shake`, `quake`, `punch` and `glitch` move. The layer's parent if not said. */
  subject?: HTMLElement | null;
  /** Seconds to wait first. */
  delay?: number;
  /** The dice. `Math.random` if not said; hand over a seeded one and an effect plays the same way every time. */
  random?: () => number;
  /**
   * How lights are laid on the page. `add` lets them add up where they cross, which glows on a dark page;
   * `normal` paints them, which is what reads on a light one. Decided once, the first time a layer is played on.
   */
  blend?: "add" | "normal";
}

const fields = new WeakMap<HTMLElement, ParticleField>();

function fieldOf(layer: HTMLElement, blend: "add" | "normal"): ParticleField {
  const known = fields.get(layer);
  if (known) return known;
  const field = createParticleField(layer, blend === "add");
  fields.set(layer, field);
  return field;
}

/** Takes every effect off a layer, mid-play or not, and gives its canvas back. Call it when the layer goes away. */
export function clearEffects(layer: HTMLElement): void {
  fields.get(layer)?.destroy();
  fields.delete(layer);
  for (const play of layer.querySelectorAll(".rco-fx-play")) {
    gsap.killTweensOf(play.querySelectorAll("*"));
    play.remove();
  }
}

/**
 * Plays one effect or several at once on `layer`, an element laid over the place they happen (give it the class
 * `rco-fx-layer`, or use `EffectLayer`, which is one). Answers the timeline, so a show can be paused, sped up or
 * put inside another one. Under reduced motion nothing plays and the timeline is empty.
 */
export function playEffects(
  layer: HTMLElement,
  effects: EffectInput | readonly EffectInput[],
  options: PlayOptions = {},
): gsap.core.Timeline {
  const asked: readonly EffectInput[] =
    typeof effects === "string" || !Array.isArray(effects) ? [effects as EffectInput] : effects;
  const list = asked
    .map((effect): Effect | undefined => (typeof effect === "string" ? EFFECTS[effect] : effect))
    .filter((effect): effect is Effect => effect !== undefined);
  if (list.length === 0 || prefersReducedMotion() || typeof document === "undefined") return gsap.timeline();
  // An effect that starts later is built later. Built now, its parts would be on the stage at once, standing still
  // in the state they start from, for as long as the wait lasts.
  if (options.delay) {
    const wait = gsap.timeline();
    wait.call(() => void playEffects(layer, list, { ...options, delay: 0 }), undefined, options.delay);
    return wait;
  }

  const bounds = layer.getBoundingClientRect();
  const { at } = options;
  let x = bounds.width / 2;
  let y = bounds.height / 2;
  let size = options.size ?? 300;
  if (at instanceof Element) {
    const box = at.getBoundingClientRect();
    x = box.left + box.width / 2 - bounds.left;
    y = box.top + box.height / 2 - bounds.top;
    size = options.size ?? (box.width || 300);
  } else if (at) {
    ({ x, y } = at);
  }
  const tone = options.tone ?? (getComputedStyle(layer).getPropertyValue("--rco-tone").trim() || "#ffffff");
  const accent = options.accent ?? tint(tone, 0.45);
  const subject = options.subject === undefined ? layer.parentElement : options.subject;

  const root = document.createElement("span");
  root.className = "rco-fx-play";
  root.setAttribute("aria-hidden", "true");
  root.style.setProperty("--rco-fx-x", `${x.toFixed(1)}px`);
  root.style.setProperty("--rco-fx-y", `${y.toFixed(1)}px`);
  root.style.setProperty("--rco-fx-u", `${size.toFixed(1)}px`);
  root.style.setProperty("--rco-fx-ratio", String(options.ratio ?? 4 / 3));
  root.style.setProperty("--rco-tone", tone);
  root.style.setProperty("--rco-fx-accent", accent);
  layer.append(root);

  const stage: EffectStage = {
    root,
    field: fieldOf(layer, options.blend ?? "add"),
    x,
    y,
    size,
    scale: size / 300,
    ratio: options.ratio ?? 4 / 3,
    width: bounds.width,
    height: bounds.height,
    tone,
    accent,
    subject,
    random: options.random ?? Math.random,
  };

  const moved = subject !== null && list.some((effect) => effect.kind === "screen");
  const done = () => {
    root.remove();
    // Whatever a shake left the stage holding, it lets go of.
    if (moved && subject) gsap.set(subject, { x: 0, y: 0, rotate: 0, scale: 1, skewX: 0 });
  };
  const timeline = gsap.timeline({ onComplete: done, onInterrupt: done });
  for (const effect of list) {
    const own = gsap.timeline();
    effect.play(stage, own);
    // An effect made only of particles has nothing on its timeline but the moment it lets them go.
    own.to({}, { duration: effect.seconds }, 0);
    timeline.add(own, 0);
  }
  return timeline;
}

/* ---------- which effects a card gets ---------- */

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
