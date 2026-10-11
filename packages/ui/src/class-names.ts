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
  /** The layer the extra effects of an `effects` plan are played on. */
  effects?: string;
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

/** What every ready-made opener but the hunt shares: a panel with a few words, buttons, and a list of what was won. */
export interface PanelClassNames {
  /** The panel. The same as `className`. */
  root?: string;
  /** The flash over the whole panel on a loud card. */
  flash?: string;
  /** The row that holds the words and the buttons. */
  head?: string;
  headline?: string;
  subline?: string;
  /** The buttons' row. */
  actions?: string;
  /** The main button. */
  mainButton?: string;
  /** The quieter button next to it: skip, or go again. */
  sideButton?: string;
  /** The list of badges. */
  finds?: string;
  /** Each badge, won or not. A won one is a `button`. */
  badge?: string;
  badgeArt?: string;
  badgeName?: string;
  /** The small line under a won card's name. */
  badgeWhere?: string;
}

/** The reel: a strip of tiles that slides under a marker. Its own root takes `className`. */
export interface SpinReelClassNames {
  /** The strip that moves. */
  strip?: string;
  /** Every tile. The one the reel stopped on carries `data-won`. */
  tile?: string;
  /** A tile's name, under its glyph. */
  tileName?: string;
  /** The line the strip stops under. */
  marker?: string;
}

/** The reel as a whole opener. */
export interface CardSpinClassNames extends PanelClassNames, SpinReelClassNames, CardOpeningClassNames {
  /** The reel's root. */
  reel?: string;
}

/** The case: a box whose lid opens. Its own root takes `className`. */
export interface LootCaseClassNames {
  /** The box: the lid and the body together. It is what shakes. */
  box?: string;
  lid?: string;
  body?: string;
  /** The plate on the front, in the colour of the card coming out. */
  latch?: string;
  /** The light that rises out of the open case. */
  glow?: string;
  /** The fan of rays behind it. */
  caseRays?: string;
  /** Each spark thrown as the lid pops. */
  caseBit?: string;
}

/** The case as a whole opener: the box, and the shelf its cards land on. */
export interface CardCaseClassNames extends PanelClassNames, LootCaseClassNames, CardOpeningClassNames {
  /** The case's root. */
  case?: string;
  /** The row of places the cards land on. */
  shelf?: string;
  /** Each place: a button holding a card. */
  slot?: string;
}

/** The pack: sealed, then dealt out on a table. The card parts apply to every card on it. */
export interface CardPackClassNames extends CardOpeningClassNames {
  /** The pack's root. The same as `className`. */
  root?: string;
  /** The sealed pack itself. */
  sealed?: string;
  /** The table the cards are dealt on. */
  table?: string;
  /** Each card's place on the table. It carries `data-up` once turned. */
  seat?: string;
  /** The button around a dealt card. */
  seatPress?: string;
  /** The rays behind a loud card once it is turned. */
  seatRays?: string;
  /** Each spark a turning card throws. */
  seatBit?: string;
  /** The flash over the table. */
  packFlash?: string;
  /** The row under the table: the words and the buttons. */
  foot?: string;
  /** The line of words under the table. */
  hint?: string;
  mainButton?: string;
  sideButton?: string;
}

/** The library's class for a part, and yours after it. */
export const cn = (base: string, ...extra: (string | undefined)[]): string => {
  let joined = base;
  for (const name of extra) if (name) joined += ` ${name}`;
  return joined;
};
