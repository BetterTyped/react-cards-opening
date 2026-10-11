import { gsap } from "gsap";
import { type CSSProperties, type ReactNode, type Ref, useImperativeHandle, useMemo, useRef } from "react";

import { cn, type PrizeWheelClassNames } from "./class-names";
import { GLYPHS } from "./glyphs";
import { PixelGlyph } from "./pixel-glyph";
import { type CardTheme, DEFAULT_THEME, rarityColor, themeStyle } from "./theme";
import type { CardLaunch, CardShow, GlyphCard } from "./types";
import { createRng, DEFAULT_RARITIES, pickCard, type RarityTier } from "@react-cards-opening/core";

const NONE: PrizeWheelClassNames = {};
/** Full turns a spin makes before it starts to settle on its wedge. */
const TURNS = 6;

export interface PrizeWheelHandle {
  /**
   * Spins the wheel and stops it with the winner under the pointer. Answers what a `CardOpening` needs to send
   * the card out of the winning wedge, or null when there is no winner to stop on.
   */
  spin: (
    show: CardShow,
    options?: {
      /** Something bigger than the wheel to flash on a loud card, like the panel around it. */
      flash?: HTMLElement | null;
      /** The wheel has stopped. */
      onLock?: () => void;
    },
  ) => CardLaunch | null;
}

export interface PrizeWheelProps<C extends GlyphCard> {
  /** The card the next spin stops on. With none, the wheel shows what could come up and waits. */
  winner: C | null;
  /** What is on the wheel: every card that could have come up. */
  pool: readonly C[];
  /** How many wedges the wheel has, from four to twelve. Eight when left out. */
  segments?: number;
  theme?: CardTheme;
  rarities?: readonly RarityTier[];
  handle?: Ref<PrizeWheelHandle>;
  /** What sits in the middle of the wheel: a count, a button, a logo. */
  children?: ReactNode;
  className?: string;
  /** A class of your own for each part of the wheel. The wheel's root takes `className`. */
  classNames?: PrizeWheelClassNames;
  style?: CSSProperties;
}

/**
 * A wheel of prizes: wedges in their tiers' colours under a pointer, and a hub in the middle. A spin takes it round
 * six times, slows it, and stops it with the dealt card's wedge under the pointer: the spin decides nothing. Pair
 * it with `CardOpening` and the card lifts out of the winning wedge.
 */
export function PrizeWheel<C extends GlyphCard>({
  winner,
  pool,
  segments = 8,
  theme = DEFAULT_THEME,
  rarities = DEFAULT_RARITIES,
  handle,
  children,
  className,
  classNames: names = NONE,
  style,
}: PrizeWheelProps<C>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const count = Math.min(12, Math.max(4, Math.round(segments)));
  const step = 360 / count;

  // What is on the wheel is the same from spin to spin, and the same on a server as in a browser: every card of
  // the pool once, in an order drawn from a seed, and then whatever the odds bring up until the wheel is full.
  const base = useMemo(() => {
    const { next } = createRng(`wheel:${pool.map((card) => card.id).join(",")}:${count}`);
    const once = pool.toSorted(() => next() - 0.5).slice(0, count);
    return Array.from({ length: count }, (_unused, index) => once[index] ?? pickCard(pool, { rarities, random: next }));
  }, [pool, rarities, count]);

  // The winner's wedge: its own if it is on the wheel already. If not, it takes one over, the same one every time.
  const winnerAt = useMemo(() => {
    if (!winner) return -1;
    const there = base.findIndex((card) => card?.id === winner.id);
    if (there !== -1) return there;
    return Math.floor(createRng(`wedge:${winner.id}`).next() * count);
  }, [base, winner, count]);
  const wedges = base.map((card, index) => (index === winnerAt && winner ? winner : card));

  useImperativeHandle(
    handle,
    () => ({
      spin: ({ tone: colour, plan, reduced }, { flash, onLock } = {}) => {
        const root = rootRef.current;
        const disc = root?.querySelector<HTMLElement>(".rco-wheel-disc");
        const pointer = root?.querySelector<HTMLElement>(".rco-wheel-pointer");
        const all = [...(root?.querySelectorAll<HTMLElement>(".rco-wheel-wedge") ?? [])];
        const win = all[winnerAt];
        if (!root || !disc || !pointer || !win) return null;
        const others = all.filter((wedge) => wedge !== win);

        // Where the wheel has to stand for the winner to be under the pointer: never dead centre, anywhere on the
        // wedge short of its edges. Always forward, and always at least the full set of turns away.
        const now = gsap.getProperty(disc, "rotation") as number;
        const rest = -winnerAt * step + (Math.random() - 0.5) * step * 0.66;
        const ahead = (((rest - now) % 360) + 360) % 360;
        const end = now + TURNS * 360 + ahead;

        gsap.killTweensOf([disc, ...all]);
        for (const wedge of all) wedge.removeAttribute("data-won");
        gsap.set(all, { opacity: 1 });
        if (reduced) gsap.set(disc, { rotation: end });

        // The pointer is knocked aside by each wedge that goes under it. Web Animations, and never more often
        // than the eye can use.
        let lastWedge = -1;
        let lastTick = 0;
        const tick = () => {
          const under = Math.floor(((gsap.getProperty(disc, "rotation") as number) + step / 2) / step);
          const at = performance.now();
          if (under === lastWedge || at - lastTick < 45) return;
          lastWedge = under;
          lastTick = at;
          pointer.animate?.([{ transform: "rotate(-16deg)" }, { transform: "none" }], {
            duration: 130,
            easing: "ease-out",
          });
        };

        const tl = gsap.timeline();
        if (!reduced) tl.to(disc, { rotation: end, duration: 5.6, ease: "power4.out", onUpdate: tick });
        tl.call(() => onLock?.());
        // The stop: the winner lights up in its colour and the rest step back. A loud card jolts the wheel.
        tl.set(root, { "--rco-hit": colour } as gsap.TweenVars);
        tl.set(win, { attr: { "data-won": "" } });
        tl.to(others, { opacity: 0.3, duration: 0.3, ease: "power2.out" }, "<");
        tl.fromTo(
          root.querySelector(".rco-wheel-glow"),
          { autoAlpha: 0, scale: 0.8 },
          { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power2.out" },
          "<",
        );
        if (plan.jolt) {
          tl.fromTo(
            flash ?? root.querySelector(".rco-wheel-flash"),
            { autoAlpha: 0 },
            {
              keyframes: [
                { autoAlpha: 0.7, duration: 0.08 },
                { autoAlpha: 0, duration: 0.7 },
              ],
            },
            "<",
          );
          tl.to(root, { keyframes: [{ x: -5 }, { x: 5 }, { x: -3 }, { x: 0 }], duration: 0.24 }, "<");
        }
        // A beat on the lit wedge before the card leaves it.
        tl.to({}, { duration: 0.35 });

        return {
          element: win.querySelector<HTMLElement>(".rco-wheel-prize") ?? win,
          lead: tl,
          release: () => {
            gsap.killTweensOf(disc);
            gsap.to(others, { opacity: 1, duration: 0.3 });
            gsap.to(root.querySelector(".rco-wheel-glow"), { autoAlpha: 0, duration: 0.4 });
          },
        };
      },
    }),
    [winnerAt, step],
  );

  // Half of what a wedge spans, less the gap to its neighbour, as the half-width of its outer edge.
  const half = Math.tan(((step / 2 - 1.4) * Math.PI) / 180) * 50;

  return (
    <div
      ref={rootRef}
      className={cn("rco-root rco-wheel", className)}
      style={{ ...themeStyle(theme), "--rco-wheel-half": `${half.toFixed(2)}%`, ...style } as CSSProperties}
    >
      <i className={cn("rco-wheel-glow", names.wheelGlow)} aria-hidden />
      <div className={cn("rco-wheel-disc", names.disc)} aria-hidden>
        {wedges.map((card, index) => (
          <i
            // oxlint-disable-next-line react/no-array-index-key -- a wheel's wedges are positional
            key={index}
            className={cn("rco-wheel-wedge", names.wedge)}
            style={
              {
                "--rco-tone": card ? rarityColor(theme, card.rarity) : theme.muted,
                "--rco-wheel-turn": index * step,
              } as CSSProperties
            }
          >
            <span className={cn("rco-wheel-prize", names.prize)}>
              <PixelGlyph
                art={card?.art ?? GLYPHS.question}
                colour={card ? rarityColor(theme, card.rarity) : theme.muted}
                cell={5}
              />
            </span>
          </i>
        ))}
      </div>
      <i className="rco-wheel-flash" aria-hidden />
      <i className={cn("rco-wheel-pointer", names.pointer)} aria-hidden>
        <i className="rco-wheel-pointer-tip" />
      </i>
      <div className={cn("rco-wheel-hub", names.hub)}>{children}</div>
    </div>
  );
}
