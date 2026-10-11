import type { CSSProperties } from "react";

import type { PixelArt } from "./glyphs";

export interface PixelGlyphProps {
  /** Nine strings of nine characters: "x" lit, "o" half lit, "." off. */
  art: PixelArt;
  /** Lit pixels wear it. Half-lit ones wear half of it. */
  colour: string;
  /** The size of one pixel. 14 makes a glyph about 150 pixels wide; 3 fits a badge. */
  cell?: number;
}

/**
 * Pixel art from nine strings of nine. It is drawn in one colour: lit pixels wear it, half-lit ones wear half of it.
 * On a card standing still it scales with the card, like everything else on the face.
 */
export function PixelGlyph({ art, colour, cell = 11 }: PixelGlyphProps) {
  return (
    <span
      className="rco-glyph"
      style={
        {
          "--rco-glyph": colour,
          "--rco-glyph-cell": cell,
          "--rco-glyph-gap": Math.max(1, Math.round(cell / 4)),
        } as CSSProperties
      }
    >
      {art
        .join("")
        .split("")
        .map((char, index) => (
          // oxlint-disable-next-line react/no-array-index-key -- a fixed 9x9 grid
          <i key={index} className="rco-glyph-pixel" data-on={char === "x" ? 2 : char === "o" ? 1 : 0} />
        ))}
    </span>
  );
}
