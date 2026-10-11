/*
 * A docs page as data. The same page is drawn as HTML on the site and written out as Markdown for people and
 * models that read text, so a page is never described twice.
 *
 * Text fields take a small subset of Markdown: `code`, **bold** and [links](/docs/effects/). Links to other pages are
 * written as site paths.
 */

/** What a preview shows. The page says which thing; the site decides how to draw it. */
export type Demo =
  /** The whole hunt: a grid, a scan button, the reveal. `only` keeps it to cards of these tiers. */
  | { type: "hunt"; only?: readonly string[]; hero?: boolean }
  /** One card of a tier, opened from a button and landing on a shelf. */
  | { type: "open"; tier: string }
  /** One card of every tier on a shelf, to open each its own way. */
  | { type: "tiers" }
  /** A card standing still, per tier. */
  | { type: "cards"; faceDown?: boolean }
  /** The grid on its own, with a button that hunts a cell down. */
  | { type: "scan"; tier: string }
  /** The whole set of pixel glyphs. */
  | { type: "glyphs" }
  /** A card of every tier in every theme. */
  | { type: "themes" }
  /** A reveal drawn without the ui package: the rules, a few lines of CSS. */
  | { type: "headless" }
  /** A face of your own: a picture card. */
  | { type: "custom-face" }
  /** Three tiers of your own. */
  | { type: "custom-tiers" }
  /** The hunt restyled through `classNames`. */
  | { type: "styled" }
  /** A sealed pack: press it, then turn its cards over. */
  | { type: "pack" }
  /** A reel that spins and stops on a card. */
  | { type: "spin" }
  /** A wheel of prizes that spins and stops on a card. */
  | { type: "wheel" }
  /** A case that opens and gives up its cards. */
  | { type: "case" }
  /** Every effect in the library, each on a button. */
  | { type: "effects" }
  /** A pack under each of the ready-made plans of effects. */
  | { type: "effect-sets" };

export type CodeLanguage = "tsx" | "ts" | "css" | "bash" | "html";

export type Block =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "list"; items: readonly string[] }
  | { kind: "steps"; items: readonly string[] }
  | { kind: "note"; text: string }
  | { kind: "code"; language: CodeLanguage; code: string; file?: string }
  | { kind: "table"; head: readonly string[]; rows: readonly (readonly string[])[] }
  | { kind: "preview"; demo: Demo; caption?: string }
  | { kind: "faq"; items: readonly { question: string; answer: string }[] }
  /** Links to other pages, as tiles. `tier` puts a dot in that tier's colour on the tile. */
  | { kind: "cards"; items: readonly { path: string; title: string; text: string; tier?: string }[] };

export type SectionId = "get-started" | "core" | "components" | "effects" | "guides" | "examples";

export interface DocPage {
  /** Where the page lives, with both slashes: "/docs/effects/burst/". */
  path: string;
  section: SectionId;
  /** The H1. */
  title: string;
  /** A few words added after the title in the browser tab and in search results: "a glowing line over time". */
  tagline?: string;
  /** The short name in the sidebar. */
  nav: string;
  /** What a search result shows under the title: 50 to 170 characters. */
  description: string;
  /** The first paragraph: what this is and when to reach for it. */
  lead: string;
  blocks: readonly Block[];
  /** Paths of pages worth reading next. At least three on a finished page. */
  related: readonly string[];
  /** The day the content last changed, YYYY-MM-DD. */
  updated: string;
}

export interface Section {
  id: SectionId;
  title: string;
  pages: readonly DocPage[];
}

/** A heading's anchor: its words, lowercase, joined with hyphens. */
export const anchorOf = (text: string) =>
  text
    .toLowerCase()
    .replaceAll(/`/g, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
