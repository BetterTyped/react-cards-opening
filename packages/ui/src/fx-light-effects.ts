import { drawing, type Effect, type EffectStage, part, piece } from "./fx-stage";

// Effects made of light: wheels of rays, beams, flashes, glows. Each is an element or two that the stylesheet
// draws (`.rco-fx-<name>`, sized in `--rco-fx-u`, coloured by `--rco-tone`) and a timeline that moves it.

const TAU = Math.PI * 2;

type Point = readonly [x: number, y: number];

/** A jagged line from `from` outward along `angle`, `length` long. A new one every time it is asked. */
function bolt(
  stage: EffectStage,
  { from, angle, length, steps }: { from: Point; angle: number; length: number; steps: number },
): Point[] {
  const points: Point[] = [from];
  for (let at = 1; at <= steps; at += 1) {
    const reach = (at / steps) * length;
    // Off its line by a little near the start and by more at the end, where a bolt forks about.
    const off = (stage.random() - 0.5) * (5 + at * 3.2);
    points.push([
      from[0] + Math.cos(angle) * reach - Math.sin(angle) * off,
      from[1] + Math.sin(angle) * reach + Math.cos(angle) * off,
    ]);
  }
  return points;
}

const asPoints = (points: readonly Point[]) => points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

export const LIGHT_EFFECTS = [
  {
    name: "rays",
    kind: "light",
    label: "Rays",
    about: "The wheel of rays a loud card opens behind itself, turning slowly.",
    seconds: 2.6,
    play: (stage, tl) => {
      const rays = part(stage, "rays");
      tl.fromTo(
        rays,
        { opacity: 0, scale: 0.5, rotate: 0 },
        { opacity: 0.95, scale: 1, duration: 0.5, ease: "expo.out" },
        0,
      );
      tl.to(rays, { rotate: 70, duration: 2.6, ease: "none" }, 0);
      tl.to(rays, { opacity: 0, duration: 0.6, ease: "power1.in" }, 2);
    },
  },
  {
    name: "beams",
    kind: "light",
    label: "Beams",
    about: "A few broad, soft shafts of light sweeping past each other in two layers.",
    seconds: 3,
    play: (stage, tl) => {
      const beams = part(stage, "beams");
      const back = piece(beams, "beams-back");
      tl.fromTo(
        beams,
        { opacity: 0, scale: 0.7, rotate: 0 },
        { opacity: 0.9, scale: 1, duration: 0.6, ease: "power2.out" },
        0,
      );
      tl.to(beams, { rotate: -46, scale: 1.12, duration: 3, ease: "none" }, 0);
      tl.fromTo(back, { rotate: 0 }, { rotate: 110, duration: 3, ease: "none" }, 0);
      tl.to(beams, { opacity: 0, duration: 0.8, ease: "power1.in" }, 2.2);
    },
  },
  {
    name: "halo",
    kind: "light",
    label: "Halo",
    about: "A soft ring of light around the card that breathes a few times and lets go.",
    seconds: 2.4,
    play: (stage, tl) => {
      const halo = part(stage, "halo");
      tl.fromTo(halo, { opacity: 0, scale: 0.78 }, { opacity: 1, scale: 1, duration: 0.5, ease: "expo.out" }, 0);
      tl.to(halo, { scale: 1.09, duration: 0.45, ease: "sine.inOut", repeat: 3, yoyo: true }, 0.5);
      tl.to(halo, { opacity: 0, scale: 1.2, duration: 0.5, ease: "power1.in" }, 1.9);
    },
  },
  {
    name: "flash",
    kind: "light",
    label: "Flash",
    about: "The whole stage goes white at the card and falls away through the tier's colour.",
    seconds: 0.85,
    play: (stage, tl) => {
      const flash = part(stage, "flash", true);
      tl.fromTo(
        flash,
        { opacity: 0 },
        {
          keyframes: [
            { opacity: 0.95, duration: 0.06 },
            { opacity: 0, duration: 0.78, ease: "power2.out" },
          ],
        },
        0,
      );
    },
  },
  {
    name: "flare",
    kind: "light",
    label: "Lens flare",
    about: "A wide streak through a hot core, with two ghosts sliding out along it, as through a lens.",
    seconds: 1.5,
    play: (stage, tl) => {
      const flare = part(stage, "flare");
      const streak = piece(flare, "flare-streak");
      const cross = piece(flare, "flare-cross");
      const core = piece(flare, "flare-core");
      const near = piece(flare, "flare-ghost");
      const far = piece(flare, "flare-ghost");
      const u = stage.size;
      tl.set(flare, { opacity: 1 }, 0);
      tl.fromTo(core, { scale: 0, opacity: 1 }, { scale: 1, duration: 0.16, ease: "back.out(2)" }, 0);
      tl.to(core, { scale: 0.5, opacity: 0, duration: 1.1, ease: "power2.in" }, 0.2);
      tl.fromTo(streak, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.3, ease: "expo.out" }, 0);
      tl.to(streak, { scaleX: 1.25, scaleY: 0.3, opacity: 0, duration: 1.1, ease: "power2.in" }, 0.3);
      tl.fromTo(cross, { scaleY: 0, opacity: 0.9 }, { scaleY: 1, duration: 0.24, ease: "expo.out" }, 0.04);
      tl.to(cross, { scaleY: 0.4, opacity: 0, duration: 0.8, ease: "power2.in" }, 0.3);
      tl.fromTo(
        near,
        { x: 0, scale: 0.4, opacity: 0 },
        { x: u * 0.85, scale: 1, opacity: 0.55, duration: 0.5, ease: "expo.out" },
        0.05,
      );
      tl.fromTo(
        far,
        { x: 0, scale: 0.3, opacity: 0 },
        { x: -u * 1.4, scale: 1.7, opacity: 0.35, duration: 0.6, ease: "expo.out" },
        0.05,
      );
      tl.to([near, far], { opacity: 0, duration: 0.7, ease: "power1.in" }, 0.6);
    },
  },
  {
    name: "spotlight",
    kind: "light",
    label: "Spotlight",
    about: "A cone of light from the top of the stage that finds the card, sways and settles on it.",
    seconds: 2.6,
    play: (stage, tl) => {
      const cone = part(stage, "spotlight");
      tl.fromTo(cone, { opacity: 0, rotate: -9 }, { opacity: 0.85, rotate: 5, duration: 0.7, ease: "power2.out" }, 0);
      tl.to(cone, { rotate: -3, duration: 0.6, ease: "sine.inOut" }, 0.7);
      tl.to(cone, { rotate: 0, duration: 0.5, ease: "sine.inOut" }, 1.3);
      tl.to(cone, { opacity: 0, duration: 0.6, ease: "power1.in" }, 2);
    },
  },
  {
    name: "aurora",
    kind: "light",
    label: "Aurora",
    about: "Three blurred bands in the tier's colour and the accent, drifting across each other.",
    seconds: 3.2,
    play: (stage, tl) => {
      const aurora = part(stage, "aurora");
      const u = stage.size;
      const bands = [
        { x: -0.5, y: -0.3, to: 0.35, turn: -14 },
        { x: 0.45, y: 0.05, to: -0.4, turn: 12 },
        { x: -0.1, y: 0.4, to: 0.25, turn: -6 },
      ];
      tl.set(aurora, { opacity: 1 }, 0);
      for (const [index, band] of bands.entries()) {
        const blob = piece(aurora, index === 1 ? "aurora-band rco-fx-aurora-other" : "aurora-band");
        tl.fromTo(
          blob,
          { x: band.x * u, y: band.y * u, rotate: band.turn, opacity: 0, scale: 0.7 },
          { x: band.to * u, rotate: -band.turn, scale: 1.1, duration: 3.2, ease: "sine.inOut" },
          0,
        );
        tl.to(blob, { opacity: 0.75, duration: 0.8, ease: "sine.out" }, index * 0.2);
        tl.to(blob, { opacity: 0, duration: 1, ease: "sine.in" }, 2.2);
      }
    },
  },
  {
    name: "sunburst",
    kind: "light",
    label: "Sunburst",
    about: "Needle-thin spikes shot outward once, like light off a blade.",
    seconds: 0.9,
    play: (stage, tl) => {
      const burst = part(stage, "sunburst");
      tl.fromTo(
        burst,
        { opacity: 1, scale: 0.15, rotate: 0 },
        { opacity: 0, scale: 1.25, rotate: 14, duration: 0.9, ease: "expo.out" },
        0,
      );
    },
  },
  {
    name: "bloom",
    kind: "light",
    label: "Bloom",
    about: "One big soft swell of light from the middle that floods and fades.",
    seconds: 1.6,
    play: (stage, tl) => {
      const bloom = part(stage, "bloom");
      tl.fromTo(bloom, { scale: 0.25 }, { scale: 1.25, duration: 1.6, ease: "expo.out" }, 0);
      tl.fromTo(
        bloom,
        { opacity: 0 },
        {
          keyframes: [
            { opacity: 0.9, duration: 0.14 },
            { opacity: 0, duration: 1.46, ease: "power1.out" },
          ],
        },
        0,
      );
    },
  },
  {
    name: "starburst",
    kind: "light",
    label: "Starburst",
    about: "A four-pointed star that snaps open, turns a little and closes: the glint on something precious.",
    seconds: 0.95,
    play: (stage, tl) => {
      const star = part(stage, "starburst");
      piece(star, "starburst-star");
      piece(star, "starburst-star rco-fx-starburst-small");
      tl.set(star, { opacity: 1 }, 0);
      tl.fromTo(star, { scale: 0, rotate: -20 }, { scale: 1, rotate: 0, duration: 0.2, ease: "back.out(1.6)" }, 0);
      tl.to(star, { scale: 0, rotate: 32, duration: 0.7, ease: "power2.in" }, 0.25);
    },
  },
  {
    name: "pillar",
    kind: "light",
    label: "Pillar",
    about: "A column of light through the card from the top of the stage to the bottom, the beam over rare loot.",
    seconds: 2,
    play: (stage, tl) => {
      const pillar = part(stage, "pillar");
      tl.fromTo(pillar, { opacity: 1, scaleX: 0 }, { scaleX: 1, duration: 0.22, ease: "expo.out" }, 0);
      tl.to(
        pillar,
        {
          keyframes: [
            { scaleX: 0.72, duration: 0.18 },
            { scaleX: 1.08, duration: 0.22 },
            { scaleX: 0.84, duration: 0.3 },
            { scaleX: 0.95, duration: 0.5 },
          ],
          ease: "sine.inOut",
        },
        0.22,
      );
      tl.to(pillar, { scaleX: 0, opacity: 0, duration: 0.55, ease: "power2.in" }, 1.45);
    },
  },
  {
    name: "lightning",
    kind: "light",
    label: "Lightning",
    about: "Jagged bolts out of the card that strike, vanish and strike again along new paths.",
    seconds: 0.62,
    play: (stage, tl) => {
      const count = 6;
      // Six bolts, and a fork off each of them.
      const lines = drawing(stage, "lightning", { tag: "polyline", count: count * 2 });
      const svg = lines[0]?.parentElement;
      if (!svg) return;
      const strike = () => {
        const lean = stage.random() * TAU;
        for (let index = 0; index < count; index += 1) {
          const angle = lean + (index / count) * TAU + (stage.random() - 0.5) * 0.5;
          const main = bolt(stage, {
            from: [Math.cos(angle) * 16, Math.sin(angle) * 16],
            angle,
            length: 84,
            steps: 7,
          });
          const knee = main[3 + Math.floor(stage.random() * 2)] ?? main[0] ?? [0, 0];
          const fork = bolt(stage, {
            from: knee,
            angle: angle + (stage.random() > 0.5 ? 0.6 : -0.6),
            length: 34,
            steps: 4,
          });
          lines[index]?.setAttribute("points", asPoints(main));
          lines[count + index]?.setAttribute("points", asPoints(fork));
        }
      };
      strike();
      tl.set(svg, { opacity: 1 }, 0);
      tl.set(svg, { opacity: 0 }, 0.08);
      tl.call(strike, undefined, 0.1);
      tl.set(svg, { opacity: 1 }, 0.12);
      tl.set(svg, { opacity: 0.35 }, 0.2);
      tl.call(strike, undefined, 0.24);
      tl.set(svg, { opacity: 1 }, 0.26);
      tl.to(svg, { opacity: 0, duration: 0.3, ease: "power1.in" }, 0.32);
    },
  },
  {
    name: "rim",
    kind: "light",
    label: "Rim light",
    about: "The card's own outline, lit hot from behind, pulsing twice.",
    seconds: 1.6,
    play: (stage, tl) => {
      const rim = part(stage, "rim");
      tl.fromTo(rim, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1.03, duration: 0.18, ease: "power2.out" }, 0);
      tl.to(rim, { opacity: 0.45, scale: 1, duration: 0.3, ease: "sine.inOut" }, 0.18);
      tl.to(rim, { opacity: 1, scale: 1.05, duration: 0.22, ease: "sine.inOut" }, 0.48);
      tl.to(rim, { opacity: 0, scale: 1.1, duration: 0.9, ease: "power1.out" }, 0.7);
    },
  },
] as const satisfies readonly Effect[];
