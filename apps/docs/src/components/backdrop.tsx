// oxlint-disable no-param-reassign -- drawing on a canvas is setting its context, one property after another
import { useEffect, useRef } from "react";

/** The six rarities' colours, as light. What drifts through the sky is drawn in these. */
const TONES = ["#b98cff", "#ff7ac0", "#58a8ff", "#ffc65a", "#63dd7a", "#ff5b68"] as const;
const TAU = Math.PI * 2;

type Star = { x: number; y: number; size: number; phase: number; pace: number; depth: number; tone: number };
type Mote = { x: number; y: number; size: number; rise: number; sway: number; phase: number; tone: number };
type Glint = { x: number; y: number; size: number; born: number; life: number; turn: number; tone: number };
type Ghost = {
  x: number;
  y: number;
  width: number;
  rise: number;
  spin: number;
  phase: number;
  lean: number;
  tone: number;
};
type Dust = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; tone: number };
type Comet = { x: number; y: number; vx: number; vy: number; age: number; life: number; tone: number };

const between = (low: number, high: number) => low + Math.random() * (high - low);
const anyTone = () => Math.floor(Math.random() * TONES.length);

/** A soft round light in one colour, drawn once and stamped wherever something glows. */
function glow(tone: string): HTMLCanvasElement {
  const sprite = document.createElement("canvas");
  sprite.width = 64;
  sprite.height = 64;
  const context = sprite.getContext("2d");
  if (!context) return sprite;
  const light = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  light.addColorStop(0, "rgb(255 255 255 / 0.95)");
  light.addColorStop(0.16, tone);
  light.addColorStop(1, "rgb(0 0 0 / 0)");
  context.fillStyle = light;
  context.globalAlpha = 0.9;
  context.fillRect(0, 0, 64, 64);
  return sprite;
}

/** A four-pointed sparkle: the shape a card game draws when something is worth looking at. */
function sparkle(context: CanvasRenderingContext2D, at: { x: number; y: number; size: number; turn: number }) {
  const { x, y, size, turn } = at;
  context.beginPath();
  context.moveTo(x + Math.cos(turn) * size, y + Math.sin(turn) * size);
  for (let point = 1; point <= 4; point += 1) {
    const angle = turn + (point * TAU) / 4;
    context.quadraticCurveTo(x, y, x + Math.cos(angle) * size, y + Math.sin(angle) * size);
  }
  context.fill();
}

/**
 * Runs the sky on one canvas until the returned function is called. Stars that twinkle, lights that rise, sparkles
 * that come and go, now and then a shooting star. A lively sky adds faint cards turning in the distance and a trail
 * of dust behind the pointer.
 */
function paint(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, lively: boolean): () => void {
  const root = document.documentElement;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sprites = TONES.map(glow);
  let width = 0;
  let height = 0;
  let ratio = 1;

  const stars: Star[] = Array.from({ length: lively ? 150 : 80 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: 0.5 + Math.random() ** 3 * 1.7,
    phase: between(0, TAU),
    pace: between(0.5, 2.2),
    depth: between(0.2, 1),
    tone: Math.random() < 0.7 ? -1 : anyTone(),
  }));
  const motes: Mote[] = Array.from({ length: lively ? 30 : 12 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: between(5, 15),
    rise: between(7, 22),
    sway: between(10, 34),
    phase: between(0, TAU),
    tone: anyTone(),
  }));
  const glints: Glint[] = Array.from({ length: lively ? 14 : 6 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: between(5, 13),
    born: between(0, 6),
    life: between(1.6, 3.4),
    turn: between(0, TAU),
    tone: anyTone(),
  }));
  // A phone has room for fewer, and smaller: the sky is behind a headline there, not beside it.
  const narrow = window.innerWidth < 720;
  const ghostCount = lively ? (narrow ? 3 : 8) : 0;
  const ghosts: Ghost[] = Array.from({ length: ghostCount }, (_, index) => ({
    x: (index + between(0.15, 0.85)) / ghostCount,
    y: Math.random(),
    width: narrow ? between(34, 58) : between(46, 104),
    rise: between(5, 13),
    spin: between(0.16, 0.42),
    phase: between(0, TAU),
    lean: between(-0.5, 0.5),
    tone: index % TONES.length,
  }));
  const dust: Dust[] = [];
  let comet: Comet | null = null;
  let nextComet = between(3, 6);

  const pointer = { x: 0.5, y: 0.5, toX: 0.5, toY: 0.5, lastX: 0, lastY: 0, owed: 0 };
  const move = (event: PointerEvent) => {
    pointer.toX = event.clientX / Math.max(1, width);
    pointer.toY = event.clientY / Math.max(1, height);
    if (!lively || still || event.pointerType !== "mouse") return;
    pointer.owed += Math.hypot(event.clientX - pointer.lastX, event.clientY - pointer.lastY);
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
    // A long jump (the pointer came in from outside) is not a stroke to draw.
    if (pointer.owed > 400) pointer.owed = 0;
    while (pointer.owed > 16 && dust.length < 90) {
      pointer.owed -= 16;
      dust.push({
        x: event.clientX + between(-5, 5),
        y: event.clientY + between(-5, 5),
        vx: between(-22, 22),
        vy: between(-34, 6),
        age: 0,
        life: between(0.6, 1.3),
        size: between(2.5, 6.5),
        tone: anyTone(),
      });
    }
  };

  const fit = () => {
    ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    if (still) draw(0, 0);
  };

  const stamp = (tone: number, at: { x: number; y: number; size: number }, alpha: number) => {
    const sprite = sprites[tone];
    if (!sprite || alpha <= 0) return;
    context.globalAlpha = Math.min(1, alpha);
    context.drawImage(sprite, at.x - at.size, at.y - at.size, at.size * 2, at.size * 2);
  };

  function draw(time: number, step: number) {
    const dark = root.classList.contains("dark");
    // On the dark page light adds up. On the light one it is ink, and there is less of it.
    const strength = dark ? 1 : 0.5;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = dark ? "lighter" : "source-over";
    pointer.x += (pointer.toX - pointer.x) * Math.min(1, step * 3);
    pointer.y += (pointer.toY - pointer.y) * Math.min(1, step * 3);
    const driftX = (pointer.x - 0.5) * -26;
    const driftY = (pointer.y - 0.5) * -18;

    for (const ghost of ghosts) {
      ghost.y -= (ghost.rise * step) / Math.max(1, height);
      if (ghost.y < -0.2) {
        ghost.y = 1.2;
        ghost.x = Math.random();
      }
      const tone = TONES[ghost.tone] ?? TONES[0];
      const tall = ghost.width * 1.4;
      // The card turns about its upright: its width is how much of its face is toward us.
      const facing = Math.cos(time * ghost.spin + ghost.phase);
      context.save();
      context.translate(ghost.x * width + driftX * 1.6, ghost.y * height + driftY * 1.6);
      context.rotate(ghost.lean + Math.sin(time * 0.2 + ghost.phase) * 0.22);
      context.scale(Math.max(0.04, Math.abs(facing)), 1);
      context.beginPath();
      context.roundRect(-ghost.width / 2, -tall / 2, ghost.width, tall, ghost.width * 0.1);
      context.globalAlpha = 0.045 * strength;
      context.fillStyle = tone;
      context.fill();
      context.globalAlpha = (0.14 + 0.1 * Math.abs(facing)) * strength;
      context.strokeStyle = tone;
      context.lineWidth = 1.3;
      context.stroke();
      context.beginPath();
      context.roundRect(-ghost.width / 2 + 7, -tall / 2 + 7, ghost.width - 14, tall - 14, ghost.width * 0.06);
      context.globalAlpha = 0.07 * strength;
      context.stroke();
      context.restore();
    }

    for (const star of stars) {
      const x = star.x * width + driftX * star.depth;
      const y = star.y * height + driftY * star.depth;
      const lit = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * star.pace + star.phase));
      if (star.tone >= 0) {
        stamp(star.tone, { x, y, size: star.size * 4.5 }, lit * 0.8 * strength);
      } else {
        context.globalAlpha = lit * 0.75 * strength;
        context.fillStyle = dark ? "#ffffff" : "#6d4bd6";
        context.beginPath();
        context.arc(x, y, star.size * 0.62, 0, TAU);
        context.fill();
      }
    }

    for (const mote of motes) {
      mote.y -= (mote.rise * step) / Math.max(1, height);
      if (mote.y < -0.05) {
        mote.y = 1.05;
        mote.x = Math.random();
      }
      const x = mote.x * width + Math.sin(time * 0.5 + mote.phase) * mote.sway + driftX;
      const breath = 0.55 + 0.45 * Math.sin(time * 1.1 + mote.phase);
      stamp(mote.tone, { x, y: mote.y * height + driftY, size: mote.size }, 0.5 * breath * strength);
    }

    for (const glint of glints) {
      const age = time - glint.born;
      if (age > glint.life) {
        glint.x = Math.random();
        glint.y = Math.random();
        glint.born = time + between(0.2, 3.5);
        glint.life = between(1.6, 3.4);
        glint.tone = anyTone();
        continue;
      }
      if (age < 0) continue;
      const swell = Math.sin((age / glint.life) * Math.PI);
      const x = glint.x * width + driftX * 1.2;
      const y = glint.y * height + driftY * 1.2;
      stamp(glint.tone, { x, y, size: glint.size * 2.4 * swell }, 0.4 * swell * strength);
      context.globalAlpha = 0.9 * swell * strength;
      context.fillStyle = dark ? "#ffffff" : (TONES[glint.tone] ?? TONES[0]);
      sparkle(context, { x, y, size: glint.size * swell, turn: glint.turn + age * 0.5 });
    }

    if (!still) {
      if (!comet && time > nextComet) {
        const speed = between(620, 900);
        const angle = between(0.28, 0.6);
        comet = {
          x: between(-0.1, 0.7) * width,
          y: between(-0.05, 0.3) * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          age: 0,
          life: between(0.7, 1.1),
          tone: anyTone(),
        };
      }
      if (comet) {
        comet.age += step;
        comet.x += comet.vx * step;
        comet.y += comet.vy * step;
        const fade = Math.sin(Math.min(1, comet.age / comet.life) * Math.PI);
        const tail = context.createLinearGradient(
          comet.x,
          comet.y,
          comet.x - comet.vx * 0.22,
          comet.y - comet.vy * 0.22,
        );
        tail.addColorStop(0, dark ? "rgb(255 255 255 / 0.9)" : (TONES[comet.tone] ?? TONES[0]));
        tail.addColorStop(1, "rgb(255 255 255 / 0)");
        context.globalAlpha = fade * strength;
        context.strokeStyle = tail;
        context.lineWidth = 1.6;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(comet.x, comet.y);
        context.lineTo(comet.x - comet.vx * 0.22, comet.y - comet.vy * 0.22);
        context.stroke();
        stamp(comet.tone, { x: comet.x, y: comet.y, size: 14 }, fade * strength);
        if (comet.age > comet.life) {
          comet = null;
          nextComet = time + (lively ? between(5, 10) : between(12, 20));
        }
      }
    }

    for (let index = dust.length - 1; index >= 0; index -= 1) {
      const bit = dust[index];
      if (!bit) continue;
      bit.age += step;
      if (bit.age > bit.life) {
        dust.splice(index, 1);
        continue;
      }
      bit.vy += 46 * step;
      bit.x += bit.vx * step;
      bit.y += bit.vy * step;
      const left = 1 - bit.age / bit.life;
      stamp(bit.tone, { x: bit.x, y: bit.y, size: bit.size * 2.2 * left }, 0.55 * left * strength);
      context.globalAlpha = left * strength;
      context.fillStyle = dark ? "#ffffff" : (TONES[bit.tone] ?? TONES[0]);
      sparkle(context, { x: bit.x, y: bit.y, size: bit.size * left, turn: bit.age * 3 });
    }
    context.globalAlpha = 1;
  }

  let frame = 0;
  let last = 0;
  let held = false;
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    // Thirty pictures a second, on a screen that could show a hundred and twenty. The sky drifts: nobody can tell,
    // and everything over it that looks through to it (the bar's glass, a reveal's effects) is redrawn a quarter
    // as often.
    if (last && now / 1000 - last < 1 / 31) return;
    const time = now / 1000;
    // While a card is being opened the sky holds still. A reveal dims and blurs the page behind it, and a page
    // that has stopped moving is blurred once, not thirty times a second. The page's own animations are told too.
    const revealing = document.querySelector(".rco-stage[data-open]") !== null;
    if (revealing !== held) {
      held = revealing;
      root.toggleAttribute("data-reveal", revealing);
    }
    if (revealing) {
      last = time;
      return;
    }
    // A tab that was away comes back to the next moment, not to everything it missed.
    const step = Math.min(0.1, last ? time - last : 0);
    last = time;
    draw(time, step);
  };

  fit();
  window.addEventListener("resize", fit);
  window.addEventListener("pointermove", move, { passive: true });
  if (!still) frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    root.removeAttribute("data-reveal");
    window.removeEventListener("resize", fit);
    window.removeEventListener("pointermove", move);
  };
}

/**
 * The night the site is set in. It is fixed to the window, so the page scrolls over it. Four slow lights, and over
 * them a canvas of stars, rising lights and sparkles. `lively` is for pages that show rather than explain: more of
 * everything, cards turning far off, and dust behind the pointer. A page somebody reads gets the quiet one.
 */
export function Backdrop({ lively = false }: { lively?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return undefined;
    return paint(element, context, lively);
  }, [lively]);
  return (
    <div className="d-sky" data-lively={lively ? "" : undefined} aria-hidden>
      <i />
      <i />
      <i />
      <i />
      <canvas ref={canvas} />
    </div>
  );
}
