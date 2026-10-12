import { corners, drawing, type Effect, type EffectStage, part, piece } from "./stage";

// Effects made of one shape getting bigger: shockwaves, ripples, rings in every outline. Elements the stylesheet
// draws (`.rco-fx-<name>`), scaled up by a timeline until they are gone.

/** An outline with `sides` corners that widens and fades, twice, one behind the other. */
function outline(name: string, sides: number, turn: number) {
  return (stage: EffectStage, tl: gsap.core.Timeline) => {
    for (const at of [0, 0.16]) {
      const [line] = drawing(stage, name, { tag: "polygon" });
      const svg = line?.ownerSVGElement;
      if (!line || !svg) return;
      line.setAttribute("points", corners(sides));
      tl.fromTo(
        svg,
        { scale: 0.25, rotate: 0 },
        { scale: at === 0 ? 3.4 : 2.6, rotate: turn, duration: 1, ease: "expo.out" },
        at,
      );
      // The shape is thrown out fast and is nearly there in a blink. It stays lit for most of the way.
      tl.fromTo(svg, { opacity: 1 }, { opacity: 0, duration: 1, ease: "power2.in" }, at);
    }
  };
}

export const WAVE_EFFECTS = [
  {
    name: "shockwave",
    kind: "wave",
    label: "Shockwave",
    about: "One thick ring thrown out from the card, thinning as it goes.",
    seconds: 1.1,
    play: (stage, tl) => {
      const ring = part(stage, "shockwave");
      tl.fromTo(
        ring,
        { scale: 0.15, "--rco-fx-line": 0.09 },
        { scale: 3.8, "--rco-fx-line": 0.004, duration: 1.1, ease: "expo.out" },
        0,
      );
      tl.fromTo(ring, { opacity: 1 }, { opacity: 0, duration: 1.1, ease: "power2.in" }, 0);
    },
  },
  {
    name: "ripples",
    kind: "wave",
    label: "Ripples",
    about: "Three thin rings one after another, as on water.",
    seconds: 1.7,
    play: (stage, tl) => {
      const ripples = part(stage, "ripples");
      tl.set(ripples, { opacity: 1 }, 0);
      for (const index of [0, 1, 2]) {
        const ring = piece(ripples, "ripples-ring");
        tl.fromTo(ring, { scale: 0.2 }, { scale: 3.3, duration: 1.25, ease: "power3.out" }, index * 0.2);
        tl.fromTo(ring, { opacity: 0.95 }, { opacity: 0, duration: 1.25, ease: "power2.in" }, index * 0.2);
      }
    },
  },
  {
    name: "pulse",
    kind: "wave",
    label: "Pulse",
    about: "A filled disc with a bright edge that swells out and thins to nothing.",
    seconds: 0.9,
    play: (stage, tl) => {
      const disc = part(stage, "pulse");
      tl.fromTo(disc, { scale: 0.2 }, { scale: 2.9, duration: 0.9, ease: "power3.out" }, 0);
      tl.fromTo(disc, { opacity: 1 }, { opacity: 0, duration: 0.9, ease: "power2.in" }, 0);
    },
  },
  {
    name: "sonar",
    kind: "wave",
    label: "Sonar",
    about: "A sweeping arm inside a fine ring, with two pings going out from the middle.",
    seconds: 2.1,
    play: (stage, tl) => {
      const sonar = part(stage, "sonar");
      const sweep = piece(sonar, "sonar-sweep");
      const pings = [piece(sonar, "sonar-ping"), piece(sonar, "sonar-ping")];
      tl.fromTo(sonar, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" }, 0);
      tl.fromTo(sweep, { rotate: 0 }, { rotate: 540, duration: 1.9, ease: "none" }, 0);
      for (const [index, ping] of pings.entries()) {
        tl.fromTo(
          ping,
          { opacity: 1, scale: 0.05 },
          { opacity: 0, scale: 1, duration: 0.9, ease: "power2.out" },
          0.15 + index * 0.75,
        );
      }
      tl.to(sonar, { opacity: 0, duration: 0.35, ease: "power1.in" }, 1.75);
    },
  },
  {
    name: "hex",
    kind: "wave",
    label: "Hex wave",
    about: "A six-sided outline that opens, turns a notch and fades, with a second one behind it.",
    seconds: 1.2,
    play: outline("hex", 6, 30),
  },
  {
    name: "diamond",
    kind: "wave",
    label: "Diamond wave",
    about: "The same, cut as a diamond: sharper, and it turns a quarter as it goes.",
    seconds: 1.2,
    play: outline("diamond", 4, 90),
  },
  {
    name: "slam",
    kind: "wave",
    label: "Ground slam",
    about: "A ring that spreads flat along the floor under the card, as if it had been dropped there.",
    seconds: 0.9,
    play: (stage, tl) => {
      const floor = part(stage, "slam");
      const hit = part(stage, "slam-hit");
      tl.fromTo(
        floor,
        { scale: 0.2, "--rco-fx-line": 0.07 },
        { scale: 3.2, "--rco-fx-line": 0.006, duration: 0.9, ease: "expo.out" },
        0,
      );
      tl.fromTo(floor, { opacity: 1 }, { opacity: 0, duration: 0.9, ease: "power2.in" }, 0);
      tl.fromTo(hit, { opacity: 0.9, scale: 0.3 }, { opacity: 0, scale: 1.8, duration: 0.5, ease: "power3.out" }, 0);
    },
  },
  {
    name: "converge",
    kind: "wave",
    label: "Converge",
    about: "Rings closing in on the card from outside. A wind-up, the opposite of a shockwave.",
    seconds: 1,
    play: (stage, tl) => {
      const rings = part(stage, "converge");
      tl.set(rings, { opacity: 1 }, 0);
      for (const index of [0, 1, 2]) {
        const ring = piece(rings, "converge-ring");
        tl.fromTo(
          ring,
          { opacity: 0, scale: 3.4 },
          {
            keyframes: [
              { opacity: 0.9, scale: 1.4, duration: 0.42, ease: "power2.in" },
              { opacity: 0, scale: 0.2, duration: 0.28, ease: "power2.in" },
            ],
          },
          index * 0.14,
        );
      }
    },
  },
  {
    name: "heatwave",
    kind: "wave",
    label: "Heatwave",
    about: "A ring with no colour of its own: it bends and brightens whatever it passes over.",
    seconds: 1,
    play: (stage, tl) => {
      const ring = part(stage, "heatwave");
      tl.fromTo(ring, { opacity: 1, scale: 0.2 }, { scale: 4, duration: 1, ease: "expo.out" }, 0);
      tl.to(ring, { opacity: 0, duration: 0.5, ease: "power1.in" }, 0.5);
    },
  },
  {
    name: "echo",
    kind: "wave",
    label: "Card echo",
    about: "The card's own outline, three times over, each one larger and fainter than the last.",
    seconds: 1.4,
    play: (stage, tl) => {
      const echo = part(stage, "echo");
      tl.set(echo, { opacity: 1 }, 0);
      for (const index of [0, 1, 2]) {
        const card = piece(echo, "echo-card");
        tl.fromTo(
          card,
          { opacity: 0.9, scale: 1 },
          { opacity: 0, scale: 1.95, duration: 1.05, ease: "power2.out" },
          index * 0.16,
        );
      }
    },
  },
  {
    name: "nova",
    kind: "wave",
    label: "Nova",
    about: "A disc of white light that bursts, hollows from the middle and leaves as a ring.",
    seconds: 1,
    play: (stage, tl) => {
      const nova = part(stage, "nova");
      piece(nova, "nova-light");
      tl.fromTo(
        nova,
        { opacity: 1, scale: 0.25, "--rco-fx-hole": 0 },
        { scale: 1, "--rco-fx-hole": 50, duration: 1, ease: "expo.out" },
        0,
      );
      tl.to(nova, { opacity: 0, duration: 0.6, ease: "power1.in" }, 0.4);
    },
  },
] as const satisfies readonly Effect[];
