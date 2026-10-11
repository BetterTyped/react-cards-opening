import { useMemo, useState } from "react";

import { describeCell, HUNT_DEAL, SAMPLE_CARDS, sampleLevels } from "../registry/sample";
import { CardHunt, type CardHuntClassNames, type CardTheme } from "@react-cards-opening/ui";

/** The whole hunt: a grid with cards hidden in it, the scan that finds them, and the reveal for each. */
export function HuntDemo({
  theme,
  only,
  hero = false,
  columns = 30,
  classNames,
}: {
  theme: CardTheme;
  /** Keep the deal to cards of these tiers. */
  only?: readonly string[];
  hero?: boolean;
  columns?: number;
  /** A class of the page's own for any part of the hunt. */
  classNames?: CardHuntClassNames;
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
      classNames={classNames}
    />
  );
}

/** The classes of the "typewriter" restyle: square corners, a monospaced face, hard shadows. See docs.css. */
const TYPEWRITER: CardHuntClassNames = {
  root: "d-tw-panel",
  headline: "d-tw-headline",
  subline: "d-tw-subline",
  scanButton: "d-tw-button",
  skipButton: "d-tw-button",
  replayButton: "d-tw-button",
  cell: "d-tw-cell",
  badge: "d-tw-badge",
  badgeArt: "d-tw-badge-art",
  stage: "d-tw-stage",
  name: "d-tw-name",
};

/** The same hunt with a look of the page's own, handed over through `classNames`. */
export function StyledHuntDemo({ theme }: { theme: CardTheme }) {
  return <HuntDemo theme={theme} classNames={TYPEWRITER} />;
}
