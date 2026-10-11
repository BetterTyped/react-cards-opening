import { useCallback, useState } from "react";

import type { OpeningCard } from "./opening";

/**
 * Where a pack is: still `sealed`, `dealt` out face down to be turned over one by one in any order, or `done`, with
 * everything turned and gathered up.
 */
export type PackStage = "sealed" | "dealt" | "done";

export interface CardPack<C extends OpeningCard = OpeningCard> {
  stage: PackStage;
  /** Whether a card of the pack is face up. */
  isUp: (id: string) => boolean;
  /** Cards still face down. */
  left: readonly C[];
  /** Every card is turned: the pack can be finished. */
  allUp: boolean;
  /** This deal is a replay: the cards were opened before, so turning them opens nothing. */
  replay: boolean;
  /** Opens the sealed pack: the cards are dealt face down. */
  tear: () => void;
  /** Turns one card over. Ignored unless the pack is dealt and the card is face down. */
  flip: (id: string) => void;
  /** Gathers the cards up. Ignored until every card is turned. */
  finish: () => void;
  /** Seals the pack again, to deal the same cards once more. */
  reset: () => void;
}

/**
 * A pack of cards without a look: every card is on the table at once and the viewer turns them over in any order.
 * Give it the cards, which of them are opened, and what to do when one is. A pack that is partly opened comes back
 * dealt, and a pack that is fully opened comes back done.
 */
export function useCardPack<C extends OpeningCard>({
  cards,
  opened,
  onOpen,
}: {
  cards: readonly C[];
  opened: readonly string[];
  /** A card was turned face up for the first time. */
  onOpen: (id: string) => void;
}): CardPack<C> {
  // What the viewer did in this deal. Until they do anything, the stage follows from what is opened.
  const [acted, setActed] = useState<{ stage: PackStage; replay: boolean } | null>(null);
  // Cards turned in a replay, where "opened" cannot tell a turned card from an unturned one.
  const [turned, setTurned] = useState<readonly string[]>([]);

  const openedHere = cards.filter((card) => opened.includes(card.id)).length;
  let resting: PackStage = "sealed";
  if (cards.length > 0 && openedHere === cards.length) resting = "done";
  else if (openedHere > 0) resting = "dealt";

  const stage = acted?.stage ?? resting;
  const replay = acted?.replay ?? false;
  const isUp = useCallback(
    (id: string) => (replay ? turned.includes(id) : opened.includes(id)),
    [opened, replay, turned],
  );
  const left = stage === "sealed" ? cards : cards.filter((card) => !isUp(card.id));
  const allUp = stage !== "sealed" && left.length === 0;

  return {
    stage,
    isUp: (id) => stage !== "sealed" && isUp(id),
    left,
    allUp,
    replay,
    tear: () => {
      if (stage === "sealed") setActed({ stage: "dealt", replay });
    },
    flip: (id) => {
      if (stage !== "dealt" || isUp(id) || !cards.some((card) => card.id === id)) return;
      if (replay) setTurned((now) => [...now, id]);
      if (!opened.includes(id)) onOpen(id);
    },
    finish: () => {
      if (stage === "dealt" && allUp) setActed({ stage: "done", replay });
    },
    reset: () => {
      setTurned([]);
      setActed({ stage: "sealed", replay: true });
    },
  };
}
