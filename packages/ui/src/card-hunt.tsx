import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

import { CardOpening } from "./card-opening";
import { GLYPHS } from "./glyphs";
import { AgainIcon, ForwardIcon, ScanIcon } from "./icons";
import { CARD_HUNT_LABELS, type CardHuntLabels, type HuntState } from "./labels";
import { PixelGlyph } from "./pixel-glyph";
import { ScanGrid, type ScanGridHandle, type ScanMarker } from "./scan-grid";
import { type CardTheme, DEFAULT_THEME, rarityColor, themeStyle } from "./theme";
import type { CardFaceInfo, CardShow, GlyphCard } from "./types";
import { DEFAULT_RARITIES, pickSpot, type RarityTier, useCardOpening, useCardSpots } from "@react-cards-opening/core";

const describeTile = (cell: number) => `tile ${cell + 1}`;

export interface CardHuntProps<C extends GlyphCard> {
  /** Every card in the deal, found or not, in the order they were dealt. */
  cards: readonly C[];
  opened: readonly string[];
  /** A card was turned face up for the first time. */
  onOpen: (id: string) => void;
  /** The grid the cards hide in: one number per cell, 0 (unlit) to 4. Cards hide on lit cells. */
  levels: readonly number[];
  /** Empty slots before the first cell, so a calendar's first column lines up with its weekday. */
  lead?: number;
  /** Cells in a column. Seven makes a year of weeks. */
  rows?: number;
  theme?: CardTheme;
  rarities?: readonly RarityTier[];
  /** How a cell reads on a card and a badge: "Mar 14". */
  describeSpot?: (cell: number) => string;
  /** Extra buttons in the header, next to the scan button. */
  actions?: ReactNode;
  /** Where this visit remembers each card's cell, so replays reopen the same tiles. Null keeps it in memory. */
  sessionKey?: string | null;
  /** The hunt is the page: bigger type, and it fills the box it is given with the grid in the middle. */
  hero?: boolean;
  /** A scan started or came to rest: finished, stopped or skipped to its end. */
  onRunChange?: (running: boolean) => void;
  labels?: Partial<CardHuntLabels>;
  /**
   * Where a found card lands instead of its badge here: its slot in a collection, a tab, a counter. Answer null
   * and the card fades out where it is.
   */
  landing?: (card: C) => HTMLElement | null;
  /** The front of the card, instead of the ready-made one. */
  renderFace?: (card: C, info: CardFaceInfo) => ReactNode;
  renderBack?: (card: C) => ReactNode;
  /** Every run of text on a face of your own, so the card stays up long enough to read. */
  readingOf?: (card: C, info: CardFaceInfo) => readonly string[];
  className?: string;
  style?: CSSProperties;
}

/**
 * The whole hunt in one piece: a grid with cards hidden in it, a button that scans for them, and the reveal for
 * each one found. The panel stays afterwards: the finds are listed, each can be opened again, and the scan can be
 * run again. It is `ScanGrid` and `CardOpening` wired to `useCardOpening`; take those three when you want the
 * parts laid out your own way.
 */
export function CardHunt<C extends GlyphCard>({
  cards,
  opened,
  onOpen,
  levels,
  lead = 0,
  rows = 7,
  theme = DEFAULT_THEME,
  rarities = DEFAULT_RARITIES,
  describeSpot = describeTile,
  actions,
  sessionKey = null,
  hero = false,
  onRunChange,
  labels,
  landing,
  renderFace,
  renderBack,
  readingOf,
  className,
  style,
}: CardHuntProps<C>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<ScanGridHandle>(null);
  // The grid stays blank until a scan has passed over it once.
  const [veiled, setVeiled] = useState(true);
  // Where each card hides: random the first time, then the same tile for the rest of the visit.
  const [spots, setSpots] = useCardSpots(sessionKey);
  // The cell picked for the card being hunted, known before the beam gets there.
  const huntedRef = useRef<Record<string, number>>({});

  const hunt = useCardOpening<C, HTMLElement>({ cards, opened, onOpen, onRunChange });
  const { run, current, pending, left } = hunt;

  // Finds from an earlier visit get a place in the grid, and the grid shows.
  useEffect(() => {
    if (run || opened.length === 0) return;
    setVeiled(false);
    setSpots((now) => {
      const next = { ...now };
      for (const id of opened) {
        if (next[id] === undefined) next[id] = pickSpot(levels, Object.values(next));
      }
      return next;
    });
  }, [opened, run, levels, setSpots]);

  if (cards.length === 0) return null;

  const words = { ...CARD_HUNT_LABELS, ...labels };
  const allFound = pending.length === 0;
  const state: HuntState = {
    total: cards.length,
    found: opened.length,
    pending: pending.length,
    left,
    running: run !== null,
    replay: run?.replay ?? false,
    hero,
  };

  const launch = (card: C, show: CardShow) => {
    // Where it hides: the tile it was found on before, or a random one nobody else holds.
    const cell =
      spots[card.id] ??
      pickSpot(
        levels,
        Object.entries(spots)
          .filter(([id]) => id !== card.id)
          .map(([, taken]) => taken),
      );
    huntedRef.current[card.id] = cell;
    return (
      scanRef.current?.seek(cell, show, {
        flash: flashRef.current,
        onLock: () => setSpots((now) => ({ ...now, [card.id]: cell })),
      }) ?? null
    );
  };

  const spotOf = (card: C) => spots[card.id] ?? huntedRef.current[card.id];
  const noteOf = (card: C) => {
    const spot = spotOf(card);
    return spot === undefined ? undefined : words.found(describeSpot(spot));
  };
  // Home is the card's badge in the list below, unless the page has its own place for it.
  const badgeOf = (card: C) =>
    [...(rootRef.current?.querySelectorAll<HTMLElement>("[data-rco-badge]") ?? [])].find(
      (badge) => badge.dataset.rcoBadge === card.id,
    ) ?? null;

  const scanAgain = () => {
    // A replay starts from a blank grid; each card comes out of the same tile as before.
    scanRef.current?.reset();
    setVeiled(true);
    hunt.replay();
  };

  const findAll = () => {
    const next = { ...spots };
    for (const card of pending) {
      if (next[card.id] === undefined) next[card.id] = pickSpot(levels, Object.values(next));
    }
    hunt.openAll();
    setSpots(next);
    setVeiled(false);
  };

  const markers = new Map<number, ScanMarker>(
    cards.flatMap((card) =>
      opened.includes(card.id) && spots[card.id] !== undefined
        ? [[spots[card.id], { id: card.id, name: card.name, colour: rarityColor(theme, card.rarity) }] as const]
        : [],
    ),
  );

  let button: ReactNode = (
    <button
      type="button"
      className="rco-button rco-button-main"
      onClick={() => hunt.start()}
      disabled={hunt.peeking !== null}
    >
      <ScanIcon />
      {words.scan(state)}
    </button>
  );
  if (run) {
    button =
      !run.replay && left > 0 ? (
        <button type="button" className="rco-button rco-button-skip" onClick={findAll}>
          <ForwardIcon />
          {words.openAll}
        </button>
      ) : null;
  } else if (allFound) {
    button = (
      <button
        type="button"
        className="rco-button rco-button-again"
        onClick={scanAgain}
        disabled={hunt.peeking !== null}
      >
        <AgainIcon />
        {words.replay}
      </button>
    );
  }

  const tone = current ? rarityColor(theme, current.rarity) : theme.fg;

  return (
    <div
      ref={rootRef}
      className={className ? `rco-root rco-hunt ${className}` : "rco-root rco-hunt"}
      data-hero={hero ? "" : undefined}
      style={{ ...themeStyle(theme), "--rco-tone": tone, ...style } as CSSProperties}
    >
      <div ref={flashRef} className="rco-hunt-flash" aria-hidden />
      <div className="rco-hunt-head">
        <div className="rco-hunt-words">
          <p className="rco-hunt-headline">{words.headline(state)}</p>
          <p className="rco-hunt-subline">{words.subline(state)}</p>
        </div>
        <div className="rco-hunt-actions">
          {actions ? <div className="rco-slot">{actions}</div> : null}
          {button}
        </div>
      </div>

      <ScanGrid
        handle={scanRef}
        levels={levels}
        lead={lead}
        rows={rows}
        theme={theme}
        tone={tone}
        veiled={veiled}
        onUnveil={() => setVeiled(false)}
        idle={run === null}
        markers={markers}
        markersDisabled={run !== null}
        markerLabel={words.openCard}
        onMarkerPress={(marker, element) => hunt.peek(marker.id, element)}
      />

      <ul className="rco-finds" aria-label={words.finds}>
        {cards.map((card) => {
          const spot = opened.includes(card.id) && !veiled ? spots[card.id] : undefined;
          return (
            <li key={card.id} className="rco-find">
              {spot === undefined ? (
                <span className="rco-badge">
                  <span className="rco-badge-art">
                    <PixelGlyph art={GLYPHS.question} colour={theme.muted} cell={3} />
                  </span>
                  <span className="rco-badge-name">{words.hidden}</span>
                </span>
              ) : (
                <button
                  type="button"
                  className="rco-badge"
                  data-rco-badge={card.id}
                  disabled={run !== null}
                  onClick={(event) => hunt.peek(card.id, event.currentTarget)}
                  title={words.openBadge}
                  style={{ "--rco-tone": rarityColor(theme, card.rarity) } as CSSProperties}
                >
                  <span className="rco-badge-art">
                    <PixelGlyph art={card.art ?? GLYPHS.question} colour={rarityColor(theme, card.rarity)} cell={3} />
                  </span>
                  <span className="rco-badge-words">
                    <span className="rco-badge-name">{card.name}</span>
                    <span className="rco-badge-where">{describeSpot(spot)}</span>
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <CardOpening
        opening={hunt.opening}
        theme={theme}
        rarities={rarities}
        launch={launch}
        landing={landing ?? badgeOf}
        noteOf={noteOf}
        renderFace={renderFace}
        renderBack={renderBack}
        readingOf={readingOf}
        labels={words}
      />
    </div>
  );
}
