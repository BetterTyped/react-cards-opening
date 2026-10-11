import type { CSSProperties, ReactNode } from "react";

import { GLYPHS, type PixelArt } from "./glyphs";
import { PixelGlyph } from "./pixel-glyph";
import { type CardTheme, DEFAULT_THEME, rarityColor, themeStyle } from "./theme";
import type { CardFaceInfo, GlyphCard } from "./types";
import { DEFAULT_RARITIES, type RarityTier, tierOf } from "@react-cards-opening/core";

/** Holds a row open when it has nothing to say, so every card's rows line up. */
const NBSP = "\u00A0";

/**
 * The rows of the ready-made face: a glyph in the room that is left, then the name, the rarity as a word, a line of
 * text and a small note. Each row has the class `rco-line`, which is what rises in when a card turns over. Give your
 * own rows that class and they rise in with them.
 */
export function CardContent({
  art,
  name,
  rarity,
  line,
  note,
  tone,
}: {
  art?: PixelArt;
  name: string;
  /** The tier as a word, under the name, in normal case. */
  rarity?: string;
  line?: string;
  note?: string;
  tone: string;
}) {
  return (
    <>
      <div className="rco-line rco-card-art">{art ? <PixelGlyph art={art} colour={tone} cell={14} /> : null}</div>
      <p className="rco-line rco-card-name">{name}</p>
      <p className="rco-line rco-card-rarity">{rarity ?? NBSP}</p>
      <p className="rco-line rco-card-text">{line}</p>
      <p className="rco-line rco-card-note">{note ?? NBSP}</p>
    </>
  );
}

/** What a card wears face down: the question glyph in the theme's accent. */
export function CardBackContent({ theme }: { theme: CardTheme }) {
  return <PixelGlyph art={GLYPHS.question} colour={theme.levels[4]} cell={12} />;
}

export interface CardProps {
  /** A card for the ready-made face: `name`, `line`, `art`. */
  card?: GlyphCard;
  /** The tier, when there is no `card`, or to override its own. */
  rarity?: string;
  rarities?: readonly RarityTier[];
  theme?: CardTheme;
  /** The card's colour, instead of its tier's colour on the theme. */
  tone?: string;
  /** A small last line on the ready-made face. */
  note?: string;
  /** Show the back. Changing it turns the card over. */
  faceDown?: boolean;
  /** Any CSS width. The height follows from `ratio`, and everything on the card scales with it. */
  width?: number | string;
  /** Height over width. */
  ratio?: number;
  /** What the back shows instead of the question glyph. */
  back?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** A face of your own. As a function it is given the tone and the tier. */
  children?: ReactNode | ((info: CardFaceInfo) => ReactNode);
}

/**
 * A card standing still: for a collection, a shop, a list of what was pulled. It is the same card the opening
 * turns over, at any size, down to the legendary's turning foil border and shine, drawn here with CSS alone.
 */
export function Card({
  card,
  rarity,
  rarities = DEFAULT_RARITIES,
  theme = DEFAULT_THEME,
  tone,
  note,
  faceDown = false,
  width = 300,
  ratio = 4 / 3,
  back,
  className,
  style,
  children,
}: CardProps) {
  const tier = tierOf(rarities, rarity ?? card?.rarity ?? "");
  const info: CardFaceInfo = { tone: tone ?? rarityColor(theme, tier.id), tier, note };
  const legendary = tier.effect === "legendary";
  let face: ReactNode = null;
  if (typeof children === "function") face = children(info);
  else if (children !== undefined && children !== null) face = children;
  else if (card) {
    face = (
      <CardContent art={card.art} name={card.name} rarity={tier.label} line={card.line} note={note} tone={info.tone} />
    );
  }
  return (
    <div
      className={className ? `rco-root rco-card ${className}` : "rco-root rco-card"}
      data-effect={tier.effect}
      data-down={faceDown ? "" : undefined}
      style={
        { ...themeStyle(theme), "--rco-tone": info.tone, width, aspectRatio: `1 / ${ratio}`, ...style } as CSSProperties
      }
    >
      {legendary ? (
        <div className="rco-legend-border" aria-hidden>
          <i className="rco-legend-spin" />
        </div>
      ) : null}
      <div className="rco-flyer-inner">
        <div className="rco-face">
          {legendary ? <i className="rco-foil" aria-hidden /> : null}
          {face}
        </div>
        <div className="rco-back">{back ?? <CardBackContent theme={theme} />}</div>
      </div>
    </div>
  );
}
