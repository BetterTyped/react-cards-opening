import { type CSSProperties, type ReactNode, useRef, useState } from "react";

import { CardOpening } from "./card-opening";
import type { CardWheelClassNames } from "./class-names";
import { cn } from "./class-names";
import type { EffectPlan } from "./effects";
import { AgainIcon, ForwardIcon, ScanIcon } from "./icons";
import { CARD_WHEEL_LABELS, type CardWheelLabels, type OpenerState } from "./labels";
import { badgeIn, Finds, Panel } from "./panel";
import { PrizeWheel, type PrizeWheelHandle } from "./prize-wheel";
import { type CardTheme, DEFAULT_THEME, rarityColor } from "./theme";
import type { CardFaceInfo, CardShow, GlyphCard } from "./types";
import { DEFAULT_RARITIES, type RarityTier, tierOf, useCardOpening } from "@react-cards-opening/core";

const NONE: CardWheelClassNames = {};

export interface CardWheelProps<C extends GlyphCard> {
  /** Every card in the deal, won or not, in the order they come up. */
  cards: readonly C[];
  opened: readonly string[];
  /** A card was turned face up for the first time. */
  onOpen: (id: string) => void;
  /** What is on the wheel. The deal itself unless you hand it the whole set. */
  pool?: readonly C[];
  /** How many wedges the wheel has, from four to twelve. Eight when left out. */
  segments?: number;
  theme?: CardTheme;
  rarities?: readonly RarityTier[];
  /** Extra buttons in the header, next to the spin button. */
  actions?: ReactNode;
  /** A spin started or came to rest. */
  onRunChange?: (running: boolean) => void;
  labels?: Partial<CardWheelLabels>;
  /** Where a won card lands instead of its badge here. Answer null and the card fades out where it is. */
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
  /** A class of your own for each part: the panel's, the wheel's and the reveal's. */
  classNames?: CardWheelClassNames;
  style?: CSSProperties;
}

/**
 * The wheel as a whole opener: a wheel of prizes that spins and stops on a card, the reveal for it, and a list of
 * what was won. One press is one spin. It is `PrizeWheel` and `CardOpening` wired to `useCardOpening`.
 */
export function CardWheel<C extends GlyphCard>({
  cards,
  opened,
  onOpen,
  pool,
  segments,
  theme = DEFAULT_THEME,
  rarities = DEFAULT_RARITIES,
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
}: CardWheelProps<C>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<PrizeWheelHandle>(null);
  const hunt = useCardOpening<C>({ cards, opened, onOpen, onRunChange });
  const { run, step, current, pending, left } = hunt;

  // The strip keeps showing the last spin once it is over, with its winner still under the marker.
  const [last, setLast] = useState<{ card: C; key: string } | null>(null);
  const spinning = run && current && !hunt.peeking ? { card: current, key: `${run.id}:${step}` } : null;
  if (spinning && spinning.key !== last?.key) setLast(spinning);
  const shown = spinning ?? last;

  if (cards.length === 0) return null;

  const words = { ...CARD_WHEEL_LABELS, ...labels };
  const state: OpenerState = {
    total: cards.length,
    opened: cards.length - pending.length,
    pending: pending.length,
    left,
    running: run !== null,
    replay: run?.replay ?? false,
  };
  const idle = hunt.peeking !== null;

  let buttons: ReactNode = (
    <button
      type="button"
      className={cn("rco-button rco-button-main", names.mainButton)}
      onClick={() => hunt.start(pending.slice(0, 1).map((card) => card.id))}
      disabled={idle}
    >
      <ScanIcon />
      {words.spin}
    </button>
  );
  if (run) {
    buttons =
      // A spin is one card, so the run never has more to give. The deal does: Take all hands over the rest of it.
      !run.replay && pending.length > 1 ? (
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
        onClick={hunt.replay}
        disabled={idle}
      >
        <AgainIcon />
        {words.replay}
      </button>
    );
  }

  const tone = current ? rarityColor(theme, current.rarity) : theme.fg;

  return (
    <Panel
      kind="wheelbox"
      theme={theme}
      tone={tone}
      names={names}
      className={className}
      style={style}
      panelRef={rootRef}
      flashRef={flashRef}
      headline={words.headline(state)}
      subline={words.subline(state)}
      actions={actions}
      buttons={buttons}
    >
      <div className="rco-wheelbox-stand">
        <PrizeWheel
          handle={wheelRef}
          winner={shown?.card ?? null}
          pool={pool ?? cards}
          segments={segments}
          theme={theme}
          rarities={rarities}
          className={names.wheel}
          classNames={names}
        >
          {/* A second way to do what the button in the header does: for the pointer, and out of the tab order. */}
          <button
            type="button"
            className="rco-wheel-press"
            onClick={() => (hunt.allOpened ? hunt.replay() : hunt.start(pending.slice(0, 1).map((card) => card.id)))}
            disabled={run !== null || hunt.peeking !== null}
            aria-hidden
            tabIndex={-1}
          >
            {words.hub(state)}
          </button>
        </PrizeWheel>
      </div>
      <Finds
        cards={cards}
        opened={opened}
        theme={theme}
        names={names}
        disabled={run !== null}
        labels={words}
        whereOf={(card) => tierOf(rarities, card.rarity).label}
        onPeek={(card, element) => hunt.peek(card.id, element)}
      />
      <CardOpening
        effects={effects}
        opening={hunt.opening}
        theme={theme}
        rarities={rarities}
        launch={(_card: C, show: CardShow) => wheelRef.current?.spin(show, { flash: flashRef.current }) ?? null}
        landing={landing ?? ((card) => badgeIn(rootRef.current, card.id))}
        renderFace={renderFace}
        renderBack={renderBack}
        readingOf={readingOf}
        labels={words}
        classNames={names}
      />
    </Panel>
  );
}
