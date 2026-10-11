import { type CSSProperties, useEffect, useState } from "react";

import { TIER_CARDS } from "../registry/sample";
import {
  DEFAULT_RARITIES,
  holdSeconds,
  prefersReducedMotion,
  showFor,
  tierOf,
  useCardOpening,
  useOpeningPhase,
} from "@react-cards-opening/core";
import { type CardTheme, rarityColor, themeStyle } from "@react-cards-opening/ui";

/** A space that holds a line open while there is no card to name. */
const NBSP = "\u00A0";

/*
 * A reveal with none of the ui package's components: the rules from `core`, a `div`, and CSS transitions keyed off
 * the phase. The effect below is all a renderer owes the opening: say which phase the card is in, and be ready to
 * jump ahead or stop when a press asks for it.
 */
export function HeadlessDemo({ theme }: { theme: CardTheme }) {
  const [opened, setOpened] = useState<readonly string[]>([]);
  const hunt = useCardOpening({
    cards: TIER_CARDS,
    opened,
    onOpen: (id) => setOpened((now) => (now.includes(id) ? now : [...now, id])),
  });
  const { opening, run, step, current } = hunt;
  const phase = useOpeningPhase(opening);

  useEffect(() => {
    if (!run || !current) return;
    const plan = showFor(tierOf(DEFAULT_RARITIES, current.rarity).effect, prefersReducedMotion());
    let timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, act: () => void) => timers.push(setTimeout(act, ms));
    const clear = () => {
      for (const timer of timers) clearTimeout(timer);
      timers = [];
    };
    const land = () => {
      clear();
      opening.reveal();
      opening.enter("land");
      after(320, opening.landed);
    };
    const turn = () => {
      clear();
      opening.enter("turn");
      after(420, () => {
        opening.reveal();
        opening.enter("hold");
      });
      after(420 + holdSeconds([current.name, current.line], plan) * 1000, land);
    };
    opening.enter("hum");
    after(plan.hum ? 900 : 200, turn);
    const detach = opening.attach({ turn, finish: land, cancel: clear, close: () => {} });
    return () => {
      clear();
      detach();
    };
    // oxlint-disable-next-line react/exhaustive-deps -- one reveal per card of a run
  }, [run?.id, step]);

  const faceUp = phase === "turn" || phase === "hold" || phase === "land";
  const tone = current ? rarityColor(theme, current.rarity) : theme.muted;

  return (
    <div className="d-headless" style={{ ...themeStyle(theme), "--tone": tone } as CSSProperties}>
      <div className="d-headless-table">
        <button
          type="button"
          className="d-headless-card"
          disabled={!run}
          onClick={hunt.pressCard}
          aria-label={faceUp ? "Keep this card" : "Turn the card over"}
        >
          {/* The turning happens one level in: a button flattens what is inside it, so it cannot hold two sides. */}
          <span className="d-headless-turn" data-phase={phase} data-up={faceUp ? "" : undefined}>
            <span className="d-headless-back">?</span>
            <span className="d-headless-face">
              <strong>{current?.name ?? NBSP}</strong>
              <em>{current ? tierOf(DEFAULT_RARITIES, current.rarity).label : NBSP}</em>
              <small>{current?.line}</small>
            </span>
          </span>
        </button>
        <p className="d-headless-phase" aria-live="polite">
          phase: <code>{phase}</code>
        </p>
      </div>
      <div className="d-headless-side">
        <div className="d-headless-actions">
          <button
            type="button"
            className="d-chip-button"
            onClick={() => hunt.start()}
            disabled={hunt.running || hunt.allOpened}
          >
            Open {hunt.pending.length === TIER_CARDS.length ? "all four" : "the rest"}
          </button>
          <button type="button" className="d-chip-button" onClick={hunt.pressBackdrop} disabled={!hunt.running}>
            Stop
          </button>
          <button type="button" className="d-chip-button" onClick={hunt.openAll} disabled={hunt.allOpened}>
            Skip the show
          </button>
        </div>
        <ol className="d-headless-list">
          {TIER_CARDS.map((card) => (
            <li key={card.id} data-open={opened.includes(card.id) ? "" : undefined}>
              <i style={{ background: rarityColor(theme, card.rarity) }} />
              {opened.includes(card.id) ? card.name : "Unopened"}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
