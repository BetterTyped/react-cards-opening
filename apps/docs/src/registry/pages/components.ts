import type { DocPage } from "../../content/types";
import { INSTALL } from "../../site";
import { propsTable } from "../props";
import type {
  CardHuntProps,
  CardOpeningProps,
  CardProps,
  GlyphCard,
  PixelGlyphProps,
  ScanGridProps,
} from "@react-cards-opening/ui";

const UPDATED = "2026-10-11";

const overview: DocPage = {
  path: "/docs/components/",
  section: "components",
  title: "Components",
  tagline: "the reveal, drawn for you",
  nav: "Overview",
  description:
    "The components of @react-cards-opening/ui: the reveal overlay, the whole hunt, the scan grid, a card that stands still, and pixel glyphs to draw on it.",
  lead: "`@react-cards-opening/ui` is the look: five components, ten themes and one stylesheet. Every component is the one running in Hype Stack's Wrapped, checked against it pixel for pixel, and each one takes a `theme` and draws itself with no CSS framework on the page.",
  blocks: [
    { kind: "code", language: "bash", code: INSTALL },
    { kind: "code", language: "tsx", code: `import "@react-cards-opening/ui/styles.css";` },
    { kind: "h2", text: "The five" },
    {
      kind: "cards",
      items: [
        {
          path: "/docs/components/card-opening/",
          title: "CardOpening",
          text: "The reveal over the page: flight, hum, flip, and the show for the tier.",
          tier: "legendary",
        },
        {
          path: "/docs/components/card-hunt/",
          title: "CardHunt",
          text: "A grid, a scan button, the reveal and the list of finds in one piece.",
          tier: "epic",
        },
        {
          path: "/docs/components/scan-grid/",
          title: "ScanGrid",
          text: "The grid and the scan that hunts a cell down.",
          tier: "rare",
        },
        {
          path: "/docs/components/card/",
          title: "Card",
          text: "A card standing still, for a collection or a shop.",
          tier: "common",
        },
        {
          path: "/docs/components/pixel-glyph/",
          title: "PixelGlyph",
          text: "Pixel art from nine strings of nine.",
          tier: "common",
        },
      ],
    },
    { kind: "h2", text: "How they fit" },
    {
      kind: "p",
      text: "`CardHunt` is `ScanGrid` and `CardOpening` wired to [useCardOpening](/docs/core/use-card-opening/). Reach for it first. When the layout is yours (cards in a shop, a daily reward, a pack on a table), use `CardOpening` on its own and tell it where a card leaves from and where it lands.",
    },
    { kind: "preview", demo: { type: "hunt" }, caption: "CardHunt: all of them at once." },
    { kind: "h2", text: "What they share" },
    {
      kind: "list",
      items: [
        "**`theme`**: a [CardTheme](/docs/theming/). `moss` in the dark when left out.",
        "**`rarities`**: your [tiers](/docs/rarity-tiers/). The four defaults when left out.",
        "**Their own ground rules.** Each resets only the elements it renders, at one class of specificity, so a page's `button` or `p` styles do not reach in and nothing leaks out.",
        "**Pixels, not rems.** A page with a 10 pixel root font gets the same card as one with 16.",
        "**`classNames`**: a class of your own for any part, and a stylesheet where every rule weighs one class, so yours wins. [Styling by hand](/docs/guides/styling/) has the Tailwind setup.",
      ],
    },
  ],
  related: ["/docs/components/card-opening/", "/docs/components/card-hunt/", "/docs/theming/", "/docs/core/"],
  updated: UPDATED,
};

const cardOpening: DocPage = {
  path: "/docs/components/card-opening/",
  section: "components",
  title: "CardOpening",
  tagline: "the reveal overlay",
  nav: "CardOpening",
  description:
    "CardOpening plays a card's reveal over the page: it leaves an element you name, turns over in the middle of the screen with its tier's show, and lands.",
  lead: "`CardOpening` is the reveal itself. It renders nothing until a card is opened, then takes the screen: the card leaves an element you name, flies to the middle face down, hums, turns over with the show its tier asked for, and shrinks into the element where it belongs.",
  blocks: [
    { kind: "preview", demo: { type: "tiers" }, caption: "Each card leaves its own place and lands back on it." },
    { kind: "h2", text: "Usage" },
    {
      kind: "code",
      language: "tsx",
      code: `import { useCardOpening, useOpenedCards } from "@react-cards-opening/core";
import { CardOpening, themeOf } from "@react-cards-opening/ui";

function Shop({ cards }) {
  const { opened, open } = useOpenedCards("shop");
  const hunt = useCardOpening({ cards, opened, onOpen: open });
  const places = useRef(new Map<string, HTMLElement>());

  return (
    <>
      {cards.map((card) => (
        <button
          key={card.id}
          ref={(element) => element && places.current.set(card.id, element)}
          onClick={() => hunt.start([card.id])}
        >
          Open
        </button>
      ))}
      <CardOpening
        opening={hunt.opening}
        theme={themeOf("grape", "dark")}
        launch={(card) => places.current.get(card.id) ?? null}
        landing={(card) => places.current.get(card.id) ?? null}
      />
    </>
  );
}`,
    },
    { kind: "h2", text: "Props" },
    propsTable<CardOpeningProps<GlyphCard>>({
      opening: ["Opening", "The rules, from `useCardOpening`."],
      theme: ["CardTheme", "The colours. `moss` in the dark by default.", "optional"],
      rarities: ["readonly RarityTier[]", "Your tiers. The four defaults otherwise.", "optional"],
      launch: [
        "(card, show) => HTMLElement | CardLaunch | null",
        "Where the card comes out of. Asked once per card. With nothing, the card grows out of the middle of the screen.",
        "optional",
      ],
      landing: [
        "(card) => HTMLElement | null",
        "Where the card goes. Asked for a few frames running, since the element may not be rendered yet. With nowhere, the card fades out.",
        "optional",
      ],
      renderFace: [
        "(card, info) => ReactNode",
        "The front. Rows with the class `rco-line` rise in as it turns.",
        "optional",
      ],
      renderBack: ["(card) => ReactNode", "The back, instead of the question glyph.", "optional"],
      noteOf: ["(card) => string | undefined", "A small last line on the ready-made face.", "optional"],
      readingOf: [
        "(card, info) => readonly string[]",
        "The text on a face of your own, so the card stays up long enough to read.",
        "optional",
      ],
      labels: ["Partial<CardOpeningLabels>", "What a screen reader and a tooltip say.", "optional"],
      classNames: [
        "CardOpeningClassNames",
        "A class of your own for each part. See [Styling by hand](/docs/guides/styling/).",
        "optional",
      ],
      width: ["number", "The card's width in pixels. 300 by default, 78% of a narrow screen at most.", "optional"],
      ratio: ["number", "Height over width. 4 / 3 by default.", "optional"],
      container: ["Element | null", "Where the overlay mounts. The document's body by default.", "optional"],
    }),
    { kind: "h2", text: "Something to play first" },
    {
      kind: "p",
      text: "`launch` can return more than an element. Hand back a GSAP timeline as `lead` and the card waits for it: a lid lifting, a pack tearing, a scan closing in. `release` is called when the card has landed or the run was stopped, to put things back.",
    },
    {
      kind: "code",
      language: "tsx",
      code: `<CardOpening
  opening={hunt.opening}
  launch={(card, { tone }) => {
    const box = boxRef.current;
    if (!box) return null;
    const lead = gsap.timeline();
    lead.to(box, { rotate: -6, duration: 0.08, yoyo: true, repeat: 5 });
    lead.to(box, { boxShadow: \`0 0 40px 6px \${tone}\`, duration: 0.3 });
    return { element: box, lead, release: () => gsap.set(box, { clearProps: "all" }) };
  }}
/>`,
    },
    {
      kind: "p",
      text: "The second argument says what is about to happen: `tone` is the tier's colour on the theme, `plan` is its [show plan](/docs/core/show-plan/), and `reduced` is whether motion is reduced.",
    },
    { kind: "h2", text: "Presses" },
    {
      kind: "p",
      text: "The card is a button and the dimmed page behind it is the backdrop. What each press does is decided by [the rules](/docs/core/use-card-opening/): face down, a press turns the card; face up, it sends it home; a press beside it stops the run.",
    },
    { kind: "h2", text: "Looking at a card again" },
    {
      kind: "code",
      language: "tsx",
      code: `<button onClick={(event) => hunt.peek(card.id, event.currentTarget)}>{card.name}</button>`,
    },
    {
      kind: "p",
      text: "A peek brings an opened card up out of what was pressed, face up, with no turn. It stays until a press on it, a press beside it or Escape sends it back, and focus returns to where it came from.",
    },
    {
      kind: "faq",
      items: [
        {
          question: "Can two openings be on one page?",
          answer:
            "Yes. Each `useCardOpening` has its own rules and each `CardOpening` its own overlay. Nothing is kept on `window`.",
        },
        {
          question: "Why does the card not fly to my landing element?",
          answer:
            "`landing` returned null for thirty frames running, or motion is reduced. Check that the element is rendered by the time the card turns over: it is asked for after `onOpen` fires.",
        },
        {
          question: "Does it lock scrolling?",
          answer:
            "No. The backdrop takes presses while a card is up, and positions are measured when the card leaves and again when it lands, so a page that scrolled in between is still right.",
        },
      ],
    },
  ],
  related: [
    "/docs/guides/origin-and-landing/",
    "/docs/guides/custom-card-face/",
    "/docs/core/use-card-opening/",
    "/docs/effects/",
  ],
  updated: UPDATED,
};

const cardHunt: DocPage = {
  path: "/docs/components/card-hunt/",
  section: "components",
  title: "CardHunt",
  tagline: "the whole hunt in one piece",
  nav: "CardHunt",
  description:
    "CardHunt is a grid with cards hidden in it, a button that scans for them, the reveal for each one found, and a list of finds that can be opened again.",
  lead: "`CardHunt` is the whole experience in one component. Cards hide in a grid. A button starts a scan that finds them one by one, each with the reveal its tier calls for. Afterwards the panel stays: the finds are listed, each can be looked at again, and the scan can be run again from a blank grid.",
  blocks: [
    { kind: "preview", demo: { type: "hunt" }, caption: "Five cards are in there. Press the button." },
    { kind: "h2", text: "Usage" },
    {
      kind: "code",
      language: "tsx",
      code: `import { useOpenedCards } from "@react-cards-opening/core";
import { CardHunt, themeOf } from "@react-cards-opening/ui";

function Hunt({ cards, activity }) {
  const { opened, open } = useOpenedCards("deal:ada:2026");
  return (
    <CardHunt
      cards={cards}
      opened={opened}
      onOpen={open}
      levels={activity} // 0 to 4, one per cell
      theme={themeOf("grape", "dark")}
      describeSpot={(cell) => \`day \${cell + 1}\`}
      sessionKey="deal:ada:2026:spots"
    />
  );
}`,
    },
    { kind: "h2", text: "The grid" },
    {
      kind: "p",
      text: "`levels` is the grid: one number per cell, 0 for unlit up to 4. Cells fill top to bottom, then left to right, seven to a column unless `rows` says otherwise. Cards hide on lit cells. A year of activity is the obvious grid, but it can be any data that makes a shape: a season of matches, a board, a month of orders.",
    },
    { kind: "h2", text: "Props" },
    propsTable<CardHuntProps<GlyphCard>>({
      cards: ["readonly C[]", "Every card in the deal, found or not. Each needs a `name`."],
      opened: ["readonly string[]", "Ids already opened."],
      onOpen: ["(id: string) => void", "A card was turned face up for the first time."],
      levels: ["readonly number[]", "The grid: one number per cell, 0 to 4."],
      lead: ["number", "Empty slots before the first cell, to line a calendar up with its weekday.", "optional"],
      rows: ["number", "Cells in a column. 7 by default.", "optional"],
      theme: ["CardTheme", "The colours.", "optional"],
      rarities: ["readonly RarityTier[]", "Your tiers.", "optional"],
      describeSpot: ["(cell: number) => string", 'How a cell reads on a card and a badge: "Mar 14".', "optional"],
      actions: ["ReactNode", "Extra buttons in the header, next to the scan button.", "optional"],
      sessionKey: [
        "string | null",
        "Where this visit remembers each card's cell, so replays reopen the same tiles.",
        "optional",
      ],
      hero: ["boolean", "The hunt is the page: bigger type, and it fills the box it is given.", "optional"],
      onRunChange: ["(running: boolean) => void", "A scan started or came to rest.", "optional"],
      labels: ["Partial<CardHuntLabels>", "Every word in the panel.", "optional"],
      landing: [
        "(card) => HTMLElement | null",
        "Where a found card lands instead of its badge. Answer null and it fades out.",
        "optional",
      ],
      renderFace: ["(card, info) => ReactNode", "The front of the card.", "optional"],
      renderBack: ["(card) => ReactNode", "The back of the card.", "optional"],
      readingOf: ["(card, info) => readonly string[]", "The text on a face of your own.", "optional"],
      className: ["string", "Added to the panel.", "optional"],
      classNames: [
        "CardHuntClassNames",
        "A class of your own for each part: the panel's, the grid's and the reveal's. See [Styling by hand](/docs/guides/styling/).",
        "optional",
      ],
      style: ["CSSProperties", "Added to the panel.", "optional"],
    }),
    { kind: "h2", text: "As the page" },
    {
      kind: "p",
      text: "With `hero`, the hunt is what the visitor came for. The headline is larger, and the panel fills the height of its container with the grid in the middle. Give the container a height.",
    },
    { kind: "preview", demo: { type: "hunt", hero: true, only: ["rare", "legendary"] } },
    { kind: "h2", text: "What the buttons do" },
    {
      kind: "table",
      head: ["Button", "When", "What it does"],
      rows: [
        ["Scan", "Cards are still hidden", "Finds them one after another."],
        ["Find all", "During a scan with more to come", "Skips the show and opens the rest at once."],
        ["Scan again", "Everything is found", "Replays from a blank grid. Each card comes out of the same tile."],
        ["A badge or a lit cell", "After a find", "Brings that card up again."],
      ],
    },
    { kind: "h2", text: "Your own words" },
    {
      kind: "p",
      text: "Every line in the panel comes from `labels`. The headline and the subline are functions of where the hunt stands, so they can count. [Labels and translation](/docs/guides/labels-and-translation/) lists them all.",
    },
    {
      kind: "code",
      language: "tsx",
      code: `<CardHunt
  labels={{
    headline: ({ pending, running }) => (running ? "Looking..." : \`\${pending} left to find\`),
    scan: () => "Search the board",
    found: (where) => \`Was on \${where}\`,
  }}
  {...rest}
/>`,
    },
  ],
  related: [
    "/docs/components/scan-grid/",
    "/docs/components/card-opening/",
    "/docs/guides/labels-and-translation/",
    "/docs/core/spots/",
  ],
  updated: UPDATED,
};

const scanGrid: DocPage = {
  path: "/docs/components/scan-grid/",
  section: "components",
  title: "ScanGrid",
  tagline: "a grid and the scan over it",
  nav: "ScanGrid",
  description:
    "ScanGrid draws a grid of cells and the scan that hunts one down: a beam that sweeps and doubles back, a reticle that locks on, and a cell that cracks.",
  lead: "`ScanGrid` is the grid a hunt happens on, and the scan that finds things in it. On its own it draws cells in five levels of a theme's ramp. Through its handle, `seek` hunts one cell down and hands back what a `CardOpening` needs to send a card out of it.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "scan", tier: "rare" },
      caption: "The grid alone. Press Scan to hunt a cell down.",
    },
    { kind: "h2", text: "Usage" },
    {
      kind: "code",
      language: "tsx",
      code: `import { ScanGrid, type ScanGridHandle } from "@react-cards-opening/ui";

const scan = useRef<ScanGridHandle>(null);
const [veiled, setVeiled] = useState(true);

<ScanGrid handle={scan} levels={levels} veiled={veiled} onUnveil={() => setVeiled(false)} />;`,
    },
    { kind: "h2", text: "With CardOpening" },
    {
      kind: "p",
      text: "`seek` returns `{ element, lead, release }`, which is exactly what `launch` on `CardOpening` takes. The card waits for the scan, then lifts out of the cell.",
    },
    {
      kind: "code",
      language: "tsx",
      code: `<CardOpening
  opening={hunt.opening}
  launch={(card, show) => scan.current?.seek(cellOf(card), show) ?? null}
/>`,
    },
    { kind: "h2", text: "Props" },
    propsTable<ScanGridProps>({
      levels: [
        "readonly number[]",
        "One number per cell, 0 (unlit) to 4. Cells fill top to bottom, then left to right.",
      ],
      lead: ["number", "Empty slots before the first cell.", "optional"],
      rows: ["number", "Cells in a column. 7 by default.", "optional"],
      theme: ["CardTheme", "The colours.", "optional"],
      tone: ["string", "The colour of the lock and the crack: the hunted card's tier.", "optional"],
      veiled: ["boolean", "Blank until the beam has passed.", "optional"],
      onUnveil: ["() => void", "The beam finished its first pass. Stop veiling.", "optional"],
      idle: ["boolean", "Nothing is being hunted: the grid may twitch and sparkle.", "optional"],
      markers: ["ReadonlyMap<number, ScanMarker>", "Found cells by index: `{ id, name, colour }`.", "optional"],
      onMarkerPress: ["(marker, element) => void", "A found cell was pressed.", "optional"],
      markersDisabled: ["boolean", "Found cells cannot be pressed for now.", "optional"],
      markerLabel: ["(name: string) => string", "What a screen reader calls a found cell.", "optional"],
      handle: ["Ref<ScanGridHandle>", "Where `seek`, `reset` and `cell` are handed out.", "optional"],
      className: ["string", "Added to the grid's root.", "optional"],
      classNames: ["ScanGridClassNames", "A class of your own for each part of the grid.", "optional"],
      style: ["CSSProperties", "Added to the grid's root.", "optional"],
    }),
    { kind: "h2", text: "The handle" },
    {
      kind: "table",
      head: ["Method", "What it does"],
      rows: [
        [
          "`seek(cell, show, options?)`",
          "Hunts the cell down and returns `{ element, lead, release }`, or null when the grid has no such cell. `options.onLock` fires when the beam settles; `options.flash` is an element to flash on a loud find.",
        ],
        ["`reset()`", "Forgets which cells the beam has lit, so a veiled grid is blank again."],
        ["`cell(index)`", "The element of a cell."],
      ],
    },
    { kind: "h2", text: "Blank until scanned" },
    {
      kind: "p",
      text: "A `veiled` grid shows every cell as unlit until the beam has crossed it. The first `seek` on a veiled grid sweeps the whole width, and `onUnveil` fires when it is done. While veiled and idle, a few cells shift by a pixel now and then: something is in there.",
    },
    { kind: "h2", text: "Other shapes" },
    {
      kind: "code",
      language: "tsx",
      code: `// A board: five rows, twelve columns.
<ScanGrid levels={board} rows={5} />

// A calendar whose first day is a Wednesday.
<ScanGrid levels={year} lead={3} />`,
    },
  ],
  related: ["/docs/effects/beam-and-lock/", "/docs/effects/crack/", "/docs/components/card-hunt/", "/docs/core/spots/"],
  updated: UPDATED,
};

const card: DocPage = {
  path: "/docs/components/card/",
  section: "components",
  title: "Card",
  tagline: "a card standing still",
  nav: "Card",
  description:
    "Card draws a card that is not being opened: for a collection, a shop or a list of pulls. Same face, same foil border and shine, drawn with CSS alone.",
  lead: "`Card` is the card when nothing is happening to it. It is the same face the reveal turns over, at any size, for a collection page, a shop shelf or a list of what was pulled. A legendary keeps its turning foil border and its shine, on CSS animations, so a wall of them costs no JavaScript.",
  blocks: [
    { kind: "preview", demo: { type: "cards" }, caption: "One of each tier. The button turns them over." },
    { kind: "h2", text: "Usage" },
    {
      kind: "code",
      language: "tsx",
      code: `import { Card, themeOf } from "@react-cards-opening/ui";

<Card card={card} theme={themeOf("grape", "dark")} width={220} />

// Face down until it is opened.
<Card card={card} faceDown={!opened.includes(card.id)} width="100%" />`,
    },
    { kind: "h2", text: "Props" },
    propsTable<CardProps>({
      card: ["GlyphCard", "A card for the ready-made face: `name`, `line`, `art`.", "optional"],
      rarity: ["string", "The tier, when there is no `card` or to override its own.", "optional"],
      rarities: ["readonly RarityTier[]", "Your tiers.", "optional"],
      theme: ["CardTheme", "The colours.", "optional"],
      tone: ["string", "The card's colour, instead of the tier's on the theme.", "optional"],
      note: ["string", "A small last line on the ready-made face.", "optional"],
      faceDown: ["boolean", "Show the back. Changing it turns the card over.", "optional"],
      width: ["number | string", "Any CSS width. 300 pixels by default.", "optional"],
      ratio: ["number", "Height over width. 4 / 3 by default.", "optional"],
      back: ["ReactNode", "The back, instead of the question glyph.", "optional"],
      className: ["string", "Added to the card.", "optional"],
      classNames: ["CardClassNames", "A class of your own for each part of the card.", "optional"],
      style: ["CSSProperties", "Added to the card.", "optional"],
      children: [
        "ReactNode | ((info) => ReactNode)",
        "A face of your own. As a function it is given the tone and the tier.",
        "optional",
      ],
    }),
    { kind: "h2", text: "It scales" },
    {
      kind: "p",
      text: "A `Card` is designed at 300 pixels wide and everything on it scales with its width: type, padding, corners, the glyph. A card 150 pixels wide is the same card at half size, which is also why a revealed card can shrink into one without a jump.",
    },
    { kind: "h2", text: "A face of your own" },
    {
      kind: "code",
      language: "tsx",
      code: `<Card rarity="epic" theme={theme}>
  {({ tone, tier }) => (
    <>
      <img src={art} alt="" style={{ flex: 1, objectFit: "cover", borderRadius: 12 }} />
      <p style={{ color: tone }}>{tier.label}</p>
    </>
  )}
</Card>`,
    },
    {
      kind: "p",
      text: "The face is a flex column with the card's padding. [Custom card face](/docs/guides/custom-card-face/) covers sizing it so it scales with the card.",
    },
    { kind: "h2", text: "Turning it over" },
    {
      kind: "p",
      text: "Changing `faceDown` flips the card in 0.6 seconds with a small overshoot. For the full reveal, with the flight and the tier's show, hand the card's element to [CardOpening](/docs/components/card-opening/) as both `launch` and `landing`.",
    },
  ],
  related: [
    "/docs/guides/custom-card-face/",
    "/docs/components/card-opening/",
    "/docs/effects/foil-border/",
    "/docs/components/pixel-glyph/",
  ],
  updated: UPDATED,
};

const pixelGlyph: DocPage = {
  path: "/docs/components/pixel-glyph/",
  section: "components",
  title: "PixelGlyph",
  tagline: "pixel art from 81 characters",
  nav: "PixelGlyph",
  description:
    "PixelGlyph draws 9 by 9 pixel art from nine strings, in one colour. Twenty five glyphs ship with the library, and drawing your own means typing one out.",
  lead: "`PixelGlyph` is how a card gets a picture without an image file. A glyph is nine strings of nine characters: `x` for a lit pixel, `o` for a half-lit one, a dot for nothing. It is drawn in one colour, the card's tier, so the same glyph reads as common or legendary by colour alone.",
  blocks: [
    { kind: "preview", demo: { type: "glyphs" }, caption: "The twenty five that ship, by name." },
    { kind: "h2", text: "Usage" },
    {
      kind: "code",
      language: "tsx",
      code: `import { GLYPHS, PixelGlyph } from "@react-cards-opening/ui";

<PixelGlyph art={GLYPHS.dragon} colour="#f2cc60" cell={14} />`,
    },
    { kind: "h2", text: "Props" },
    propsTable<PixelGlyphProps>({
      art: ["PixelArt", "Nine strings of nine characters."],
      colour: ["string", "Lit pixels wear it. Half-lit ones wear half of it."],
      cell: ["number", "The size of one pixel. 11 by default: 14 on a card, 3 in a badge.", "optional"],
    }),
    { kind: "h2", text: "Draw your own" },
    {
      kind: "code",
      language: "ts",
      code: `import type { PixelArt } from "@react-cards-opening/ui";

export const heart: PixelArt = [
  ".........",
  ".xx...xx.",
  "xxxx.xxxx",
  "xxxxxxxxx",
  "xxxxxxxxx",
  ".xxxxxxx.",
  "..xxxxx..",
  "...xxx...",
  "....x....",
];`,
    },
    {
      kind: "p",
      text: "Use `o` for shading: the inside of a shape, a shadow under it. Nine by nine is small enough that every pixel is a decision, which is the charm of it.",
    },
    { kind: "h2", text: "Or use a picture" },
    {
      kind: "p",
      text: "Nothing requires glyphs. A card's face is a slot: put an image, an SVG or a 3D canvas in it with `renderFace`. See [Custom card face](/docs/guides/custom-card-face/).",
    },
  ],
  related: ["/docs/components/card/", "/docs/guides/custom-card-face/", "/docs/theming/", "/docs/components/"],
  updated: UPDATED,
};

export const COMPONENTS: readonly DocPage[] = [overview, cardOpening, cardHunt, scanGrid, card, pixelGlyph];
