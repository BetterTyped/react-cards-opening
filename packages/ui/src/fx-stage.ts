import type { Particle, ParticleField, ParticleShape, Polar } from "./fx-particles";
import { mixColors } from "./theme";

// What an effect is given to work with, and the two ways it has of drawing: particles on the layer's canvas, and
// parts, which are plain elements styled by the stylesheet and moved by a timeline.

export type EffectKind = "particles" | "light" | "wave" | "screen";

export interface EffectStage {
  /** The element every part of this play is put in. It is taken away when the play is over. */
  root: HTMLElement;
  field: ParticleField;
  /** Where the effect is centred, in pixels from the layer's top left corner. */
  x: number;
  y: number;
  /** The width of what is being celebrated, in pixels. Every effect is drawn for a card 300 wide and scaled to it. */
  size: number;
  /** `size / 300`: what a design pixel is worth here. */
  scale: number;
  /** Height over width of what is celebrated. */
  ratio: number;
  /** The layer's own size. */
  width: number;
  height: number;
  tone: string;
  accent: string;
  /** What a shake or a punch moves. */
  subject: HTMLElement | null;
  random: () => number;
}

export interface Effect<Name extends string = string> {
  name: Name;
  kind: EffectKind;
  label: string;
  /** One line on what it looks like. */
  about: string;
  /** How long it plays. */
  seconds: number;
  /** Adds what the effect does to `timeline`, starting at zero. */
  play: (stage: EffectStage, timeline: gsap.core.Timeline) => void;
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** A colour a share of the way to white. A colour that is not a plain hex is handed back as it came. */
export const tint = (colour: string, amount: number) =>
  HEX.test(colour) ? mixColors(colour, "#ffffff", amount) : colour;

/** A colour a share of the way to black. */
export const shade = (colour: string, amount: number) =>
  HEX.test(colour) ? mixColors(colour, "#000000", amount) : colour;

/* ---------- particles ---------- */

type Range = number | readonly [low: number, high: number];

export interface Spawn {
  /** The moment of the effect they are let go at, in seconds. Its start unless told otherwise. */
  at?: number;
  count: number;
  shape?: ParticleShape | readonly ParticleShape[];
  colours?: readonly string[];
  /**
   * Where each one is born, from the effect's centre, in design pixels. `edge` is the outline of what is
   * celebrated, at the point each one flies out through: an effect plays behind the card, so what starts at the
   * middle spends its best moment hidden. The centre unless told otherwise.
   */
  from?: "edge" | ((index: number, count: number, random: () => number) => readonly [x: number, y: number]);
  /**
   * The way each one flies, in radians, zero pointing right and a quarter turn pointing down. A pair spreads them
   * evenly between two angles, with a little jitter. Everywhere, unless told otherwise.
   */
  angle?: readonly [from: number, to: number] | ((index: number, count: number, random: () => number) => number);
  /** Design pixels a second. */
  speed?: Range;
  life?: Range;
  /** Seconds before it appears. */
  delay?: Range;
  size?: Range;
  grow?: number;
  spin?: Range;
  /** Its turn at birth, or `heading` to point the way it flies. */
  rotation?: Range | "heading";
  gravity?: number;
  drag?: number;
  alpha?: Range;
  fadeIn?: number;
  fadeOut?: number;
  twinkle?: Range;
  sway?: Range;
  swayHz?: Range;
  flip?: Range;
  glow?: number;
  trail?: number;
  line?: number;
  snap?: number;
  /** Circles the centre instead of flying: its radius, how fast that grows, how fast it turns, and the squash. */
  polar?: (index: number, count: number, random: () => number) => Omit<Polar, "cx" | "cy">;
}

const TAU = Math.PI * 2;
const FULL = [0, TAU] as const;

/**
 * The point where a line from the middle at `angle` crosses the outline of what is celebrated, in design pixels.
 * `share` pulls it in (under one) or pushes it out (over one).
 */
export function onEdge(angle: number, ratio: number, share = 1): readonly [x: number, y: number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const reach = Math.min(150 / Math.max(Math.abs(cos), 1e-6), (150 * ratio) / Math.max(Math.abs(sin), 1e-6)) * share;
  return [cos * reach, sin * reach];
}

/** Makes the particles an effect asked for, scaled to the stage and placed on it. */
export function spawn(stage: EffectStage, spec: Spawn): Particle[] {
  const { random, scale } = stage;
  const pick = (range: Range | undefined, fallback: number) => {
    if (range === undefined) return fallback;
    if (typeof range === "number") return range;
    return range[0] + (range[1] - range[0]) * random();
  };
  const shapes = typeof spec.shape === "string" ? [spec.shape] : (spec.shape ?? ["square"]);
  const colours = spec.colours ?? [stage.tone];

  return Array.from({ length: spec.count }, (_unused, index) => {
    const spread = spec.angle ?? FULL;
    const angle =
      typeof spread === "function"
        ? spread(index, spec.count, random)
        : spread[0] + ((index + random() * 0.9) / spec.count) * (spread[1] - spread[0]);
    let fromX = 0;
    let fromY = 0;
    if (spec.from === "edge") [fromX, fromY] = onEdge(angle, stage.ratio, 0.92);
    else if (spec.from) [fromX, fromY] = spec.from(index, spec.count, random);
    const speed = pick(spec.speed, 0) * scale;
    const orbit = spec.polar?.(index, spec.count, random);
    const x = stage.x + fromX * scale;
    const y = stage.y + fromY * scale;
    const rotation = spec.rotation === "heading" ? angle : pick(spec.rotation, random() * TAU);

    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: (spec.gravity ?? 0) * scale,
      drag: spec.drag ?? 1,
      age: -pick(spec.delay, 0),
      life: pick(spec.life, 1),
      size: pick(spec.size, 6) * scale,
      grow: spec.grow ?? 1,
      rotation,
      spin: pick(spec.spin, 0),
      colour: colours[Math.floor(random() * colours.length)] ?? stage.tone,
      shape: shapes[Math.floor(random() * shapes.length)] ?? "square",
      alpha: pick(spec.alpha, 1),
      fadeIn: spec.fadeIn ?? 0.04,
      fadeOut: spec.fadeOut ?? 0.4,
      twinkle: pick(spec.twinkle, 0),
      phase: random() * TAU,
      sway: pick(spec.sway, 0) * scale,
      swayHz: pick(spec.swayHz, 1),
      flip: pick(spec.flip, 0),
      glow: spec.glow ?? 0,
      trail: spec.trail ?? 0.08,
      line: (spec.line ?? 1.5) * Math.max(scale, 0.6),
      snap: (spec.snap ?? 0) * scale,
      polar: orbit ? { ...orbit, cx: x, cy: y, radius: orbit.radius * scale, radial: orbit.radial * scale } : null,
    } satisfies Particle;
  });
}

/** Lets particles go at their moment of the timeline. */
export function emit(stage: EffectStage, timeline: gsap.core.Timeline, spec: Spawn): void {
  timeline.call(() => stage.field.emit(spawn(stage, spec)), undefined, spec.at ?? 0);
}

/* ---------- parts ---------- */

/**
 * An element of the effect, on the stage. A part sits on the effect's centre and is sized by the stylesheet in
 * `--rco-fx-u`, the width of what is celebrated. A cover fills the whole layer instead.
 */
export function part(stage: EffectStage, name: string, cover = false): HTMLElement {
  const element = document.createElement("i");
  element.className = cover ? `rco-fx-cover rco-fx-${name}` : `rco-fx rco-fx-${name}`;
  element.setAttribute("aria-hidden", "true");
  stage.root.append(element);
  return element;
}

/** A part inside another part: a ring's second line, a flare's ghost. */
export function piece(parent: HTMLElement, name: string): HTMLElement {
  const element = document.createElement("i");
  element.className = `rco-fx-${name}`;
  parent.append(element);
  return element;
}

const SVG = "http://www.w3.org/2000/svg";

/** A drawn part: outlines that stay one line thick however far they are stretched. */
export function drawing(
  stage: EffectStage,
  name: string,
  { tag, count = 1 }: { tag: "polygon" | "polyline"; count?: number },
): SVGElement[] {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", `rco-fx rco-fx-${name}`);
  svg.setAttribute("viewBox", "-100 -100 200 200");
  svg.setAttribute("aria-hidden", "true");
  const lines = Array.from({ length: count }, () => {
    const line = document.createElementNS(SVG, tag);
    line.setAttribute("class", `rco-fx-${name}-line`);
    line.setAttribute("vector-effect", "non-scaling-stroke");
    svg.append(line);
    return line;
  });
  stage.root.append(svg);
  return lines;
}

/**
 * A drawn part made of more than outlines: circles, dashes, whatever the markup says. The markup is the effect's
 * own, written in the library, never anything a page passed in.
 */
export function figure(stage: EffectStage, name: string, markup: string): SVGElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", `rco-fx rco-fx-${name}`);
  svg.setAttribute("viewBox", "-100 -100 200 200");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = markup;
  stage.root.append(svg);
  return svg;
}

/** The corners of a shape with this many sides, as SVG points, its first corner straight up. */
export function corners(sides: number, radius = 100): string {
  return Array.from({ length: sides }, (_unused, index) => {
    const angle = (index / sides) * TAU - Math.PI / 2;
    return `${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`;
  }).join(" ");
}
