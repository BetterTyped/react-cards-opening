/*
 * Where the site lives and who it points at, in one place. The address is a GitHub Pages project site today; moving
 * to a domain of its own is a change to `origin` and `base` and nothing else.
 */

type Campaign = "docs-navbar" | "docs-footer" | "docs-home" | "docs-page";

export const SITE = {
  /** The package scope and the repository, as people type it. */
  name: "react-cards-opening",
  /** The name as a title. */
  title: "React Cards Opening",
  tagline: "Card opening animations for React",
  description:
    "React components and hooks for opening cards: a card that flies out, hums, flips and lands, a scan that hunts for it, and rarity effects up to a legendary foil.",
  origin: "https://bettertyped.github.io",
  /** Every address starts with the repository's name. Kept in step with `BASE` in vite.config.ts. */
  base: "/react-cards-opening/",
  repo: "https://github.com/BetterTyped/react-cards-opening",
  npm: "https://www.npmjs.com/package/@react-cards-opening/ui",
  discord: "https://www.hype-stack.dev/discord",
  x: "https://x.com/maciej_pyrc",
  sponsor: "https://github.com/sponsors/prc5",
  organization: { name: "BetterTyped", url: "https://github.com/BetterTyped" },
  author: { name: "Maciej Pyrc", url: "https://github.com/prc5" },
} as const;

/** A link to Hype Stack that says which part of this site sent the visitor. */
export const hypeStack = (campaign: Campaign, path = "/") =>
  `https://www.hype-stack.dev${path}?utm_source=react-cards-opening&utm_medium=referral&utm_campaign=${campaign}`;

/** The full address of a page, from its path on the site ("/docs/effects/burst/"). */
export const absoluteUrl = (path: string) => `${SITE.origin}${SITE.base}${path.replace(/^\/+/, "")}`;

/** The packages, in the order they depend on each other. */
export const PACKAGES = [
  {
    name: "@react-cards-opening/core",
    holds:
      "The rules without a look: the queue, what each press means, rarity tiers, seeded rolls, opened-card storage.",
  },
  {
    name: "@react-cards-opening/ui",
    holds: "The look: the pack, the wheel, the reel, the case and the hunt, 64 effects, ten themes, one stylesheet.",
  },
] as const;

/** The line that installs everything. */
export const INSTALL = "pnpm add @react-cards-opening/ui @react-cards-opening/core gsap";
