import { useMemo, useState } from "react";

import { describeCell, HUNT_DEAL, SAMPLE_CARDS, sampleLevels } from "../registry/sample";
import { CardHunt, type CardTheme } from "@react-cards-opening/ui";

/** The whole hunt: a grid with cards hidden in it, the scan that finds them, and the reveal for each. */
export function HuntDemo({
  theme,
  only,
  hero = false,
  columns = 30,
}: {
  theme: CardTheme;
  /** Keep the deal to cards of these tiers. */
  only?: readonly string[];
  hero?: boolean;
  columns?: number;
}) {
  const [opened, setOpened] = useState<readonly string[]>([]);
  const levels = useMemo(() => sampleLevels(columns), [columns]);
  const cards = useMemo(
    () => (only ? only.flatMap((tier) => SAMPLE_CARDS.filter((card) => card.rarity === tier).slice(0, 1)) : HUNT_DEAL),
    [only],
  );
  return (
    <CardHunt
      cards={cards}
      opened={opened}
      onOpen={(id) => setOpened((now) => (now.includes(id) ? now : [...now, id]))}
      levels={levels}
      theme={theme}
      hero={hero}
      describeSpot={describeCell}
    />
  );
}
