import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { type Combo, COMBOS, namesIn, OPENER_PARTS, type Part, PIECE_PARTS } from "../registry/gallery";
import { cardOfTier, TIER_CARDS } from "../registry/sample";
import { LookControls, useLookTheme } from "./look";
import { DemoStage } from "./preview";
import { SiteLink } from "./site-link";
import { prefersReducedMotion } from "@react-cards-opening/core";
import {
  Card,
  type CardTheme,
  EFFECT_KINDS,
  EFFECT_LIST,
  EffectLayer,
  type EffectLayerHandle,
  type EffectStep,
  rarityColor,
  SIGNATURE_EFFECTS,
} from "@react-cards-opening/ui";

/*
 * The galleries: walls of tiles in which the library plays, for the pages that show rather than explain. A tile
 * only plays while it is on screen, and only holds a canvas while it is near it, so a wall of a hundred costs what
 * the dozen in view cost.
 */

/** Whether an element is on screen, or within `margin` of it. */
function useNear<T extends Element>(margin: string) {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return undefined;
    const watcher = new IntersectionObserver(([entry]) => setNear(entry?.isIntersecting ?? false), {
      rootMargin: margin,
    });
    watcher.observe(element);
    return () => watcher.disconnect();
  }, [margin]);
  return [ref, near] as const;
}

/**
 * A wall plays a few tiles at a time, however many of them are on screen. Each tile asks for a turn and plays when
 * it is given one, so what a wall costs is set by `limit` and not by how wide the window is.
 */
function turns(limit: number) {
  let playing = 0;
  const waiting: (() => void)[] = [];
  const next = () => {
    while (playing < limit) {
      const start = waiting.shift();
      if (!start) return;
      playing += 1;
      start();
    }
  };
  return {
    /**
     * Stands in line. `go` is called when the turn comes, with what to call when it is over. Answers a way out:
     * of the line, or of the turn if it has begun.
     */
    ask(go: (done: () => void) => void): () => void {
      let state: "waiting" | "playing" | "over" = "waiting";
      const done = () => {
        if (state !== "playing") return;
        state = "over";
        playing -= 1;
        next();
      };
      const start = () => {
        state = "playing";
        go(done);
      };
      waiting.push(start);
      next();
      return () => {
        if (state === "waiting") {
          state = "over";
          const at = waiting.indexOf(start);
          if (at !== -1) waiting.splice(at, 1);
        } else done();
      };
    },
  };
}

/** Three reveals at once on a wall of them, and five single effects on a wall of those. */
const REVEALS = turns(3);
const SINGLES_AT_ONCE = turns(5);

type Moment = "hum" | "turn";

/** Plays the steps of a stack that belong to one moment of a reveal, each after its own delay. */
function playMoment(
  layer: EffectLayerHandle | null,
  steps: readonly EffectStep[],
  { moment, ...options }: { moment: Moment; at: Element | null; tone: string; accent?: string },
) {
  for (const step of steps) {
    const cue = typeof step === "object" && "effect" in step ? step : { effect: step };
    if ((cue.on ?? "turn") === moment) layer?.play(cue.effect, { ...options, delay: cue.delay ?? 0 });
  }
}

/** Seconds a card hums face down before it turns, how long it is held up, and the pause before the next round. */
const HUM = 0.7;
const HOLD = 3.3;
const GAP = 0.9;
/** How long a tile keeps its turn: the loud part of what it plays. After that the next tile in line may start. */
const LOUD = 2.2;
const LOUD_SINGLE = 1.5;

interface FxTileProps {
  name: string;
  /** Under the name: the effects in the stack, or an effect's own name as code. */
  names: readonly string[];
  tier: string;
  steps: readonly EffectStep[];
  theme: CardTheme;
  /** Its place on the wall: tiles start a beat apart, so a wall ripples and never fires as one. */
  order: number;
  /** A reveal: the card starts face down, hums, and turns. Otherwise the card stands and the effect plays behind it. */
  flip?: boolean;
  size: "big" | "small";
}

/**
 * One tile: a card on its ground, a layer behind it, and a stack of effects played on a loop while the tile is on
 * screen. A press plays it again from the start.
 */
function FxTile({ name, names, tier, steps, theme, order, flip = false, size }: FxTileProps) {
  const [ref, near] = useNear<HTMLDivElement>("160px");
  const layer = useRef<EffectLayerHandle>(null);
  const place = useRef<HTMLDivElement>(null);
  const [up, setUp] = useState(!flip);
  const [round, setRound] = useState(0);
  const card = useMemo(() => cardOfTier(tier), [tier]);
  const tone = rarityColor(theme, tier);
  const accent = theme.levels[4];

  useEffect(() => {
    if (!near) return undefined;
    const still = prefersReducedMotion();
    const handle = layer.current;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (seconds: number, run: () => void) => timers.push(setTimeout(run, seconds * 1000));
    const options = () => ({ at: place.current, tone, accent });
    const turn = () => {
      if (flip) setUp(true);
      playMoment(handle, steps, { moment: "turn", ...options() });
    };
    const line = flip ? REVEALS : SINGLES_AT_ONCE;
    let leave: (() => void) | null = null;
    // Plays once, now. `again` is what to do once it has played out: stand in line for the next round.
    const play = (again: () => void) => {
      if (!flip) {
        playMoment(handle, steps, { moment: "hum", ...options() });
        turn();
        if (!still) later(3.4, again);
        return;
      }
      setUp(false);
      playMoment(handle, steps, { moment: "hum", ...options() });
      later(HUM, turn);
      // With reduced motion the card turns once and stays: nothing loops.
      if (still) return;
      later(HUM + HOLD, () => setUp(false));
      later(HUM + HOLD + GAP, again);
    };
    const queue = () => {
      // Not in a hidden tab, and not behind a card somebody is opening: the wall waits for both.
      if (document.visibilityState !== "visible" || document.querySelector(".rco-stage[data-open]")) {
        later(0.8, queue);
        return;
      }
      leave = line.ask((done) => {
        later(flip ? LOUD : LOUD_SINGLE, done);
        play(queue);
      });
    };
    // A press plays at once, in line or not. Left alone, a tile waits its turn: under reduced motion it waits for
    // the press.
    if (round > 0) play(queue);
    else if (!still) later(0.15 + (order % 6) * 0.12, queue);
    else if (flip) setUp(true);
    return () => {
      for (const timer of timers) clearTimeout(timer);
      leave?.();
      handle?.clear();
    };
  }, [near, round, flip, steps, tone, accent, order]);

  return (
    <div ref={ref} className="g-tile" data-size={size} style={{ "--tone": tone } as CSSProperties}>
      <div className="g-stage" style={{ background: theme.bg }}>
        <button
          type="button"
          className="g-room"
          aria-label={`Play ${name} again`}
          onClick={() => setRound((now) => now + 1)}
        >
          {near ? <EffectLayer handle={layer} theme={theme} /> : null}
          <div ref={place} className="g-card">
            <Card card={card} theme={theme} faceDown={!up} width="100%" />
          </div>
        </button>
      </div>
      <div className="g-about">
        <b>{name}</b>
        <span className="g-names">
          {names.map((effect) => (
            <i key={effect}>{effect}</i>
          ))}
        </span>
      </div>
    </div>
  );
}

function Wall({ size, children }: { size: "big" | "small"; children: ReactNode }) {
  return (
    <div className="g-wall" data-size={size}>
      {children}
    </div>
  );
}

function ComboWall({ combos, theme }: { combos: readonly Combo[]; theme: CardTheme }) {
  return (
    <Wall size="big">
      {combos.map((combo, index) => (
        <FxTile
          key={combo.name}
          name={combo.name}
          names={namesIn(combo.steps)}
          tier={combo.tier}
          steps={combo.steps}
          theme={theme}
          order={index}
          flip
          size="big"
        />
      ))}
    </Wall>
  );
}

const SHOWS: readonly Combo[] = TIER_CARDS.map((card) => ({
  name: card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1),
  tier: card.rarity,
  steps: SIGNATURE_EFFECTS[card.rarity as keyof typeof SIGNATURE_EFFECTS] ?? [],
}));

/** The six shows the openers play when told nothing, one per tier. */
export function ShowsGallery() {
  const theme = useLookTheme();
  return (
    <>
      <div className="g-tools">
        <span>Every tile is the library, playing live. Press one to play it again.</span>
        <LookControls />
      </div>
      <ComboWall combos={SHOWS} theme={theme} />
    </>
  );
}

/** Named stacks of effects, each a small reveal. `first` keeps the wall to its first few. */
export function CombosGallery({ first }: { first?: number }) {
  const theme = useLookTheme();
  return <ComboWall combos={first ? COMBOS.slice(0, first) : COMBOS} theme={theme} />;
}

/** The tier a single effect's tile wears, so a wall of them runs through all six colours. */
const tierAt = (index: number) => TIER_CARDS[(index * 5 + 1) % TIER_CARDS.length]?.rarity ?? "rare";

/** Every effect as a stack of one, kind by kind. */
const SINGLES = EFFECT_KINDS.map(({ kind, label }) => ({
  kind,
  label,
  effects: EFFECT_LIST.filter((effect) => effect.kind === kind).map((effect, index) => ({
    name: effect.name,
    label: effect.label,
    names: [effect.name],
    steps: [effect.name] as readonly EffectStep[],
    tier: tierAt(index),
  })),
}));

/** Every effect in the library on a tile of its own, kind by kind. */
export function EffectsGallery() {
  const theme = useLookTheme();
  return (
    <>
      {SINGLES.map(({ kind, label, effects }) => (
        <section key={kind} className="g-kind">
          <h3>
            {label} <small>{effects.length}</small>
          </h3>
          <Wall size="small">
            {effects.map((effect, index) => (
              <FxTile
                key={effect.name}
                name={effect.label}
                names={effect.names}
                tier={effect.tier}
                steps={effect.steps}
                theme={theme}
                order={index}
                size="small"
              />
            ))}
          </Wall>
        </section>
      ))}
    </>
  );
}

/** A component, live: mounted the first time it comes near the screen, and left there. */
function PartTile({ part, theme, wide }: { part: Part; theme: CardTheme; wide?: boolean }) {
  const [ref, near] = useNear<HTMLDivElement>("300px");
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (near) setSeen(true);
  }, [near]);
  const combo = COMBOS[9] ?? COMBOS[0];
  return (
    <section className="g-part" data-wide={wide ? "" : undefined}>
      <header>
        <SiteLink path={part.path} className="g-part-name">
          {part.name}
        </SiteLink>
        <span>{part.line}</span>
        <SiteLink path={part.path} className="g-part-go">
          Props and code
        </SiteLink>
      </header>
      <div ref={ref} className="g-part-stage">
        {seen && part.demo ? <DemoStage demo={part.demo} /> : null}
        {seen && !part.demo && combo ? (
          <FxTile
            name={combo.name}
            names={namesIn(combo.steps)}
            tier={combo.tier}
            steps={combo.steps}
            theme={theme}
            order={0}
            flip
            size="big"
          />
        ) : null}
      </div>
    </section>
  );
}

/** Every component, playing: the five openers at the page's full width, then the pieces they are built from. */
export function ComponentsGallery() {
  const theme = useLookTheme();
  return (
    <>
      <div className="g-tools">
        <span>Every one is the real component, not a recording.</span>
        <LookControls />
      </div>
      <div className="g-parts">
        {OPENER_PARTS.map((part) => (
          <PartTile key={part.path} part={part} theme={theme} wide />
        ))}
        {PIECE_PARTS.map((part) => (
          <PartTile key={part.path} part={part} theme={theme} />
        ))}
      </div>
    </>
  );
}
