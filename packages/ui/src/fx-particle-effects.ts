import { type Effect, type EffectStage, emit, onEdge, shade, tint } from "./fx-stage";

// Effects made of particles. Each is written for a card 300 pixels wide, in pixels and pixels a second, and the
// stage scales it. Angles are in radians: zero points right, a quarter turn points down, so `UP` is negative.

const TAU = Math.PI * 2;
const UP = -Math.PI / 2;
const DOWN = Math.PI / 2;

/** The layer's edges, seen from the effect's centre, in design pixels: for what falls across the whole stage. */
const edges = (stage: EffectStage) => ({
  left: -stage.x / stage.scale,
  right: (stage.width - stage.x) / stage.scale,
  top: -stage.y / stage.scale,
  bottom: (stage.height - stage.y) / stage.scale,
});

const between = (low: number, high: number, random: () => number) => low + (high - low) * random();

/** A place on the card's outline picked at random, pushed out from it by between `near` and `far` of its size. */
const around =
  (stage: EffectStage, near: number, far: number) => (_index: number, _count: number, random: () => number) =>
    onEdge(random() * TAU, stage.ratio, between(near, far, random));

export const PARTICLE_EFFECTS = [
  {
    name: "sparks",
    kind: "particles",
    label: "Sparks",
    about: "A ring of lit squares thrown hard and slowing fast, the way the card's own burst does.",
    seconds: 1.3,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 56,
        shape: "square",
        colours: [stage.tone, stage.tone, tint(stage.tone, 0.5), tint(stage.tone, 0.85)],
        from: "edge",
        speed: [260, 1150],
        drag: 0.03,
        gravity: 160,
        life: [0.6, 1.25],
        size: [5, 11],
        spin: [-7, 7],
        glow: 0.75,
        fadeOut: 0.55,
      });
    },
  },
  {
    name: "confetti",
    kind: "particles",
    label: "Confetti",
    about: "Paper thrown up from behind the card. It flutters, shows its darker side, and falls.",
    seconds: 3,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 140,
        shape: "flake",
        colours: [stage.tone, stage.accent, tint(stage.tone, 0.55), tint(stage.accent, 0.5), tint(stage.tone, 0.9)],
        from: (_index, _count, random) => [between(-60, 60, random), between(20, 80, random)],
        angle: [UP - 1.15, UP + 1.15],
        speed: [420, 1150],
        gravity: 1050,
        drag: 0.22,
        life: [1.9, 2.9],
        delay: [0, 0.12],
        size: [10, 19],
        spin: [-9, 9],
        flip: [1.4, 3.6],
        sway: [20, 70],
        swayHz: [0.6, 1.6],
        fadeOut: 0.18,
      });
    },
  },
  {
    name: "embers",
    kind: "particles",
    label: "Embers",
    about: "Small hot lights lifting off the card, drifting and flickering out on the way up.",
    seconds: 3.4,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 96,
        shape: "mote",
        colours: [stage.tone, tint(stage.tone, 0.35), tint(stage.tone, 0.75)],
        from: around(stage, 0.9, 1.25),
        angle: [UP - 0.25, UP + 0.25],
        speed: [50, 190],
        gravity: -36,
        life: [1.5, 2.6],
        delay: [0, 1.5],
        size: [4, 8.5],
        grow: 0.4,
        twinkle: [3, 8],
        sway: [18, 55],
        swayHz: [0.5, 1.4],
        fadeIn: 0.15,
        fadeOut: 0.55,
        glow: 1,
      });
    },
  },
  {
    name: "stardust",
    kind: "particles",
    label: "Stardust",
    about: "Four-pointed stars easing outward and twinkling as they slow.",
    seconds: 2.6,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 64,
        shape: ["star", "star", "mote"],
        colours: [tint(stage.tone, 0.6), tint(stage.tone, 0.9), stage.tone],
        from: "edge",
        speed: [40, 420],
        drag: 0.22,
        life: [1.3, 2.5],
        delay: [0, 0.25],
        size: [4, 11],
        spin: [-1.2, 1.2],
        twinkle: [2, 5],
        fadeIn: 0.12,
        fadeOut: 0.5,
        glow: 0.6,
      });
    },
  },
  {
    name: "pixels",
    kind: "particles",
    label: "Pixels",
    about: "Hard square pixels on a grid, blown out and dropped. Nothing is smoothed.",
    seconds: 1.6,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 54,
        shape: "square",
        colours: [stage.tone, tint(stage.tone, 0.4), shade(stage.tone, 0.25), tint(stage.tone, 0.85)],
        from: "edge",
        speed: [200, 760],
        gravity: 880,
        drag: 0.2,
        life: [0.8, 1.45],
        size: [8, 12],
        rotation: 0,
        snap: 6,
        fadeOut: 0.08,
      });
    },
  },
  {
    name: "shards",
    kind: "particles",
    label: "Shards",
    about: "Splinters of glass with one lit facet each, spinning as they fall.",
    seconds: 1.7,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 30,
        shape: "shard",
        colours: [stage.tone, tint(stage.tone, 0.35), tint(stage.tone, 0.7)],
        from: "edge",
        speed: [280, 820],
        gravity: 720,
        drag: 0.28,
        life: [0.9, 1.6],
        size: [9, 21],
        spin: [-11, 11],
        flip: [0.8, 2.6],
        fadeOut: 0.25,
      });
    },
  },
  {
    name: "fountain",
    kind: "particles",
    label: "Fountain",
    about: "A jet of lights from the top of the card that climbs, spreads and rains back down.",
    seconds: 2.6,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 120,
        shape: "mote",
        colours: [stage.tone, tint(stage.tone, 0.5), tint(stage.tone, 0.85)],
        from: (_index, _count, random) => [between(-16, 16, random), -150 * stage.ratio + 6],
        angle: (_index, _count, random) => UP + between(-0.42, 0.42, random),
        speed: [520, 980],
        gravity: 1250,
        drag: 0.6,
        life: [1.1, 1.7],
        delay: [0, 0.95],
        size: [3.2, 6.5],
        fadeOut: 0.3,
        glow: 0.9,
      });
    },
  },
  {
    name: "bubbles",
    kind: "particles",
    label: "Bubbles",
    about: "Thin rings with a glint, wobbling up past the card and popping.",
    seconds: 3.2,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 46,
        shape: "ring",
        colours: [tint(stage.tone, 0.45), tint(stage.tone, 0.75)],
        from: (_index, _count, random) => [between(-250, 250, random), between(110, 300, random)],
        angle: [UP - 0.1, UP + 0.1],
        speed: [80, 220],
        life: [1.5, 2.6],
        delay: [0, 0.9],
        size: [6, 22],
        grow: 1.3,
        sway: [16, 46],
        swayHz: [0.6, 1.5],
        line: 2.2,
        fadeIn: 0.2,
        fadeOut: 0.06,
      });
    },
  },
  {
    name: "snow",
    kind: "particles",
    label: "Snow",
    about: "Soft flakes falling across the whole stage, near ones larger and faster than far ones.",
    seconds: 5,
    play: (stage, tl) => {
      const { left, right, top, bottom } = edges(stage);
      const drop = bottom - top;
      emit(stage, tl, {
        count: 130,
        shape: "dot",
        colours: [tint(stage.tone, 0.82), tint(stage.tone, 0.95)],
        from: (_index, _count, random) => [between(left - 40, right + 40, random), top - 10 - random() * drop * 0.4],
        angle: [DOWN - 0.12, DOWN + 0.12],
        speed: [drop / 4.4, drop / 2.4],
        life: [3.4, 4.8],
        delay: [0, 0.6],
        size: [3, 8],
        alpha: [0.5, 0.95],
        sway: [14, 46],
        swayHz: [0.3, 0.9],
        fadeIn: 0.08,
        fadeOut: 0.22,
        glow: 0.5,
      });
    },
  },
  {
    name: "petals",
    kind: "particles",
    label: "Petals",
    about: "Petals let go from above the card, turning over and swinging side to side as they come down.",
    seconds: 4,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 54,
        shape: "petal",
        colours: [stage.tone, tint(stage.tone, 0.4), tint(stage.tone, 0.7)],
        from: (_index, _count, random) => [between(-300, 300, random), between(-340, -230, random)],
        angle: [DOWN - 0.2, DOWN + 0.2],
        speed: [110, 230],
        life: [2.5, 3.6],
        delay: [0, 1.1],
        size: [10, 17],
        spin: [-2.4, 2.4],
        flip: [0.5, 1.3],
        sway: [50, 110],
        swayHz: [0.4, 0.9],
        fadeIn: 0.1,
        fadeOut: 0.25,
      });
    },
  },
  {
    name: "comets",
    kind: "particles",
    label: "Comets",
    about: "A handful of bright heads with tapering tails, fired outward.",
    seconds: 1.1,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 16,
        shape: "streak",
        colours: [tint(stage.tone, 0.3), stage.tone],
        from: "edge",
        speed: [900, 1500],
        drag: 0.1,
        life: [0.5, 0.95],
        size: [5, 8.5],
        trail: 0.14,
        glow: 0.9,
        fadeOut: 0.5,
      });
    },
  },
  {
    name: "spiral",
    kind: "particles",
    label: "Spiral",
    about: "Three arms of light winding out from behind the card like a small galaxy.",
    seconds: 2.2,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 96,
        shape: "mote",
        colours: [stage.tone, tint(stage.tone, 0.5), tint(stage.tone, 0.75)],
        delay: [0, 0.02],
        life: [1.2, 1.9],
        size: [4, 8],
        grow: 0.5,
        glow: 0.9,
        fadeIn: 0.1,
        fadeOut: 0.5,
        polar: (index) => {
          // Three arms. Along an arm each light starts a little further out and a little further round.
          const along = Math.floor(index / 3);
          return {
            radius: 150 + along * 7,
            angle: (index % 3) * (TAU / 3) + along * 0.13,
            radial: 150,
            turn: 2.8,
            squash: 1,
          };
        },
        drag: 0.45,
      });
    },
  },
  {
    name: "fireflies",
    kind: "particles",
    label: "Fireflies",
    about: "Slow lights wandering around the card, each pulsing at its own pace.",
    seconds: 3.8,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 36,
        shape: "mote",
        colours: [stage.tone, tint(stage.tone, 0.4)],
        from: (_index, _count, random) => [between(-260, 260, random), between(-280, 280, random)],
        speed: [8, 46],
        life: [2.4, 3.6],
        delay: [0, 0.5],
        size: [4, 7.5],
        twinkle: [0.5, 1.3],
        sway: [26, 64],
        swayHz: [0.25, 0.7],
        fadeIn: 0.2,
        fadeOut: 0.35,
        glow: 1,
      });
    },
  },
  {
    name: "rain",
    kind: "particles",
    label: "Rain of light",
    about: "Fast thin streaks falling past the card at a slant.",
    seconds: 2.2,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 70,
        shape: "streak",
        colours: [tint(stage.tone, 0.3), tint(stage.tone, 0.65)],
        from: (_index, _count, random) => [between(-320, 360, random), between(-460, -330, random)],
        angle: () => DOWN + 0.14,
        speed: [1050, 1650],
        life: [0.5, 0.8],
        delay: [0, 1.3],
        size: [2, 3.6],
        trail: 0.085,
        alpha: [0.5, 1],
        fadeIn: 0.1,
        fadeOut: 0.3,
        glow: 0.5,
      });
    },
  },
  {
    name: "orbit",
    kind: "particles",
    label: "Orbit",
    about: "Lights circling the card on a tilted ring, tightening as they fade.",
    seconds: 2.6,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 36,
        shape: "mote",
        colours: [stage.tone, tint(stage.tone, 0.55), tint(stage.tone, 0.75)],
        delay: [0, 0.06],
        life: [2, 2.5],
        size: [5, 9.5],
        glow: 1,
        fadeIn: 0.12,
        fadeOut: 0.3,
        polar: (index, count) => ({
          radius: 250 + (index % 3) * 18,
          angle: (index / count) * TAU,
          radial: -22,
          turn: 3.4,
          squash: 0.62,
        }),
      });
    },
  },
  {
    name: "implosion",
    kind: "particles",
    label: "Implosion",
    about: "Streaks drawn in from all around to the card's middle. A charge, best before something louder.",
    seconds: 0.95,
    play: (stage, tl) => {
      const life = 0.62;
      emit(stage, tl, {
        count: 56,
        shape: "streak",
        colours: [stage.tone, tint(stage.tone, 0.5)],
        from: (index, count) => {
          const angle = (index / count) * TAU;
          const far = 300 + (index % 5) * 34;
          return [Math.cos(angle) * far, Math.sin(angle) * far];
        },
        // Each one flies back down the line it was placed on, and gets to the middle as its life runs out.
        angle: (index, count) => (index / count) * TAU + Math.PI,
        speed: [470, 560],
        drag: 1.9,
        life,
        delay: [0, 0.26],
        size: [3, 5.5],
        grow: 0.3,
        trail: 0.1,
        glow: 0.7,
        fadeIn: 0.3,
        fadeOut: 0.12,
      });
    },
  },
  {
    name: "smoke",
    kind: "particles",
    label: "Smoke",
    about: "Soft puffs in the tier's colour swelling and thinning out behind the card.",
    seconds: 2.4,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 22,
        shape: "puff",
        colours: [stage.tone, shade(stage.tone, 0.3), tint(stage.tone, 0.3)],
        from: around(stage, 0.75, 1.1),
        speed: [50, 210],
        drag: 0.3,
        gravity: -46,
        life: [1.4, 2.3],
        delay: [0, 0.2],
        size: [90, 170],
        grow: 2.1,
        alpha: [0.4, 0.7],
        fadeIn: 0.14,
        fadeOut: 0.6,
      });
    },
  },
  {
    name: "coins",
    kind: "particles",
    label: "Coins",
    about: "Coins tossed up from the card, flashing as they turn and dropping under their own weight.",
    seconds: 2.2,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 36,
        shape: "coin",
        colours: [stage.tone, tint(stage.tone, 0.3), shade(stage.tone, 0.15)],
        from: (_index, _count, random) => [between(-40, 40, random), between(0, 60, random)],
        angle: (_index, _count, random) => UP + between(-0.85, 0.85, random),
        speed: [560, 1060],
        gravity: 1650,
        drag: 0.5,
        life: [1.4, 2],
        delay: [0, 0.22],
        size: [10, 15.5],
        rotation: [-0.5, 0.5],
        spin: [-1.5, 1.5],
        flip: [1.6, 3.4],
        fadeOut: 0.14,
      });
    },
  },
  {
    name: "fireworks",
    kind: "particles",
    label: "Fireworks",
    about: "Three shells going off around the card one after another, each a round burst that hangs and falls.",
    seconds: 2.6,
    play: (stage, tl) => {
      const shells = [
        { at: 0, x: -190, y: -150, colour: stage.tone },
        { at: 0.38, x: 210, y: -210, colour: stage.accent },
        { at: 0.8, x: 10, y: -300, colour: tint(stage.tone, 0.45) },
      ];
      for (const shell of shells) {
        emit(stage, tl, {
          at: shell.at,
          count: 64,
          shape: "mote",
          colours: [shell.colour, tint(shell.colour, 0.5)],
          from: () => [shell.x, shell.y],
          speed: [150, 640],
          drag: 0.07,
          gravity: 150,
          life: [1, 1.6],
          size: [3.6, 7],
          grow: 0.5,
          twinkle: [0, 7],
          fadeOut: 0.5,
          glow: 1,
        });
        emit(stage, tl, {
          at: shell.at,
          count: 1,
          shape: "puff",
          colours: [shell.colour],
          from: () => [shell.x, shell.y],
          life: 0.5,
          size: 90,
          grow: 3,
          alpha: 0.8,
          fadeOut: 0.8,
        });
      }
    },
  },
  {
    name: "glitter",
    kind: "particles",
    label: "Glitter",
    about: "Stars that light and go out where they stand, all around the card.",
    seconds: 2.4,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 64,
        shape: "star",
        colours: [tint(stage.tone, 0.75), tint(stage.tone, 0.95), tint(stage.tone, 0.4)],
        from: around(stage, 0.96, 1.6),
        life: [0.4, 0.85],
        delay: [0, 1.5],
        size: [8, 21],
        grow: 0.5,
        spin: [-2.4, 2.4],
        fadeIn: 0.4,
        fadeOut: 0.6,
        glow: 0.7,
      });
    },
  },
  {
    name: "ring-of-pixels",
    kind: "particles",
    label: "Pixel ring",
    about: "A shockwave drawn in pixels: one clean ring of squares that widens and thins.",
    seconds: 1,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 52,
        shape: "square",
        colours: [stage.tone, tint(stage.tone, 0.5)],
        angle: (index, count) => (index / count) * TAU,
        speed: 1500,
        drag: 0.06,
        life: 0.85,
        size: 15,
        grow: 0.5,
        rotation: 0,
        snap: 5,
        fadeOut: 0.3,
      });
      emit(stage, tl, {
        at: 0.12,
        count: 40,
        shape: "square",
        colours: [tint(stage.tone, 0.7)],
        angle: (index, count) => ((index + 0.5) / count) * TAU,
        speed: 1050,
        drag: 0.06,
        life: 0.8,
        size: 11,
        grow: 0.5,
        rotation: 0,
        snap: 5,
        fadeOut: 0.3,
      });
    },
  },
  {
    name: "dust",
    kind: "particles",
    label: "Dust",
    about: "A low cloud kicked out sideways from the card's foot, as if it had landed hard.",
    seconds: 1.5,
    play: (stage, tl) => {
      emit(stage, tl, {
        count: 30,
        shape: "puff",
        colours: [tint(stage.tone, 0.5), tint(stage.tone, 0.75)],
        from: (_index, _count, random) => [between(-120, 120, random), 196],
        angle: (index, _count, random) =>
          (index % 2 === 0 ? 0 : Math.PI) + between(-0.2, 0.2, random) * (index % 2 === 0 ? -1 : 1) - 0.12,
        speed: [160, 620],
        drag: 0.05,
        gravity: -30,
        life: [0.8, 1.4],
        size: [30, 70],
        grow: 2.2,
        alpha: [0.4, 0.75],
        fadeIn: 0.1,
        fadeOut: 0.7,
      });
    },
  },
] as const satisfies readonly Effect[];
