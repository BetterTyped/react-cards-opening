import type { Block, DocPage } from "../../content/types";
import { EFFECT_KINDS, EFFECT_LIST, EFFECT_SETS } from "@react-cards-opening/ui";

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
    { kind: "h2", text: "Playing one" },
    {
      kind: "code",
      language: "tsx",
      code: `import { EffectLayer, type EffectLayerHandle } from "@react-cards-opening/ui";

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
      code: `import { emit, part, playEffects, type Effect } from "@react-cards-opening/ui";

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

const plans: DocPage = {
  path: "/docs/effects/plans/",
  section: "effects",
  title: "Effect plans",
  tagline: "which tier gets which effects",
  nav: "Effect plans",
  description:
    "Give every opener an effects plan: which of the library's effects each rarity tier plays as its card turns over. Six ready-made sets ship, or write your own.",
  lead: "Every opener takes `effects`: a plan that says which effects each tier plays as its card turns over, on top of the card's own show. Six plans ship, each a mood. A plan is a plain object, so writing your own is a few lines.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "effect-sets" },
      caption: "The same pack under each plan. Turn the legendary last.",
    },
    { kind: "h2", text: "Usage" },
    {
      kind: "code",
      language: "tsx",
      code: `import { CardPack, EFFECT_SETS } from "@react-cards-opening/ui";

<CardPack cards={cards} opened={opened} onOpen={open} effects={EFFECT_SETS.storm} />;`,
    },
    {
      kind: "p",
      text: "`CardPack`, `CardSpin`, `CardCase`, `CardHunt` and `CardOpening` all take it. Left out, nothing is added: the reveal plays exactly its own [thirteen effects](/docs/effects/).",
    },
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
      text: "A key is either what a tier does (`quiet`, `loud`, `legendary`, from its `effect` in your [tiers](/docs/rarity-tiers/)) or a tier's own id. An id wins when both are there, so one plan fits a game with three tiers or seven, and one tier can still be singled out.",
    },
    {
      kind: "code",
      language: "tsx",
      code: `import type { EffectPlan } from "@react-cards-opening/ui";

const plan: EffectPlan = {
  quiet: ["sparks"],
  loud: ["shockwave", "sparks", "punch"],
  legendary: ["flash", "nova", "pillar", "embers", "quake"],
  // This one tier, whatever it does:
  mythic: ["negative", "lightning", "heatwave", "fireworks"],
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
        "**As the card turns over**, with the card's own burst: 0.2 seconds into the flip in the reveal, and on the press in a pack.",
        "**Behind the card**, on a layer of its own (`.rco-fx-layer`, the `effects` key of `classNames`), centred on the card and sized to it.",
        "**In the tier's colour.** The theme's accent is the second colour, for effects that use two.",
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
