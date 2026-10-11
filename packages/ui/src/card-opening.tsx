import { gsap } from "gsap";
import { type CSSProperties, type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { CardBackContent, CardContent } from "./card";
import { type CardOpeningClassNames, cn } from "./class-names";
import { type EffectPlan, effectsFor, playSteps, SIGNATURE_EFFECTS } from "./effects";
import { CARD_OPENING_LABELS, type CardOpeningLabels } from "./labels";
import { type CardTheme, DEFAULT_THEME, rarityColor, themeStyle } from "./theme";
import type { CardFaceInfo, CardLaunch, CardShow, GlyphCard } from "./types";
import { useGsapEffect } from "./use-gsap-effect";
import {
  DEFAULT_RARITIES,
  holdSeconds,
  isTopEffect,
  type Opening,
  type OpeningCard,
  prefersReducedMotion,
  type RarityTier,
  showFor,
  tierOf,
} from "@react-cards-opening/core";
import { clearEffects } from "@react-cards-opening/effects";

const BURST = 22;
const SPARKLES = 16;
const CARD_WIDTH = 300;
const CARD_RATIO = 4 / 3;

const noop = () => {};
const NONE: CardOpeningClassNames = {};

/** What keeps a legendary card alive while it is up: the turning foil border, the ray wheel, the shine, sparkles. */
function legendLoops(stage: HTMLElement): gsap.core.Animation[] {
  const legend = (selector: string) => stage.querySelectorAll<HTMLElement>(selector);
  return [
    gsap.to(legend(".rco-legend-spin"), { rotate: 360, duration: 2.4, ease: "none", repeat: -1 }),
    gsap.to(legend(".rco-legend-rays"), { rotate: -360, duration: 26, ease: "none", repeat: -1 }),
    // The shine starts and rests with its band wholly off the card: 115% is just off the left edge, -15% just off
    // the right. Run it any further and the gradient's next copy slides back onto the card and sits there, lit,
    // for the whole pause between sweeps.
    gsap.fromTo(
      legend(".rco-foil"),
      { backgroundPosition: "115% 0", autoAlpha: 1 },
      { backgroundPosition: "-15% 0", duration: 0.9, ease: "power1.inOut", repeat: -1, repeatDelay: 1.2 },
    ),
    gsap.fromTo(
      legend(".rco-sparkle"),
      { scale: 0, autoAlpha: 0 },
      {
        keyframes: [
          { scale: 1, autoAlpha: 1, duration: 0.25 },
          { scale: 0, autoAlpha: 0, duration: 0.55 },
        ],
        stagger: { each: 0.12, repeat: -1, from: "random" },
      },
    ),
  ];
}

/**
 * The shake of a card that is about to turn. A short hum is the five moves it always was. A long one, a mythic's,
 * keeps shaking for all of it, a little harder every time: something is building.
 */
function shiver(x: number, seconds: number): { x: number }[] {
  if (seconds <= 0.75) return [{ x: x - 5 }, { x: x + 5 }, { x: x - 4 }, { x: x + 4 }, { x }];
  const moves = Math.round(seconds / 0.065);
  return Array.from({ length: moves }, (_unused, index) => {
    if (index === moves - 1) return { x };
    const far = 3 + (index / moves) * 9;
    return { x: x + (index % 2 === 0 ? -far : far) };
  });
}

/** Waits a few frames for an element React is about to render. */
function whenRendered(look: () => HTMLElement | null, frames = 30): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    let left = frames;
    const tick = () => {
      const match = look();
      if (match || left <= 0) {
        resolve(match);
        return;
      }
      left -= 1;
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function defaultFace(card: OpeningCard, info: CardFaceInfo, names: CardOpeningClassNames): ReactNode {
  const glyph = card as Partial<GlyphCard> & OpeningCard;
  return (
    <CardContent
      art={glyph.art}
      name={glyph.name ?? card.id}
      rarity={info.tier.label}
      line={glyph.line}
      note={info.note}
      tone={info.tone}
      classNames={names}
    />
  );
}

function defaultReading(card: OpeningCard, info: CardFaceInfo): string[] {
  const glyph = card as Partial<GlyphCard> & OpeningCard;
  return [glyph.name, info.tier.label, glyph.line, info.note].filter((text): text is string => Boolean(text));
}

export interface CardOpeningProps<C extends OpeningCard> {
  /** The rules, from `useCardOpening`. A peek's origin is the element that was pressed. */
  opening: Opening<C, HTMLElement>;
  theme?: CardTheme;
  rarities?: readonly RarityTier[];
  /**
   * Where a card comes out of: an element, or an element with something to play first. Asked once per card, as
   * its reveal is built. With nothing to leave from, the card grows out of the middle of the screen.
   */
  launch?: (card: C, show: CardShow) => CardLaunch | HTMLElement | null;
  /**
   * Where a card goes when it is done: the element it shrinks into. It may not be rendered yet when the card
   * turns over, so it is asked for a few frames running. With nowhere to go, the card fades out where it is.
   */
  landing?: (card: C) => HTMLElement | null;
  /** The front of the card. Rows with the class `rco-line` rise in as it turns over. */
  renderFace?: (card: C, info: CardFaceInfo) => ReactNode;
  /** The back of the card, instead of the question glyph. */
  renderBack?: (card: C) => ReactNode;
  /** A small last line for the ready-made face, like where the card was found. */
  noteOf?: (card: C) => string | undefined;
  /**
   * Every run of text on the face, so the card stays up long enough to read. The ready-made face answers this
   * itself; a face of your own should too, or it gets the shortest hold.
   */
  readingOf?: (card: C, info: CardFaceInfo) => readonly string[];
  labels?: Partial<CardOpeningLabels>;
  /**
   * What each tier plays on top of the card's own show. Left out, every tier gets its signature show
   * (`SIGNATURE_EFFECTS`). Hand over one of `EFFECT_SETS` or a plan of your own, or `false` for the card's own
   * show and nothing more.
   */
  effects?: EffectPlan | false;
  /** A class of your own for each part of the reveal. */
  classNames?: CardOpeningClassNames;
  /** The card's width in pixels at the middle of the screen. Narrow screens get 78% of their width at most. */
  width?: number;
  /** Height over width. */
  ratio?: number;
  /** Where the overlay is mounted. The document's body unless told otherwise. */
  container?: Element | null;
}

/**
 * The reveal itself, over the page: a card leaves where it was found, face down, for the middle of the screen. It
 * hums, turns over with a burst in its tier's colour, stays for as long as it takes to read, and lands where it
 * belongs. Loud tiers open a wheel of rays. A legendary gets the full show.
 */
export function CardOpening<C extends OpeningCard>({
  opening,
  theme = DEFAULT_THEME,
  rarities = DEFAULT_RARITIES,
  launch,
  landing,
  renderFace,
  renderBack,
  noteOf,
  readingOf,
  labels,
  effects = SIGNATURE_EFFECTS,
  classNames: names = NONE,
  width: cardWidth = CARD_WIDTH,
  ratio = CARD_RATIO,
  container,
}: CardOpeningProps<C>) {
  const stageRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  // Looping effects (the legendary foil and sparkles) live outside the timeline, so they are stopped by hand.
  const loopsRef = useRef<gsap.core.Animation[]>([]);
  const aliveRef = useRef(true);
  const { run, step, peek } = useSyncExternalStore(opening.subscribe, opening.getState, opening.getState);
  const current = opening.current();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Read through a ref: a function from the page above is a new one on every render, and must not restart a reveal.
  const latest = useRef({ launch, landing, noteOf, readingOf, theme, rarities, effects });
  latest.current = { launch, landing, noteOf, readingOf, theme, rarities, effects };

  // The canvas the extra effects are drawn on goes when the reveal does.
  useEffect(() => {
    const stage = stageRef.current;
    return () => {
      const layer = stage?.querySelector<HTMLElement>(".rco-fx-layer");
      if (layer) clearEffects(layer);
    };
  }, [mounted]);

  const killLoops = () => {
    for (const loop of loopsRef.current) loop.kill();
    loopsRef.current = [];
  };

  // A card in a run: out of where it was found, to the middle, over, and home.
  useGsapEffect(
    (safe) => {
      const stage = stageRef.current;
      if (!stage || !run || !current) return;
      const find = (selector: string) => stage.querySelector<HTMLElement>(selector);
      const all = (selector: string) => stage.querySelectorAll<HTMLElement>(selector);
      const backdrop = find(".rco-backdrop");
      const flyer = find(".rco-flyer");
      const inner = find(".rco-flyer-inner");
      const back = find(".rco-back");
      const rays = find(".rco-rays");
      if (!backdrop || !flyer || !inner || !back || !rays) return;

      // A reveal taken down a moment ago is still fading out. Left alone, that fade would win over this one.
      gsap.killTweensOf([backdrop, flyer, rays, ...all(".rco-legend-rays")]);

      const props = latest.current;
      const reduced = prefersReducedMotion();
      const tier = tierOf(props.rarities, current.rarity);
      const plan = showFor(tier.effect, reduced);
      const colour = rarityColor(props.theme, current.rarity);
      const { replay } = run;

      const launched = props.launch?.(current, { tone: colour, plan, reduced }) ?? null;
      const from: CardLaunch | null = launched instanceof HTMLElement ? { element: launched } : launched;

      const tl = gsap.timeline();
      timelineRef.current = tl;
      if (from?.lead) tl.add(from.lead);

      // The card leaves where it was found for the middle of the screen, face down.
      const width = Math.min(cardWidth, window.innerWidth * 0.78);
      const height = width * ratio;
      const centre = { x: window.innerWidth / 2 - width / 2, y: window.innerHeight / 2 - height / 2 };
      // Measured the moment the card leaves, so scrolling while something plays first cannot throw it off.
      const start = { x: centre.x, y: centre.y, scale: 0.05 };
      const measureStart = () => {
        if (!from) return;
        const at = from.element.getBoundingClientRect();
        start.x = at.left + at.width / 2 - width / 2;
        start.y = at.top + at.height / 2 - height / 2;
        start.scale = Math.max(0.04, at.width / width);
      };
      tl.set(flyer, { width, height });
      tl.set(inner, { rotateY: 180 });
      tl.set(back, { boxShadow: "inset 0 0 0 2px rgb(255 255 255 / 0.14)" });
      // What played first finishes on an undimmed page; then the room darkens and the card leaves.
      tl.addLabel("flight", from?.lead ? "+=0.15" : undefined);
      tl.call(measureStart, undefined, "flight");
      tl.set(backdrop, { pointerEvents: "auto" }, "<");
      tl.to(backdrop, { autoAlpha: 1, duration: 0.4 }, "<");
      tl.fromTo(
        flyer,
        {
          x: () => start.x,
          y: () => start.y,
          scale: () => start.scale,
          rotate: 0,
          autoAlpha: 1,
        },
        {
          x: centre.x,
          y: centre.y,
          scale: 1,
          rotate: gsap.utils.random(-4, 4),
          duration: plan.flightSeconds,
          ease: "expo.out",
          // In a fromTo this belongs in the to-vars: the start is measured when the card leaves, not when built.
          immediateRender: false,
        },
        "<",
      );
      // What the tier adds to the card's own show, and where it is played: behind the card, in its colour.
      const steps = reduced ? [] : effectsFor(props.effects, tier);
      const cue = (moment: "hum" | "turn") =>
        safe(() => {
          const layer = find(".rco-fx-layer");
          if (!layer) return;
          playSteps(layer, steps, {
            moment,
            at: flyer,
            size: width,
            ratio,
            tone: colour,
            subject: stage,
          });
        });
      // It hums before it turns: longer and louder the rarer it is.
      tl.addLabel("hum");
      if (steps.length > 0) tl.call(cue("hum"), undefined, "hum");
      tl.to(back, {
        boxShadow: `inset 0 0 0 2px ${colour}, 0 0 70px 12px ${colour}`,
        duration: 0.5,
        ease: "power2.out",
      });
      if (plan.hum) {
        tl.to(
          flyer,
          {
            keyframes:
              plan.hum.kind === "shake" ? shiver(centre.x, plan.hum.seconds) : [{ y: centre.y - 8 }, { y: centre.y }],
            duration: plan.hum.seconds,
            ease: "none",
          },
          "<0.2",
        );
      }
      // The turn. A press on the face-down card jumps straight here.
      tl.addLabel("turn");
      tl.to(flyer, { rotate: 0, duration: 0.5, ease: "back.out(1.6)" });
      tl.to(inner, { rotateY: 0, duration: plan.flipSeconds, ease: "back.out(1.4)" }, "<");
      tl.fromTo(
        all(".rco-burst-bit"),
        { x: 0, y: 0, scale: 0.6, autoAlpha: 1 },
        {
          x: (index: number) => Math.cos((index / BURST) * Math.PI * 2) * (width * 0.7 + ((index * 37) % 90)),
          y: (index: number) => Math.sin((index / BURST) * Math.PI * 2) * (height * 0.55 + ((index * 23) % 70)),
          scale: 1,
          autoAlpha: 0,
          duration: 1.1,
          ease: "expo.out",
          immediateRender: false,
        },
        "<0.2",
      );
      if (steps.length > 0) tl.call(cue("turn"), undefined, "<");
      if (plan.rays) {
        tl.fromTo(rays, { autoAlpha: 0, rotate: 0, scale: 0.6 }, { autoAlpha: 0.9, scale: 1, duration: 0.5 }, "<");
        tl.to(rays, { rotate: 60, duration: 2.6, ease: "none" }, "<");
      }
      // Legendary gets the full show: a flash, shockwaves, a second ray wheel, a living foil border and sparkles.
      if (plan.legendary) {
        tl.fromTo(
          all(".rco-legend-flash"),
          { autoAlpha: 0 },
          {
            keyframes: [
              { autoAlpha: 0.9, duration: 0.08 },
              { autoAlpha: 0, duration: 1 },
            ],
          },
          "<",
        );
        tl.fromTo(
          all(".rco-legend-wave"),
          { scale: 0.2, autoAlpha: 1 },
          { scale: 4.5, autoAlpha: 0, duration: 1.3, ease: "expo.out", stagger: 0.2 },
          "<",
        );
        tl.fromTo(
          all(".rco-legend-rays"),
          { autoAlpha: 0, rotate: 0, scale: 0.4 },
          { autoAlpha: 1, scale: 1.1, duration: 0.7, ease: "expo.out" },
          "<",
        );
        tl.fromTo(all(".rco-legend-border"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, "<0.2");
        tl.call(
          safe(() => {
            loopsRef.current.push(...legendLoops(stage));
          }),
          undefined,
          "<",
        );
      }
      const lines = all(".rco-line");
      if (lines.length > 0) {
        tl.from(lines, { y: 14, autoAlpha: 0, duration: 0.45, ease: "expo.out", stagger: 0.06 }, "<0.15");
      }
      // The card counts as opened while it sits face up: whatever the page does about that (a re-render, a list
      // growing by one) happens now, not when the viewer presses, so the card can leave the instant they do.
      tl.call(opening.reveal, undefined, "+=0.15");
      // Face up for as long as this card's own text takes to read, and never less than its show takes to play out.
      const info: CardFaceInfo = { tone: colour, tier, note: props.noteOf?.(current) };
      tl.addLabel("hold");
      tl.to({}, { duration: holdSeconds((props.readingOf ?? defaultReading)(current, info), plan) });

      let detach: () => void = noop;
      detach = opening.attach({
        turn: () => void tl.play("turn"),
        // Straight to the card leaving for home.
        finish: () => {
          if (tl.progress() < 1) tl.progress(1);
        },
        // Taken down where it stands. A card still face down goes back unopened.
        cancel: safe(() => {
          tl.kill();
          killLoops();
          gsap.to([backdrop, flyer, rays, ...all(".rco-legend-rays")], { autoAlpha: 0, duration: 0.25 });
          gsap.set(backdrop, { pointerEvents: "none" });
          from?.release?.();
          detach();
        }),
        close: noop,
      });

      // Home: the card shrinks into where it belongs.
      const land = safe(async () => {
        opening.reveal();
        opening.enter("land");
        const look = latest.current.landing;
        const slot = look ? await whenRendered(() => look(current)) : null;
        if (!aliveRef.current) return;
        const finish = () => {
          gsap.set(backdrop, { pointerEvents: "none" });
          from?.release?.();
          detach();
          opening.landed();
        };
        killLoops();
        const out = gsap.timeline({ onComplete: finish });
        out.to(backdrop, { autoAlpha: 0, duration: 0.45 });
        out.to(rays, { autoAlpha: 0, duration: 0.3 }, "<");
        out.to(
          all(".rco-legend-rays, .rco-legend-border, .rco-sparkle, .rco-foil"),
          { autoAlpha: 0, duration: 0.3 },
          "<",
        );
        if (!slot || reduced) {
          out.to(flyer, { autoAlpha: 0, scale: 0.9, duration: 0.3 }, "<");
          return;
        }
        const to = slot.getBoundingClientRect();
        out.to(
          flyer,
          {
            x: to.left + to.width / 2 - width / 2,
            y: to.top + to.height / 2 - height / 2,
            scale: to.width / width,
            duration: 0.6,
            ease: "power3.inOut",
          },
          "<",
        );
        out.to(flyer, { autoAlpha: 0, duration: 0.18 }, ">-0.18");
        if (replay) {
          out.fromTo(
            slot,
            { boxShadow: `0 0 0 2px ${colour}, 0 0 40px 4px ${colour}` },
            { boxShadow: "0 0 0 0px transparent", duration: 1, clearProps: "boxShadow" },
          );
        }
      });
      tl.call(() => void land());
      // Last, so none of them sits between two tweens that are placed relative to each other.
      for (const phase of ["flight", "hum", "turn", "hold"] as const) {
        tl.call(() => opening.enter(phase), undefined, phase);
      }
    },
    [run?.id, step],
  );

  // An opened card, looked at again. No lead and no turn: the card comes up out of what was pressed, face up, and
  // stays until a press on it, a press on the backdrop or Escape sends it back.
  useGsapEffect(
    (safe) => {
      const stage = stageRef.current;
      if (!stage || !peek || !current) return;
      const { origin } = peek;
      const find = (selector: string) => stage.querySelector<HTMLElement>(selector);
      const all = (selector: string) => stage.querySelectorAll<HTMLElement>(selector);
      const backdrop = find(".rco-backdrop");
      const flyer = find(".rco-flyer");
      const inner = find(".rco-flyer-inner");
      const rays = find(".rco-rays");
      const press = find(".rco-flyer-press");
      if (!backdrop || !flyer || !inner || !rays || !press) return;

      const props = latest.current;
      const reduced = prefersReducedMotion();
      const plan = showFor(tierOf(props.rarities, current.rarity).effect, reduced);
      const width = Math.min(cardWidth, window.innerWidth * 0.78);
      const height = width * ratio;
      // Measured when the card leaves and again when it goes back: the page may scroll while it is up.
      const home = () => {
        const at = origin.getBoundingClientRect();
        return {
          x: at.left + at.width / 2 - width / 2,
          y: at.top + at.height / 2 - height / 2,
          scale: Math.max(0.04, at.height / height),
        };
      };

      // A card still on its way back from an earlier press is dropped where it is, and so is the fade of a
      // reveal that was just taken down.
      timelineRef.current?.kill();
      killLoops();
      gsap.killTweensOf([backdrop, flyer, rays, ...all(".rco-legend-rays")]);
      gsap.set(flyer, { width, height, rotate: 0, autoAlpha: 1, ...home() });
      gsap.set(inner, { rotateY: 0 });
      gsap.set(rays, { autoAlpha: 0 });
      gsap.set(backdrop, { pointerEvents: "auto" });

      const tl = gsap.timeline();
      timelineRef.current = tl;
      tl.to(backdrop, { autoAlpha: 1, duration: 0.3 });
      tl.to(
        flyer,
        {
          x: window.innerWidth / 2 - width / 2,
          y: window.innerHeight / 2 - height / 2,
          scale: 1,
          duration: reduced ? 0.01 : 0.45,
          ease: "expo.out",
        },
        "<",
      );
      const lines = all(".rco-line");
      if (lines.length > 0) {
        tl.fromTo(
          lines,
          { y: 10, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.35, ease: "expo.out", stagger: 0.04 },
          "<0.1",
        );
      }
      if (plan.rays) {
        tl.fromTo(rays, { autoAlpha: 0, rotate: 0, scale: 0.6 }, { autoAlpha: 0.9, scale: 1, duration: 0.5 }, "<");
      }
      if (plan.legendary) {
        tl.fromTo(
          all(".rco-legend-rays"),
          { autoAlpha: 0, rotate: 0, scale: 0.4 },
          { autoAlpha: 1, scale: 1.1, duration: 0.7, ease: "expo.out" },
          "<",
        );
        tl.fromTo(all(".rco-legend-border"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, "<");
      }
      // The card can stay up for as long as it likes, so what moves around it loops instead of running out.
      tl.call(
        safe(() => {
          if (plan.rays && !reduced) {
            loopsRef.current.push(gsap.to(rays, { rotate: 360, duration: 16, ease: "none", repeat: -1 }));
          }
          if (plan.legendary) loopsRef.current.push(...legendLoops(stage));
        }),
        undefined,
        "<",
      );

      const keys = new AbortController();
      let detach: () => void = noop;
      const close = safe(() => {
        keys.abort();
        detach();
        tl.kill();
        killLoops();
        gsap.set(backdrop, { pointerEvents: "none" });
        const out = gsap.timeline({ onComplete: opening.closed });
        timelineRef.current = out;
        out.to(backdrop, { autoAlpha: 0, duration: 0.3 });
        out.to(
          [rays, ...all(".rco-legend-rays, .rco-legend-border, .rco-sparkle, .rco-foil")],
          { autoAlpha: 0, duration: 0.2 },
          "<",
        );
        out.to(flyer, { ...home(), duration: reduced ? 0.01 : 0.32, ease: "power3.in" }, "<");
        out.to(flyer, { autoAlpha: 0, duration: 0.12 }, ">-0.12");
        origin.focus({ preventScroll: true });
      });
      detach = opening.attach({ turn: noop, finish: noop, cancel: close, close });
      window.addEventListener(
        "keydown",
        (event) => {
          if (event.key === "Escape") close();
        },
        { signal: keys.signal },
      );
      // Enter and Space close it too, and a second Enter does not reopen what is underneath.
      press.focus({ preventScroll: true });
      return () => keys.abort();
    },
    [peek?.id],
  );

  useEffect(
    () => () => {
      for (const loop of loopsRef.current) loop.kill();
      loopsRef.current = [];
    },
    [],
  );

  if (!mounted) return null;
  const target = container ?? document.body;
  const tier = current ? tierOf(rarities, current.rarity) : null;
  const tone = current ? rarityColor(theme, current.rarity) : theme.fg;
  const legendary = tier ? isTopEffect(tier.effect) : false;
  const info: CardFaceInfo | null = current && tier ? { tone, tier, note: noteOf?.(current) } : null;
  const words = { ...CARD_OPENING_LABELS, ...labels };

  return createPortal(
    <div
      ref={stageRef}
      className={cn("rco-root rco-stage", names.stage)}
      aria-live="polite"
      style={{ ...themeStyle(theme), "--rco-tone": tone } as CSSProperties}
    >
      <div className={cn("rco-backdrop", names.backdrop)} aria-hidden onClick={opening.pressBackdrop} />
      <div className={cn("rco-rays", names.rays)} aria-hidden />
      {legendary ? (
        <>
          <div className={cn("rco-legend-rays", names.legendRays)} aria-hidden />
          <div className={cn("rco-legend-flash", names.legendFlash)} aria-hidden />
        </>
      ) : null}
      <div className={cn("rco-fx-layer", names.effects)} aria-hidden />
      <div className={cn("rco-flyer", names.flyer)}>
        {legendary ? (
          <>
            {[0, 1].map((wave) => (
              <i key={wave} className={cn("rco-legend-wave", names.wave)} aria-hidden />
            ))}
            <span className="rco-sparkles" aria-hidden>
              {Array.from({ length: SPARKLES }, (_unused, index) => {
                const angle = (index / SPARKLES) * Math.PI * 2;
                const reach = 0.62 + ((index * 37) % 20) / 100;
                return (
                  <i
                    // oxlint-disable-next-line react/no-array-index-key -- sparkles are positional
                    key={index}
                    className={cn("rco-sparkle", names.sparkle)}
                    style={{
                      left: `${50 + Math.cos(angle) * reach * 100}%`,
                      top: `${50 + Math.sin(angle) * reach * 80}%`,
                    }}
                  />
                );
              })}
            </span>
            <div className={cn("rco-legend-border", names.foilBorder)} aria-hidden>
              <i className="rco-legend-spin" />
            </div>
          </>
        ) : null}
        <span className="rco-burst" aria-hidden>
          {Array.from({ length: BURST }, (_unused, index) => (
            // oxlint-disable-next-line react/no-array-index-key -- burst particles are positional
            <i key={index} className={cn("rco-burst-bit", names.burst)} />
          ))}
        </span>
        <button
          type="button"
          className={cn("rco-flyer-press", names.press)}
          aria-label={peek ? words.closeCard : words.turnCard}
          title={peek ? words.closeCardHint : words.turnCardHint}
          onClick={opening.pressCard}
        />
        <div className="rco-flyer-inner">
          <div className={cn("rco-face", names.face)}>
            {legendary ? <i className={cn("rco-foil", names.shine)} aria-hidden /> : null}
            {current && info ? (renderFace ? renderFace(current, info) : defaultFace(current, info, names)) : null}
          </div>
          <div className={cn("rco-back", names.back)}>
            {current && renderBack ? renderBack(current) : <CardBackContent theme={theme} />}
          </div>
        </div>
      </div>
    </div>,
    target,
  );
}
