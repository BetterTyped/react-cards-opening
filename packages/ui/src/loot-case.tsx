import { gsap } from "gsap";
import { type CSSProperties, type Ref, useEffect, useImperativeHandle, useRef } from "react";

import { cn, type LootCaseClassNames } from "./class-names";
import { GLYPHS, type PixelArt } from "./glyphs";
import { PixelGlyph } from "./pixel-glyph";
import { type CardTheme, DEFAULT_THEME, themeStyle } from "./theme";
import type { CardLaunch, CardShow } from "./types";
import { prefersReducedMotion } from "@react-cards-opening/core";

/** Sparks thrown as the lid pops. */
const BITS = 14;

const NONE: LootCaseClassNames = {};

export interface LootCaseHandle {
  /**
   * Opens the case for a card. The first time it shakes, the lid pops and light pours out; while it stays open, a
   * later card only makes the light swell. Answers what a `CardOpening` needs to send the card out of the case.
   */
  open: (
    show: CardShow,
    options?: {
      /** Something bigger than the case to flash on a loud card, like the panel around it. */
      flash?: HTMLElement | null;
    },
  ) => CardLaunch | null;
  /** Shuts the lid and puts the light out. */
  close: () => void;
}

export interface LootCaseProps {
  theme?: CardTheme;
  /** The colour of the light and the latch: the tier of the card coming out. */
  tone?: string;
  /** The glyph on the front of the case. */
  emblem?: PixelArt;
  /** Nothing is going on: a shut case may stir now and then. */
  idle?: boolean;
  /** Makes the case a button. */
  onPress?: () => void;
  disabled?: boolean;
  /** What a screen reader calls the case when it is a button. */
  label?: string;
  /**
   * The press is a second way to do what a button next to the case already does. It stays for the pointer and is
   * kept out of the tab order and away from screen readers, so the same thing is not offered twice.
   */
  shortcut?: boolean;
  handle?: Ref<LootCaseHandle>;
  className?: string;
  /** A class of your own for each part of the case. The case's root takes `className`. */
  classNames?: LootCaseClassNames;
  style?: CSSProperties;
}

/**
 * A case with cards in it. Shut, it stirs now and then. Opened, it shakes, its lid pops, light in the colour of
 * what is coming pours out of it, and the cards leave through the top one after another. It is drawn with CSS:
 * there is no image to swap. Pair it with `CardOpening`, or use `CardCase` for the whole thing.
 */
export function LootCase({
  theme = DEFAULT_THEME,
  tone,
  emblem = GLYPHS.question,
  idle = true,
  onPress,
  disabled = false,
  label = "Open the case",
  shortcut = false,
  handle,
  className,
  classNames: names = NONE,
  style,
}: LootCaseProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);

  useImperativeHandle(
    handle,
    () => ({
      open: ({ plan, reduced }, { flash } = {}) => {
        const root = rootRef.current;
        const find = (selector: string) => root?.querySelector<HTMLElement>(selector) ?? null;
        const box = find(".rco-case-box");
        const lid = find(".rco-case-lid");
        const glow = find(".rco-case-glow");
        const rays = find(".rco-case-rays");
        const mouth = find(".rco-case-mouth");
        if (!root || !box || !lid || !glow || !rays || !mouth) return null;
        const bits = root.querySelectorAll<HTMLElement>(".rco-case-bit");

        gsap.killTweensOf([box, lid, glow, rays, ...bits]);
        const tl = gsap.timeline();
        if (openRef.current) {
          // Already open: the light swells in the new card's colour, and that is all the warning it gets.
          tl.fromTo(glow, { scale: 0.8 }, { scale: 1, duration: 0.3, ease: "power2.out" });
        } else {
          openRef.current = true;
          root.dataset.open = "";
          if (!reduced) {
            // It shakes harder the closer it gets, the way something does that is about to give.
            tl.to(box, {
              keyframes: [{ rotate: -2 }, { rotate: 2 }, { rotate: -3 }, { rotate: 3 }, { rotate: -4 }, { rotate: 0 }],
              duration: 0.62,
              ease: "none",
            });
            tl.to(box, { keyframes: [{ y: -6 }, { y: 0 }], duration: 0.18, ease: "power2.out" }, ">-0.1");
          }
          // The lid goes back on its hinge and up a little; the light comes out from under it.
          tl.to(lid, { rotateX: 74, y: -10, duration: reduced ? 0.01 : 0.45, ease: "back.out(2.2)" });
          tl.fromTo(
            glow,
            { autoAlpha: 0, scale: 0.3 },
            { autoAlpha: 1, scale: 1, duration: 0.5, ease: "expo.out" },
            "<0.05",
          );
          tl.fromTo(
            rays,
            { autoAlpha: 0, scale: 0.5 },
            { autoAlpha: 0.9, scale: 1, duration: 0.5, ease: "expo.out" },
            "<",
          );
          tl.fromTo(
            bits,
            { x: 0, y: 0, scale: 0.6, autoAlpha: 1 },
            {
              x: (index: number) =>
                Math.cos(Math.PI * (0.12 + (index / (BITS - 1)) * 0.76)) * (70 + ((index * 37) % 60)),
              y: (index: number) =>
                -Math.sin(Math.PI * (0.12 + (index / (BITS - 1)) * 0.76)) * (80 + ((index * 23) % 70)),
              scale: 1,
              autoAlpha: 0,
              duration: 0.9,
              ease: "expo.out",
              immediateRender: false,
            },
            "<",
          );
          if (plan.jolt && flash) {
            tl.fromTo(
              flash,
              { autoAlpha: 0 },
              {
                keyframes: [
                  { autoAlpha: 0.7, duration: 0.08 },
                  { autoAlpha: 0, duration: 0.7 },
                ],
              },
              "<",
            );
          }
          // A beat with the case open and lit before the first card comes out.
          tl.to({}, { duration: 0.2 }, ">-0.45");
        }
        // The rays keep turning for as long as the case is open.
        if (!reduced) gsap.to(rays, { rotate: "+=360", duration: 40, ease: "none", repeat: -1 });
        return { element: mouth, lead: tl };
      },
      close: () => {
        const root = rootRef.current;
        if (!root || !openRef.current) return;
        openRef.current = false;
        delete root.dataset.open;
        const lid = root.querySelector<HTMLElement>(".rco-case-lid");
        const lights = root.querySelectorAll<HTMLElement>(".rco-case-glow, .rco-case-rays");
        gsap.killTweensOf([lid, ...lights]);
        gsap.to(lights, { autoAlpha: 0, duration: 0.3 });
        gsap.to(lid, { rotateX: 0, y: 0, duration: prefersReducedMotion() ? 0.01 : 0.35, ease: "power2.in" });
      },
    }),
    [],
  );

  // A shut case with nothing going on stirs now and then: something is in there. Web Animations, and only while
  // the case is on screen.
  useEffect(() => {
    const root = rootRef.current;
    const box = root?.querySelector<HTMLElement>(".rco-case-box");
    if (!root || !box || !idle || prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const stir = () => {
      if (openRef.current) return;
      box.animate(
        [
          { transform: "none" },
          { transform: "rotate(-2deg)" },
          { transform: "rotate(2deg)" },
          { transform: "rotate(-1deg)" },
          { transform: "none" },
        ],
        { duration: 420, easing: "ease-in-out" },
      );
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !timer) timer = setInterval(stir, 2600);
      if (!entry?.isIntersecting && timer) {
        clearInterval(timer);
        timer = null;
      }
    });
    observer.observe(root);
    return () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [idle]);

  // Whatever is still moving when the case goes away goes with it.
  useEffect(
    () => () => {
      const root = rootRef.current;
      if (root) gsap.killTweensOf(root.querySelectorAll("*"));
    },
    [],
  );

  return (
    <div
      ref={rootRef}
      className={cn("rco-root rco-case", className)}
      style={{ ...themeStyle(theme), "--rco-tone": tone ?? theme.levels[4], ...style } as CSSProperties}
    >
      <i className={cn("rco-case-rays", names.caseRays)} aria-hidden />
      <i className={cn("rco-case-glow", names.glow)} aria-hidden />
      <span className="rco-case-bits" aria-hidden>
        {Array.from({ length: BITS }, (_unused, index) => (
          // oxlint-disable-next-line react/no-array-index-key -- sparks are positional
          <i key={index} className={cn("rco-case-bit", names.caseBit)} />
        ))}
      </span>
      <span className={cn("rco-case-box", names.box)}>
        <i className={cn("rco-case-lid", names.lid)} />
        <i className="rco-case-mouth" aria-hidden />
        <span className={cn("rco-case-body", names.body)}>
          <PixelGlyph art={emblem} colour={theme.levels[4]} cell={5} />
          <i className={cn("rco-case-latch", names.latch)} />
        </span>
      </span>
      {onPress ? (
        <button
          type="button"
          className="rco-case-press"
          onClick={onPress}
          disabled={disabled}
          aria-label={shortcut ? undefined : label}
          aria-hidden={shortcut || undefined}
          tabIndex={shortcut ? -1 : undefined}
        />
      ) : null}
    </div>
  );
}
