import type { DocPage } from "../../content/types";

const UPDATED = "2026-10-11";

const overview: DocPage = {
  path: "/docs/examples/",
  section: "examples",
  title: "Examples",
  tagline: "whole pieces to copy",
  nav: "Overview",
  description:
    "Complete, working card openings to copy: the full hunt as it runs in Hype Stack's Wrapped, a card opened from a button, and a collection that fills up.",
  lead: "Each example is a whole component, running on this page and printed in full under it. They use only what the two packages export, so anything here can be pasted into an app that has them installed. Start with the one closest to what you are building and change it.",
  blocks: [
    {
      kind: "cards",
      items: [
        {
          path: "/docs/examples/card-hunt/",
          title: "Card hunt",
          text: "The whole hunt: a grid, a scan, five cards, the finds.",
          tier: "legendary",
        },
        {
          path: "/docs/examples/open-from-a-button/",
          title: "Open from a button",
          text: "One button, one card, the smallest thing that works.",
          tier: "rare",
        },
        {
          path: "/docs/examples/collection/",
          title: "Collection",
          text: "Cards face down on a shelf that open where they lie.",
          tier: "epic",
        },
      ],
    },
    { kind: "h2", text: "The cards they deal" },
    {
      kind: "p",
      text: "Every example deals from the same made-up set of ten creatures, drawn with the [pixel glyphs](/docs/components/pixel-glyph/) that ship with the library. Swap in your own cards: a card is an `id`, a `rarity`, and whatever your face needs.",
    },
    {
      kind: "code",
      language: "ts",
      file: "cards.ts",
      code: `import { GLYPHS, type GlyphCard } from "@react-cards-opening/ui";

export const cards: GlyphCard[] = [
  { id: "moss-hedgehog", rarity: "common", name: "Moss Hedgehog", line: "Rolls into a ball at the first sign of a meeting.", art: GLYPHS.hedgehog },
  { id: "lantern-fox", rarity: "rare", name: "Lantern Fox", line: "Knows a shortcut. Will not say where it comes out.", art: GLYPHS.fox },
  { id: "ember-cat", rarity: "epic", name: "Ember Cat", line: "Sleeps on warm machines and wakes up when they fail.", art: GLYPHS.cat },
  { id: "tide-octopus", rarity: "rare", name: "Tide Octopus", line: "Eight arms, and one of them is always on the keyboard.", art: GLYPHS.octopus },
  { id: "vault-dragon", rarity: "legendary", name: "Vault Dragon", line: "Keeps one of every card ever dealt. This one is its own.", art: GLYPHS.dragon },
];`,
    },
  ],
  related: ["/docs/examples/card-hunt/", "/docs/examples/collection/", "/docs/first-opening/", "/docs/components/"],
  updated: UPDATED,
};

const cardHunt: DocPage = {
  path: "/docs/examples/card-hunt/",
  section: "examples",
  title: "Card hunt example",
  tagline: "the full hunt",
  nav: "Card hunt",
  description:
    "A complete card hunt in one file: five cards hidden in a grid, a scan that finds them, opened cards remembered on the device, and a replay.",
  lead: "This is the panel from Hype Stack's Wrapped, rebuilt from the two packages and nothing else. Five cards hide in a grid of 210 cells. The scan finds them one at a time, each with its tier's reveal, and what was opened is remembered on this device.",
  blocks: [
    { kind: "preview", demo: { type: "hunt" }, caption: "Scan, then press a badge or a lit cell to see a card again." },
    { kind: "h2", text: "The code" },
    {
      kind: "code",
      language: "tsx",
      file: "hunt.tsx",
      code: `import { useOpenedCards } from "@react-cards-opening/core";
import { CardHunt, themeOf } from "@react-cards-opening/ui";
import "@react-cards-opening/ui/styles.css";

import { cards } from "./cards";

/** Thirty weeks of activity, 0 (nothing) to 4 (a lot). Use your own data here. */
const levels = Array.from({ length: 30 * 7 }, (_unused, day) => [0, 1, 2, 0, 3, 2, 4, 1, 0, 2][(day * 7) % 10]);

const describeSpot = (cell: number) => \`week \${Math.floor(cell / 7) + 1}, day \${(cell % 7) + 1}\`;

export function Hunt() {
  // Keyed by the deal, so a new deal starts unopened.
  const { opened, open, ready } = useOpenedCards("example-deal-1");
  if (!ready) return null;
  return (
    <CardHunt
      cards={cards}
      opened={opened}
      onOpen={open}
      levels={levels}
      theme={themeOf("grape", "dark")}
      describeSpot={describeSpot}
      sessionKey="example-deal-1:spots"
    />
  );
}`,
    },
    { kind: "h2", text: "What to change first" },
    {
      kind: "list",
      items: [
        "**`levels`**: your real data. The shape of the grid is what makes the hunt feel like it belongs to the person.",
        "**`describeSpot`**: what a cell is called. A date, a match, a square of a board.",
        "**The key**: who the deal is for and when it was made.",
        "**`labels`**: the words. See [Labels and translation](/docs/guides/labels-and-translation/).",
        "**`landing`**: send found cards somewhere other than their badge. See [Origin and landing](/docs/guides/origin-and-landing/).",
      ],
    },
    { kind: "h2", text: "Take it apart" },
    {
      kind: "p",
      text: "`CardHunt` is a layout, and you may want another. The same hunt from its parts is [ScanGrid](/docs/components/scan-grid/) for the grid, [CardOpening](/docs/components/card-opening/) for the reveal and [useCardOpening](/docs/core/use-card-opening/) between them, with `scan.seek()` as the reveal's `launch`.",
    },
    {
      kind: "code",
      language: "tsx",
      code: `const scan = useRef<ScanGridHandle>(null);
const hunt = useCardOpening({ cards, opened, onOpen: open });
const [spots, setSpots] = useCardSpots("example-deal-1:spots");

<ScanGrid handle={scan} levels={levels} idle={!hunt.running} />
<button onClick={() => hunt.start()}>Scan</button>
<CardOpening
  opening={hunt.opening}
  launch={(card, show) => {
    const cell = spots[card.id] ?? pickSpot(levels, Object.values(spots));
    return scan.current?.seek(cell, show, { onLock: () => setSpots((now) => ({ ...now, [card.id]: cell })) }) ?? null;
  }}
/>`,
    },
  ],
  related: [
    "/docs/components/card-hunt/",
    "/docs/components/scan-grid/",
    "/docs/core/spots/",
    "/docs/examples/collection/",
  ],
  updated: UPDATED,
};

const fromButton: DocPage = {
  path: "/docs/examples/open-from-a-button/",
  section: "examples",
  title: "Open from a button",
  tagline: "the smallest opening",
  nav: "Open from a button",
  description:
    "The smallest working card opening: one button that deals a card by rarity weight and a reveal that flies out of it. About thirty lines.",
  lead: "No grid, no scan, no collection. A button deals one card from a pool, weighted by rarity, and the reveal comes out of the button. This is the shape of a daily reward, a loot drop after a level, or a thank-you after a purchase.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "open", tier: "legendary" },
      caption: "The example below, with a card in place of the button so it has somewhere to land.",
    },
    { kind: "h2", text: "The code" },
    {
      kind: "code",
      language: "tsx",
      file: "daily-card.tsx",
      code: `import { rollCards, useCardOpening } from "@react-cards-opening/core";
import { CardOpening } from "@react-cards-opening/ui";
import { useRef, useState } from "react";
import "@react-cards-opening/ui/styles.css";

import { pool } from "./cards";

export function DailyCard({ userId, today }: { userId: string; today: string }) {
  const button = useRef<HTMLButtonElement>(null);
  // The same person gets the same card all day, on any device.
  const [cards] = useState(() => rollCards({ pool, count: 1, seed: \`\${userId}:\${today}\` }));
  const [opened, setOpened] = useState<string[]>([]);
  const hunt = useCardOpening({ cards, opened, onOpen: (id) => setOpened((now) => [...now, id]) });

  return (
    <>
      <button ref={button} onClick={() => hunt.start()} disabled={hunt.running || hunt.allOpened}>
        {hunt.allOpened ? \`You got \${cards[0].name}\` : "Open today's card"}
      </button>
      <CardOpening opening={hunt.opening} launch={() => button.current} />
    </>
  );
}`,
    },
    { kind: "h2", text: "Notes" },
    {
      kind: "list",
      items: [
        "The roll is seeded with the person and the day, so a reload cannot reroll it. For a card that is worth something, roll on your server instead.",
        "There is no `landing`, so the card fades out where it is once it has been read. Add one to send it to a counter or a collection.",
        "A press on the card turns it early, a second press sends it away. Nothing here had to say so.",
      ],
    },
    { kind: "h2", text: "Show the odds" },
    {
      kind: "code",
      language: "tsx",
      code: `import { chances } from "@react-cards-opening/core";

const odds = chances(pool);

<ul>
  {pool.map((card) => (
    <li key={card.id}>
      {card.name}: {(odds.get(card.id)! * 100).toFixed(1)}%
    </li>
  ))}
</ul>`,
    },
  ],
  related: [
    "/docs/first-opening/",
    "/docs/core/rolls/",
    "/docs/guides/origin-and-landing/",
    "/docs/examples/collection/",
  ],
  updated: UPDATED,
};

const collection: DocPage = {
  path: "/docs/examples/collection/",
  section: "examples",
  title: "Collection example",
  tagline: "cards open in place",
  nav: "Collection",
  description:
    "A collection shelf where every card lies face down and opens where it lies: it lifts out of its place, turns over, and lands back face up.",
  lead: "A collection is the most natural home for a card, so it makes sense to open cards there. Each one lies face down in its slot. Press it and it lifts out, turns over in the middle of the screen, and lands back in the same slot, face up. Press an opened one to look at it again.",
  blocks: [
    { kind: "preview", demo: { type: "tiers" }, caption: "Four slots. Open them in any order." },
    { kind: "h2", text: "The code" },
    {
      kind: "code",
      language: "tsx",
      file: "collection.tsx",
      code: `import { useCardOpening, useOpenedCards, useOpeningPhase } from "@react-cards-opening/core";
import { Card, CardOpening, type GlyphCard } from "@react-cards-opening/ui";
import { useRef } from "react";
import "@react-cards-opening/ui/styles.css";

export function Collection({ cards }: { cards: GlyphCard[] }) {
  const { opened, open } = useOpenedCards("collection");
  const hunt = useCardOpening({ cards, opened, onOpen: open });
  const phase = useOpeningPhase(hunt.opening);
  const slots = useRef(new Map<string, HTMLElement>());
  const slotOf = (card: GlyphCard) => slots.current.get(card.id) ?? null;
  // While a card is in the air, its slot is empty.
  const away = hunt.current && phase !== "idle" && phase !== "lead" ? hunt.current.id : null;

  return (
    <>
      <ul className="shelf">
        {cards.map((card) => {
          const isOpen = opened.includes(card.id);
          return (
            <li key={card.id}>
              <button
                ref={(element) => {
                  if (element) slots.current.set(card.id, element);
                }}
                // Seen through, not hidden: a hidden button could not take the focus back after a peek.
                style={{ opacity: away === card.id ? 0 : 1 }}
                disabled={hunt.running}
                aria-label={isOpen ? \`Look at \${card.name} again\` : "Open this card"}
                onClick={(event) => (isOpen ? hunt.peek(card.id, event.currentTarget) : hunt.start([card.id]))}
              >
                <Card card={card} faceDown={!isOpen} width="100%" />
              </button>
            </li>
          );
        })}
      </ul>
      <CardOpening opening={hunt.opening} launch={slotOf} landing={slotOf} />
    </>
  );
}`,
    },
    {
      kind: "code",
      language: "css",
      file: "collection.css",
      code: `.shelf {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  list-style: none;
  padding: 0;
}

.shelf button {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}`,
    },
    { kind: "h2", text: "Why it looks like one card" },
    {
      kind: "list",
      items: [
        "The reveal starts at the slot's exact place and size, and the slot is see-through while its card is away. The eye reads it as the same card lifting out.",
        "A [Card](/docs/components/card/) scales everything with its width, so the revealed card and the one on the shelf are the same picture at two sizes.",
        "`faceDown` flips to false while the slot is see-through, so the card is already face up when it lands back.",
      ],
    },
    { kind: "h2", text: "Open them all" },
    {
      kind: "code",
      language: "tsx",
      code: `<button onClick={() => hunt.start()} disabled={hunt.running || hunt.allOpened}>
  Open the rest ({hunt.pending.length})
</button>`,
    },
    {
      kind: "p",
      text: "`start()` with no arguments queues every unopened card. They open one after another, each from its own slot, and a press beside a card stops the run.",
    },
  ],
  related: [
    "/docs/components/card/",
    "/docs/guides/origin-and-landing/",
    "/docs/components/card-opening/",
    "/docs/examples/card-hunt/",
  ],
  updated: UPDATED,
};

export const EXAMPLES: readonly DocPage[] = [overview, cardHunt, fromButton, collection];
