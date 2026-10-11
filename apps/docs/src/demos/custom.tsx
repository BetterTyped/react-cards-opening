import { TIER_CARDS } from "../registry/sample";
import { CardShelf } from "./card-shelf";
import type { RarityTier } from "@react-cards-opening/core";
import { type CardFaceInfo, type CardTheme, GLYPHS, type GlyphCard, PixelGlyph } from "@react-cards-opening/ui";

interface Creature extends GlyphCard {
  power: number;
  guard: number;
  speed: number;
}

const STATS = [
  [2, 5, 3],
  [4, 3, 8],
  [7, 4, 6],
  [9, 8, 7],
] as const;

const CREATURES: readonly Creature[] = TIER_CARDS.map((card, index) => {
  const [power, guard, speed] = STATS[index] ?? [1, 1, 1];
  return Object.assign({ power, guard, speed }, card);
});

/** A face of the page's own: a picture window, a name, three numbers. Each row has `rco-line`, so it rises in. */
function CreatureFace({ card, info }: { card: Creature; info: CardFaceInfo }) {
  return (
    <>
      <div className="rco-line d-face-window">
        <PixelGlyph art={card.art ?? GLYPHS.question} colour={info.tone} cell={10} />
      </div>
      <p className="rco-line d-face-name">{card.name}</p>
      <p className="rco-line d-face-kind" style={{ color: info.tone }}>
        {info.tier.label} creature
      </p>
      <dl className="rco-line d-face-stats">
        {(["power", "guard", "speed"] as const).map((stat) => (
          <div key={stat}>
            <dt>{stat}</dt>
            <dd>{card[stat]}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

const creatureFace = (card: Creature, info: CardFaceInfo) => <CreatureFace card={card} info={info} />;
const creatureReading = (card: Creature, info: CardFaceInfo) => [
  card.name,
  `${info.tier.label} creature`,
  "power guard speed",
];

/** The same reveal around a face that is not the ready-made one. */
export function CustomFaceDemo({ theme }: { theme: CardTheme }) {
  return <CardShelf cards={CREATURES} theme={theme} renderFace={creatureFace} readingOf={creatureReading} />;
}

/** Three tiers of the page's own, each with the show it asked for. */
export const MEDAL_TIERS: readonly RarityTier[] = [
  { id: "bronze", label: "Bronze", weight: 70, effect: "quiet" },
  { id: "silver", label: "Silver", weight: 25, effect: "loud" },
  { id: "gold", label: "Gold", weight: 5, effect: "legendary" },
];

const MEDAL_COLORS = { bronze: "#d08a5a", silver: "#c3ccd6", gold: "#f2cc60" };

const MEDALS: readonly GlyphCard[] = [
  {
    id: "third",
    name: "Third Place",
    rarity: "bronze",
    line: "On the podium. Barely, and it still counts.",
    art: GLYPHS.check,
  },
  {
    id: "second",
    name: "Second Place",
    rarity: "silver",
    line: "One step from the top, with a better view of it.",
    art: GLYPHS.rocket,
  },
  {
    id: "first",
    name: "First Place",
    rarity: "gold",
    line: "Nobody finished ahead of you. Nobody.",
    art: GLYPHS.trophy,
  },
];

export function CustomTiersDemo({ theme }: { theme: CardTheme }) {
  return <CardShelf cards={MEDALS} theme={{ ...theme, rarity: MEDAL_COLORS }} rarities={MEDAL_TIERS} />;
}
