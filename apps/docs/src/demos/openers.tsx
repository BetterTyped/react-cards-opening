import { useState } from "react";

import { HUNT_DEAL, SAMPLE_CARDS } from "../registry/sample";
import {
  CardCase,
  CardPack,
  CardSpin,
  CardWheel,
  type CardTheme,
  EFFECT_SETS,
  type EffectPlan,
  type EffectSetId,
} from "@react-cards-opening/ui";

/** Which cards have been opened, for a demo: nothing is kept past a reload. */
function useOpened() {
  const [opened, setOpened] = useState<readonly string[]>([]);
  return { opened, onOpen: (id: string) => setOpened((now) => (now.includes(id) ? now : [...now, id])) };
}

/** A sealed pack of five: press it, and turn the cards over one at a time. */
export function PackDemo({ theme, effects }: { theme: CardTheme; effects?: EffectPlan }) {
  const { opened, onOpen } = useOpened();
  return <CardPack cards={HUNT_DEAL} opened={opened} onOpen={onOpen} theme={theme} effects={effects} />;
}

/** A reel that spins past the whole set and stops on the next card of the deal. */
export function SpinDemo({ theme }: { theme: CardTheme }) {
  const { opened, onOpen } = useOpened();
  return <CardSpin cards={HUNT_DEAL} pool={SAMPLE_CARDS} opened={opened} onOpen={onOpen} theme={theme} />;
}

/** A wheel of prizes that spins and stops on the next card of the deal. */
export function WheelDemo({ theme }: { theme: CardTheme }) {
  const { opened, onOpen } = useOpened();
  return <CardWheel cards={HUNT_DEAL} pool={SAMPLE_CARDS} opened={opened} onOpen={onOpen} theme={theme} />;
}

/** A case that opens and gives up its cards one after another. */
export function CaseDemo({ theme }: { theme: CardTheme }) {
  const { opened, onOpen } = useOpened();
  return <CardCase cards={HUNT_DEAL} opened={opened} onOpen={onOpen} theme={theme} />;
}

const SETS = Object.keys(EFFECT_SETS) as EffectSetId[];

/** The same pack under each ready-made plan of effects. Picking a plan seals the pack again. */
export function EffectSetsDemo({ theme }: { theme: CardTheme }) {
  const [set, setSet] = useState<EffectSetId>("radiant");
  return (
    <div className="d-fx">
      <div className="d-fx-chips" role="group" aria-label="Effect set">
        {SETS.map((id) => (
          <button key={id} type="button" className="d-chip-button" aria-pressed={id === set} onClick={() => setSet(id)}>
            {id}
          </button>
        ))}
      </div>
      <PackDemo key={set} theme={theme} effects={EFFECT_SETS[set]} />
    </div>
  );
}
