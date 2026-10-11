import { useRef, useState } from "react";

import { cardOfTier, TIER_CARDS } from "../registry/sample";
import {
  Card,
  type CardTheme,
  EFFECT_KINDS,
  EFFECT_LIST,
  EffectLayer,
  type EffectLayerHandle,
  type EffectName,
  rarityColor,
} from "@react-cards-opening/ui";

/**
 * Every effect in the library on one stage: a card, a layer behind it, and a button for each effect. The tier
 * picks the colour they play in.
 */
export function EffectsDemo({ theme }: { theme: CardTheme }) {
  const layer = useRef<EffectLayerHandle>(null);
  const place = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState("legendary");
  const [last, setLast] = useState<EffectName | null>(null);
  const play = (name: EffectName) => {
    setLast(name);
    layer.current?.play(name, { at: place.current, tone: rarityColor(theme, tier), accent: theme.levels[4] });
  };

  return (
    <div className="d-fx">
      <div className="d-fx-room">
        <EffectLayer handle={layer} theme={theme} />
        <div ref={place} className="d-fx-card">
          <Card card={cardOfTier(tier)} theme={theme} width="100%" />
        </div>
      </div>
      <div className="d-fx-chips" role="group" aria-label="The colour effects play in">
        {TIER_CARDS.map((card) => (
          <button
            key={card.rarity}
            type="button"
            className="d-chip-button"
            aria-pressed={card.rarity === tier}
            onClick={() => setTier(card.rarity)}
          >
            <i className="d-fx-dot" style={{ background: rarityColor(theme, card.rarity) }} />
            {card.rarity}
          </button>
        ))}
      </div>
      {EFFECT_KINDS.map(({ kind, label }) => (
        <div key={kind} className="d-fx-group">
          <p className="d-fx-kind">{label}</p>
          <div className="d-fx-chips">
            {EFFECT_LIST.filter((effect) => effect.kind === kind).map((effect) => (
              <button
                key={effect.name}
                type="button"
                className="d-chip-button"
                aria-pressed={effect.name === last}
                title={effect.about}
                onClick={() => play(effect.name)}
              >
                {effect.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
