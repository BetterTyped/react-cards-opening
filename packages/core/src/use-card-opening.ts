import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Opening, type OpeningCard, type OpeningPeek, type OpeningPhase, type OpeningRun } from "./opening";

export interface CardOpening<C extends OpeningCard = OpeningCard, O = HTMLElement> {
  /** The rules behind this hook. Hand it to whatever draws the reveal. */
  opening: Opening<C, O>;
  run: OpeningRun | null;
  /** Which card of the run's queue is up. */
  step: number;
  /** The opened card being looked at again, if any. */
  peeking: OpeningPeek<O> | null;
  /** The card that is up, in a run or a peek. */
  current: C | null;
  /** Cards nobody has opened yet. */
  pending: readonly C[];
  running: boolean;
  /** How many cards of this run come after the one that is up. */
  left: number;
  allOpened: boolean;
  /** Opens every unopened card, one after another. Pass a queue to open only some. */
  start: (queue?: readonly string[]) => boolean;
  /** Goes over every card again. Nothing is opened by it. */
  replay: () => boolean;
  /** Skips the show and opens every unopened card at once. */
  openAll: () => void;
  /** Brings an opened card up again, out of what was pressed. */
  peek: (card: string, origin: O) => void;
  /** Puts a peeked card back. */
  close: () => void;
  pressCard: () => void;
  pressBackdrop: () => void;
}

/**
 * A card opening without a look: give it the cards, which of them are opened, and what to do when one is. It keeps
 * the queue and answers what each press means. Pair it with `CardOpening` from `@react-cards-opening/ui`, or draw
 * the reveal yourself and report to `opening`.
 */
export function useCardOpening<C extends OpeningCard, O = HTMLElement>({
  cards,
  opened,
  onOpen,
  onRunChange,
}: {
  /** Every card in the deal, opened or not. */
  cards: readonly C[];
  opened: readonly string[];
  /** A card was turned face up for the first time. */
  onOpen: (id: string) => void;
  /** A run started or came to rest: finished, stopped or skipped to its end. */
  onRunChange?: (running: boolean) => void;
}): CardOpening<C, O> {
  const [opening] = useState(() => new Opening<C, O>());
  // On every render: a function from the page above is a new one each time, and the rules read the latest.
  opening.sync({ cards, opened, onOpen });
  const { run, step, peek } = useSyncExternalStore(opening.subscribe, opening.getState, opening.getState);

  const onRunChangeRef = useRef(onRunChange);
  onRunChangeRef.current = onRunChange;
  const running = run !== null;
  const wasRunningRef = useRef(false);
  useEffect(() => {
    if (running === wasRunningRef.current) return;
    wasRunningRef.current = running;
    onRunChangeRef.current?.(running);
  }, [running]);

  const pending = cards.filter((card) => !opened.includes(card.id));
  const currentId = run ? run.queue[step] : peek?.card;

  return {
    opening,
    run,
    step,
    peeking: peek,
    current: cards.find((card) => card.id === currentId) ?? null,
    pending,
    running,
    left: run ? run.queue.length - step - 1 : 0,
    allOpened: pending.length === 0,
    start: (queue) => opening.start({ queue }),
    replay: () => opening.start({ replay: true }),
    openAll: opening.openAll,
    peek: opening.peek,
    close: opening.close,
    pressCard: opening.pressCard,
    pressBackdrop: opening.pressBackdrop,
  };
}

/** The phase the reveal is in, as state. Separate from `useCardOpening` so only what shows it re-renders. */
export function useOpeningPhase(opening: Pick<Opening<never, never>, "subscribePhase" | "getPhase">): OpeningPhase {
  return useSyncExternalStore(opening.subscribePhase, opening.getPhase, opening.getPhase);
}
