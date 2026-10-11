import type { Block, DocPage } from "../../content/types";
import { DEFAULT_RARITIES } from "@react-cards-opening/core";
import { EFFECT_KINDS, EFFECT_LIST, EFFECT_SETS, type EffectStep, SIGNATURE_EFFECTS } from "@react-cards-opening/ui";

const UPDATED = "2026-10-11";

const KIND_NOTES: Record<string, string> = {
  particles:
    "Drawn on one canvas a layer, so a hundred of them cost about as much as one. Lights add up where they cross on a dark page and are painted on a light one.",
  light: "Elements the stylesheet draws and a timeline moves: wheels of rays, beams, flashes and glows.",
  wave: "One shape getting bigger: rings, ripples and outlines thrown out from the card, or drawn in to it.",
  screen: "These act on the whole stage: they move it, wash it, or lay something across all of it.",
};

const kindBlocks: Block[] = EFFECT_KINDS.flatMap(({ kind, label }): Block[] => {
  const effects = EFFECT_LIST.filter((effect) => effect.kind === kind);
  return [
    { kind: "h2", text: `${label} (${effects.length})` },
    { kind: "p", text: KIND_NOTES[kind] ?? "" },
    {
      kind: "table",
      head: ["Effect", "Name", "What it looks like", "Seconds"],
      rows: effects.map((effect) => [effect.label, `\`${effect.name}\``, effect.about, String(effect.seconds)]),
    },
  ];
});

const library: DocPage = {
  path: "/docs/effects/library/",
  section: "effects",
  title: "Effects library",
  tagline: `${EFFECT_LIST.length} effects for any opening`,
  nav: "Effects library",
  description: `${EFFECT_LIST.length} effects for card openings in React: particles, rays and flares, shockwaves, and screen effects like shake and glitch, each one name to play.`,
  lead: `Past the reveal's own show there is a library of ${EFFECT_LIST.length} effects: particles, light, waves, and effects that act on the whole stage. Each is one name. Play one on its own, stack several at the same moment, or hand an opener a [plan](/docs/effects/plans/) that says which tier gets what.`,
  blocks: [
    {
      kind: "preview",
      demo: { type: "effects" },
      caption: "Every effect, on a button. Pick a tier to change the colour they play in.",
    },
    { kind: "h2", text: "A package of its own" },
    {
      kind: "p",
      text: "The effects live in `@react-cards-opening/effects`. The ui package brings it along and carries its stylesheet, so with the card components installed there is nothing to add, and everything on this page can be imported from either. For effects without cards, install it alone: nothing in it knows what a card is.",
    },
    { kind: "code", language: "bash", code: "pnpm add @react-cards-opening/effects gsap" },
    { kind: "code", language: "tsx", code: `import "@react-cards-opening/effects/styles.css";` },
    { kind: "h2", text: "Playing one" },
    {
      kind: "code",
      language: "tsx",
      code: `import { EffectLayer, type EffectLayerHandle } from "@react-cards-opening/effects";

const layer = useRef<EffectLayerHandle>(null);

<EffectLayer handle={layer} />;

layer.current?.play("shockwave");
layer.current?.play(["flash", "nova", "embers"], { at: cardElement, tone: "#f5c451" });`,
    },
    {
      kind: "p",
      text: "An effect is drawn for a card 300 pixels wide and scaled to whatever it celebrates, so the same `sparks` fits a badge and a full-screen reveal. It takes its colour from the `tone` you give it. [EffectLayer](/docs/components/effect-layer/) has every option.",
    },
    ...kindBlocks,
    { kind: "h2", text: "Stacking" },
    {
      kind: "p",
      text: 'Effects are made to be played together. A good hit is usually three things at the same moment: something for the whole stage, a wave, and particles. `["flash", "shockwave", "sparks"]` is a rare card. `["negative", "nova", "pillar", "embers", "quake"]` is the one people screenshot. For a wind-up, play `implosion` or `converge` first and the hit after it with `delay`.',
    },
    { kind: "h2", text: "An effect of your own" },
    {
      kind: "p",
      text: "An effect is an object: a name, how long it plays, and a `play` that adds to a GSAP timeline. Two helpers do the drawing. `emit` lets particles go, and `part` puts an element on the stage, already centred and sized. Your effect goes anywhere a name does.",
    },
    {
      kind: "code",
      language: "ts",
      code: `import { emit, part, playEffects, type Effect } from "@react-cards-opening/effects";

const hearts: Effect = {
  name: "hearts",
  kind: "particles",
  label: "Hearts",
  about: "Pink petals that rise instead of falling, over a soft ring.",
  seconds: 2.4,
  play: (stage, timeline) => {
    emit(stage, timeline, {
      count: 30,
      shape: "petal",
      colours: ["#fb7185", "#fda4af"],
      from: "edge",
      angle: [-Math.PI * 0.9, -Math.PI * 0.1],
      speed: [120, 380],
      gravity: -120,
      life: [1.4, 2.2],
      size: [8, 14],
      flip: [0.6, 1.4],
    });
    const ring = part(stage, "shockwave");
    timeline.fromTo(ring, { opacity: 1, scale: 0.2 }, { opacity: 0, scale: 3, duration: 0.9 }, 0);
  },
};

playEffects(layer, [hearts, "flash"]);`,
    },
    {
      kind: "table",
      head: ["Helper", "What it does"],
      rows: [
        ["`emit(stage, timeline, spec)`", "Lets particles go at a moment of the effect."],
        [
          "`part(stage, name)`",
          "Puts an element on the stage with the class `rco-fx-<name>`, centred on the effect. Pass `true` as a third argument for one that fills the stage.",
        ],
        ["`piece(parent, name)`", "An element inside a part: a ring's second line, a flare's ghost."],
        [
          "`drawing(stage, name, { tag, count })`",
          "An SVG outline that stays one line thick however far it is stretched. This is how the hex wave and the lightning are drawn.",
        ],
        ["`corners(sides)`", "The points of a shape with that many sides, for a `drawing`."],
        [
          "`onEdge(angle, ratio)`",
          "Where a line from the middle crosses the card's outline, for placing things on its edge.",
        ],
        ["`tint(colour, amount)`, `shade(colour, amount)`", "A hex colour part of the way to white, or to black."],
      ],
    },
    {
      kind: "code",
      language: "ts",
      code: `import { corners, drawing, type Effect } from "@react-cards-opening/effects";

// A triangle thrown out from the card, drawn with the hex wave's own styles.
const triangle: Effect = {
  name: "triangle",
  kind: "wave",
  label: "Triangle",
  about: "Three sides, thrown out from the card.",
  seconds: 1,
  play: (stage, timeline) => {
    const [line] = drawing(stage, "hex", { tag: "polygon" });
    line.setAttribute("points", corners(3));
    timeline.fromTo(line.parentElement, { opacity: 1, scale: 0.3 }, { opacity: 0, scale: 3, duration: 1 }, 0);
  },
};`,
    },
    {
      kind: "p",
      text: 'Particles come in eleven shapes: `square`, `dot`, `mote`, `star`, `streak`, `shard`, `flake`, `ring`, `petal`, `puff` and `coin`. Speeds are in pixels a second, angles in radians with zero pointing right, and `from: "edge"` starts each one on the card\'s outline, where it is seen from the first frame.',
    },
    { kind: "h2", text: "Restyling one" },
    {
      kind: "p",
      text: "Every part that is not a particle is an element with a class: `.rco-fx-shockwave`, `.rco-fx-rays`, `.rco-fx-pillar`. Each rule weighs one class, like the rest of the [stylesheet](/docs/guides/styling/), so a rule of your own wins without a fight.",
    },
    {
      kind: "code",
      language: "css",
      code: `/* A dashed shockwave. */
.rco-fx-shockwave {
  border-style: dashed;
}`,
    },
  ],
  related: [
    "/docs/effects/plans/",
    "/docs/components/effect-layer/",
    "/docs/effects/",
    "/docs/components/card-pack/",
    "/docs/core/reduced-motion/",
  ],
  updated: UPDATED,
};

const names = (list: readonly string[]) => list.map((name) => `\`${name}\``).join(", ");

/** A tier's steps as people read them: the wind-up, then what plays as the card turns, later ones with their delay. */
function showRow(tier: string, label: string): readonly string[] {
  const steps: readonly EffectStep[] = SIGNATURE_EFFECTS[tier as keyof typeof SIGNATURE_EFFECTS] ?? [];
  const cues = steps.map((step) =>
    typeof step === "object" && "effect" in step
      ? {
          name: String(typeof step.effect === "string" ? step.effect : step.effect.name),
          on: step.on ?? "turn",
          delay: step.delay ?? 0,
        }
      : { name: String(typeof step === "string" ? step : step.name), on: "turn", delay: 0 },
  );
  const list = (moment: string) =>
    cues
      .filter((cue) => cue.on === moment)
      .map((cue) => (cue.delay > 0 ? `\`${cue.name}\` +${cue.delay}s` : `\`${cue.name}\``))
      .join(", ") || "nothing";
  return [label, list("hum"), list("turn")];
}

const plans: DocPage = {
  path: "/docs/effects/plans/",
  section: "effects",
  title: "Effect plans",
  tagline: "which tier gets which effects",
  nav: "Effect plans",
  description:
    "Every rarity tier plays a show of its own as its card turns over, from a common's puff of dust to a mythic's cataclysm. See what is in each and change any of it.",
  lead: "Every opener plays a show for each tier, on top of the card's own reveal: a wind-up while the card waits face down, and the hit as it turns. Out of the box that is `SIGNATURE_EFFECTS`, a different show for each of the six tiers. `effects` swaps it for one of six ready-made sets, a plan of your own, or nothing.",
  blocks: [
    { kind: "preview", demo: { type: "tiers" }, caption: "The six signature shows. Open them left to right." },
    { kind: "h2", text: "The signature shows" },
    {
      kind: "p",
      text: "Each tier is built from different effects, so a card is known by how it arrives and not only by its colour. No two tiers share more than a couple of effects, and the shows get longer as the tiers get rarer.",
    },
    {
      kind: "table",
      head: ["Tier", "While it waits face down", "As it turns over"],
      rows: DEFAULT_RARITIES.map((tier) => showRow(tier.id, tier.label)),
    },
    {
      kind: "p",
      text: "A tier of your own that is not one of the six gets the show of what it does: a `quiet` tier a common's, a `loud` one an epic's, and so on up.",
    },
    { kind: "h2", text: "Usage" },
    {
      kind: "code",
      language: "tsx",
      code: `import { CardPack, EFFECT_SETS } from "@react-cards-opening/ui";

// The signature shows: nothing to pass.
<CardPack cards={cards} opened={opened} onOpen={open} />;

// One of the ready-made sets instead.
<CardPack cards={cards} opened={opened} onOpen={open} effects={EFFECT_SETS.storm} />;

// The card's own reveal and nothing more.
<CardPack cards={cards} opened={opened} onOpen={open} effects={false} />;`,
    },
    {
      kind: "p",
      text: "`CardPack`, `CardSpin`, `CardCase`, `CardHunt` and `CardOpening` all take it. With `false`, the reveal plays exactly its own [thirteen effects](/docs/effects/).",
    },
    { kind: "preview", demo: { type: "effect-sets" }, caption: "The same pack under each ready-made set." },
    { kind: "h2", text: "The six sets" },
    {
      kind: "table",
      head: ["Set", "Quiet tiers", "Loud tiers", "Legendary"],
      rows: Object.entries(EFFECT_SETS).map(([id, set]) => [
        `\`${id}\``,
        names(set.quiet),
        names(set.loud),
        names(set.legendary),
      ]),
    },
    { kind: "h2", text: "A plan of your own" },
    {
      kind: "p",
      text: "A key is either a tier's own id or what a tier does (`quiet`, `loud`, `legendary`, `mythic`, from its `effect` in your [tiers](/docs/rarity-tiers/)). An id wins when both are there, so one plan fits a game with three tiers or seven, and one tier can still be singled out. A plan with no `mythic` key gives a mythic its `legendary` steps.",
    },
    {
      kind: "p",
      text: 'A step is an effect\'s name, which plays as the card turns, or a cue that says when: `on: "hum"` plays while the card waits face down, and `delay` holds it back by that many seconds.',
    },
    {
      kind: "code",
      language: "tsx",
      code: `import { SIGNATURE_EFFECTS, type EffectPlan } from "@react-cards-opening/ui";

const plan: EffectPlan = {
  // Keep the signature shows, and change two tiers.
  ...SIGNATURE_EFFECTS,
  rare: ["shockwave", "sparks", { effect: "glitter", delay: 0.3 }],
  mythic: [
    { effect: "implosion", on: "hum" },
    "negative",
    "nova",
    "quake",
    { effect: "fireworks", delay: 0.2 },
    { effect: "flames", delay: 0.4 },
  ],
};

<CardHunt cards={cards} opened={opened} onOpen={open} levels={levels} effects={plan} />;`,
    },
    {
      kind: "p",
      text: "A plan can name effects of your own next to the library's. See [an effect of your own](/docs/effects/library/).",
    },
    { kind: "h2", text: "When and where it plays" },
    {
      kind: "list",
      items: [
        "**In two moments.** `hum` steps start as the card stops in the middle of the screen, face down. `turn` steps start with the card's own burst, 0.2 seconds into the flip. A card in a pack turns the moment it is pressed, so both play at the press.",
        "**Behind the card**, on a layer of its own (`.rco-fx-layer`, the `effects` key of `classNames`), centred on the card and sized to it.",
        "**In the tier's colour**, with a lighter tint of it as the second colour for effects that use two.",
        "**Never under reduced motion.** The card still turns, and nothing else moves.",
      ],
    },
  ],
  related: [
    "/docs/effects/library/",
    "/docs/components/effect-layer/",
    "/docs/rarity-tiers/",
    "/docs/components/card-pack/",
    "/docs/core/show-plan/",
  ],
  updated: UPDATED,
};

export const EFFECT_LIBRARY: readonly DocPage[] = [library, plans];
