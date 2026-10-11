import { gsap } from "gsap";
import { type CSSProperties, type ReactNode, useRef, useState } from "react";

import { Card } from "./card";
import { CardOpening } from "./card-opening";
import { type CardPackClassNames, cn } from "./class-names";
import { clearEffects, type EffectPlan, effectsFor, playEffects } from "./effects";
import { GLYPHS, type PixelArt } from "./glyphs";
import { AgainIcon } from "./icons";
import { CARD_PACK_LABELS, type CardPackLabels, type PackState } from "./labels";
import { PixelGlyph } from "./pixel-glyph";
import { type CardTheme, DEFAULT_THEME, rarityColor, themeStyle } from "./theme";
import type { CardFaceInfo, GlyphCard } from "./types";
import { useGsapEffect, useIsomorphicLayoutEffect } from "./use-gsap-effect";
import {
  DEFAULT_RARITIES,
  prefersReducedMotion,
  type RarityTier,
  showFor,
  tierOf,
  useCardOpening,
  useCardPack,
} from "@react-cards-opening/core";

/** Sparks a turning card throws, and the ones the pack throws when it bursts. */
const BITS = 12;
const BURST = 18;

const NONE: CardPackClassNames = {};
const noop = () => {};

/** How many cards sit in each row of the table, top to bottom, on a wide table and on a narrow one. */
const WIDE_ROWS: Record<number, readonly number[]> = { 6: [3, 3], 7: [4, 3], 8: [4, 4], 9: [5, 4], 10: [5, 5] };
const NARROW_ROWS: Record<number, readonly number[]> = {
  3: [2, 1],
  4: [2, 2],
  5: [2, 1, 2],
  6: [2, 2, 2],
  7: [2, 3, 2],
  8: [3, 2, 3],
  9: [3, 3, 3],
  10: [3, 4, 3],
};
/** Five on a wide table sit in a ring, one at the top: the layout a pack of five is known by. */
const RING: readonly (readonly [number, number])[] = [
  [0, -17],
  [38, -4],
  [20, 15],
  [-20, 15],
  [-38, -4],
];

interface Table {
  /** Where each card sits, from the middle of the table, in hundredths of the table's width. */
  seats: readonly (readonly [x: number, y: number])[];
  /** The table's height, in the same unit. */
  height: number;
  /** A card's width, in the same unit. */
  card: number;
}

/** Rows of cards, each centred, the rows spread evenly down the table. `widest` is the most a card may be. */
function rowsTable(rows: readonly number[], widest: number): Table {
  const most = Math.max(...rows);
  const card = Math.min(widest, 90 / most - 3);
  const pitchX = card + 4;
  const pitchY = card * (4 / 3) + 5;
  const seats = rows.flatMap((count, row) =>
    Array.from(
      { length: count },
      (_unused, at) => [(at - (count - 1) / 2) * pitchX, (row - (rows.length - 1) / 2) * pitchY] as const,
    ),
  );
  return { seats, height: rows.length * pitchY + 5, card };
}

const wideTable = (count: number): Table =>
  count === 5 ? { seats: RING, height: 59, card: 16 } : rowsTable(WIDE_ROWS[count] ?? [count], 17);

const narrowTable = (count: number): Table => rowsTable(NARROW_ROWS[count] ?? [count], 30);

/** Gathered up: one row, fanned, the cards closing ranks when there are many. */
function doneTable(count: number, widest: number): Table {
  const card = Math.min(widest, 84 / Math.max(count, 1) + 4);
  const pitch = Math.min(card + 2, (88 - card) / Math.max(count - 1, 1));
  return {
    seats: Array.from({ length: count }, (_unused, at) => [(at - (count - 1) / 2) * pitch, 0] as const),
    height: card * (4 / 3) + 10,
    card,
  };
}

export interface CardPackProps<C extends GlyphCard> {
  /** The cards in the pack, in the order they are dealt. Up to ten sit well on the table. */
  cards: readonly C[];
  opened: readonly string[];
  /** A card was turned face up for the first time. */
  onOpen: (id: string) => void;
  theme?: CardTheme;
  rarities?: readonly RarityTier[];
  /** The glyph on the front of the sealed pack. */
  emblem?: PixelArt;
  /** Every card is turned and the viewer pressed Done. */
  onDone?: () => void;
  labels?: Partial<CardPackLabels>;
  /** Extra buttons under the table once the pack is done. */
  actions?: ReactNode;
  renderFace?: (card: C, info: CardFaceInfo) => ReactNode;
  renderBack?: (card: C) => ReactNode;
  readingOf?: (card: C, info: CardFaceInfo) => readonly string[];
  /** More to play as a card turns over: which effects each tier gets. One of `EFFECT_SETS`, or your own plan. */
  effects?: EffectPlan;
  className?: string;
  /** A class of your own for each part of the pack, and of every card on its table. */
  classNames?: CardPackClassNames;
  style?: CSSProperties;
}

/**
 * A pack of cards. Sealed, it floats. Pressed, it bursts and deals its cards face down on the table. Each one
 * glows in its tier's colour when the pointer is on it, which is the tease, and turns over on a press, in any
 * order. A loud card opens rays behind itself; a legendary lights the whole table. Once all are turned, Done
 * gathers them into a row. A turned card can be pressed again to look at it up close.
 */
export function CardPack<C extends GlyphCard>({
  cards,
  opened,
  onOpen,
  theme = DEFAULT_THEME,
  rarities = DEFAULT_RARITIES,
  emblem = GLYPHS.question,
  onDone,
  labels,
  actions,
  renderFace,
  renderBack,
  readingOf,
  effects,
  className,
  classNames: names = NONE,
  style,
}: CardPackProps<C>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pack = useCardPack({ cards, opened, onOpen });
  // The reveal is here for one thing: bringing a turned card up close. Nothing is ever opened through it.
  const zoom = useCardOpening<C>({ cards, opened, onOpen: noop });
  // Counts the tears, so each one plays its burst once. Zero is a pack that came back already dealt: no burst.
  const [tears, setTears] = useState(0);
  const { stage } = pack;

  // The burst: the pack shakes, flashes and is gone, and the cards fly from where it was to their seats.
  useGsapEffect(() => {
    const root = rootRef.current;
    if (!root || tears === 0) return;
    const sealed = root.querySelector<HTMLElement>(".rco-pack-sealed");
    const flash = root.querySelector<HTMLElement>(".rco-pack-flash");
    const table = root.querySelector<HTMLElement>(".rco-pack-table");
    const dealt = [...root.querySelectorAll<HTMLElement>(".rco-pack-deal")];
    if (!sealed || !flash || !table) return;
    const reduced = prefersReducedMotion();
    const centre = table.getBoundingClientRect();
    const from = (card: HTMLElement, axis: "x" | "y") => {
      const at = card.getBoundingClientRect();
      return axis === "x"
        ? centre.left + centre.width / 2 - (at.left + at.width / 2)
        : centre.top + centre.height / 2 - (at.top + at.height / 2);
    };

    const tl = gsap.timeline();
    // The burst is the pack's own colour, whatever card lit the table last.
    flash.style.removeProperty("--rco-tone");
    gsap.set(sealed, { autoAlpha: 1, scale: 1, rotate: 0 });
    gsap.set(dealt, { autoAlpha: 0 });
    if (reduced) {
      tl.set(sealed, { autoAlpha: 0 });
      tl.set(dealt, { autoAlpha: 1 });
      return;
    }
    tl.to(sealed, {
      keyframes: [{ rotate: -3 }, { rotate: 3 }, { rotate: -4 }, { rotate: 4 }, { rotate: -5 }, { rotate: 0 }],
      scale: 1.08,
      duration: 0.5,
      ease: "none",
    });
    tl.fromTo(
      flash,
      { autoAlpha: 0 },
      {
        keyframes: [
          { autoAlpha: 0.85, duration: 0.08 },
          { autoAlpha: 0, duration: 0.8 },
        ],
      },
    );
    tl.to(sealed, { scale: 1.5, autoAlpha: 0, duration: 0.22, ease: "power2.in" }, "<");
    tl.fromTo(
      root.querySelectorAll(".rco-pack-burst-bit"),
      { x: 0, y: 0, scale: 0.6, autoAlpha: 1 },
      {
        x: (index: number) => Math.cos((index / BURST) * Math.PI * 2) * (110 + ((index * 37) % 120)),
        y: (index: number) => Math.sin((index / BURST) * Math.PI * 2) * (90 + ((index * 23) % 90)),
        scale: 1,
        autoAlpha: 0,
        duration: 1,
        ease: "expo.out",
        immediateRender: false,
      },
      "<",
    );
    tl.fromTo(
      dealt,
      {
        x: (_index: number, card: HTMLElement) => from(card, "x"),
        y: (_index: number, card: HTMLElement) => from(card, "y"),
        scale: 0.3,
        rotate: () => gsap.utils.random(-40, 40),
        autoAlpha: 0,
      },
      { x: 0, y: 0, scale: 1, rotate: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(1.3)", stagger: 0.07 },
      "<0.08",
    );
  }, [tears]);

  // The canvas the extra effects are drawn on goes when the pack does.
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    return () => {
      const layer = root?.querySelector<HTMLElement>(".rco-fx-layer");
      if (layer) clearEffects(layer);
    };
  }, []);

  if (cards.length === 0) return null;

  const words = { ...CARD_PACK_LABELS, ...labels };
  const state: PackState = { total: cards.length, left: pack.left.length, stage, replay: pack.replay };
  const wide = stage === "done" ? doneTable(cards.length, 15) : wideTable(cards.length);
  const narrow = stage === "done" ? doneTable(cards.length, 24) : narrowTable(cards.length);

  const tear = () => {
    pack.tear();
    setTears((now) => now + 1);
  };

  /** What a card does around itself as it turns: sparks for every tier, rays for a loud one, the table for a legendary. */
  const celebrate = (card: C, seat: HTMLElement) => {
    const root = rootRef.current;
    const reduced = prefersReducedMotion();
    const plan = showFor(tierOf(rarities, card.rarity).effect, reduced);
    gsap.fromTo(
      seat.querySelectorAll(".rco-pack-bit"),
      { x: 0, y: 0, scale: 0.6, autoAlpha: 1 },
      {
        x: (index: number) => Math.cos((index / BITS) * Math.PI * 2) * (seat.offsetWidth * 0.75 + ((index * 37) % 40)),
        y: (index: number) => Math.sin((index / BITS) * Math.PI * 2) * (seat.offsetWidth * 0.9 + ((index * 23) % 40)),
        scale: 1,
        autoAlpha: 0,
        duration: 1,
        ease: "expo.out",
        delay: 0.18,
      },
    );
    if (!root || reduced) return;
    const layer = root.querySelector<HTMLElement>(".rco-fx-layer");
    const extra = effectsFor(effects, tierOf(rarities, card.rarity));
    if (layer && extra.length > 0) {
      playEffects(layer, extra, {
        at: seat,
        tone: rarityColor(theme, card.rarity),
        accent: theme.levels[4],
        subject: root.querySelector<HTMLElement>(".rco-pack-table"),
        delay: 0.18,
      });
    }
    if (plan.jolt) {
      gsap.to(root.querySelector(".rco-pack-table"), {
        keyframes: [{ x: -5 }, { x: 5 }, { x: -3 }, { x: 0 }],
        duration: 0.24,
        delay: 0.2,
      });
    }
    if (plan.legendary) {
      // The table lights up in the card's own colour, not the pack's.
      gsap.fromTo(
        root.querySelector(".rco-pack-flash"),
        { autoAlpha: 0, "--rco-tone": rarityColor(theme, card.rarity) },
        {
          keyframes: [
            { autoAlpha: 0.8, duration: 0.08 },
            { autoAlpha: 0, duration: 1 },
          ],
          delay: 0.2,
        },
      );
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn("rco-root rco-pack", className, names.root)}
      data-stage={stage}
      style={
        {
          ...themeStyle(theme),
          "--rco-tone": theme.levels[4],
          "--rco-pack-h": wide.height,
          "--rco-pack-nh": narrow.height,
          "--rco-pack-w": wide.card,
          "--rco-pack-nw": narrow.card,
          ...style,
        } as CSSProperties
      }
    >
      <div className={cn("rco-pack-table", names.table)}>
        <i className={cn("rco-pack-flash", names.packFlash)} aria-hidden />
        <div className={cn("rco-fx-layer", names.effects)} aria-hidden />
        <span className="rco-pack-burst" aria-hidden>
          {Array.from({ length: BURST }, (_unused, index) => (
            // oxlint-disable-next-line react/no-array-index-key -- sparks are positional
            <i key={index} className="rco-pack-burst-bit" />
          ))}
        </span>
        {stage === "sealed" || tears > 0 ? (
          <button
            type="button"
            className={cn("rco-pack-sealed", names.sealed)}
            onClick={tear}
            disabled={stage !== "sealed"}
            aria-label={words.tear}
            aria-hidden={stage === "sealed" ? undefined : true}
          >
            <span className="rco-pack-wrap">
              <PixelGlyph art={emblem} colour={theme.bg} cell={8} />
            </span>
          </button>
        ) : null}
        {stage === "sealed"
          ? null
          : cards.map((card, index) => {
              const up = pack.isUp(card.id);
              const tier = tierOf(rarities, card.rarity);
              const [x, y] = wide.seats[index] ?? [0, 0];
              const [nx, ny] = narrow.seats[index] ?? [0, 0];
              return (
                <div
                  key={card.id}
                  className={cn("rco-pack-seat", names.seat)}
                  data-up={up ? "" : undefined}
                  data-effect={tier.effect}
                  style={
                    {
                      "--rco-tone": rarityColor(theme, card.rarity),
                      "--rco-seat-x": x,
                      "--rco-seat-y": y,
                      "--rco-seat-nx": nx,
                      "--rco-seat-ny": ny,
                      "--rco-seat-tilt": stage === "done" ? (index - (cards.length - 1) / 2) * 2.5 : 0,
                    } as CSSProperties
                  }
                >
                  <div className="rco-pack-deal">
                    {tier.effect === "quiet" ? null : <i className={cn("rco-pack-rays", names.seatRays)} aria-hidden />}
                    <span className="rco-pack-bits" aria-hidden>
                      {Array.from({ length: BITS }, (_unused, bit) => (
                        // oxlint-disable-next-line react/no-array-index-key -- sparks are positional
                        <i key={bit} className={cn("rco-pack-bit", names.seatBit)} />
                      ))}
                    </span>
                    <button
                      type="button"
                      className={cn("rco-pack-press", names.seatPress)}
                      aria-label={up ? words.openCard(card.name) : words.flip}
                      disabled={zoom.peeking !== null}
                      onClick={(event) => {
                        const seat = event.currentTarget.closest<HTMLElement>(".rco-pack-seat");
                        if (up) zoom.peek(card.id, event.currentTarget);
                        else {
                          pack.flip(card.id);
                          if (seat) celebrate(card, seat);
                        }
                      }}
                    >
                      <Card
                        card={card}
                        theme={theme}
                        rarities={rarities}
                        faceDown={!up}
                        width="100%"
                        back={renderBack ? renderBack(card) : undefined}
                        classNames={names}
                      >
                        {renderFace ? (info: CardFaceInfo) => renderFace(card, info) : undefined}
                      </Card>
                    </button>
                  </div>
                </div>
              );
            })}
      </div>
      <div className={cn("rco-pack-foot", names.foot)}>
        <p className={cn("rco-pack-hint", names.hint)} aria-live="polite">
          {words.hint(state)}
        </p>
        {stage === "dealt" && pack.allUp ? (
          <button
            type="button"
            className={cn("rco-button rco-button-main", names.mainButton)}
            onClick={() => {
              pack.finish();
              onDone?.();
            }}
          >
            {words.done}
          </button>
        ) : null}
        {stage === "done" ? (
          <>
            {actions ? <div className="rco-slot">{actions}</div> : null}
            <button type="button" className={cn("rco-button rco-button-again", names.sideButton)} onClick={pack.reset}>
              <AgainIcon />
              {words.replay}
            </button>
          </>
        ) : null}
      </div>
      <CardOpening
        opening={zoom.opening}
        theme={theme}
        rarities={rarities}
        renderFace={renderFace}
        renderBack={renderBack}
        readingOf={readingOf}
        labels={words}
        classNames={names}
      />
    </div>
  );
}
