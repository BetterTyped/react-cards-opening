import type { Block, DocPage, Section } from "../content/types";
import { EFFECTS, type EffectDoc } from "./effects";
import { COMPONENTS } from "./pages/components";
import { CORE } from "./pages/core";
import { EXAMPLES } from "./pages/examples";
import { GET_STARTED } from "./pages/get-started";
import { GUIDES } from "./pages/guides";
import { EFFECT_LIBRARY } from "./pages/library";
import { EFFECT_LIST } from "@react-cards-opening/ui";

/*
 * Every page of the docs. The sidebar, the routes, the sitemap, the Markdown twins and llms.txt all read this one
 * list, so an effect added to its registry gets all five without another edit.
 */

/** The day the generated pages' wording last changed. Bump it when the templates below change. */
const UPDATED = "2026-10-11";

/* ---------- effects ---------- */

const effectPath = (id: string) => `/docs/effects/${id}/`;

const TIER_LINES: Record<EffectDoc["tiers"], string> = {
  "every tier": "Every card gets it, whatever its tier.",
  "loud and legendary tiers":
    "Tiers whose `effect` is `loud` or `legendary` get it. Of the four that ship, that is epic and legendary.",
  "legendary tiers": "Only tiers whose `effect` is `legendary` get it, and nobody with reduced motion.",
  "the scan": "It belongs to the scan, so it plays in a `ScanGrid` and a `CardHunt`, for every tier.",
};

function effectPage(effect: EffectDoc, index: number): DocPage {
  const neighbours = [EFFECTS[index - 1], EFFECTS[index + 1], EFFECTS[(index + 5) % EFFECTS.length]]
    .filter((other): other is EffectDoc => other !== undefined && other.id !== effect.id)
    .map((other) => effectPath(other.id));
  const blocks: Block[] = [
    { kind: "preview", demo: effect.demo, caption: effect.caption },
    { kind: "h2", text: "When it plays" },
    { kind: "p", text: TIER_LINES[effect.tiers] },
    { kind: "h2", text: "How it is built" },
    ...effect.how.map((text): Block => ({ kind: "p", text })),
    { kind: "h2", text: "What changes it" },
    { kind: "list", items: effect.tune },
  ];
  return {
    path: effectPath(effect.id),
    section: "effects",
    title: effect.name,
    tagline: effect.tagline,
    nav: effect.name,
    description: effect.description,
    lead: effect.lead,
    blocks,
    related: [...new Set([...neighbours, "/docs/effects/", "/docs/rarity-tiers/"])],
    updated: UPDATED,
  };
}

const effectsOverview: DocPage = {
  path: "/docs/effects/",
  section: "effects",
  title: "Effects",
  tagline: "a live gallery of all of them",
  nav: "Gallery",
  description:
    "A live gallery of every effect for card openings in React: six signature shows, two dozen combinations, and each effect on its own.",
  lead: `${EFFECT_LIST.length} effects, and what they look like stacked. Every tile below is the library playing live, on a card of the tier it suits: press one to play it again.`,
  wide: true,
  blocks: [
    { kind: "h2", text: "Six signature shows" },
    {
      kind: "p",
      text: "What every opener plays when told nothing: one show per tier, each built from different effects. They are a [plan](/docs/effects/plans/), and a plan can be swapped.",
    },
    { kind: "gallery", show: "shows" },
    { kind: "h2", text: "Combinations" },
    {
      kind: "p",
      text: "Stacks to take as they are or pull apart. The names under a tile are what to pass to `play`, or to put in a plan.",
    },
    { kind: "gallery", show: "combos" },
    { kind: "h2", text: "Every effect" },
    {
      kind: "p",
      text: "Each on its own, with the name that plays it. The [library page](/docs/effects/library/) has how to play, stack and write them.",
    },
    { kind: "gallery", show: "effects" },
    { kind: "h2", text: "Go deeper" },
    {
      kind: "cards",
      items: [
        {
          path: "/docs/effects/library/",
          title: "Effects library",
          text: "Play one, stack several, write your own.",
          tier: "legendary",
        },
        {
          path: "/docs/effects/plans/",
          title: "Effect plans",
          text: "Which tier gets which of them, on any opener.",
          tier: "epic",
        },
        {
          path: "/docs/components/effect-layer/",
          title: "EffectLayer",
          text: "A place to play them, on anything.",
          tier: "rare",
        },
      ],
    },
    { kind: "h2", text: "The card's own effects" },
    {
      kind: "p",
      text: "Under whatever a plan adds, a reveal has thirteen effects of its own, in a fixed order. Each has a page.",
    },
    {
      kind: "preview",
      demo: { type: "open", tier: "legendary" },
      caption: "All ten of the card's own effects in one reveal. Press it.",
    },
    {
      kind: "cards",
      items: EFFECTS.filter((effect) => effect.tiers !== "the scan").map((effect) => ({
        path: effectPath(effect.id),
        title: effect.name,
        text: effect.description.split(". ")[0].replace(/\.$/, "") + ".",
        tier: effect.tier,
      })),
    },
    {
      kind: "cards",
      items: EFFECTS.filter((effect) => effect.tiers === "the scan").map((effect) => ({
        path: effectPath(effect.id),
        title: effect.name,
        text: effect.description.split(". ")[0].replace(/\.$/, "") + ".",
        tier: effect.tier,
      })),
    },
    { kind: "h2", text: "The order" },
    {
      kind: "table",
      head: ["At", "What happens", "Who gets it"],
      rows: [
        ["0 s", "[Beam and lock](/docs/effects/beam-and-lock/), then the [crack](/docs/effects/crack/)", "the scan"],
        ["+0.15 s", "[Flight](/docs/effects/flight/), 0.75 s", "every tier"],
        ["then", "[Hum](/docs/effects/hum/), 0.5 to 0.9 s", "every tier"],
        ["then", "[Flip](/docs/effects/flip/), 0.6 s, with the [burst](/docs/effects/burst/) 0.2 s in", "every tier"],
        ["with the flip", "[Rays](/docs/effects/rays/)", "loud and legendary"],
        [
          "with the flip",
          "[Flash](/docs/effects/flash/), [shockwaves](/docs/effects/shockwaves/), [foil border](/docs/effects/foil-border/), [shine](/docs/effects/shine/), [sparkles](/docs/effects/sparkles/)",
          "legendary",
        ],
        ["then", "The hold: as long as the card takes to read", "every tier"],
        ["then", "The landing, 0.6 s", "every tier"],
        ["after", "[Found pulse](/docs/effects/found-pulse/)", "the scan"],
      ],
    },
    { kind: "h2", text: "Rules they all follow" },
    {
      kind: "list",
      items: [
        "**Nothing is created mid-reveal.** Every particle is in the page from the start, invisible. An effect only moves what is there.",
        "**Only `transform`, `opacity` and shadows move.** Nothing an effect does changes the page's layout.",
        "**Tiles never change size.** A cell lights up; it does not grow over its neighbours.",
        "**Idle effects run only on screen**, on the Web Animations API, so a grid further down the page costs nothing.",
        "**The colour is the theme's.** No effect names a colour of its own.",
      ],
    },
  ],
  related: [
    "/docs/rarity-tiers/",
    "/docs/core/show-plan/",
    "/docs/components/card-opening/",
    "/docs/core/reduced-motion/",
  ],
  updated: UPDATED,
};

export const SECTIONS: readonly Section[] = [
  { id: "get-started", title: "Get started", pages: GET_STARTED },
  { id: "core", title: "Core", pages: CORE },
  { id: "components", title: "Components", pages: COMPONENTS },
  { id: "effects", title: "Effects", pages: [effectsOverview, ...EFFECT_LIBRARY, ...EFFECTS.map(effectPage)] },
  { id: "guides", title: "Guides", pages: GUIDES },
  { id: "examples", title: "Examples", pages: EXAMPLES },
];

export const PAGES: readonly DocPage[] = SECTIONS.flatMap((section) => section.pages);

const BY_PATH = new Map(PAGES.map((page) => [page.path, page]));

export const pageAt = (path: string) => BY_PATH.get(path);

/** Pages that are not docs pages, by the name a link to them shows. */
const OTHER_TITLES: Readonly<Record<string, string>> = { "/": "Home" };

export const titleOf = (path: string) => BY_PATH.get(path)?.title ?? OTHER_TITLES[path];

/** The pages before and after one, in the order the sidebar lists them. */
export function neighboursOf(path: string): { previous?: DocPage; next?: DocPage } {
  const index = PAGES.findIndex((page) => page.path === path);
  if (index === -1) return {};
  return { previous: PAGES[index - 1], next: PAGES[index + 1] };
}
