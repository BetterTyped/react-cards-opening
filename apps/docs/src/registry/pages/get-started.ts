import type { DocPage } from "../../content/types";
import { INSTALL, PACKAGES } from "../../site";

const UPDATED = "2026-10-11";

const introduction: DocPage = {
  path: "/docs/",
  section: "get-started",
  title: "Introduction",
  tagline: "card opening for React",
  nav: "Introduction",
  description:
    "What react-cards-opening is: a headless core that holds the rules of opening cards, and a ui package that draws the reveal, from a hop to a legendary foil.",
  lead: "react-cards-opening is the moment a card is opened, as a library. A card lifts out of wherever it was, flies to the middle of the screen face down, hums, turns over, stays as long as it takes to read, and lands where it belongs. How loud that is depends on how rare the card is.",
  blocks: [
    { kind: "preview", demo: { type: "tiers" }, caption: "Four cards, one a tier. Press them left to right." },
    { kind: "h2", text: "Two packages" },
    {
      kind: "table",
      head: ["Package", "What it holds"],
      rows: PACKAGES.map((entry) => [`\`${entry.name}\``, entry.holds]),
    },
    {
      kind: "p",
      text: "Most apps install both and render one component. The split is there for the other cases: a game with its own art direction keeps `core` and draws the reveal itself, and a server deals cards with the same [seeded roll](/docs/core/rolls/) the browser shows.",
    },
    { kind: "h2", text: "What you get" },
    {
      kind: "list",
      items: [
        "**The reveal.** [CardOpening](/docs/components/card-opening/) plays it over the page: flight, hum, flip, burst, and for loud tiers rays, a flash, shockwaves, a foil border, a shine and sparkles.",
        "**The hunt.** [CardHunt](/docs/components/card-hunt/) hides cards in a grid and scans for them. It is the scan from Hype Stack's Wrapped, cut loose from the calendar it was born on.",
        "**The rules.** [useCardOpening](/docs/core/use-card-opening/) decides what a press means at each moment, when a card counts as opened, and what stopping does.",
        "**Tiers that are yours.** Four tiers ship. [Three or seven of your own](/docs/guides/custom-tiers/) get the right show from one word each.",
        "**One stylesheet.** No CSS framework and no reset needed. Ten [themes](/docs/theming/) in dark and light, or one from a single colour.",
        "**Yours to restyle.** A `classNames` prop for every part, and rules light enough that a Tailwind utility or a class of your own wins. See [Styling by hand](/docs/guides/styling/).",
      ],
    },
    { kind: "h2", text: "What it is not" },
    {
      kind: "p",
      text: "It is not a card game engine and it does not know what your cards do. It opens them. It also has no case-opening reel, no sound and no assets to download: every picture in these docs is drawn from nine strings of nine characters.",
    },
    { kind: "h2", text: "Where it comes from" },
    {
      kind: "p",
      text: "The reveal was built for the year-in-review inside [Hype Stack](https://www.hype-stack.dev/wrapped?utm_source=react-cards-opening&utm_medium=referral&utm_campaign=docs-page), where it turns achievements into cards. This library is that code with the product taken out. It is free and MIT licensed, and it stays that way.",
    },
  ],
  related: ["/docs/installation/", "/docs/first-opening/", "/docs/components/card-opening/", "/docs/effects/"],
  updated: UPDATED,
};

const installation: DocPage = {
  path: "/docs/installation/",
  section: "get-started",
  title: "Installation",
  tagline: "two packages and GSAP",
  nav: "Installation",
  description:
    "Install react-cards-opening with pnpm, npm, yarn or bun, import its one stylesheet, and check what it needs: React 18 or 19 and GSAP 3.13 or newer.",
  lead: "Installing react-cards-opening is two packages, one peer dependency and one stylesheet. The packages are always released together under one version number, so the pair you install is a pair that was tested together.",
  blocks: [
    { kind: "h2", text: "Install" },
    { kind: "code", language: "bash", code: INSTALL },
    {
      kind: "p",
      text: "With npm that is `npm install @react-cards-opening/ui @react-cards-opening/core gsap`, and the same names work with yarn and bun. GSAP is a peer dependency: there is one copy of it on the page, yours.",
    },
    { kind: "h2", text: "Import the stylesheet" },
    {
      kind: "code",
      language: "tsx",
      file: "main.tsx",
      code: `import "@react-cards-opening/ui/styles.css";`,
    },
    {
      kind: "p",
      text: "Once, anywhere above the components. Every class in it starts with `rco-`, and it only styles elements the library renders, so it cannot change your page. It needs no Tailwind, no reset and no build plugin.",
    },
    { kind: "h2", text: "Requirements" },
    {
      kind: "table",
      head: ["Needs", "Version", "Why"],
      rows: [
        ["React", "18 or 19", "Hooks and `useSyncExternalStore`."],
        ["GSAP", "3.13 or newer", "The reveal is a GSAP timeline. Only the core, no plugins."],
        ["A browser from 2023 on", "", "`color-mix()`, the `translate` property and container query units."],
      ],
    },
    {
      kind: "note",
      text: "GSAP is free for every use, commercial included, but its licence is its own and not MIT. This library's code is MIT.",
    },
    { kind: "h2", text: "Only the rules" },
    {
      kind: "p",
      text: "If you draw the reveal yourself, `core` on its own is enough. It depends on React and nothing else: no GSAP, no stylesheet.",
    },
    { kind: "code", language: "bash", code: "pnpm add @react-cards-opening/core" },
    { kind: "h2", text: "With a server renderer" },
    {
      kind: "p",
      text: "Both packages render on a server without touching `window`, and the overlay mounts after hydration. In an app with server components, the hooks and the components that open cards go in a client component. [Server rendering](/docs/guides/server-rendering/) has the details.",
    },
  ],
  related: ["/docs/first-opening/", "/docs/theming/", "/docs/guides/server-rendering/", "/docs/"],
  updated: UPDATED,
};

const firstOpening: DocPage = {
  path: "/docs/first-opening/",
  section: "get-started",
  title: "Your first opening",
  tagline: "one card, start to end",
  nav: "Your first opening",
  description:
    "Open your first card in about twenty lines: describe the cards, keep track of which are opened, and render CardOpening with a button to leave from.",
  lead: "A card opening needs three things from you: the cards, which of them are already opened, and somewhere on the page for a card to leave from. This page builds the smallest one that works, then swaps it for the whole hunt in one line.",
  blocks: [
    { kind: "preview", demo: { type: "open", tier: "epic" }, caption: "What this page builds. Press the card." },
    { kind: "h2", text: "Describe the cards" },
    {
      kind: "p",
      text: "A card is an `id` and a `rarity`. The ready-made face also reads a `name`, a `line` of text and `art`, a pixel glyph from the set that ships or one you type out.",
    },
    {
      kind: "code",
      language: "tsx",
      file: "cards.ts",
      code: `import { GLYPHS, type GlyphCard } from "@react-cards-opening/ui";

export const cards: GlyphCard[] = [
  {
    id: "storm-bolt",
    rarity: "epic",
    name: "Storm Bolt",
    line: "Strikes the same place twice, on purpose.",
    art: GLYPHS.bolt,
  },
];`,
    },
    { kind: "h2", text: "Open one" },
    {
      kind: "code",
      language: "tsx",
      file: "open-a-card.tsx",
      code: `import { useCardOpening, useOpenedCards } from "@react-cards-opening/core";
import { CardOpening } from "@react-cards-opening/ui";
import { useRef } from "react";
import "@react-cards-opening/ui/styles.css";

import { cards } from "./cards";

export function OpenACard() {
  const button = useRef<HTMLButtonElement>(null);
  // Which cards are opened, remembered on this device under this key.
  const { opened, open } = useOpenedCards("my-deal");
  // The rules: the queue, and what every press means.
  const hunt = useCardOpening({ cards, opened, onOpen: open });

  return (
    <>
      <button ref={button} onClick={() => hunt.start()} disabled={hunt.running || hunt.allOpened}>
        {hunt.allOpened ? "All opened" : "Open a card"}
      </button>
      {/* The reveal. The card flies out of the button. */}
      <CardOpening opening={hunt.opening} launch={() => button.current} />
    </>
  );
}`,
    },
    {
      kind: "steps",
      items: [
        "`useOpenedCards` keeps the list of opened ids in local storage. Pass `null` to keep it in memory, or bring your own state.",
        "`useCardOpening` takes the cards and that list. `start()` queues every card still unopened and opens them one after another.",
        "`CardOpening` draws it. `launch` answers where the current card comes out of.",
      ],
    },
    { kind: "h2", text: "Give it somewhere to land" },
    {
      kind: "p",
      text: "A card with nowhere to go fades out where it is. Name an element with `landing` and it shrinks into that instead: a slot in a collection, a counter, a tab.",
    },
    {
      kind: "code",
      language: "tsx",
      code: `<CardOpening
  opening={hunt.opening}
  launch={() => button.current}
  landing={(card) => document.getElementById(\`slot-\${card.id}\`)}
/>`,
    },
    { kind: "h2", text: "Or take the whole hunt" },
    {
      kind: "p",
      text: "If hiding the cards in a grid and scanning for them is what you want, [CardHunt](/docs/components/card-hunt/) is all of the above plus the grid, the scan button and the list of finds, in one component.",
    },
    {
      kind: "code",
      language: "tsx",
      code: `import { CardHunt } from "@react-cards-opening/ui";

<CardHunt cards={cards} opened={opened} onOpen={open} levels={levels} />`,
    },
    { kind: "preview", demo: { type: "hunt" }, caption: "The same idea with five cards and somewhere to hide them." },
  ],
  related: [
    "/docs/components/card-opening/",
    "/docs/core/use-card-opening/",
    "/docs/components/card-hunt/",
    "/docs/theming/",
  ],
  updated: UPDATED,
};

const theming: DocPage = {
  path: "/docs/theming/",
  section: "get-started",
  title: "Theming",
  tagline: "ten themes or your own",
  nav: "Theming",
  description:
    "Theme a card opening with one of ten built-in themes in dark or light, a theme made from a single accent colour, or an object of your own colours.",
  lead: "Every component takes a `theme`: a plain object with a ground, a card surface, two text colours, a five-step ramp and a colour for each rarity. Ten ship, each in dark and light, and one function makes a full theme from a single colour.",
  blocks: [
    { kind: "preview", demo: { type: "themes" }, caption: "Pick a tile. Every preview on this site follows." },
    { kind: "h2", text: "Use a built-in theme" },
    {
      kind: "code",
      language: "tsx",
      code: `import { CardHunt, themeOf } from "@react-cards-opening/ui";

<CardHunt theme={themeOf("grape", "dark")} {...rest} />`,
    },
    {
      kind: "p",
      text: "The ids are `moss`, `ice`, `grape`, `halloween`, `ocean`, `candy`, `sunset`, `synthwave`, `mono` and `paper`. `THEME_LIST` has all ten with their names, for a picker. With no `theme` a component wears `moss` in the dark.",
    },
    { kind: "h2", text: "From one colour" },
    {
      kind: "code",
      language: "tsx",
      code: `import { customTheme } from "@react-cards-opening/ui";

const theme = customTheme("#ff5a36", "dark");`,
    },
    {
      kind: "p",
      text: "`customTheme` mixes a five-step ramp into a dark or light ground. Rarity keeps its six colours: grey, green, blue, purple, orange and red, deepened on a light ground so they hold. To change them, spread the theme and hand it a `rarity` of your own.",
    },
    { kind: "h2", text: "The shape of a theme" },
    {
      kind: "code",
      language: "ts",
      code: `interface CardTheme {
  bg: string; // the panel and the back of a card
  card: string; // the face of a card, badges
  fg: string; // text
  muted: string; // quieter text
  levels: readonly [string, string, string, string, string]; // the grid's ramp
  rarity: Record<string, string>; // a colour per tier id
}`,
    },
    {
      kind: "p",
      text: "`levels[0]` is an unlit cell and `levels[4]` is the accent: the scan button, the beam's glow, the back of a card. A tier with no colour in `rarity` wears `muted`. Use plain hex colours: they are handed to GSAP as they are.",
    },
    { kind: "h2", text: "CSS variables" },
    {
      kind: "p",
      text: "Colours come from the `theme` prop. A few things that are not colours are yours to set in CSS, on any ancestor of the components. [Styling by hand](/docs/guides/styling/) lists all of them, and how to put a class of your own on any part.",
    },
    {
      kind: "table",
      head: ["Variable", "Default", "What it does"],
      rows: [
        ["`--rco-font`", "the page's font", "The typeface of everything the library draws."],
        ["`--rco-radius`", "`28px`", "The corner of a card. The foil border follows it."],
        ["`--rco-card-shadow`", "a deep black drop", "The shadow under a card."],
        ["`--rco-z`", "`80`", "Where the reveal's overlay stacks."],
      ],
    },
    {
      kind: "code",
      language: "css",
      code: `:root {
  --rco-font: "Inter Variable", system-ui, sans-serif;
  --rco-radius: 18px;
  --rco-z: 1000;
}`,
    },
    { kind: "h2", text: "Follow the page's dark mode" },
    {
      kind: "code",
      language: "tsx",
      code: `const mode = document.documentElement.classList.contains("dark") ? "dark" : "light";

<CardHunt theme={themeOf("ocean", mode)} {...rest} />`,
    },
  ],
  related: [
    "/docs/rarity-tiers/",
    "/docs/guides/custom-tiers/",
    "/docs/components/card/",
    "/docs/components/pixel-glyph/",
  ],
  updated: UPDATED,
};

const rarityTiers: DocPage = {
  path: "/docs/rarity-tiers/",
  section: "get-started",
  title: "Rarity tiers",
  tagline: "six tiers, six shows",
  nav: "Rarity tiers",
  description:
    "How rarity works in react-cards-opening: six default tiers from common to mythic, the weight that sets how often each comes up, and the show each one gets.",
  lead: "Six tiers ship, the six loot is sorted into almost everywhere: common, uncommon, rare, epic, legendary and mythic. Each arrives its own way. A common is set down in a puff of dust. A mythic puts the lights out, pulls everything in, and arrives in an impact frame with the air cracking around it.",
  blocks: [
    { kind: "preview", demo: { type: "tiers" }, caption: "One of each. Open them left to right." },
    { kind: "h2", text: "The six that ship" },
    {
      kind: "table",
      head: ["Tier", "Colour", "Weight", "Roughly", "How it arrives"],
      rows: [
        ["`common`", "grey", "45", "nearly one in two", "Set down: a ring along the floor, and dust."],
        ["`uncommon`", "green", "27", "one in four", "Alive: ripples, leaves on an updraft, fireflies."],
        ["`rare`", "blue", "15", "one in seven", "Ice: rings close in, then a crystal, a hex wave and shards."],
        ["`epic`", "purple", "8", "one in twelve", "Arcane: light is drawn in, then a turning sigil and a spiral."],
        ["`legendary`", "orange", "4", "one in twenty five", "The sun: a flash, a pillar of light, a sunburst, coins."],
        [
          "`mythic`",
          "red",
          "1",
          "one in a hundred",
          "A cataclysm: the lights fail, then a nova, cracks, lightning, a quake, and fire.",
        ],
      ],
    },
    {
      kind: "p",
      text: "The colours are the same on every [theme](/docs/theming/), because a tier's colour is how it is known: a rare is blue whatever the page around it looks like.",
    },
    { kind: "h2", text: "A tier is four things" },
    {
      kind: "p",
      text: "An id, a word to show, a weight that says how often it comes up, and an effect level that says how loud the card's own reveal is. On top of that reveal, each tier plays a show of its own from the [effects library](/docs/effects/library/). [Effect plans](/docs/effects/plans/) lists what is in each and how to change it.",
    },
    { kind: "h2", text: "Four effect levels" },
    {
      kind: "p",
      text: "The effect level is the part of the reveal that belongs to the card itself: how it waits face down, and what it does as it turns.",
    },
    {
      kind: "table",
      head: ["Effect", "On the grid", "Face down", "As it turns", "Stays up at least"],
      rows: [
        ["`quiet`", "ring and sparks", "glow, then a hop", "[burst](/docs/effects/burst/)", "1.75 s"],
        ["`loud`", "adds a flash and a shake", "glow, then a shake", "burst and [rays](/docs/effects/rays/)", "1.75 s"],
        [
          "`legendary`",
          "the same",
          "a longer shake",
          "adds a [flash](/docs/effects/flash/), [shockwaves](/docs/effects/shockwaves/), a [foil border](/docs/effects/foil-border/), a [shine](/docs/effects/shine/) and [sparkles](/docs/effects/sparkles/)",
          "2.65 s",
        ],
        ["`mythic`", "the same", "the longest shake, harder every time", "everything a legendary does", "3.4 s"],
      ],
    },
    { kind: "h2", text: "A card names its tier" },
    {
      kind: "code",
      language: "ts",
      code: `const card = { id: "ash-phoenix", rarity: "mythic", name: "Ash Phoenix" };`,
    },
    {
      kind: "p",
      text: "A card whose `rarity` is not in the list still opens: quietly, in the theme's muted colour, and never from a roll. A typo in a tier id should not take a reveal down with it.",
    },
    { kind: "h2", text: "Weights are ratios" },
    {
      kind: "p",
      text: "Only the proportion between weights matters. A card's chance in a draw is its tier's weight over the weights of every card in the pool, so two legendaries in a pool each come up half as often as one would. [Rolls and odds](/docs/core/rolls/) has the functions.",
    },
    { kind: "h2", text: "Tiers of your own" },
    {
      kind: "code",
      language: "tsx",
      code: `import type { RarityTier } from "@react-cards-opening/core";

const tiers: RarityTier[] = [
  { id: "bronze", label: "Bronze", weight: 70, effect: "quiet" },
  { id: "silver", label: "Silver", weight: 25, effect: "loud" },
  { id: "gold", label: "Gold", weight: 5, effect: "legendary" },
];

<CardHunt rarities={tiers} theme={{ ...theme, rarity: { bronze: "#d08a5a", silver: "#c3ccd6", gold: "#f2cc60" } }} />`,
    },
    {
      kind: "p",
      text: "The label is shown as written, under the card's name, in normal case. [Custom tiers](/docs/guides/custom-tiers/) walks through a full example.",
    },
  ],
  related: ["/docs/guides/custom-tiers/", "/docs/core/show-plan/", "/docs/core/rolls/", "/docs/effects/"],
  updated: UPDATED,
};

export const GET_STARTED: readonly DocPage[] = [introduction, installation, firstOpening, theming, rarityTiers];
