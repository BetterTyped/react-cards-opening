import { type Effect, part, piece } from "./stage";

// Effects that act on the whole stage: they move it, wash it, or lay something across all of it.

export const SCREEN_EFFECTS = [
  {
    name: "shake",
    kind: "screen",
    label: "Shake",
    about: "A short, sharp side-to-side jolt of the stage.",
    seconds: 0.42,
    play: (stage, tl) => {
      if (!stage.subject) return;
      const far = 9 * stage.scale;
      tl.to(
        stage.subject,
        {
          keyframes: [
            { x: -far },
            { x: far * 0.9 },
            { x: -far * 0.65 },
            { x: far * 0.5 },
            { x: -far * 0.25 },
            { x: 0 },
          ],
          duration: 0.42,
          ease: "none",
        },
        0,
      );
    },
  },
  {
    name: "quake",
    kind: "screen",
    label: "Quake",
    about: "A longer rumble that throws the stage about in every direction and dies down.",
    seconds: 0.85,
    play: (stage, tl) => {
      if (!stage.subject) return;
      const steps = 12;
      const keyframes = Array.from({ length: steps }, (_unused, index) => {
        const left = 1 - index / (steps - 1);
        const far = 13 * stage.scale * left;
        return {
          x: (stage.random() - 0.5) * 2 * far,
          y: (stage.random() - 0.5) * 2 * far,
          rotate: (stage.random() - 0.5) * 1.6 * left,
        };
      });
      tl.to(stage.subject, { keyframes, duration: 0.85, ease: "none" }, 0);
    },
  },
  {
    name: "punch",
    kind: "screen",
    label: "Punch",
    about: "The stage jumps a few percent toward the viewer and springs back.",
    seconds: 0.55,
    play: (stage, tl) => {
      if (!stage.subject) return;
      tl.to(stage.subject, { scale: 1.055, duration: 0.08, ease: "power2.out" }, 0);
      tl.to(stage.subject, { scale: 1, duration: 0.47, ease: "elastic.out(1, 0.45)" }, 0.08);
    },
  },
  {
    name: "vignette",
    kind: "screen",
    label: "Vignette",
    about: "The edges of the stage close in with the tier's colour and open again.",
    seconds: 1.5,
    play: (stage, tl) => {
      const edge = part(stage, "vignette", true);
      tl.fromTo(edge, { opacity: 0, scale: 1.2 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, 0);
      tl.to(edge, { opacity: 0, scale: 1.15, duration: 0.95, ease: "power1.in" }, 0.55);
    },
  },
  {
    name: "tint",
    kind: "screen",
    label: "Tint",
    about: "The whole stage takes the tier's colour for a moment, as through tinted glass.",
    seconds: 0.85,
    play: (stage, tl) => {
      const wash = part(stage, "tint", true);
      tl.fromTo(
        wash,
        { opacity: 0 },
        {
          keyframes: [
            { opacity: 0.9, duration: 0.06 },
            { opacity: 0, duration: 0.79, ease: "power1.out" },
          ],
        },
        0,
      );
    },
  },
  {
    name: "scanlines",
    kind: "screen",
    label: "Scanlines",
    about: "Fine lines across the stage and one bright band that runs down through them.",
    seconds: 1.3,
    play: (stage, tl) => {
      const lines = part(stage, "scanlines", true);
      const band = piece(lines, "scanlines-band");
      tl.fromTo(lines, { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0);
      // The band is 16% of the stage tall: from just above it to just below, by its own height, with no layout.
      tl.fromTo(band, { yPercent: -112 }, { yPercent: 638, duration: 1.05, ease: "none" }, 0.05);
      tl.to(lines, { opacity: 0, duration: 0.25 }, 1.05);
    },
  },
  {
    name: "glitch",
    kind: "screen",
    label: "Glitch",
    about: "Torn bars of colour jumping across the stage while it skews, for half a second.",
    seconds: 0.5,
    play: (stage, tl) => {
      const tear = part(stage, "glitch", true);
      const bars = Array.from({ length: 11 }, (_unused, index) =>
        piece(tear, index % 2 === 0 ? "glitch-bar" : "glitch-bar rco-fx-glitch-other"),
      );
      const frames = 8;
      tl.set(tear, { opacity: 1 }, 0);
      for (let frame = 0; frame < frames; frame += 1) {
        const at = frame * 0.055;
        for (const bar of bars) {
          tl.set(
            bar,
            {
              top: `${(stage.random() * 96).toFixed(1)}%`,
              height: `${(0.3 + stage.random() ** 2 * 4.2).toFixed(2)}%`,
              left: `${(stage.random() * 50).toFixed(1)}%`,
              width: `${(22 + stage.random() * 70).toFixed(1)}%`,
              x: (stage.random() - 0.5) * 40 * stage.scale * stage.render,
              opacity: stage.random() > 0.4 ? 0.75 : 0,
            },
            at,
          );
        }
        if (stage.subject) {
          tl.set(
            stage.subject,
            { x: (stage.random() - 0.5) * 14 * stage.scale, skewX: (stage.random() - 0.5) * 3 },
            at,
          );
        }
      }
      tl.set(tear, { opacity: 0 }, frames * 0.055);
      if (stage.subject) tl.set(stage.subject, { x: 0, skewX: 0 }, frames * 0.055);
    },
  },
  {
    name: "chroma",
    kind: "screen",
    label: "Chroma split",
    about: "Two flashes, one in the tier's colour and one in the accent, thrown apart and pulled back into one.",
    seconds: 0.6,
    play: (stage, tl) => {
      const split = part(stage, "chroma", true);
      const left = piece(split, "chroma-half");
      const right = piece(split, "chroma-half rco-fx-chroma-other");
      const far = stage.unit * 0.55;
      tl.set(split, { opacity: 1 }, 0);
      tl.fromTo(left, { x: -far }, { x: 0, duration: 0.6, ease: "expo.out" }, 0);
      tl.fromTo(right, { x: far }, { x: 0, duration: 0.6, ease: "expo.out" }, 0);
      tl.fromTo([left, right], { opacity: 1 }, { opacity: 0, duration: 0.6, ease: "power1.in" }, 0);
    },
  },
  {
    name: "letterbox",
    kind: "screen",
    label: "Letterbox",
    about: "Two black bars slide in at the top and bottom, hold, and leave: the stage becomes a film for a moment.",
    seconds: 2.4,
    play: (stage, tl) => {
      const frame = part(stage, "letterbox", true);
      const top = piece(frame, "letterbox-bar");
      const bottom = piece(frame, "letterbox-bar rco-fx-letterbox-foot");
      tl.set(frame, { opacity: 1 }, 0);
      tl.fromTo(top, { yPercent: -100 }, { yPercent: 0, duration: 0.4, ease: "power3.out" }, 0);
      tl.fromTo(bottom, { yPercent: 100 }, { yPercent: 0, duration: 0.4, ease: "power3.out" }, 0);
      tl.to(top, { yPercent: -100, duration: 0.45, ease: "power2.in" }, 1.95);
      tl.to(bottom, { yPercent: 100, duration: 0.45, ease: "power2.in" }, 1.95);
    },
  },
  {
    name: "flicker",
    kind: "screen",
    label: "Flicker",
    about: "The lights cut out three times, each cut shorter than the last.",
    seconds: 0.42,
    play: (stage, tl) => {
      const dark = part(stage, "flicker", true);
      for (const [index, depth] of [0.6, 0, 0.45, 0, 0.28, 0].entries()) {
        tl.set(dark, { opacity: depth }, index * 0.07);
      }
    },
  },
  {
    name: "speedlines",
    kind: "screen",
    label: "Speed lines",
    about: "Thin lines racing in from the edges toward the card, redrawn every few frames.",
    seconds: 0.8,
    play: (stage, tl) => {
      const lines = part(stage, "speedlines", true);
      const frames = 12;
      tl.set(lines, { opacity: 1 }, 0);
      for (let frame = 0; frame < frames; frame += 1) {
        tl.set(lines, { "--rco-fx-turn": Math.round(stage.random() * 360) }, frame * 0.05);
      }
      tl.to(lines, { opacity: 0, duration: 0.2 }, 0.6);
    },
  },
  {
    name: "negative",
    kind: "screen",
    label: "Impact frame",
    about: "Two frames of the stage in negative, the way a drawn impact is punctuated.",
    seconds: 0.26,
    play: (stage, tl) => {
      const frame = part(stage, "negative", true);
      tl.set(frame, { opacity: 1 }, 0);
      tl.set(frame, { opacity: 0 }, 0.07);
      tl.set(frame, { opacity: 1 }, 0.14);
      tl.set(frame, { opacity: 0 }, 0.2);
    },
  },
  {
    name: "focus",
    kind: "screen",
    label: "Focus pull",
    about: "The stage starts blurred and comes sharp, as a lens finding its subject.",
    seconds: 0.8,
    play: (stage, tl) => {
      const lens = part(stage, "focus", true);
      tl.fromTo(lens, { opacity: 1 }, { opacity: 0, duration: 0.8, ease: "power2.out" }, 0);
    },
  },
] as const satisfies readonly Effect[];
