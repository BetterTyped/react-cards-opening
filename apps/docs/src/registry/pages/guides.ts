import type { DocPage } from "../../content/types";

const UPDATED = "2026-10-11";

const customFace: DocPage = {
  path: "/docs/guides/custom-card-face/",
  section: "guides",
  title: "Custom card face",
  tagline: "your art on the card",
  nav: "Custom card face",
  description:
    "Replace the ready-made card face with your own: an image, stats, anything. Keep the rise-in animation with one class and size it so it scales with the card.",
  lead: "The ready-made face shows a pixel glyph, a name, a tier and a line of text. Your cards probably have art, numbers, a set symbol. `renderFace` replaces everything inside the card's frame and keeps everything around it: the flight, the turn, the tier's colour and its show.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "custom-face" },
      caption: "The same reveal around a face with a picture window and three numbers.",
    },
    { kind: "h2", text: "renderFace" },
    {
      kind: "code",
      language: "tsx",
      code: `<CardOpening
  opening={hunt.opening}
  renderFace={(card, { tone, tier }) => (
    <>
      <img className="rco-line face-art" src={card.image} alt="" />
      <p className="rco-line face-name">{card.name}</p>
      <p className="rco-line face-kind" style={{ color: tone }}>
        {tier.label} creature
      </p>
    </>
  )}
  readingOf={(card, { tier }) => [card.name, \`\${tier.label} creature\`]}
/>`,
    },
    {
      kind: "list",
      items: [
        "The face is a flex column with the card's padding. Give the part that should take the spare room `flex: 1`.",
        "`info.tone` is the tier's colour on the theme and `info.tier` is the tier itself, label included.",
        "`CardHunt` and `Card` take the same function.",
      ],
    },
    { kind: "h2", text: "Keep the rise-in" },
    {
      kind: "p",
      text: "When a card turns over, every element with the class `rco-line` rises 14 pixels and fades in, one after another in the order they are written. Put the class on each row of your face. Rows without it are simply there when the card turns.",
    },
    { kind: "h2", text: "Say what there is to read" },
    {
      kind: "p",
      text: "A card stays face up for as long as its text takes to read. The library can count the ready-made face's words; it cannot see yours. `readingOf` returns every run of text on the face. Without it the card gets the shortest hold its tier allows.",
    },
    { kind: "h2", text: "Sizes that scale" },
    {
      kind: "p",
      text: "A revealed card is 300 pixels wide. A [Card](/docs/components/card/) standing still can be any width, and its contents scale with it. For your face to do the same, size it in the card's own unit: `--rco-u` is one pixel in the reveal and one three-hundredth of the width on a standing card.",
    },
    {
      kind: "code",
      language: "css",
      code: `.face-name {
  font-size: calc(22 * var(--rco-u, 1px));
  font-weight: 600;
  margin-top: calc(12 * var(--rco-u, 1px));
}

.face-art {
  flex: 1;
  min-height: 0;
  object-fit: cover;
  border-radius: calc(14 * var(--rco-u, 1px));
}`,
    },
    { kind: "h2", text: "The back" },
    {
      kind: "code",
      language: "tsx",
      code: `<CardOpening opening={hunt.opening} renderBack={() => <img src="/card-back.svg" alt="" />} />`,
    },
    {
      kind: "p",
      text: "The back is a centred grid on a soft glow in the theme's accent. Whatever you render sits in the middle of it. The glowing edge that shows the tier before the turn is drawn around it either way.",
    },
  ],
  related: [
    "/docs/components/card/",
    "/docs/components/card-opening/",
    "/docs/components/pixel-glyph/",
    "/docs/core/show-plan/",
  ],
  updated: UPDATED,
};

const customTiers: DocPage = {
  path: "/docs/guides/custom-tiers/",
  section: "guides",
  title: "Custom tiers",
  tagline: "your own rarity ladder",
  nav: "Custom tiers",
  description:
    "Define your own rarity tiers, three or seven of them, give each a colour on the theme, and pick the show each one gets with a single word.",
  lead: "Common, rare, epic and legendary are a default, not a rule. A tier list is an array you pass in. Each tier says how often it comes up and how loud its reveal is, and the theme says what colour it wears.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "custom-tiers" },
      caption: "Bronze is quiet, silver is loud, gold gets everything.",
    },
    { kind: "h2", text: "Write the list" },
    {
      kind: "code",
      language: "ts",
      file: "tiers.ts",
      code: `import type { RarityTier } from "@react-cards-opening/core";

export const tiers: RarityTier[] = [
  { id: "bronze", label: "Bronze", weight: 70, effect: "quiet" },
  { id: "silver", label: "Silver", weight: 25, effect: "loud" },
  { id: "gold", label: "Gold", weight: 5, effect: "legendary" },
];`,
    },
    { kind: "h2", text: "Colour them" },
    {
      kind: "code",
      language: "ts",
      code: `import { themeOf } from "@react-cards-opening/ui";

const base = themeOf("mono", "dark");
export const theme = { ...base, rarity: { bronze: "#d08a5a", silver: "#c3ccd6", gold: "#f2cc60" } };`,
    },
    {
      kind: "p",
      text: "The keys of `rarity` are tier ids. A tier with no entry wears the theme's muted colour, which is a reasonable look for a lowest tier and a visible reminder for a forgotten one.",
    },
    { kind: "h2", text: "Pass both" },
    {
      kind: "code",
      language: "tsx",
      code: `<CardHunt cards={cards} rarities={tiers} theme={theme} {...rest} />

// The same list deals the cards.
const hand = rollCards({ pool, count: 3, rarities: tiers, seed });`,
    },
    { kind: "h2", text: "Choosing an effect" },
    {
      kind: "table",
      head: ["Effect", "Use it for", "Keep in mind"],
      rows: [
        ["`quiet`", "Most of your cards.", "Several tiers can be quiet. They differ by colour and label."],
        ["`loud`", "The tier people hope for.", "Rays and a shake. One or two tiers at most."],
        ["`legendary`", "The tier people screenshot.", "The full show. If two tiers have it, neither is special."],
      ],
    },
    { kind: "h2", text: "More than three shows" },
    {
      kind: "p",
      text: "Seven tiers on three effect levels works well: colour does the rest. If you need a show that does not exist, `launch` on [CardOpening](/docs/components/card-opening/) takes a timeline of your own to play before the card leaves, and it is told the card, so it can do something only for your top tier.",
    },
  ],
  related: ["/docs/rarity-tiers/", "/docs/core/rolls/", "/docs/theming/", "/docs/core/show-plan/"],
  updated: UPDATED,
};

const originAndLanding: DocPage = {
  path: "/docs/guides/origin-and-landing/",
  section: "guides",
  title: "Origin and landing",
  tagline: "where a card lands",
  nav: "Origin and landing",
  description:
    "Tell a card where to come out of and where to go: a button, a pack, a slot in a collection. Play a timeline of your own before it leaves.",
  lead: "A reveal starts somewhere and ends somewhere, and both are yours to choose. `launch` names the element a card comes out of. `landing` names the one it shrinks into. Neither has to be part of this library: any element on the page will do.",
  blocks: [
    { kind: "preview", demo: { type: "tiers" }, caption: "Here both are the card's own place on the shelf." },
    { kind: "h2", text: "From a button to a counter" },
    {
      kind: "code",
      language: "tsx",
      code: `const pack = useRef<HTMLButtonElement>(null);
const counter = useRef<HTMLSpanElement>(null);

<button ref={pack} onClick={() => hunt.start()}>Open the pack</button>
<span ref={counter}>{opened.length} cards</span>

<CardOpening
  opening={hunt.opening}
  launch={() => pack.current}
  landing={() => counter.current}
/>`,
    },
    { kind: "h2", text: "How the card uses them" },
    {
      kind: "list",
      items: [
        "The card starts at the centre of the `launch` element, scaled so it is as wide as that element.",
        "It ends at the centre of the `landing` element, scaled to that element's width, and fades over its last 0.18 seconds.",
        "Both are measured at the moment they are needed, so a page that scrolled in between is still right.",
        "`landing` is asked for up to thirty frames in a row. A slot that only exists once the card is opened has time to render.",
      ],
    },
    { kind: "h2", text: "A slot per card" },
    {
      kind: "code",
      language: "tsx",
      code: `const slots = useRef(new Map<string, HTMLElement>());

{cards.map((card) => (
  <li key={card.id} ref={(element) => element && slots.current.set(card.id, element)}>
    <Card card={card} faceDown={!opened.includes(card.id)} width="100%" />
  </li>
))}

<CardOpening opening={hunt.opening} landing={(card) => slots.current.get(card.id) ?? null} />`,
    },
    { kind: "h2", text: "Play something first" },
    {
      kind: "p",
      text: "Return an object from `launch` and you can put a GSAP timeline in front of the card. It is added to the reveal's own timeline, so skipping and stopping work through it without extra code.",
    },
    {
      kind: "code",
      language: "tsx",
      code: `launch={(card, { tone, plan }) => {
  const pack = packRef.current;
  if (!pack) return null;
  const lead = gsap.timeline();
  lead.to(pack, { scale: 1.06, duration: 0.2, yoyo: true, repeat: 3 });
  if (plan.rays) lead.to(pack, { boxShadow: \`0 0 60px 10px \${tone}\`, duration: 0.3 });
  return {
    element: pack,
    lead,
    release: () => gsap.set(pack, { clearProps: "scale,boxShadow" }),
  };
}}`,
    },
    {
      kind: "note",
      text: "`release` runs when the card has landed and also when the run was stopped halfway. Use it to undo whatever `lead` did.",
    },
    { kind: "h2", text: "Nowhere" },
    {
      kind: "p",
      text: "Without `launch` the card grows out of the middle of the screen. Without `landing`, or when it answers null, the card fades out where it is. Both are fine for a reveal that is the whole point of the screen.",
    },
  ],
  related: [
    "/docs/components/card-opening/",
    "/docs/components/scan-grid/",
    "/docs/effects/flight/",
    "/docs/examples/collection/",
  ],
  updated: UPDATED,
};

const keepOpened: DocPage = {
  path: "/docs/guides/keep-opened-cards/",
  section: "guides",
  title: "Keep opened cards",
  tagline: "on a device or a server",
  nav: "Keep opened cards",
  description:
    "Three ways to remember which cards were opened: local storage with useOpenedCards, your own state, or a server, written to from onOpen.",
  lead: "The library never decides where opened cards are stored. It asks for a list of opened ids and calls `onOpen` when one is added. That leaves three good places to keep the list, and the right one depends on whether a card is a toy or a thing someone owns.",
  blocks: [
    { kind: "h2", text: "On the device" },
    {
      kind: "code",
      language: "tsx",
      code: `const { opened, open } = useOpenedCards(\`deal:\${userId}:\${dealtAt}\`);
const hunt = useCardOpening({ cards, opened, onOpen: open });`,
    },
    {
      kind: "p",
      text: 'Right for a reveal that is a presentation: the cards are already decided and "opened" only means "already watched". It costs nothing and works signed out. It does not follow the person to their phone.',
    },
    { kind: "h2", text: "In your own state" },
    {
      kind: "code",
      language: "tsx",
      code: `const [opened, setOpened] = useState<string[]>([]);
const hunt = useCardOpening({
  cards,
  opened,
  onOpen: (id) => setOpened((now) => [...now, id]),
});`,
    },
    { kind: "p", text: "Right for a demo, a game round, or anything that should start over on reload." },
    { kind: "h2", text: "On a server" },
    {
      kind: "code",
      language: "tsx",
      code: `const { data } = useQuery(["deal"], fetchDeal); // { cards, opened }
const [local, setLocal] = useState<string[]>([]);
const opened = [...(data?.opened ?? []), ...local];

const hunt = useCardOpening({
  cards: data?.cards ?? [],
  opened,
  onOpen: (id) => {
    setLocal((now) => [...now, id]); // the reveal goes on at once
    void api.openCard(id); // the server catches up
  },
});`,
    },
    {
      kind: "list",
      items: [
        "Update local state first. `onOpen` fires while the card is face up, and the reveal should not wait on a request.",
        "Make the endpoint safe to call twice. A retry or a second tab will do it.",
        "Send the cards down already dealt. A deal made in the browser can be redone by the visitor; see [Rolls and odds](/docs/core/rolls/).",
      ],
    },
    { kind: "h2", text: "Skipping counts" },
    {
      kind: "p",
      text: "`openAll()` calls `onOpen` once for each unopened card, one after another. If your handler makes a request per card, that is a burst of requests. Batch them, or give the skip button its own endpoint.",
    },
  ],
  related: [
    "/docs/core/use-opened-cards/",
    "/docs/core/rolls/",
    "/docs/core/use-card-opening/",
    "/docs/guides/server-rendering/",
  ],
  updated: UPDATED,
};

const ownUi: DocPage = {
  path: "/docs/guides/own-ui-on-core/",
  section: "guides",
  title: "Your own UI on core",
  tagline: "a reveal of your own",
  nav: "Your own UI on core",
  description:
    "Build a card reveal on @react-cards-opening/core alone: the rules from the hook, the look from your own markup, CSS or animation library.",
  lead: "If your product has its own way of moving, keep `core` and leave `ui` out. The rules stay the same (the queue, the presses, when a card counts as opened) and the picture is whatever you draw. This guide builds a working reveal from a `div` and CSS transitions.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "headless" },
      caption: "No ui package and no GSAP in this one. Press the first button, then the card.",
    },
    { kind: "h2", text: "What a renderer owes the rules" },
    {
      kind: "steps",
      items: [
        "**Say where the card is.** Call `opening.enter(phase)` as the reveal moves on: `hum`, `turn`, `hold`, `land`.",
        "**Say when it is face up.** Call `opening.reveal()`. That is when `onOpen` fires. It is safe to call twice.",
        "**Say when it is home.** Call `opening.landed()`. The next card comes up, or the run ends.",
        "**Be ready to jump.** Hand `opening.attach()` four functions: turn now, finish now, cancel, close.",
      ],
    },
    { kind: "h2", text: "The effect" },
    {
      kind: "code",
      language: "tsx",
      code: `import { holdSeconds, showFor, tierOf, DEFAULT_RARITIES, useCardOpening, useOpeningPhase } from "@react-cards-opening/core";

function Reveal({ cards, opened, onOpen }) {
  const hunt = useCardOpening({ cards, opened, onOpen });
  const { opening, run, step, current } = hunt;
  const phase = useOpeningPhase(opening);

  useEffect(() => {
    if (!run || !current) return;
    const plan = showFor(tierOf(DEFAULT_RARITIES, current.rarity).effect);
    let timers: number[] = [];
    const after = (ms: number, act: () => void) => timers.push(window.setTimeout(act, ms));
    const clear = () => timers.splice(0).forEach(clearTimeout);

    const land = () => {
      clear();
      opening.reveal();
      opening.enter("land");
      after(320, opening.landed);
    };
    const turn = () => {
      clear();
      opening.enter("turn");
      after(420, () => {
        opening.reveal();
        opening.enter("hold");
      });
      after(420 + holdSeconds([current.name, current.line], plan) * 1000, land);
    };

    opening.enter("hum");
    after(900, turn);
    const detach = opening.attach({ turn, finish: land, cancel: clear, close: () => {} });
    return () => {
      clear();
      detach();
    };
  }, [run?.id, step]);

  return (
    <button className="card" data-phase={phase} onClick={hunt.pressCard} disabled={!run}>
      {current?.name}
    </button>
  );
}`,
    },
    { kind: "h2", text: "The look" },
    {
      kind: "code",
      language: "css",
      code: `.card {
  transition: transform 0.42s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.3s;
  transform: rotateY(180deg);
}
.card[data-phase="hum"] { animation: shake 0.3s 2; }
.card[data-phase="turn"],
.card[data-phase="hold"] { transform: rotateY(0); }
.card[data-phase="land"] { transform: scale(0.6); opacity: 0; }`,
    },
    { kind: "h2", text: "What you get for free" },
    {
      kind: "list",
      items: [
        "`hunt.pressCard` turns a face-down card and sends a face-up one home. You did not write that branch.",
        "`hunt.pressBackdrop` stops the run the right way: a turned card still lands, a face-down one goes back unopened.",
        "`hunt.openAll` opens everything and calls your `cancel`.",
        "A replay never calls `onOpen`.",
        "The [show plan](/docs/core/show-plan/) tells you how loud to be for the tier, and `holdSeconds` how long to wait.",
      ],
    },
    { kind: "h2", text: "With an animation library" },
    {
      kind: "p",
      text: "The same contract works with any clock. With a timeline, `turn` is a seek to a label and `finish` is a jump to the end. That is exactly what [CardOpening](/docs/components/card-opening/) does with GSAP, and reading its source is the fastest way to a renderer of your own.",
    },
  ],
  related: ["/docs/core/use-card-opening/", "/docs/core/show-plan/", "/docs/core/", "/docs/core/reduced-motion/"],
  updated: UPDATED,
};

const serverRendering: DocPage = {
  path: "/docs/guides/server-rendering/",
  section: "guides",
  title: "Server rendering",
  tagline: "Next.js and friends",
  nav: "Server rendering",
  description:
    "Render react-cards-opening on a server: what is in the HTML, what waits for the browser, and how to avoid a flash for returning visitors.",
  lead: "Both packages render on a server. Nothing reads `window` during render, the reveal's overlay only mounts in the browser, and the plain functions (`rollCards`, `chances`, `themeOf`) run anywhere. This page is about the three things left to you: where the client boundary goes, where the stylesheet goes, and what a returning visitor sees first.",
  blocks: [
    { kind: "h2", text: "What is in the HTML" },
    {
      kind: "table",
      head: ["Component", "On the server"],
      rows: [
        ["`CardHunt`", "The whole panel: headline, button, grid, badges. Readable with JavaScript off."],
        ["`ScanGrid`", "The grid, veiled or not."],
        ["`Card`", "The card, face up or down."],
        ["`CardOpening`", "Nothing. The overlay is a portal that mounts after hydration."],
      ],
    },
    { kind: "h2", text: "Next.js" },
    {
      kind: "code",
      language: "tsx",
      file: "app/layout.tsx",
      code: `import "@react-cards-opening/ui/styles.css";`,
    },
    {
      kind: "code",
      language: "tsx",
      file: "app/hunt.tsx",
      code: `"use client";

import { useOpenedCards } from "@react-cards-opening/core";
import { CardHunt } from "@react-cards-opening/ui";

export function Hunt({ cards, levels }) {
  const { opened, open } = useOpenedCards("deal");
  return <CardHunt cards={cards} opened={opened} onOpen={open} levels={levels} />;
}`,
    },
    {
      kind: "p",
      text: "The file that uses the hooks is a client component: the packages do not mark themselves with `use client`, so that functions like `rollCards` stay callable from server code. The cards and the grid can come from a server component above it as props: they are plain data.",
    },
    { kind: "h2", text: "Returning visitors" },
    {
      kind: "p",
      text: "The server does not know what is in local storage, so its HTML shows every card unopened. `useOpenedCards` reads storage before the first paint, which is soon enough for most pages. If the two states look very different, hold the piece back until `ready`:",
    },
    {
      kind: "code",
      language: "tsx",
      code: `const { opened, open, ready } = useOpenedCards("deal");
if (!ready) return <div style={{ minHeight: 360 }} />;`,
    },
    {
      kind: "p",
      text: "Or keep opened cards on the server and render the right state the first time. See [Keep opened cards](/docs/guides/keep-opened-cards/).",
    },
    { kind: "h2", text: "Random things" },
    {
      kind: "p",
      text: "Anything random that is rendered has to be the same on both sides. Deal with a `seed` in [rollCards](/docs/core/rolls/), and build the grid from data, not from `Math.random()`. Where a card hides is random on purpose, and it is picked in the browser when the scan starts, so it never reaches the HTML.",
    },
  ],
  related: [
    "/docs/installation/",
    "/docs/guides/keep-opened-cards/",
    "/docs/core/use-opened-cards/",
    "/docs/core/rolls/",
  ],
  updated: UPDATED,
};

const labels: DocPage = {
  path: "/docs/guides/labels-and-translation/",
  section: "guides",
  title: "Labels and translation",
  tagline: "every word a prop",
  nav: "Labels and translation",
  description:
    "Change or translate every word a card hunt shows and every label a screen reader hears, through one labels prop with strings and functions.",
  lead: "No sentence is hard coded where you cannot reach it. `CardHunt` and `CardOpening` take a `labels` object, and anything you leave out keeps its English default. Lines that depend on the state of the hunt are functions, so a translation can count and pluralise its own way.",
  blocks: [
    { kind: "h2", text: "Override a few" },
    {
      kind: "code",
      language: "tsx",
      code: `<CardHunt
  labels={{
    scan: ({ found }) => (found > 0 ? "Weiter suchen" : "Suchen"),
    openAll: "Alle finden",
    replay: "Noch einmal",
    hidden: "Noch versteckt",
    found: (where) => \`Gefunden: \${where}\`,
  }}
  {...rest}
/>`,
    },
    { kind: "h2", text: "All of them" },
    {
      kind: "table",
      head: ["Label", "Type", "Default"],
      rows: [
        ["`headline`", "`(state) => string`", '"5 cards are hiding in here." and its variants'],
        ["`subline`", "`(state) => string`", '"Run the scan. Each card opens where the beam finds it."'],
        ["`scan`", "`(state) => string`", '"Scan", then "Keep scanning"'],
        ["`openAll`", "`string`", '"Find all"'],
        ["`replay`", "`string`", '"Scan again"'],
        ["`hidden`", "`string`", '"Still hidden"'],
        ["`finds`", "`string`", '"Your finds" (read by screen readers)'],
        ["`openCard`", "`(name) => string`", '"Open Night Owl" (a found cell)'],
        ["`openBadge`", "`string`", '"Open this card" (a badge\'s tooltip)'],
        ["`found`", "`(where) => string`", '"Found on row 3, column 12"'],
        ["`turnCard`", "`string`", '"Turn the card over, then keep it"'],
        ["`turnCardHint`", "`string`", '"Click to turn it over, click again to keep it"'],
        ["`closeCard`", "`string`", '"Close this card"'],
        ["`closeCardHint`", "`string`", '"Click to close"'],
      ],
    },
    { kind: "h2", text: "The state a line is written from" },
    {
      kind: "code",
      language: "ts",
      code: `interface HuntState {
  total: number; // cards in the deal
  found: number; // opened so far
  pending: number; // still hidden
  left: number; // still to come in this scan, after the one on screen
  running: boolean;
  replay: boolean;
  hero: boolean;
}`,
    },
    { kind: "h2", text: "The rest of the words" },
    {
      kind: "list",
      items: [
        "**Tier names** are the `label` of each [tier](/docs/rarity-tiers/). Translate them in your tier list.",
        "**Where a card was found** comes from `describeSpot`. Format a date there in the reader's locale.",
        "**Card names and text** are your data.",
      ],
    },
    {
      kind: "code",
      language: "tsx",
      code: `import { CARD_HUNT_LABELS } from "@react-cards-opening/ui";

// Start from the defaults when only the wording around them changes.
const labels = { ...CARD_HUNT_LABELS, replay: "Run it back" };`,
    },
  ],
  related: [
    "/docs/components/card-hunt/",
    "/docs/core/reduced-motion/",
    "/docs/rarity-tiers/",
    "/docs/components/card-opening/",
  ],
  updated: UPDATED,
};

export const GUIDES: readonly DocPage[] = [
  customFace,
  customTiers,
  originAndLanding,
  keepOpened,
  ownUi,
  serverRendering,
  labels,
];
