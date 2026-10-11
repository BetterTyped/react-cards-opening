import type { Block } from "../content/types";
import type {
  CardCaseClassNames,
  CardClassNames,
  CardHuntClassNames,
  CardOpeningClassNames,
  CardPackClassNames,
  LootCaseClassNames,
  PanelClassNames,
  PrizeWheelClassNames,
  ScanGridClassNames,
  SpinReelClassNames,
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
  effects: ["rco-fx-layer", "The layer an `effects` plan is played on, behind the card."],
};

const PANEL: Lines<keyof PanelClassNames> = {
  root: ["rco-panel", "The panel. The same as `className`."],
  flash: ["rco-panel-flash", "The flash over the whole panel on a loud card."],
  head: ["rco-panel-head", "The row that holds the words and the buttons."],
  headline: ["rco-panel-headline", "The headline."],
  subline: ["rco-panel-subline", "The line under it."],
  actions: ["rco-panel-actions", "The buttons' row."],
  mainButton: ["rco-button-main", "The main button: Spin, or Open the case."],
  sideButton: ["rco-button-skip", "Take all during a run, and the replay button after it."],
  finds: ["rco-finds", "The list of badges."],
  badge: ["rco-badge", "Each badge, won or not. A won one is a `button`."],
  badgeArt: ["rco-badge-art", "The little glyph's box in a badge."],
  badgeName: ["rco-badge-name", "The card's name in a badge."],
  badgeWhere: ["rco-badge-where", "The second line of a badge."],
};

const REEL: Lines<keyof SpinReelClassNames | "reel"> = {
  reel: ["rco-reel", "The reel's window. `className` on a `SpinReel` used alone."],
  strip: ["rco-reel-strip", "The strip that slides."],
  tile: ["rco-reel-tile", "Every tile. The winner also gets `data-won`."],
  tileName: ["rco-reel-name", "The card's name under a tile's glyph."],
  marker: ["rco-reel-marker", "The line the reel stops under."],
};

const WHEEL: Lines<keyof PrizeWheelClassNames | "wheel"> = {
  wheel: ["rco-wheel", "The wheel's root. `className` on a `PrizeWheel` used alone."],
  disc: ["rco-wheel-disc", "The disc that turns."],
  wedge: ["rco-wheel-wedge", "Every wedge. The winner also gets `data-won`."],
  prize: ["rco-wheel-prize", "What a wedge holds: the card's glyph."],
  pointer: ["rco-wheel-pointer", "The pointer the wheel stops under."],
  hub: ["rco-wheel-hub", "The middle of the wheel."],
  wheelGlow: ["rco-wheel-glow", "The light behind the wheel once it has stopped, in the winner's colour."],
};

const LOOT_CASE: Lines<keyof LootCaseClassNames | "case"> = {
  case: ["rco-case", "The case's root. `className` on a `LootCase` used alone."],
  box: ["rco-case-box", "The lid and the body together: what shakes."],
  lid: ["rco-case-lid", "The lid."],
  body: ["rco-case-body", "The body, with the emblem on it."],
  latch: ["rco-case-latch", "The plate on the front. It wears the colour of what comes out next."],
  glow: ["rco-case-glow", "The light that pours out of the open case."],
  caseRays: ["rco-case-rays", "The wheel of rays behind an open case."],
  caseBit: ["rco-case-bit", "Each spark thrown as the lid lifts."],
};

const SHELF: Lines<
  Exclude<
    keyof CardCaseClassNames,
    keyof PanelClassNames | keyof LootCaseClassNames | keyof CardOpeningClassNames | "case"
  >
> = {
  shelf: ["rco-shelf", "The row of places under the case."],
  slot: ["rco-shelf-slot", "Each place: a button holding the card that lands there."],
};

const PACK: Lines<Exclude<keyof CardPackClassNames, keyof CardOpeningClassNames>> = {
  root: ["rco-pack", "The pack's panel. The same as `className`. It carries `data-stage`."],
  table: ["rco-pack-table", "The table the cards are dealt on."],
  sealed: ["rco-pack-sealed", "The sealed pack: a button."],
  packFlash: ["rco-pack-flash", "The flash over the table as the pack bursts, and as a legendary turns."],
  seat: ["rco-pack-seat", "A card's place on the table. It carries `data-up` and `data-effect`."],
  seatPress: ["rco-pack-press", "The button around each card."],
  seatRays: ["rco-pack-rays", "The rays a loud card opens behind itself."],
  seatBit: ["rco-pack-bit", "Each spark a turning card throws."],
  foot: ["rco-pack-foot", "The row under the table: the hint and the buttons."],
  hint: ["rco-pack-hint", "The line that says what to do next."],
  mainButton: ["rco-button-main", "Done."],
  sideButton: ["rco-button-again", "Deal them again."],
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

export const SLOT_TABLES = {
  card: table(CARD),
  opening: table(OPENING),
  scan: table(SCAN),
  hunt: table(HUNT),
  panel: table(PANEL),
  reel: table(REEL),
  wheel: table(WHEEL),
  lootCase: table(LOOT_CASE),
  shelf: table(SHELF),
  pack: table(PACK),
};
