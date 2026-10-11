import { createRng } from "@react-cards-opening/core";
import { GLYPHS, type GlyphCard, isThemeId, themeOf } from "@react-cards-opening/ui";

/*
 * One made-up deal, read from the address bar so a test can ask for exactly the page it wants:
 *   ?theme=grape&mode=light   which colours
 *   ?hero                     the hunt as the page
 *   ?only=dragon-hoard        just these cards, comma separated
 *   ?found=night-owl          these are opened already
 */
const params = new URLSearchParams(window.location.search);
const list = (name: string) => (params.get(name) ?? "").split(",").filter(Boolean);

const themeId = params.get("theme") ?? "moss";
export const theme = themeOf(isThemeId(themeId) ? themeId : "moss", params.get("mode") === "light" ? "light" : "dark");
export const hero = params.has("hero");
export const found = list("found");

export interface SampleCard extends GlyphCard {
  rarity: "common" | "rare" | "epic" | "legendary";
  line: string;
}

const ALL: SampleCard[] = [
  {
    id: "night-owl",
    name: "Night Owl",
    rarity: "common",
    line: "Most of your work landed after midnight. The quiet hours are yours.",
    art: GLYPHS.owl,
  },
  {
    id: "trailblazer",
    name: "Trailblazer",
    rarity: "rare",
    line: "You started nine things nobody had touched before.",
    art: GLYPHS.mountain,
  },
  {
    id: "firestarter",
    name: "Firestarter",
    rarity: "epic",
    line: "Forty one days in a row without a gap. Then a weekend off, and forty more.",
    art: GLYPHS.flame,
  },
  {
    id: "dragon-hoard",
    name: "Dragon Hoard",
    rarity: "legendary",
    line: "One in twenty five years has this. Yours does.",
    art: GLYPHS.dragon,
  },
  {
    id: "lucky-duck",
    name: "Lucky Duck",
    rarity: "common",
    line: "It was a typo. It shipped anyway and nobody noticed.",
    art: GLYPHS.duck,
  },
];

const only = list("only");
export const cards = only.length > 0 ? ALL.filter((card) => only.includes(card.id)) : ALL;

/** A year of days, quiet weekends and a busy autumn, the same on every load. */
const rng = createRng("playground-year");
export const lead = 3;
export const levels = Array.from({ length: 365 }, (_unused, day) => {
  const weekday = (day + lead) % 7;
  const busy = day > 240 && day < 320 ? 0.25 : 0;
  const roll = rng.next() + busy - (weekday === 0 || weekday === 6 ? 0.35 : 0);
  if (roll < 0.3) return 0;
  if (roll < 0.55) return 1;
  if (roll < 0.78) return 2;
  if (roll < 0.95) return 3;
  return 4;
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Day 0 is the first of January. */
export function describeDay(day: number): string {
  const date = new Date(Date.UTC(2026, 0, 1 + day));
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}
