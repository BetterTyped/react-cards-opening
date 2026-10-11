import { type ReactNode, useMemo, useState } from "react";

import type { Demo } from "../content/types";
import { CardShelf } from "../demos/card-shelf";
import { CustomFaceDemo, CustomTiersDemo } from "../demos/custom";
import { EffectsDemo } from "../demos/effects";
import { HeadlessDemo } from "../demos/headless";
import { HuntDemo, StyledHuntDemo } from "../demos/hunt";
import { CaseDemo, EffectSetsDemo, PackDemo, SpinDemo, WheelDemo } from "../demos/openers";
import { ScanDemo } from "../demos/scan";
import { CardsDemo, GlyphsDemo, ThemesDemo } from "../demos/static";
import { cardOfTier, TIER_CARDS } from "../registry/sample";
import { LookControls, useLookTheme } from "./look";

/*
 * The live previews. Every one of them is the library itself, in whatever theme and mode the reader last picked:
 * the choice follows them from page to page.
 */

/** A demo that is its own panel: it brings its ground and its corners, so it sits on the plate without a stage. */
const isPanel = (demo: Demo) => ["hunt", "styled", "pack", "spin", "wheel", "case"].includes(demo.type);

/** One card of a tier on a shelf of its own. */
function OneCard({ tier }: { tier: string }) {
  const theme = useLookTheme();
  const cards = useMemo(() => [cardOfTier(tier)], [tier]);
  return <CardShelf cards={cards} theme={theme} />;
}

function DemoView({ demo }: { demo: Demo }): ReactNode {
  const theme = useLookTheme();
  switch (demo.type) {
    case "hunt":
      return <HuntDemo theme={theme} only={demo.only} hero={demo.hero} />;
    case "open":
      return <OneCard tier={demo.tier} />;
    case "tiers":
      return <CardShelf cards={TIER_CARDS} theme={theme} />;
    case "cards":
      return <CardsDemo theme={theme} faceDown={demo.faceDown} />;
    case "scan":
      return <ScanDemo theme={theme} tier={demo.tier} />;
    case "glyphs":
      return <GlyphsDemo theme={theme} />;
    case "themes":
      return <ThemesDemo theme={theme} />;
    case "headless":
      return <HeadlessDemo theme={theme} />;
    case "custom-face":
      return <CustomFaceDemo theme={theme} />;
    case "custom-tiers":
      return <CustomTiersDemo theme={theme} />;
    case "styled":
      return <StyledHuntDemo theme={theme} />;
    case "pack":
      return <PackDemo theme={theme} />;
    case "spin":
      return <SpinDemo theme={theme} />;
    case "wheel":
      return <WheelDemo theme={theme} />;
    case "case":
      return <CaseDemo theme={theme} />;
    case "effects":
      return <EffectsDemo theme={theme} />;
    case "effect-sets":
      return <EffectSetsDemo theme={theme} />;
  }
}

/** A demo on the ground it is meant to be seen on: the theme's own, so a card looks the way it will in a page. */
export function DemoStage({ demo }: { demo: Demo }) {
  const theme = useLookTheme();
  if (isPanel(demo)) return <DemoView demo={demo} />;
  return (
    <div className="d-stage" style={{ background: theme.bg, color: theme.fg }}>
      <DemoView demo={demo} />
    </div>
  );
}

/** A preview on a page: the demo, what to do with it, and the controls that change how every preview looks. */
export function Preview({ demo, caption }: { demo: Demo; caption?: string }) {
  // A new key is a new demo: every card unopened again.
  const [round, setRound] = useState(0);
  return (
    <figure className="d-preview">
      <div className="d-preview-plate">
        <DemoStage key={round} demo={demo} />
      </div>
      <figcaption>
        {caption ? <p>{caption}</p> : <span />}
        <div className="d-preview-tools">
          <LookControls />
          <button type="button" className="d-chip-button" onClick={() => setRound((now) => now + 1)}>
            Start over
          </button>
        </div>
      </figcaption>
    </figure>
  );
}
