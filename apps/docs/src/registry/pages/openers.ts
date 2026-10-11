import type { DocPage } from "../../content/types";
import { propsTable } from "../props";
import { SLOT_TABLES } from "../slots";
import type {
  CardCaseProps,
  CardPackProps,
  CardSpinProps,
  EffectLayerProps,
  GlyphCard,
  LootCaseProps,
  PlayOptions,
  SpinReelProps,
} from "@react-cards-opening/ui";

const UPDATED = "2026-10-11";

const cardPack: DocPage = {
  path: "/docs/components/card-pack/",
  section: "components",
  title: "CardPack",
  tagline: "a sealed pack you tear open",
  nav: "CardPack",
  description:
    "CardPack is a sealed pack of cards for React: press it and it bursts, deals its cards face down, and each one turns over on a press with its tier's show.",
  lead: "`CardPack` is the pack opening card games are known for. A sealed pack floats until it is pressed, bursts, and deals its cards face down on a table. A card glows in its tier's colour under the pointer, which is the tease, and turns over when it is pressed, in any order. Done gathers them into a row.",
  blocks: [
    { kind: "preview", demo: { type: "pack" }, caption: "Press the pack. Hover a card before you turn it." },
    { kind: "h2", text: "Usage" },
    {
      kind: "code",
      language: "tsx",
      code: `import { useOpenedCards } from "@react-cards-opening/core";
import { CardPack } from "@react-cards-opening/ui";
import "@react-cards-opening/ui/styles.css";

function Pack({ cards }) {
  const { opened, open } = useOpenedCards("pack:42");
  return <CardPack cards={cards} opened={opened} onOpen={open} />;
}`,
    },
    {
      kind: "p",
      text: "`cards` is the pack, in the order it is dealt, and each card names its tier in `rarity`. What is in the pack is decided before it is opened: deal it with [rollCards](/docs/core/rolls/) on your server and the tearing is only the show.",
    },
    { kind: "h2", text: "How it lays the table" },
    {
      kind: "list",
      items: [
        "**Five cards sit in a ring**, one at the top, the layout a pack of five is known by. Any other count sits in rows. Up to ten sit well.",
        "**The table is measured against the pack's own width**, with a container query, so a pack in a sidebar lays itself out like one on a phone: two or three to a row.",
        "**A card moves by changing two numbers.** Gathering them on Done is the same cards with new seats, and the stylesheet glides them there.",
      ],
    },
    { kind: "h2", text: "What each tier does" },
    {
      kind: "p",
      text: "Every card throws sparks as it turns. A loud tier opens rays behind itself and jolts the table. A legendary lights the whole table. On top of that each tier plays its [signature show](/docs/effects/plans/), and `effects` swaps it for a set or a plan of your own.",
    },
    {
      kind: "code",
      language: "tsx",
      code: `import { CardPack, EFFECT_SETS } from "@react-cards-opening/ui";

<CardPack cards={cards} opened={opened} onOpen={open} effects={EFFECT_SETS.radiant} />;`,
    },
    { kind: "h2", text: "Props" },
    propsTable<CardPackProps<GlyphCard>>({
      cards: ["readonly C[]", "The cards in the pack, in the order they are dealt."],
      opened: [
        "readonly string[]",
        "Ids already turned over. A pack that comes back with some of them is dealt, not sealed.",
      ],
      onOpen: ["(id: string) => void", "A card was turned face up for the first time."],
      theme: ["CardTheme", "The colours. `moss` in the dark when left out.", "optional"],
      rarities: ["readonly RarityTier[]", "Your tiers. The six defaults when left out.", "optional"],
      emblem: ["PixelArt", "The glyph on the front of the sealed pack. A question mark when left out.", "optional"],
      onDone: ["() => void", "Every card is turned and Done was pressed.", "optional"],
      labels: ["Partial<CardPackLabels>", "Every word the pack says, and what a screen reader hears.", "optional"],
      actions: ["ReactNode", "Extra buttons under the table once the pack is done.", "optional"],
      renderFace: ["(card, info) => ReactNode", "The front of a card, instead of the ready-made face.", "optional"],
      renderBack: ["(card) => ReactNode", "The back of a card, instead of the question glyph.", "optional"],
      readingOf: [
        "(card, info) => readonly string[]",
        "The text on a face of your own, so a card brought up close stays long enough to read.",
        "optional",
      ],
      effects: [
        "EffectPlan | false",
        "What each tier plays on top of the card's own reveal. The [signature shows](/docs/effects/plans/) when left out, `false` for none.",
        "optional",
      ],
      className: ["string", "A class for the pack's root.", "optional"],
      classNames: ["CardPackClassNames", "A class of your own for each part.", "optional"],
      style: ["CSSProperties", "Inline styles for the root: the place for `--rco-pack-width`.", "optional"],
    }),
    { kind: "h2", text: "Parts and variables" },
    SLOT_TABLES.pack,
    {
      kind: "table",
      head: ["Variable", "What it sets", "When left out"],
      rows: [
        ["`--rco-pack-width`", "The widest the table is laid out for. Past it the cards stop growing.", "`880px`"],
        ["`--rco-pack-size`", "The sealed pack's width.", "`min(40cqw, 180px)`"],
        ["`--rco-panel-radius`", "The corners of the pack's panel.", "`28px`"],
      ],
    },
    { kind: "h2", text: "Without the component" },
    {
      kind: "p",
      text: "The rules are [useCardPack](/docs/core/use-card-pack/) in the core package: sealed, dealt, done, and which cards are up. Draw the table yourself and keep the rules.",
    },
  ],
  related: [
    "/docs/core/use-card-pack/",
    "/docs/effects/plans/",
    "/docs/components/card-spin/",
    "/docs/components/card-case/",
    "/docs/guides/styling/",
  ],
  updated: UPDATED,
};

const cardSpin: DocPage = {
  path: "/docs/components/card-spin/",
  section: "components",
  title: "CardSpin",
  tagline: "a reel that stops on your card",
  nav: "CardSpin",
  description:
    "CardSpin is a case-opening reel for React: a strip of tiles races under a marker, slows, and stops on the card that was dealt, which then lifts out of it.",
  lead: "`CardSpin` is the reel a case opening is known for. A strip of tiles races under a marker, slows down, and stops on a card. The winning tile lights up, the rest dim, and the card lifts out of it into the [reveal](/docs/components/card-opening/). One press is one spin.",
  blocks: [
    { kind: "preview", demo: { type: "spin" }, caption: "Press Spin. The reel stops on the next card of the deal." },
    { kind: "h2", text: "Usage" },
    {
      kind: "code",
      language: "tsx",
      code: `import { useOpenedCards } from "@react-cards-opening/core";
import { CardSpin } from "@react-cards-opening/ui";

function Spins({ won, catalog }) {
  const { opened, open } = useOpenedCards("spins:42");
  return <CardSpin cards={won} pool={catalog} opened={opened} onOpen={open} />;
}`,
    },
    { kind: "h2", text: "The spin decides nothing" },
    {
      kind: "p",
      text: "`cards` is what was won, decided before anything moves. `pool` is everything that could have come up, and it only fills the strip. Tiles are drawn from the pool by tier weight with [pickCard](/docs/core/rolls/), so rare cards pass less often and the strip looks like the odds, and the tile under the marker at the end is always the card that was dealt. The strip is built from a seed, so a server and a browser lay out the same tiles.",
    },
    {
      kind: "note",
      text: "A reel that shows near misses is still a reel that shows the odds honestly here: what passes by is drawn with the real weights. If you sell spins, check what your market requires you to publish. [chances](/docs/core/rolls/) gives you the numbers.",
    },
    { kind: "h2", text: "Props" },
    propsTable<CardSpinProps<GlyphCard>>({
      cards: ["readonly C[]", "What was won, in the order the spins stop on them."],
      opened: ["readonly string[]", "Ids already won on the reel."],
      onOpen: ["(id: string) => void", "A card was turned face up for the first time."],
      pool: ["readonly C[]", "What slides past on the reel. The deal itself when left out.", "optional"],
      theme: ["CardTheme", "The colours. `moss` in the dark when left out.", "optional"],
      rarities: ["readonly RarityTier[]", "Your tiers. They weigh what the strip is filled with.", "optional"],
      actions: ["ReactNode", "Extra buttons in the header, next to the spin button.", "optional"],
      onRunChange: ["(running: boolean) => void", "A spin started or came to rest.", "optional"],
      labels: ["Partial<CardSpinLabels>", "Every word in the panel.", "optional"],
      landing: ["(card) => HTMLElement | null", "Where a won card lands, instead of its badge here.", "optional"],
      renderFace: ["(card, info) => ReactNode", "The front of the card, instead of the ready-made face.", "optional"],
      renderBack: ["(card) => ReactNode", "The back of the card.", "optional"],
      readingOf: [
        "(card, info) => readonly string[]",
        "The text on a face of your own, so the card stays up long enough to read.",
        "optional",
      ],
      effects: [
        "EffectPlan | false",
        "What each tier plays on top of the card's own reveal. The [signature shows](/docs/effects/plans/) when left out, `false` for none.",
        "optional",
      ],
      className: ["string", "A class for the panel.", "optional"],
      classNames: [
        "CardSpinClassNames",
        "A class of your own for each part: the panel's, the reel's and the reveal's.",
        "optional",
      ],
      style: ["CSSProperties", "Inline styles for the panel.", "optional"],
    }),
    { kind: "h2", text: "SpinReel on its own" },
    {
      kind: "p",
      text: "`CardSpin` is `SpinReel` and `CardOpening` wired to [useCardOpening](/docs/core/use-card-opening/). When the layout is yours, take the reel alone. Its handle has one call: `spin` plays the reel and hands back what `launch` on `CardOpening` takes, so the card waits for the reel and then lifts out of the winning tile.",
    },
    {
      kind: "code",
      language: "tsx",
      code: `import { CardOpening, SpinReel, type SpinReelHandle } from "@react-cards-opening/ui";

const reel = useRef<SpinReelHandle>(null);

<SpinReel handle={reel} winner={hunt.current} pool={catalog} spinKey={spins} />
<CardOpening opening={hunt.opening} launch={(card, show) => reel.current?.spin(show) ?? null} />`,
    },
    propsTable<SpinReelProps<GlyphCard>>({
      winner: ["C | null", "The card the next spin stops on. With none, the strip shows what could come up and waits."],
      pool: ["readonly C[]", "What slides past: every card that could have come up."],
      spinKey: [
        "string | number",
        "Changes with every spin, so two spins for the same card deal two different strips.",
        "optional",
      ],
      theme: ["CardTheme", "The colours.", "optional"],
      rarities: ["readonly RarityTier[]", "Your tiers.", "optional"],
      handle: [
        "Ref<SpinReelHandle>",
        "`spin(show, { flash, onLock })`: plays the reel and answers a launch.",
        "optional",
      ],
      className: ["string", "A class for the reel's root.", "optional"],
      classNames: ["SpinReelClassNames", "A class of your own for each part of the reel.", "optional"],
      style: ["CSSProperties", "Inline styles for the root: the place for `--rco-tile`.", "optional"],
    }),
    { kind: "h2", text: "Parts and variables" },
    SLOT_TABLES.reel,
    SLOT_TABLES.panel,
    {
      kind: "table",
      head: ["Variable", "What it sets", "When left out"],
      rows: [["`--rco-tile`", "A tile's width and height.", "`112px`, and `92px` on a narrow screen"]],
    },
  ],
  related: [
    "/docs/components/card-opening/",
    "/docs/core/rolls/",
    "/docs/components/card-case/",
    "/docs/components/card-pack/",
    "/docs/effects/plans/",
  ],
  updated: UPDATED,
};

const cardCase: DocPage = {
  path: "/docs/components/card-case/",
  section: "components",
  title: "CardCase",
  tagline: "a case that gives up its cards",
  nav: "CardCase",
  description:
    "CardCase is a loot case for React: it shakes, the lid lifts, light pours out, and its cards come out one after another to land on a shelf under it.",
  lead: "`CardCase` is a chest of cards. It stirs while it waits. Opened, it shakes, the lid lifts, light and sparks pour out, and the cards come out of it one after another, each through the [reveal](/docs/components/card-opening/), each landing on its place on the shelf below. The plate on the front and the light inside take the colour of whatever is coming out next.",
  blocks: [
    { kind: "preview", demo: { type: "case" }, caption: "Press the case, or the button. Take all skips the show." },
    { kind: "h2", text: "Usage" },
    {
      kind: "code",
      language: "tsx",
      code: `import { useOpenedCards } from "@react-cards-opening/core";
import { CardCase, GLYPHS } from "@react-cards-opening/ui";

function Chest({ cards }) {
  const { opened, open } = useOpenedCards("chest:42");
  return <CardCase cards={cards} opened={opened} onOpen={open} emblem={GLYPHS.crown} />;
}`,
    },
    { kind: "h2", text: "Props" },
    propsTable<CardCaseProps<GlyphCard>>({
      cards: ["readonly C[]", "What is in the case, in the order it comes out."],
      opened: ["readonly string[]", "Ids already out of the case."],
      onOpen: ["(id: string) => void", "A card was turned face up for the first time."],
      theme: ["CardTheme", "The colours. `moss` in the dark when left out.", "optional"],
      rarities: ["readonly RarityTier[]", "Your tiers. The six defaults when left out.", "optional"],
      emblem: ["PixelArt", "The glyph on the front of the case.", "optional"],
      actions: ["ReactNode", "Extra buttons in the header, next to the open button.", "optional"],
      onRunChange: ["(running: boolean) => void", "The case started giving up its cards, or came to rest.", "optional"],
      labels: ["Partial<CardCaseLabels>", "Every word in the panel.", "optional"],
      landing: [
        "(card) => HTMLElement | null",
        "Where a card lands, instead of its place on the shelf here.",
        "optional",
      ],
      renderFace: ["(card, info) => ReactNode", "The front of the card, instead of the ready-made face.", "optional"],
      renderBack: ["(card) => ReactNode", "The back of the card.", "optional"],
      readingOf: [
        "(card, info) => readonly string[]",
        "The text on a face of your own, so the card stays up long enough to read.",
        "optional",
      ],
      effects: [
        "EffectPlan | false",
        "What each tier plays on top of the card's own reveal. The [signature shows](/docs/effects/plans/) when left out, `false` for none.",
        "optional",
      ],
      className: ["string", "A class for the panel.", "optional"],
      classNames: [
        "CardCaseClassNames",
        "A class of your own for each part: the panel's, the case's, the shelf's and the reveal's.",
        "optional",
      ],
      style: ["CSSProperties", "Inline styles for the panel.", "optional"],
    }),
    { kind: "h2", text: "LootCase on its own" },
    {
      kind: "p",
      text: "The box is its own component. `LootCase` draws the case and, through its handle, opens it: `open` plays the lid and the light and hands back what `launch` on `CardOpening` takes, so a card comes out of the gap under the lid. `close` puts the lid back.",
    },
    {
      kind: "code",
      language: "tsx",
      code: `import { CardOpening, LootCase, type LootCaseHandle } from "@react-cards-opening/ui";

const chest = useRef<LootCaseHandle>(null);

<LootCase handle={chest} tone={toneOfNextCard} onPress={() => hunt.start()} />
<CardOpening opening={hunt.opening} launch={(card, show) => chest.current?.open(show) ?? null} />`,
    },
    propsTable<LootCaseProps>({
      theme: ["CardTheme", "The colours.", "optional"],
      tone: ["string", "The colour of the plate and of the light inside: the tier of what comes out next.", "optional"],
      emblem: ["PixelArt", "The glyph on the front.", "optional"],
      idle: ["boolean", "Stirs now and then while shut. On when left out.", "optional"],
      onPress: ["() => void", "Makes the whole case a button.", "optional"],
      disabled: ["boolean", "The case cannot be pressed.", "optional"],
      label: ["string", "What a screen reader calls the press.", "optional"],
      shortcut: [
        "boolean",
        "The press repeats a button next to the case: keep it for the pointer and out of the tab order.",
        "optional",
      ],
      handle: ["Ref<LootCaseHandle>", "`open(show, { flash })` and `close()`.", "optional"],
      className: ["string", "A class for the case's root.", "optional"],
      classNames: ["LootCaseClassNames", "A class of your own for each part of the case.", "optional"],
      style: ["CSSProperties", "Inline styles for the root: the place for `--rco-case-size`.", "optional"],
    }),
    { kind: "h2", text: "Parts and variables" },
    SLOT_TABLES.lootCase,
    SLOT_TABLES.shelf,
    SLOT_TABLES.panel,
    {
      kind: "table",
      head: ["Variable", "What it sets", "When left out"],
      rows: [["`--rco-case-size`", "The case's width. Everything on it scales with this.", "`220px`"]],
    },
  ],
  related: [
    "/docs/components/card-opening/",
    "/docs/components/card-pack/",
    "/docs/components/card-spin/",
    "/docs/effects/plans/",
    "/docs/guides/styling/",
  ],
  updated: UPDATED,
};

const effectLayer: DocPage = {
  path: "/docs/components/effect-layer/",
  section: "components",
  title: "EffectLayer",
  tagline: "a place to play effects",
  nav: "EffectLayer",
  description:
    "EffectLayer is a sheet you lay over any element to play the library's effects on it: a shockwave on a button, confetti over a page, a flash behind a card.",
  lead: "`EffectLayer` is where effects are played. It is a sheet over its nearest positioned parent that lets every press through. The openers play their [plans](/docs/effects/plans/) on one. Take its handle and the whole [library of effects](/docs/effects/library/) works anywhere: a level-up, a purchase, a streak.",
  blocks: [
    { kind: "preview", demo: { type: "effects" }, caption: "One layer, one card. Every button is one call to play." },
    { kind: "h2", text: "Usage" },
    {
      kind: "code",
      language: "tsx",
      code: `import { EffectLayer, type EffectLayerHandle } from "@react-cards-opening/ui";
import "@react-cards-opening/ui/styles.css";

function Reward() {
  const layer = useRef<EffectLayerHandle>(null);
  const prize = useRef<HTMLDivElement>(null);

  return (
    <div style={{ position: "relative" }}>
      <EffectLayer handle={layer} />
      <div ref={prize}>...</div>
      <button
        onClick={() =>
          layer.current?.play(["flash", "shockwave", "confetti"], { at: prize.current, tone: "#f5c451" })
        }
      >
        Claim
      </button>
    </div>
  );
}`,
    },
    {
      kind: "p",
      text: "The layer comes first in its parent, so what follows it is drawn over the effects: a burst comes out from behind the prize. Put the layer last to play in front instead.",
    },
    { kind: "h2", text: "play" },
    {
      kind: "p",
      text: "`play` takes one effect or a list to play at once, and where to play it. It answers the GSAP timeline, so a show can be paused, sped up, or put inside a timeline of your own.",
    },
    propsTable<PlayOptions>(
      {
        at: ["Element | { x, y } | null", "Where the effect is centred. The layer's middle when left out.", "optional"],
        size: [
          "number",
          "The width of what is celebrated, in pixels. An element given as `at` answers this itself.",
          "optional",
        ],
        ratio: [
          "number",
          "Height over width of what is celebrated: the outline `rim` and `echo` draw. 4/3 when left out.",
          "optional",
        ],
        tone: ["string", "The colour, as a plain hex. The layer's own `--rco-tone` when left out.", "optional"],
        accent: ["string", "A second colour, for effects that use two. A tint of the tone when left out.", "optional"],
        subject: [
          "HTMLElement | null",
          "What `shake`, `quake`, `punch` and `glitch` move. The layer's parent when left out.",
          "optional",
        ],
        delay: ["number", "Seconds to wait first.", "optional"],
        random: ["() => number", "The dice. A seeded one plays an effect the same way every time.", "optional"],
        blend: ['"add" | "normal"', "How lights are laid on the page. `EffectLayer` picks from its theme.", "optional"],
      },
      ["Option", "Type", "What it does"],
    ),
    { kind: "h2", text: "Props" },
    propsTable<EffectLayerProps>({
      handle: ["Ref<EffectLayerHandle>", "`play(effects, options)`, `clear()` and `element()`.", "optional"],
      theme: ["CardTheme", "On a light theme the lights are painted instead of added up.", "optional"],
      tone: ["string", "The colour effects wear when a play does not name one.", "optional"],
      className: ["string", "A class for the layer.", "optional"],
      style: ["CSSProperties", "Inline styles for the layer.", "optional"],
    }),
    { kind: "h2", text: "Without React" },
    {
      kind: "p",
      text: "`playEffects(layer, effects, options)` is the same call on any element with the class `rco-fx-layer`. `clearEffects(layer)` takes everything off and gives the canvas back: call it when the layer goes away.",
    },
    {
      kind: "code",
      language: "ts",
      code: `import { clearEffects, playEffects } from "@react-cards-opening/ui";

const timeline = playEffects(layer, "nova", { at: button, tone: "#22d3ee" });
timeline.timeScale(0.5);`,
    },
    { kind: "h2", text: "Good manners" },
    {
      kind: "list",
      items: [
        "**Reduced motion plays nothing.** The timeline comes back empty and the page stays still.",
        "**Particles share one canvas a layer**, stepped by GSAP's ticker. When the last one is gone the canvas stops drawing.",
        "**A play cleans up after itself.** Its elements are removed when it ends or is interrupted, and a stage that was shaken is put back.",
      ],
    },
  ],
  related: [
    "/docs/effects/library/",
    "/docs/effects/plans/",
    "/docs/components/card-opening/",
    "/docs/core/reduced-motion/",
  ],
  updated: UPDATED,
};

export const OPENERS: readonly DocPage[] = [cardPack, cardSpin, cardCase, effectLayer];
