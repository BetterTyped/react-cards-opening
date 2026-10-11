import { useState } from "react";

import { useLook } from "../components/look";
import { TIER_CARDS } from "../registry/sample";
import { Card, type CardTheme, GLYPHS, PixelGlyph, rarityColor, THEME_LIST, themeOf } from "@react-cards-opening/ui";

/** One card of each tier, standing still. */
export function CardsDemo({ theme, faceDown = false }: { theme: CardTheme; faceDown?: boolean }) {
  const [down, setDown] = useState(faceDown);
  return (
    <div className="d-cards-demo">
      <ul className="d-shelf-cards" data-count={TIER_CARDS.length}>
        {TIER_CARDS.map((card) => (
          <li key={card.id}>
            <Card card={card} theme={theme} faceDown={down} width="100%" />
          </li>
        ))}
      </ul>
      <button type="button" className="d-chip-button" onClick={() => setDown((now) => !now)}>
        {down ? "Turn them face up" : "Turn them face down"}
      </button>
    </div>
  );
}

/** Every glyph in the set, with the name it is asked for by. */
export function GlyphsDemo({ theme }: { theme: CardTheme }) {
  return (
    <ul className="d-glyphs">
      {Object.entries(GLYPHS).map(([id, art]) => (
        <li key={id}>
          <PixelGlyph art={art} colour={theme.levels[4]} cell={6} />
          <code>{id}</code>
        </li>
      ))}
    </ul>
  );
}

/** Every theme as a tile: its ramp, its rarity colours, its name. Picking one changes every preview. */
export function ThemesDemo({ theme }: { theme: CardTheme }) {
  const { look, setLook } = useLook();
  return (
    <div className="d-themes-demo">
      <ul className="d-themes">
        {THEME_LIST.map(({ id, label }) => {
          const tile = themeOf(id, look.mode);
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={look.theme === id}
                onClick={() => setLook({ ...look, theme: id })}
                style={{ background: tile.bg, color: tile.fg }}
              >
                <span className="d-theme-ramp" aria-hidden>
                  {tile.levels.map((level) => (
                    <i key={level} style={{ background: level }} />
                  ))}
                </span>
                <span className="d-theme-tiers" aria-hidden>
                  {["common", "rare", "epic", "legendary"].map((tier) => (
                    <i key={tier} style={{ background: rarityColor(tile, tier) }} />
                  ))}
                </span>
                <strong>{label}</strong>
                <code>{id}</code>
              </button>
            </li>
          );
        })}
      </ul>
      <ul className="d-shelf-cards" data-count={TIER_CARDS.length}>
        {TIER_CARDS.map((card) => (
          <li key={card.id}>
            <Card card={card} theme={theme} width="100%" />
          </li>
        ))}
      </ul>
    </div>
  );
}
