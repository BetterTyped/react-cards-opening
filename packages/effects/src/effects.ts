import { gsap } from "gsap";

import { LIGHT_EFFECTS } from "./light-effects";
import { PARTICLE_EFFECTS } from "./particle-effects";
import { createParticleField, type ParticleField } from "./particles";
import { prefersReducedMotion } from "./reduced-motion";
import { SCREEN_EFFECTS } from "./screen-effects";
import { type Effect, type EffectKind, type EffectStage, tint } from "./stage";
import { WAVE_EFFECTS } from "./wave-effects";

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
