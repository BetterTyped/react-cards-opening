// oxlint-disable no-param-reassign -- drawing on a canvas is setting its context, one property after another
import { gsap } from "gsap";

// The particles of every effect: one canvas per layer, stepped by GSAP's own ticker so a paused or slowed page
// pauses or slows them too. Nothing here knows what an effect is. An effect hands over particles; the field moves
// them, draws them, and goes quiet when the last one is gone.

const TAU = Math.PI * 2;

export type ParticleShape =
  | "square"
  | "dot"
  | "mote"
  | "star"
  | "streak"
  | "shard"
  | "flake"
  | "ring"
  | "petal"
  | "puff"
  | "coin"
  | "flame";

/** A particle that circles a point instead of flying straight. */
export interface Polar {
  cx: number;
  cy: number;
  radius: number;
  angle: number;
  /** Pixels a second, outward. */
  radial: number;
  /** Radians a second. */
  turn: number;
  /** Height over width of the circle it draws: under one is an orbit seen from the side. */
  squash: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Pixels a second, each second, downward. */
  gravity: number;
  /** The share of its speed a particle still has after one second. 1 never slows. */
  drag: number;
  /** Seconds lived. Below zero it is waiting its turn. */
  age: number;
  life: number;
  size: number;
  /** Its size at the end of its life, as a share of the size it began with. */
  grow: number;
  rotation: number;
  spin: number;
  colour: string;
  shape: ParticleShape;
  alpha: number;
  /** The shares of its life spent fading in and fading out. */
  fadeIn: number;
  fadeOut: number;
  /** Blinks a second. Zero burns steadily. */
  twinkle: number;
  phase: number;
  /** Sideways drift, in pixels a second at its widest, and how many times a second it swings. */
  sway: number;
  swayHz: number;
  /** Turns a second around its own long axis: what makes confetti flutter and a coin flash. */
  flip: number;
  /** How strong the light around it is. Zero is a particle with no light of its own. */
  glow: number;
  /** A streak's tail, in seconds of its own flight. */
  trail: number;
  /** A ring's line, in pixels. */
  line: number;
  /** Snaps its place to a grid this many pixels wide: what makes a burst read as pixels. Zero is free. */
  snap: number;
  polar: Polar | null;
}

/** A field with nowhere to draw: on a server, in a test DOM, or when the browser has no canvas to give. */
export interface ParticleField {
  emit(particles: readonly Particle[]): void;
  clear(): void;
  destroy(): void;
  /** How many particles are alive or waiting. */
  count(): number;
}

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

/** What a particle's light is stamped from. */
type Sprite = ImageBitmap | HTMLCanvasElement;

/** A soft round light in one colour, drawn once and stamped for every particle that glows in it. */
const sprites = new Map<string, Sprite>();

/** Draws the light: a falloff used as a mask, then filled, so any colour CSS can name works, with no parsing. */
function paintGlow(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, colour: string): void {
  const falloff = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  falloff.addColorStop(0, "rgba(0, 0, 0, 1)");
  falloff.addColorStop(0.22, "rgba(0, 0, 0, 0.62)");
  falloff.addColorStop(0.55, "rgba(0, 0, 0, 0.2)");
  falloff.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = falloff;
  ctx.fillRect(0, 0, 64, 64);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, 64, 64);
}

/**
 * The light as a picture that can no longer change. A canvas stamped onto another canvas is copied again for every
 * stamp, in case it was drawn on in between, and a browser that sees a canvas read that often takes it, and the one
 * it is stamped on, off the GPU: a burst then costs seconds. A bitmap is handed over once.
 */
function makeSprite(colour: string): Sprite | null {
  if (typeof OffscreenCanvas !== "undefined") {
    try {
      const offscreen = new OffscreenCanvas(64, 64);
      const ctx = offscreen.getContext("2d");
      if (ctx) {
        paintGlow(ctx, colour);
        return offscreen.transferToImageBitmap();
      }
    } catch {
      // A browser with the class and without a 2D context for it: the canvas below is what it gets.
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  paintGlow(ctx, colour);
  return canvas;
}

function glowSprite(colour: string): Sprite | null {
  const known = sprites.get(colour);
  if (known) return known;
  const sprite = makeSprite(colour);
  if (!sprite) return null;
  if (sprites.size > 48) {
    for (const old of sprites.values()) if ("close" in old) old.close();
    sprites.clear();
  }
  sprites.set(colour, sprite);
  return sprite;
}

function step(p: Particle, dt: number): void {
  p.age += dt;
  if (p.age < 0) return;
  const keep = p.drag ** dt;
  if (p.polar) {
    const orbit = p.polar;
    orbit.angle += orbit.turn * dt;
    orbit.radius = Math.max(0, orbit.radius + orbit.radial * dt);
    orbit.radial *= keep;
    p.x = orbit.cx + Math.cos(orbit.angle) * orbit.radius;
    p.y = orbit.cy + Math.sin(orbit.angle) * orbit.radius * orbit.squash;
  } else {
    p.vy += p.gravity * dt;
    p.vx *= keep;
    p.vy *= keep;
    p.x += (p.vx + (p.sway ? Math.sin(p.age * p.swayHz * TAU + p.phase) * p.sway : 0)) * dt;
    p.y += p.vy * dt;
  }
  p.rotation += p.spin * dt;
}

function draw(ctx: CanvasRenderingContext2D, p: Particle, add: boolean): void {
  if (p.age < 0) return;
  const t = Math.min(1, p.age / p.life);
  let alpha = p.alpha;
  if (t < p.fadeIn) alpha *= t / p.fadeIn;
  else if (t > 1 - p.fadeOut) alpha *= (1 - t) / p.fadeOut;
  if (p.twinkle) alpha *= 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(p.age * p.twinkle * TAU + p.phase));
  if (alpha <= 0.004) return;
  const size = Math.max(0.01, p.size * (1 + (p.grow - 1) * easeOut(t)));
  const x = p.snap ? Math.round(p.x / p.snap) * p.snap : p.x;
  const y = p.snap ? Math.round(p.y / p.snap) * p.snap : p.y;
  const turn = p.flip ? Math.cos(p.age * p.flip * TAU + p.phase) : 1;

  if (p.shape === "flame") {
    // A tongue of fire is light with no hard middle: where many of them cross, they add up to white heat.
    const sprite = glowSprite(p.colour);
    if (!sprite) return;
    const reach = size * 1.7;
    ctx.globalCompositeOperation = add ? "lighter" : "source-over";
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.drawImage(sprite, x - reach, y - reach * 1.25, reach * 2, reach * 2.5);
    return;
  }

  if (p.glow > 0 || p.shape === "mote" || p.shape === "puff") {
    const sprite = glowSprite(p.colour);
    if (sprite) {
      const light = p.shape === "puff" ? 1 : Math.max(p.glow, 0.6);
      const reach = p.shape === "puff" ? size : size * (p.shape === "mote" ? 4.2 : 2.8);
      ctx.globalCompositeOperation = add && p.shape !== "puff" ? "lighter" : "source-over";
      ctx.globalAlpha = Math.min(1, alpha * light);
      ctx.drawImage(sprite, x - reach, y - reach, reach * 2, reach * 2);
    }
    if (p.shape === "puff") return;
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.fillStyle = p.colour;

  if (p.shape === "mote") {
    // The hot middle of a light: white, a third of its size.
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x, y, size * 0.44, 0, TAU);
    ctx.fill();
    return;
  }
  if (p.shape === "dot") {
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, TAU);
    ctx.fill();
    return;
  }
  if (p.shape === "ring") {
    ctx.strokeStyle = p.colour;
    ctx.lineWidth = p.line;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, TAU);
    ctx.stroke();
    // The glint every bubble carries on its shoulder.
    ctx.globalAlpha = Math.min(1, alpha * 0.8);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x - size * 0.38, y - size * 0.38, Math.max(0.6, size * 0.14), 0, TAU);
    ctx.fill();
    return;
  }
  if (p.shape === "streak") {
    const speed = Math.hypot(p.vx, p.vy) || 1;
    const length = Math.max(size * 2, speed * p.trail);
    const ux = p.vx / speed;
    const uy = p.vy / speed;
    const half = size / 2;
    // A tapering tail and a round head: a comet, not a line.
    ctx.beginPath();
    ctx.moveTo(x - uy * half, y + ux * half);
    ctx.lineTo(x + uy * half, y - ux * half);
    ctx.lineTo(x - ux * length, y - uy * length);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x, y, half * 0.9, 0, TAU);
    ctx.fill();
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(p.rotation);
  if (p.shape === "square") {
    if (p.snap) ctx.fillRect(-size / 2, -size / 2, size, size);
    else {
      ctx.beginPath();
      ctx.roundRect(-size / 2, -size / 2, size, size, size * 0.24);
      ctx.fill();
    }
  } else if (p.shape === "star") {
    // Four points, pinched thin at the waist.
    ctx.beginPath();
    for (let point = 0; point < 8; point += 1) {
      const reach = point % 2 === 0 ? size : size * 0.22;
      const angle = (point / 8) * TAU;
      ctx.lineTo(Math.cos(angle) * reach, Math.sin(angle) * reach);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.2, 0, TAU);
    ctx.fill();
  } else if (p.shape === "flake") {
    ctx.scale(1, turn);
    // The back of a flake is in its own shadow.
    if (turn < 0) ctx.globalAlpha = Math.min(1, alpha * 0.62);
    ctx.fillRect(-size / 2, -size * 0.32, size, size * 0.64);
  } else if (p.shape === "petal") {
    ctx.scale(turn, 1);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.42, size * 0.9, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = Math.min(1, alpha * 0.3);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.ellipse(-size * 0.1, -size * 0.2, size * 0.14, size * 0.5, 0, 0, TAU);
    ctx.fill();
  } else if (p.shape === "shard") {
    ctx.scale(1, 0.35 + 0.65 * Math.abs(turn));
    const lean = Math.sin(p.phase) * 0.4;
    ctx.beginPath();
    ctx.moveTo(size * lean, -size);
    ctx.lineTo(size * 0.62, size * 0.55);
    ctx.lineTo(-size * 0.5, size * 0.38);
    ctx.closePath();
    ctx.fill();
    // One lit facet.
    ctx.globalAlpha = Math.min(1, alpha * 0.4);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(size * lean, -size);
    ctx.lineTo(size * 0.62, size * 0.55);
    ctx.lineTo(size * 0.06, size * 0.1);
    ctx.closePath();
    ctx.fill();
  } else if (p.shape === "coin") {
    const wide = Math.max(0.12, Math.abs(turn));
    ctx.beginPath();
    ctx.ellipse(0, 0, size * wide, size, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = Math.min(1, alpha * (0.2 + 0.45 * wide));
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.ellipse(0, 0, size * wide * 0.62, size * 0.62, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** The longest side a canvas is given, in its own pixels. */
const MAX_SIDE = 8192;

const NOWHERE: ParticleField = { emit: () => {}, clear: () => {}, destroy: () => {}, count: () => 0 };

/**
 * A canvas over `layer` and the particles on it. `add` lets lights add up where they cross, which is what makes a
 * burst glow on a dark page; on a light one it would wash them out, so there they are simply painted.
 */
export function createParticleField(layer: HTMLElement, add = true): ParticleField {
  if (typeof document === "undefined") return NOWHERE;
  const canvas = document.createElement("canvas");
  canvas.className = "rco-fx-canvas";
  canvas.setAttribute("aria-hidden", "true");
  // A test DOM has a canvas element and no way to draw on one. It says so by throwing or by answering null.
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = typeof canvas.getContext === "function" ? canvas.getContext("2d") : null;
  } catch {
    ctx = null;
  }
  if (!ctx) return NOWHERE;
  const pen = ctx;
  layer.prepend(canvas);

  let alive: Particle[] = [];
  let ticking = false;
  let ratio = 1;

  const fit = () => {
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    // Never past what a screen could show. A layer without the stylesheet has no size of its own and takes the
    // canvas's, which this would then double, and double again: a page with a forgotten import would freeze.
    const width = Math.min(MAX_SIDE, Math.round(layer.clientWidth * ratio));
    const height = Math.min(MAX_SIDE, Math.round(layer.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  const wipe = () => {
    pen.setTransform(1, 0, 0, 1, 0, 0);
    pen.clearRect(0, 0, canvas.width, canvas.height);
  };

  const tick = (_time: number, deltaTime: number) => {
    // A tab that slept wakes with one huge frame. Nothing should cross the screen in it.
    const dt = Math.min(deltaTime / 1000, 0.05);
    wipe();
    pen.setTransform(ratio, 0, 0, ratio, 0, 0);
    let kept = 0;
    for (const particle of alive) {
      step(particle, dt);
      if (particle.age < particle.life) {
        draw(pen, particle, add);
        alive[kept] = particle;
        kept += 1;
      }
    }
    alive.length = kept;
    pen.globalAlpha = 1;
    pen.globalCompositeOperation = "source-over";
    if (kept === 0) stop();
  };

  function stop() {
    if (!ticking) return;
    ticking = false;
    gsap.ticker.remove(tick);
    wipe();
  }

  const watcher = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
  watcher?.observe(layer);

  return {
    emit(particles) {
      if (particles.length === 0) return;
      fit();
      alive = [...alive, ...particles];
      if (!ticking) {
        ticking = true;
        gsap.ticker.add(tick);
      }
    },
    clear() {
      alive = [];
      stop();
    },
    destroy() {
      alive = [];
      stop();
      watcher?.disconnect();
      canvas.remove();
    },
    count: () => alive.length,
  };
}
