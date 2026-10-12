import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from "react";

import { TIER_CARDS } from "../registry/sample";
import { DEFAULT_RARITIES, prefersReducedMotion, tierOf, useCardOpening } from "@react-cards-opening/core";
import {
  Card,
  CardOpening,
  type CardTheme,
  EffectLayer,
  type EffectLayerHandle,
  EFFECTS,
  effectsFor,
  type EffectStep,
  playSteps,
  rarityColor,
  SIGNATURE_EFFECTS,
} from "@react-cards-opening/ui";

/** The order the hand turns itself over in: from the middle out, so the eye starts where the headline points. */
const ORDER = [2, 3, 1, 4, 0, 5] as const;
/** Milliseconds between one card turning and the next, and how long the whole hand stays up before it resets. */
const BEAT = 2300;
const REST = 2600;

/** A step's effect, whether it was written as a name or as a cue. */
const effectOf = (step: EffectStep) => (typeof step === "object" && "effect" in step ? step.effect : step);

/**
 * A tier's show without the parts that take over the screen: no shake, no impact frame, no bars. The hero plays on
 * its own, again and again, next to text somebody is reading. Those belong to a reveal the reader asked for.
 */
function gentle(steps: readonly EffectStep[]): EffectStep[] {
  return steps.filter((step) => {
    const effect = effectOf(step);
    const kind = typeof effect === "string" ? EFFECTS[effect]?.kind : effect.kind;
    return kind !== "screen";
  });
}

/** The card leans toward the pointer, and a light on its face follows it. */
function lean(event: PointerEvent<HTMLButtonElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - box.left) / box.width;
  const y = (event.clientY - box.top) / box.height;
  event.currentTarget.style.setProperty("--ry", `${((x - 0.5) * 22).toFixed(2)}deg`);
  event.currentTarget.style.setProperty("--rx", `${((0.5 - y) * 18).toFixed(2)}deg`);
  event.currentTarget.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
  event.currentTarget.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
}
function settle(event: PointerEvent<HTMLButtonElement>) {
  for (const name of ["--rx", "--ry"]) event.currentTarget.style.removeProperty(name);
}

/**
 * The hero's hand of cards, one of each rarity, and the library playing on it for real. Left alone, the hand turns
 * itself over a card at a time, each with its tier's own show, then gathers and starts again. A card leans toward
 * the pointer. Pressed, it opens the way it would in an app: the whole reveal, over the page.
 */
export function HeroFan({ theme }: { theme: CardTheme }) {
  const cards = TIER_CARDS;
  const layer = useRef<EffectLayerHandle>(null);
  const places = useRef(new Map<string, HTMLElement>());
  // Cards the reader opened stay up. Cards the hand turned by itself go back down when it gathers.
  const [opened, setOpened] = useState<readonly string[]>([]);
  const [turned, setTurned] = useState<readonly string[]>([]);
  const hunt = useCardOpening({
    cards,
    opened,
    onOpen: (id) => setOpened((now) => (now.includes(id) ? now : [...now, id])),
  });
  // The hand waits while the reader has the pointer on it, and while a reveal is up.
  const held = useRef(false);
  const running = useRef(false);
  running.current = hunt.running || hunt.peeking !== null;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let at = 0;
    let timer: ReturnType<typeof setTimeout>;
    const beat = () => {
      const waiting = document.visibilityState !== "visible" || held.current || running.current;
      if (waiting) {
        timer = setTimeout(beat, 600);
        return;
      }
      if (at >= ORDER.length) {
        // Every card has had its turn: the hand goes face down and starts over.
        at = 0;
        setTurned([]);
        timer = setTimeout(beat, 1400);
        return;
      }
      const card = cards[ORDER[at] ?? 0];
      at += 1;
      if (!card) return;
      setTurned((now) => [...now, card.id]);
      const place = places.current.get(card.id);
      const stage = layer.current?.element();
      if (place && stage) {
        playSteps(stage, gentle(effectsFor(SIGNATURE_EFFECTS, tierOf(DEFAULT_RARITIES, card.rarity))), {
          moment: "turn",
          at: place,
          // Drawn smaller than the card would ask for: the hand shares the hero with a headline.
          size: place.getBoundingClientRect().width * 0.72,
          tone: rarityColor(theme, card.rarity),
          subject: null,
          delay: 0.18,
        });
      }
      timer = setTimeout(beat, at >= ORDER.length ? REST : BEAT);
    };
    timer = setTimeout(beat, 1500);
    return () => clearTimeout(timer);
  }, [cards, theme]);

  const placeOf = (card: { id: string }) => places.current.get(card.id) ?? null;

  return (
    <div className="h-stage">
      <div className="h-air" aria-hidden>
        <EffectLayer handle={layer} theme={theme} />
      </div>
      <ul
        className="h-fan"
        onPointerEnter={() => {
          held.current = true;
        }}
        onPointerLeave={() => {
          held.current = false;
        }}
      >
        {cards.map((card, index) => {
          const isOpen = opened.includes(card.id);
          const up = isOpen || turned.includes(card.id);
          const away = hunt.current?.id === card.id && hunt.running;
          return (
            <li
              key={card.id}
              style={
                {
                  "--i": index - (cards.length - 1) / 2,
                  "--n": index,
                  "--tone": rarityColor(theme, card.rarity),
                } as CSSProperties
              }
            >
              <button
                type="button"
                ref={(element) => {
                  if (element) places.current.set(card.id, element);
                  else places.current.delete(card.id);
                }}
                className="h-card"
                data-up={up ? "" : undefined}
                data-away={away ? "" : undefined}
                disabled={hunt.running}
                aria-label={isOpen ? `Look at ${card.name} again` : `Open the ${card.rarity} card`}
                onPointerMove={lean}
                onPointerLeave={settle}
                onClick={(event) => {
                  if (isOpen) hunt.peek(card.id, event.currentTarget);
                  else hunt.start([card.id]);
                }}
              >
                <Card card={card} theme={theme} faceDown={!up} width="100%" />
              </button>
            </li>
          );
        })}
      </ul>
      <CardOpening opening={hunt.opening} theme={theme} launch={placeOf} landing={placeOf} />
    </div>
  );
}
