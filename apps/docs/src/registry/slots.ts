import type { Block } from "../content/types";
import type {
  CardClassNames,
  CardHuntClassNames,
  CardOpeningClassNames,
  ScanGridClassNames,
} from "@react-cards-opening/ui";

/*
 * The parts a class of your own can be put on, as tables that cannot fall behind the code: each is typed by the
 * keys of the real `classNames` type, so a part added to the library without a line here stops the typecheck.
 */

type Line = readonly [libraryClass: string, text: string];
type Lines<K extends string> = Record<K, Line>;

const CARD: Lines<keyof CardClassNames> = {
  face: ["rco-face", "The front of the card: its frame, its padding, its ground."],
  back: ["rco-back", "The back of the card."],
  foilBorder: ["rco-legend-border", "The turning border of a legendary."],
  shine: ["rco-foil", "The band of light that crosses a legendary's face."],
  art: ["rco-card-art", "The room the glyph sits in, on the ready-made face."],
  name: ["rco-card-name", "The card's name."],
  rarity: ["rco-card-rarity", "The tier as a word, under the name."],
  text: ["rco-card-text", "The line of text."],
  note: ["rco-card-note", "The small last line."],
};

const OPENING: Lines<Exclude<keyof CardOpeningClassNames, keyof CardClassNames>> = {
  stage: ["rco-stage", "The fixed layer over the page that holds the reveal. A good place to set variables."],
  backdrop: ["rco-backdrop", "The dimmed page behind the card."],
  flyer: ["rco-flyer", "The box that flies. It holds the card and what moves with it."],
  press: ["rco-flyer-press", "The button laid over the card: what a press and the focus land on."],
  rays: ["rco-rays", "The wheel of rays behind a loud card."],
  burst: ["rco-burst-bit", "Each particle of the burst."],
  legendRays: ["rco-legend-rays", "The second, finer wheel a legendary adds."],
  legendFlash: ["rco-legend-flash", "The flash over the whole screen as a legendary turns."],
  wave: ["rco-legend-wave", "Each of a legendary's two shockwave rings."],
  sparkle: ["rco-sparkle", "Each of the diamonds that glint around a legendary."],
};

const SCAN: Lines<keyof ScanGridClassNames> = {
  grid: ["rco-grid", "The grid itself."],
  cell: ["rco-cell", "Every cell."],
  marker: ["rco-cell-press", "The button inside a found cell."],
  beam: ["rco-beam", "The beam that sweeps the grid."],
  beamGlow: ["rco-beam-glow", "The soft light either side of the beam."],
  beamLine: ["rco-beam-line", "The bright line at its middle."],
  band: ["rco-band", "The band of light along the row being locked."],
  reticle: ["rco-reticle", "The square that closes in on a cell."],
  ring: ["rco-ring", "The ring that rolls out of a cracking cell."],
  spark: ["rco-crack-bit", "Each spark a cracking cell throws."],
  scanFlash: ["rco-scan-flash", "The grid's own flash, used when it stands alone."],
};

const HUNT: Lines<Exclude<keyof CardHuntClassNames, keyof ScanGridClassNames | keyof CardOpeningClassNames>> = {
  root: ["rco-hunt", "The panel. The same as `className`."],
  head: ["rco-hunt-head", "The row that holds the words and the buttons."],
  headline: ["rco-hunt-headline", "The headline."],
  subline: ["rco-hunt-subline", "The line under it."],
  actions: ["rco-hunt-actions", "The buttons' row."],
  scanButton: ["rco-button-main", "The main button: Scan, then Keep scanning."],
  skipButton: ["rco-button-skip", "Find all, shown during a scan."],
  replayButton: ["rco-button-again", "Scan again, shown once everything is found."],
  scan: ["rco-scan", "The grid's root."],
  flash: ["rco-hunt-flash", "The flash over the whole panel on a loud find."],
  finds: ["rco-finds", "The list of badges."],
  badge: ["rco-badge", "Each badge, found or not. A found one is a `button`."],
  badgeArt: ["rco-badge-art", "The little glyph's box in a badge."],
  badgeName: ["rco-badge-name", "The card's name in a badge."],
  badgeWhere: ["rco-badge-where", "Where a found card was found."],
};

const table = (lines: Record<string, Line>): Block => ({
  kind: "table",
  head: ["Key", "The library's class", "The part"],
  rows: Object.entries(lines).map(([key, [libraryClass, text]]) => [`\`${key}\``, `\`.${libraryClass}\``, text]),
});

export const SLOT_TABLES = { card: table(CARD), opening: table(OPENING), scan: table(SCAN), hunt: table(HUNT) };
