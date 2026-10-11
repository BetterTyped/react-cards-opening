import { type CSSProperties, type ReactNode, useRef } from "react";

import { Card } from "./card";
import { CardOpening } from "./card-opening";
import { type CardCaseClassNames, cn } from "./class-names";
import type { EffectPlan } from "./effects";
import type { PixelArt } from "./glyphs";
import { AgainIcon, ForwardIcon } from "./icons";
import { CARD_CASE_LABELS, type CardCaseLabels, type OpenerState } from "./labels";
import { LootCase, type LootCaseHandle } from "./loot-case";
import { Panel } from "./panel";
import { type CardTheme, DEFAULT_THEME, rarityColor } from "./theme";
import type { CardFaceInfo, CardShow, GlyphCard } from "./types";
import { DEFAULT_RARITIES, type RarityTier, useCardOpening, useOpeningPhase } from "@react-cards-opening/core";

const NONE: CardCaseClassNames = {};

export interface CardCaseProps<C extends GlyphCard> {
  /** Every card in the case, taken out or not, in the order they come out. */
  cards: readonly C[];
  opened: readonly string[];
  /** A card was turned face up for the first time. */
  onOpen: (id: string) => void;
  theme?: CardTheme;
  rarities?: readonly RarityTier[];
  /** The glyph on the front of the case. */
  emblem?: PixelArt;
  /** Extra buttons in the header, next to the open button. */
  actions?: ReactNode;
  /** The case started giving up its cards, or came to rest. */
  onRunChange?: (running: boolean) => void;
  labels?: Partial<CardCaseLabels>;
  /** Where a card lands instead of its place on the shelf here. Answer null and the card fades out where it is. */
  landing?: (card: C) => HTMLElement | null;
  renderFace?: (card: C, info: CardFaceInfo) => ReactNode;
  renderBack?: (card: C) => ReactNode;
  readingOf?: (card: C, info: CardFaceInfo) => readonly string[];
  /**
   * What each tier plays on top of the card's own show. Left out, every tier gets its signature show
   * (`SIGNATURE_EFFECTS`). Hand over one of `EFFECT_SETS` or a plan of your own, or `false` for the card's own
   * show and nothing more.
   */
  effects?: EffectPlan | false;
  className?: string;
  /** A class of your own for each part: the panel's, the case's, the shelf's and the reveal's. */
  classNames?: CardCaseClassNames;
  style?: CSSProperties;
}

/**
 * The case as a whole opener: a box that opens, the cards that come out of it one after another, and a shelf they
 * land on. Press the case or the button. It is `LootCase` and `CardOpening` wired to `useCardOpening`.
 */
export function CardCase<C extends GlyphCard>({
  cards,
  opened,
  onOpen,
  theme = DEFAULT_THEME,
  rarities = DEFAULT_RARITIES,
  emblem,
  actions,
  onRunChange,
  labels,
  landing,
  renderFace,
  renderBack,
  readingOf,
  effects,
  className,
  classNames: names = NONE,
  style,
}: CardCaseProps<C>) {
  const flashRef = useRef<HTMLDivElement>(null);
  const caseRef = useRef<LootCaseHandle>(null);
  const places = useRef(new Map<string, HTMLElement>());
  const hunt = useCardOpening<C>({
    cards,
    opened,
    onOpen,
    onRunChange: (running) => {
      // The run is over: the lid goes back on, whatever is left inside.
      if (!running) caseRef.current?.close();
      onRunChange?.(running);
    },
  });
  const { run, current, pending, left } = hunt;
  const phase = useOpeningPhase(hunt.opening);

  if (cards.length === 0) return null;

  const words = { ...CARD_CASE_LABELS, ...labels };
  const state: OpenerState = {
    total: cards.length,
    opened: cards.length - pending.length,
    pending: pending.length,
    left,
    running: run !== null,
    replay: run?.replay ?? false,
  };
  const busy = run !== null || hunt.peeking !== null;
  const openIt = () => (hunt.allOpened ? hunt.replay() : hunt.start());
  // The card is in the air: its place on the shelf is empty until it lands.
  const away = current && phase !== "idle" && phase !== "lead" ? current.id : null;
  const placeOf = (card: C) => places.current.get(card.id) ?? null;

  let buttons: ReactNode = (
    <button
      type="button"
      className={cn("rco-button rco-button-main", names.mainButton)}
      onClick={openIt}
      disabled={busy}
    >
      {words.open}
    </button>
  );
  if (run) {
    buttons =
      !run.replay && left > 0 ? (
        <button type="button" className={cn("rco-button rco-button-skip", names.sideButton)} onClick={hunt.openAll}>
          <ForwardIcon />
          {words.openAll}
        </button>
      ) : null;
  } else if (hunt.allOpened) {
    buttons = (
      <button
        type="button"
        className={cn("rco-button rco-button-again", names.sideButton)}
        onClick={openIt}
        disabled={busy}
      >
        <AgainIcon />
        {words.replay}
      </button>
    );
  }

  const tone = current ? rarityColor(theme, current.rarity) : theme.levels[4];

  return (
    <Panel
      kind="crate"
      theme={theme}
      tone={tone}
      names={names}
      className={className}
      style={style}
      flashRef={flashRef}
      headline={words.headline(state)}
      subline={words.subline(state)}
      actions={actions}
      buttons={buttons}
    >
      <div className="rco-crate-stand">
        <LootCase
          handle={caseRef}
          theme={theme}
          tone={tone}
          emblem={emblem}
          idle={!busy}
          onPress={openIt}
          disabled={busy}
          shortcut
          className={names.case}
          classNames={names}
        />
      </div>
      <ul className={cn("rco-shelf", names.shelf)} aria-label={words.shelf}>
        {cards.map((card) => {
          const isOpen = opened.includes(card.id);
          return (
            <li key={card.id} className="rco-shelf-place">
              <button
                type="button"
                ref={(element) => {
                  if (element) places.current.set(card.id, element);
                  else places.current.delete(card.id);
                }}
                className={cn("rco-shelf-slot", names.slot)}
                data-open={isOpen ? "" : undefined}
                data-away={away === card.id ? "" : undefined}
                disabled={run !== null || !isOpen}
                aria-label={isOpen ? words.openCard(card.name) : words.emptySlot}
                onClick={(event) => hunt.peek(card.id, event.currentTarget)}
              >
                <Card card={card} theme={theme} rarities={rarities} faceDown={!isOpen} width="100%" classNames={names}>
                  {renderFace ? (info: CardFaceInfo) => renderFace(card, info) : undefined}
                </Card>
              </button>
            </li>
          );
        })}
      </ul>
      <CardOpening
        effects={effects}
        opening={hunt.opening}
        theme={theme}
        rarities={rarities}
        launch={(_card: C, show: CardShow) => caseRef.current?.open(show, { flash: flashRef.current }) ?? null}
        landing={landing ?? placeOf}
        renderFace={renderFace}
        renderBack={renderBack}
        readingOf={readingOf}
        labels={words}
        classNames={names}
      />
    </Panel>
  );
}
