import type { Block, DocPage, Section } from "../content/types";
import { EFFECTS, type EffectDoc } from "./effects";
import { COMPONENTS } from "./pages/components";
import { CORE } from "./pages/core";
import { EXAMPLES } from "./pages/examples";
import { GET_STARTED } from "./pages/get-started";
import { GUIDES } from "./pages/guides";
import { EFFECT_LIBRARY } from "./pages/library";

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
  tagline: "what a reveal is made of",
  nav: "Overview",
  description:
    "Every effect in a card reveal, one page each: flight, hum, flip, burst, rays, flash, shockwaves, foil border, shine, sparkles and the scan's three.",
  lead: "A reveal is thirteen small effects in a fixed order. Every card gets the first four. Loud tiers add rays. A legendary adds five more. The last three belong to the scan. Each has its own page with a live preview, the numbers behind it and what changes it.",
  blocks: [
    {
      kind: "cards",
      items: [
        {
          path: "/docs/effects/library/",
          title: "Effects library",
          text: "Dozens more to play on top: particles, light, shockwaves, screen effects.",
          tier: "legendary",
        },
        {
          path: "/docs/effects/plans/",
          title: "Effect plans",
          text: "Which tier gets which of them, on any opener.",
          tier: "epic",
        },
      ],
    },
    {
      kind: "preview",
      demo: { type: "open", tier: "legendary" },
      caption: "All ten of the card's own effects in one reveal. Press it.",
    },
    { kind: "h2", text: "On the card" },
    {
      kind: "cards",
      items: EFFECTS.filter((effect) => effect.tiers !== "the scan").map((effect) => ({
        path: effectPath(effect.id),
        title: effect.name,
        text: effect.description.split(". ")[0].replace(/\.$/, "") + ".",
        tier: effect.tier,
      })),
    },
    { kind: "h2", text: "On the grid" },
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
