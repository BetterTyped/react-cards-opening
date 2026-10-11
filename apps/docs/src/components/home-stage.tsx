import { useEffect, useRef, useState } from "react";

import { HuntDemo } from "../demos/hunt";
import { CaseDemo, PackDemo, SpinDemo, WheelDemo } from "../demos/openers";
import { SiteLink } from "./site-link";
import { type CardTheme, EffectLayer, type EffectLayerHandle } from "@react-cards-opening/ui";

/**
 * The air behind the hero's hand of cards: the library's own effects, played softly and for good. Lights drift up
 * through it, and now and then a few stars. Nothing plays for a reader who asked for less motion, or while the tab
 * is out of sight.
 */
export function HeroAir({ theme }: { theme: CardTheme }) {
  const layer = useRef<EffectLayerHandle>(null);
  const tone = theme.levels[4];

  useEffect(() => {
    let round = 0;
    const breathe = () => {
      if (document.visibilityState !== "visible") return;
      layer.current?.play(round % 3 === 2 ? "stardust" : "fireflies", { tone, size: 420 });
      round += 1;
    };
    breathe();
    const timer = setInterval(breathe, 3400);
    return () => clearInterval(timer);
  }, [tone]);

  return (
    <div className="h-air" aria-hidden>
      <EffectLayer handle={layer} theme={theme} />
    </div>
  );
}

const OPENERS = [
  {
    id: "pack",
    label: "Pack",
    line: "A sealed pack bursts and deals its cards face down. Turn them in any order.",
    path: "/docs/components/card-pack/",
  },
  {
    id: "wheel",
    label: "Wheel",
    line: "A wheel of prizes turns under a pointer and lands on the card that was dealt.",
    path: "/docs/components/card-wheel/",
  },
  {
    id: "reel",
    label: "Reel",
    line: "A strip of tiles races past a marker, slows, and stops on yours.",
    path: "/docs/components/card-spin/",
  },
  {
    id: "case",
    label: "Case",
    line: "A case shakes, the lid lifts, and its cards come out one after another.",
    path: "/docs/components/card-case/",
  },
  {
    id: "hunt",
    label: "Hunt",
    line: "A beam sweeps a grid, a reticle locks on, and the cell cracks open.",
    path: "/docs/components/card-hunt/",
  },
] as const;

type OpenerId = (typeof OPENERS)[number]["id"];

function Opener({ id, theme }: { id: OpenerId; theme: CardTheme }) {
  if (id === "pack") return <PackDemo theme={theme} />;
  if (id === "wheel") return <WheelDemo theme={theme} />;
  if (id === "reel") return <SpinDemo theme={theme} />;
  if (id === "case") return <CaseDemo theme={theme} />;
  return <HuntDemo theme={theme} columns={34} />;
}

/** The five openers on one stage: pick one and it runs, with the same five cards in each. */
export function OpenerTabs({ theme }: { theme: CardTheme }) {
  const [picked, setPicked] = useState<OpenerId>("pack");
  const opener = OPENERS.find((entry) => entry.id === picked) ?? OPENERS[0];

  return (
    <div>
      <div className="h-tabs" role="tablist" aria-label="Ways to open a card">
        {OPENERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            id={`opener-tab-${entry.id}`}
            aria-selected={entry.id === picked}
            aria-controls="opener-panel"
            onClick={() => setPicked(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <div className="h-frame" role="tabpanel" id="opener-panel" aria-labelledby={`opener-tab-${picked}`}>
        <Opener key={picked} id={picked} theme={theme} />
        <div className="h-frame-foot">
          <span>{opener.line}</span>
          <SiteLink path={opener.path} className="d-pill">
            How the {opener.label.toLowerCase()} works
          </SiteLink>
        </div>
      </div>
    </div>
  );
}
