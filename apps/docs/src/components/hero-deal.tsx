import { type CSSProperties, useMemo, useState } from "react";

import { CardShelf } from "../demos/card-shelf";
import { SAMPLE_CARDS } from "../registry/sample";
import { useLookTheme } from "./look";
import { DEFAULT_RARITIES } from "@react-cards-opening/core";
import { rarityColor } from "@react-cards-opening/ui";

/**
 * The first thing on the site: one card, face down, and the six tiers to deal it from. Pressing the card is the
 * whole pitch, so nothing else on the stage asks for attention.
 */
export function HeroDeal() {
  const theme = useLookTheme();
  const [tier, setTier] = useState("legendary");
  // Which card of the tier is on the table. Dealing again takes the next one.
  const [round, setRound] = useState(0);
  const ofTier = SAMPLE_CARDS.filter((card) => card.rarity === tier);
  const card = ofTier[round % ofTier.length] ?? SAMPLE_CARDS[0];
  const cards = useMemo(() => [card], [card]);

  return (
    <div
      className="d-deal"
      style={{ background: theme.bg, color: theme.fg, "--rco-accent": theme.levels[4] } as CSSProperties}
    >
      <div className="d-deal-table">
        <CardShelf key={`${tier}-${round}`} cards={cards} theme={theme} />
      </div>
      <div className="d-deal-bar">
        <div role="group" aria-label="Tier to deal" className="d-deal-tiers">
          {DEFAULT_RARITIES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-pressed={tier === entry.id}
              onClick={() => {
                setTier(entry.id);
                setRound(0);
              }}
              style={{ "--tone": rarityColor(theme, entry.id) } as CSSProperties}
            >
              <i aria-hidden />
              <span>{entry.label}</span>
            </button>
          ))}
        </div>
        <button type="button" className="d-chip-button" onClick={() => setRound((now) => now + 1)}>
          Deal another
        </button>
      </div>
    </div>
  );
}
