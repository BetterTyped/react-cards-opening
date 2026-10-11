import { type ReactNode, useRef, useState } from "react";

import { DEFAULT_RARITIES, type RarityTier, useCardOpening, useOpeningPhase } from "@react-cards-opening/core";
import { Card, type CardFaceInfo, CardOpening, type CardTheme, type GlyphCard } from "@react-cards-opening/ui";

/*
 * Cards lying face down that open where they lie: press one and it lifts out of its place, turns over in the middle
 * of the screen and lands back, face up. Press it again to look at it. It is `useCardOpening` and `CardOpening` with
 * the card's own place as both where it leaves from and where it lands.
 */
export function CardShelf<C extends GlyphCard>({
  cards,
  theme,
  rarities = DEFAULT_RARITIES,
  renderFace,
  readingOf,
}: {
  cards: readonly C[];
  theme: CardTheme;
  rarities?: readonly RarityTier[];
  renderFace?: (card: C, info: CardFaceInfo) => ReactNode;
  readingOf?: (card: C, info: CardFaceInfo) => readonly string[];
}) {
  const [opened, setOpened] = useState<readonly string[]>([]);
  const places = useRef(new Map<string, HTMLElement>());
  const hunt = useCardOpening<C, HTMLElement>({
    cards,
    opened,
    onOpen: (id) => setOpened((now) => (now.includes(id) ? now : [...now, id])),
  });
  const phase = useOpeningPhase(hunt.opening);
  // The card is in the air: its place on the shelf is empty until it lands.
  const away = hunt.current && phase !== "idle" && phase !== "lead" ? hunt.current.id : null;
  const placeOf = (card: C) => places.current.get(card.id) ?? null;

  return (
    <>
      <ul className="d-shelf-cards" data-count={cards.length}>
        {cards.map((card) => {
          const isOpen = opened.includes(card.id);
          return (
            <li key={card.id}>
              <button
                type="button"
                ref={(element) => {
                  if (element) places.current.set(card.id, element);
                  else places.current.delete(card.id);
                }}
                className="d-place"
                data-away={away === card.id ? "" : undefined}
                // Not while a card is being looked at: the dimmed page already takes the presses then, and a
                // disabled button could not take the focus back when the card is put away.
                disabled={hunt.running}
                aria-label={isOpen ? `Look at ${card.name} again` : "Open this card"}
                onClick={(event) => {
                  if (isOpen) hunt.peek(card.id, event.currentTarget);
                  else hunt.start([card.id]);
                }}
              >
                <Card card={card} theme={theme} rarities={rarities} faceDown={!isOpen} width="100%">
                  {renderFace ? (info: CardFaceInfo) => renderFace(card, info) : undefined}
                </Card>
              </button>
            </li>
          );
        })}
      </ul>
      <CardOpening
        opening={hunt.opening}
        theme={theme}
        rarities={rarities}
        launch={placeOf}
        landing={placeOf}
        renderFace={renderFace}
        readingOf={readingOf}
      />
    </>
  );
}
