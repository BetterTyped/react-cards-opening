import { gsap } from "gsap";
import { type CSSProperties, type Ref, useImperativeHandle, useMemo, useRef } from "react";

import { cn, type SpinReelClassNames } from "./class-names";
import { GLYPHS } from "./glyphs";
import { PixelGlyph } from "./pixel-glyph";
import { type CardTheme, DEFAULT_THEME, rarityColor, themeStyle } from "./theme";
import type { CardLaunch, CardShow, GlyphCard } from "./types";
import { createRng, DEFAULT_RARITIES, pickCard, type RarityTier } from "@react-cards-opening/core";

/** How many tiles a strip holds, and which of them the reel stops on: far enough along for a long, slowing ride. */
const TILES = 56;
const WINNER = 48;
/** The tile under the marker before a spin. */
const REST = 3;

const NONE: SpinReelClassNames = {};

export interface SpinReelHandle {
  /**
   * Spins the strip and stops it on the winner. Answers what a `CardOpening` needs to send the card out of the
   * winning tile, or null when there is no winner to stop on.
   */
  spin: (
    show: CardShow,
    options?: {
      /** Something bigger than the reel to flash on a loud card, like the panel around it. */
      flash?: HTMLElement | null;
      /** The strip has stopped. */
      onLock?: () => void;
    },
  ) => CardLaunch | null;
}

export interface SpinReelProps<C extends GlyphCard> {
  /** The card the next spin stops on. With none, the strip shows what could come up and waits. */
  winner: C | null;
  /** What slides past: every card that could have come up. Rarer tiers pass less often, as they would. */
  pool: readonly C[];
  /** Changes with every spin, so two spins for the same card deal two different strips. */
  spinKey?: string | number;
  theme?: CardTheme;
  rarities?: readonly RarityTier[];
  handle?: Ref<SpinReelHandle>;
  className?: string;
  /** A class of your own for each part of the reel. The reel's root takes `className`. */
  classNames?: SpinReelClassNames;
  style?: CSSProperties;
}

/**
 * A reel: a strip of tiles that slides fast under a marker, slows down and stops on one of them. What passes by is
 * drawn from the pool by tier weight, so the strip looks like the odds, and the tile it stops on is the card that
 * was dealt: the spin decides nothing. Pair it with `CardOpening` and the card lifts out of the winning tile.
 */
export function SpinReel<C extends GlyphCard>({
  winner,
  pool,
  spinKey = 0,
  theme = DEFAULT_THEME,
  rarities = DEFAULT_RARITIES,
  handle,
  className,
  classNames: names = NONE,
  style,
}: SpinReelProps<C>) {
  const rootRef = useRef<HTMLDivElement>(null);

  // The strip for this spin: drawn from a seed, so a server and a browser lay out the same tiles.
  const tiles = useMemo(() => {
    const { next } = createRng(`${winner?.id ?? "idle"}:${spinKey}`);
    return Array.from({ length: TILES }, (_unused, index) =>
      index === WINNER && winner ? winner : pickCard(pool, { rarities, random: next }),
    );
  }, [winner, pool, rarities, spinKey]);

  const hasWinner = winner !== null;
  useImperativeHandle(
    handle,
    () => ({
      spin: ({ tone: colour, plan, reduced }, { flash, onLock } = {}) => {
        const root = rootRef.current;
        const strip = root?.querySelector<HTMLElement>(".rco-reel-strip");
        const marker = root?.querySelector<HTMLElement>(".rco-reel-marker");
        if (!root || !strip || !marker || !hasWinner) return null;
        const all = [...strip.querySelectorAll<HTMLElement>(".rco-reel-tile")];
        const win = all[WINNER];
        if (!win) return null;
        const others = all.filter((tile) => tile !== win);

        // Where the strip has to sit for a tile to be under the marker, a little off its middle or dead on.
        const middle = root.clientWidth / 2;
        const xFor = (tile: HTMLElement, off = 0) => middle - (tile.offsetLeft + tile.offsetWidth / 2) - off;
        const pitch = (all[1]?.offsetLeft ?? 0) - (all[0]?.offsetLeft ?? 0) || win.offsetWidth;
        const start = xFor(all[REST] ?? win);
        // It never stops dead centre: anywhere on the tile, short of its edges.
        const end = xFor(win, (Math.random() - 0.5) * win.offsetWidth * 0.7);

        gsap.killTweensOf([strip, ...all]);
        win.removeAttribute("data-won");
        gsap.set(all, { opacity: 1 });
        gsap.set(strip, { x: reduced ? end : start });

        // The marker ticks as each tile goes under it. Web Animations, and never more often than the eye can use.
        let lastTile = -1;
        let lastTick = 0;
        const tick = () => {
          const under = Math.floor((middle - (gsap.getProperty(strip, "x") as number)) / pitch);
          const now = performance.now();
          if (under === lastTile || now - lastTick < 45) return;
          lastTile = under;
          lastTick = now;
          marker.animate?.([{ transform: "scaleY(1.18)" }, { transform: "none" }], {
            duration: 110,
            easing: "ease-out",
          });
        };

        const tl = gsap.timeline();
        if (!reduced) tl.to(strip, { x: end, duration: 5.4, ease: "power4.out", onUpdate: tick });
        tl.call(() => onLock?.());
        // The stop: the winner lights up in its colour and the rest step back. A loud card jolts the reel.
        tl.set(win, { "--rco-hit": colour, attr: { "data-won": "" } } as gsap.TweenVars);
        tl.to(others, { opacity: 0.3, duration: 0.3, ease: "power2.out" }, "<");
        if (plan.jolt) {
          tl.fromTo(
            flash ?? root.querySelector(".rco-reel-flash"),
            { autoAlpha: 0 },
            {
              keyframes: [
                { autoAlpha: 0.7, duration: 0.08 },
                { autoAlpha: 0, duration: 0.7 },
              ],
            },
            "<",
          );
          tl.to(strip, { keyframes: [{ y: -4 }, { y: 4 }, { y: -2 }, { y: 0 }], duration: 0.24 }, "<");
        }
        // A beat on the lit tile before the card leaves it.
        tl.to({}, { duration: 0.35 });

        return {
          element: win,
          lead: tl,
          release: () => {
            gsap.killTweensOf(strip);
            gsap.to(others, { opacity: 1, duration: 0.3 });
          },
        };
      },
    }),
    [hasWinner],
  );

  return (
    <div
      ref={rootRef}
      className={cn("rco-root rco-reel", className)}
      style={{ ...themeStyle(theme), ...style } as CSSProperties}
    >
      <div className="rco-reel-flash" aria-hidden />
      <div className={cn("rco-reel-strip", names.strip)} aria-hidden>
        {tiles.map((card, index) => (
          <i
            // oxlint-disable-next-line react/no-array-index-key -- a strip's tiles are positional
            key={index}
            className={cn("rco-reel-tile", names.tile)}
            style={{ "--rco-tone": card ? rarityColor(theme, card.rarity) : theme.muted } as CSSProperties}
          >
            <PixelGlyph
              art={card?.art ?? GLYPHS.question}
              colour={card ? rarityColor(theme, card.rarity) : theme.muted}
              cell={5}
            />
            <span className={cn("rco-reel-name", names.tileName)}>{card?.name}</span>
          </i>
        ))}
      </div>
      <i className={cn("rco-reel-marker", names.marker)} aria-hidden />
    </div>
  );
}
