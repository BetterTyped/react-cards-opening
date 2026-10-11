/*
 * Classes of your own, by part. Every component takes a `classNames` object, and each key names one part of it.
 * Your class is added after the library's own, so the part keeps its `rco-` class (the animation finds it by that)
 * and gains yours.
 *
 * Every rule in the library's stylesheet has the weight of a single class. A class of yours that comes later in the
 * cascade wins, and so does anything in a higher cascade layer, which is how Tailwind's utilities get the last word
 * when the stylesheet is imported into the `components` layer.
 */

/** The rows of the ready-made face. */
export interface CardContentClassNames {
  /** The room the glyph sits in. */
  art?: string;
  name?: string;
  /** The tier as a word, under the name. */
  rarity?: string;
  /** The line of text. */
  text?: string;
  /** The small last line. */
  note?: string;
}

/** A card: its two sides and what a legendary wears. */
export interface CardClassNames extends CardContentClassNames {
  face?: string;
  back?: string;
  /** The turning border of a legendary. */
  foilBorder?: string;
  /** The band of light that crosses a legendary's face. */
  shine?: string;
}

/** The reveal: everything around the card while it is up. */
export interface CardOpeningClassNames extends CardClassNames {
  /** The fixed layer over the page that holds all of it. */
  stage?: string;
  /** The dimmed page behind the card. */
  backdrop?: string;
  /** The wheel of rays behind a loud card. */
  rays?: string;
  /** The second, finer wheel a legendary adds. */
  legendRays?: string;
  /** The flash over the whole screen as a legendary turns. */
  legendFlash?: string;
  /** The box that flies: it holds the card and what moves with it. */
  flyer?: string;
  /** Each of a legendary's two shockwave rings. */
  wave?: string;
  /** Each of the diamonds that glint around a legendary. */
  sparkle?: string;
  /** Each particle of the burst. */
  burst?: string;
  /** The button laid over the card: what a press and the keyboard focus land on. */
  press?: string;
}

/** The grid and the scan over it. The grid's own root takes `className`. */
export interface ScanGridClassNames {
  /** The grid's own flash, used when it is not handed a bigger one. */
  scanFlash?: string;
  grid?: string;
  /** Every cell. State is on the cell as `data-level`, `data-lit`, `data-hit` and `data-found`. */
  cell?: string;
  /** The button inside a found cell. */
  marker?: string;
  /** The band of light along the row being locked. */
  band?: string;
  reticle?: string;
  /** The ring that rolls out of a cracking cell. */
  ring?: string;
  /** Each spark a cracking cell throws. */
  spark?: string;
  beam?: string;
  beamGlow?: string;
  beamLine?: string;
}

/** The whole hunt: its own parts, and every part of the grid and the reveal inside it. */
export interface CardHuntClassNames extends ScanGridClassNames, CardOpeningClassNames {
  /** The panel. The same as `className`. */
  root?: string;
  /** The grid's root. */
  scan?: string;
  /** The flash over the whole panel on a loud find. */
  flash?: string;
  /** The row that holds the words and the buttons. */
  head?: string;
  headline?: string;
  subline?: string;
  /** The buttons' row. */
  actions?: string;
  /** The main button: "Scan", then "Keep scanning". */
  scanButton?: string;
  /** "Find all", shown during a scan. */
  skipButton?: string;
  /** "Scan again", shown once everything is found. */
  replayButton?: string;
  /** The list of badges. */
  finds?: string;
  /** Each badge, found or not. A found one is a `button`. */
  badge?: string;
  badgeArt?: string;
  badgeName?: string;
  /** Where a found card was found, under its name. */
  badgeWhere?: string;
}

/** The library's class for a part, and yours after it. */
export const cn = (base: string, ...extra: (string | undefined)[]): string => {
  let joined = base;
  for (const name of extra) if (name) joined += ` ${name}`;
  return joined;
};
