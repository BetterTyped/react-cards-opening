import { renderToString } from "react-dom/server";

import { Card } from "./card";
import { CardHunt } from "./card-hunt";
import { CardOpening } from "./card-opening";
import { GLYPHS } from "./glyphs";
import { themeOf } from "./theme";
import type { GlyphCard } from "./types";
// @vitest-environment node
import { rollCards, useCardOpening } from "@react-cards-opening/core";

const CARDS: GlyphCard[] = [
  { id: "fox", name: "Lantern Fox", rarity: "rare", line: "Knows a shortcut.", art: GLYPHS.fox },
  { id: "dragon", name: "Vault Dragon", rarity: "legendary", line: "Keeps one of every card.", art: GLYPHS.dragon },
];
const LEVELS = Array.from({ length: 70 }, (_unused, cell) => cell % 5);
const noop = () => {};

describe("on a server, where there is no window", () => {
  it("renders the whole hunt to HTML: the words, the grid, the badges", () => {
    const html = renderToString(<CardHunt cards={CARDS} opened={["fox"]} onOpen={noop} levels={LEVELS} />);

    expect(html).toContain("1 more is hiding in here.");
    expect(html.match(/rco-cell/g)?.length).toBeGreaterThanOrEqual(LEVELS.length);
    expect(html).toContain("Still hidden");
  });

  it("renders a card standing still, face up, in its theme", () => {
    const theme = themeOf("grape", "light");
    const html = renderToString(<Card card={CARDS[1]} theme={theme} />);

    expect(html).toContain("Vault Dragon");
    expect(html).toContain("Legendary");
    expect(html).toContain(theme.rarity.legendary);
  });

  it("leaves the reveal's overlay to the browser", () => {
    const html = renderToString(<Probe />);

    expect(html).not.toContain("rco-stage");
  });

  it("deals the same hand it would in a browser", () => {
    const hand = rollCards({ pool: CARDS, count: 1, seed: "ada:2026" });

    expect(hand).toEqual(rollCards({ pool: CARDS, count: 1, seed: "ada:2026" }));
  });
});

/** A hunt's own overlay is inside it; this renders one on its own to look at what it puts in the HTML. */
function Probe() {
  return (
    <div>
      <CardHunt cards={CARDS} opened={[]} onOpen={noop} levels={LEVELS} />
      <OverlayOnly />
    </div>
  );
}

function OverlayOnly() {
  // An opening nobody started: the overlay has nothing to show and, on a server, nowhere to mount.
  const { opening } = useCardOpening({ cards: CARDS, opened: [], onOpen: noop });
  return <CardOpening opening={opening} />;
}
