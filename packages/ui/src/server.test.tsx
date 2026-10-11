import { renderToString } from "react-dom/server";

import { Card } from "./card";
import { CardCase } from "./card-case";
import { CardHunt } from "./card-hunt";
import { CardOpening } from "./card-opening";
import { CardPack } from "./card-pack";
import { CardSpin } from "./card-spin";
import { CardWheel } from "./card-wheel";
import { EffectLayer } from "./effect-layer";
import { EFFECT_SETS, playEffects } from "./effects";
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

  it("renders a sealed pack, and a pack somebody already started as dealt", () => {
    const sealed = renderToString(<CardPack cards={CARDS} opened={[]} onOpen={noop} effects={EFFECT_SETS.radiant} />);
    const started = renderToString(<CardPack cards={CARDS} opened={["fox"]} onOpen={noop} />);

    expect(sealed).toContain('data-stage="sealed"');
    expect(sealed).toContain("2 cards inside. Press the pack.");
    expect(started).toContain('data-stage="dealt"');
    expect(started).toContain("Lantern Fox");
    expect(started.match(/rco-pack-seat/g)).toHaveLength(2);
  });

  it("renders the wheel and the reel the way a browser would lay them out, and the case with its shelf", () => {
    const wheel = <CardWheel cards={CARDS} opened={[]} onOpen={noop} segments={6} />;
    expect(renderToString(wheel)).toBe(renderToString(wheel));
    expect(renderToString(wheel).match(/rco-wheel-wedge/g)).toHaveLength(6);

    const reel = <CardSpin cards={CARDS} opened={[]} onOpen={noop} />;
    const chest = renderToString(<CardCase cards={CARDS} opened={["fox"]} onOpen={noop} />);

    expect(renderToString(reel)).toBe(renderToString(reel));
    expect(renderToString(reel).match(/rco-reel-tile/g)?.length).toBeGreaterThan(40);
    expect(chest).toContain("rco-case-lid");
    expect(chest.match(/rco-shelf-slot/g)).toHaveLength(2);
  });

  it("renders an effect layer as an empty sheet, and plays nothing where there is no page", () => {
    const html = renderToString(<EffectLayer tone="#f5c451" />);

    expect(html).toContain("rco-fx-layer");
    expect(html).not.toContain("canvas");
    expect(playEffects({} as HTMLElement, "confetti").duration()).toBe(0);
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
