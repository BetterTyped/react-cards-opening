import type { gsap } from "gsap";

import type { PixelArt } from "./glyphs";
import type { OpeningCard, RarityTier, ShowPlan } from "@react-cards-opening/core";

/** A card the ready-made face knows how to draw: a glyph, a name, a line of text. */
export interface GlyphCard extends OpeningCard {
  name: string;
  /** One or two sentences under the name. Three lines of it show; the rest is cut. */
  line?: string;
  art?: PixelArt;
}

/** What a reveal is about to look like, handed to whatever the card comes out of. */
export interface CardShow {
  /** The colour of the card's tier on the theme in use. */
  tone: string;
  plan: ShowPlan;
  reduced: boolean;
}

/** Where a card leaves from. */
export interface CardLaunch {
  /** The card comes out of this element, at its size. */
  element: HTMLElement;
  /** What plays before the card leaves: a scan closing in, a lid lifting. The card waits for it. */
  lead?: ReturnType<typeof gsap.timeline>;
  /** Puts the origin back the way it was once the card has landed or the run was stopped. */
  release?: () => void;
}

/** What a face is drawn with. */
export interface CardFaceInfo {
  tone: string;
  tier: RarityTier;
  /** A small last line, like where the card was found. */
  note?: string;
}
