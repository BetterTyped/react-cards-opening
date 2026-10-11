<h1 align="center">

<a href="https://bettertyped.github.io/react-cards-opening/">
  <img src="./.github/assets/banner.png" alt="react-cards-opening: card opening for React. A card flies out, hums, flips and lands." />
</a>

</h1>

<div align="center">

**Card opening for React. A free tool from
[Hype Stack](https://www.hype-stack.dev/?utm_source=react-cards-opening&utm_medium=referral&utm_campaign=readme-top).**

**[Docs](https://bettertyped.github.io/react-cards-opening/) |
[Effects](https://bettertyped.github.io/react-cards-opening/docs/effects/) |
[Examples](https://bettertyped.github.io/react-cards-opening/docs/examples/) |
[Discord](https://www.hype-stack.dev/discord)**

</div>

<div align="center">
  <a href="https://bettertyped.com/">
    <img src="https://custom-icon-badges.demolab.com/static/v1?label=&message=BetterTyped&color=333&logo=BT" alt="BetterTyped" />
  </a>
  <a href="https://www.npmjs.com/package/@react-cards-opening/ui">
    <img src="https://custom-icon-badges.demolab.com/npm/v/@react-cards-opening/ui.svg?logo=npm&color=8f5cf0" alt="npm version" />
  </a>
  <a href="https://github.com/BetterTyped/react-cards-opening">
    <img src="https://custom-icon-badges.demolab.com/github/stars/BetterTyped/react-cards-opening?logo=star&style=flat" alt="GitHub stars" />
  </a>
  <a href="https://github.com/BetterTyped/react-cards-opening/blob/main/LICENSE.md">
    <img src="https://custom-icon-badges.demolab.com/github/license/BetterTyped/react-cards-opening?logo=law&color=blue" alt="MIT license" />
  </a>
  <a href="https://www.npmjs.com/package/@react-cards-opening/ui">
    <img src="https://custom-icon-badges.demolab.com/npm/dm/@react-cards-opening/ui?logoColor=fff&logo=trending-up" alt="npm downloads a month" />
  </a>
  <a href="https://bundlephobia.com/package/@react-cards-opening/ui">
    <img src="https://custom-icon-badges.demolab.com/bundlephobia/minzip/@react-cards-opening/ui?color=E10098&logo=package" alt="Bundle size" />
  </a>
  <a href="https://github.com/BetterTyped/react-cards-opening">
    <img src="https://custom-icon-badges.demolab.com/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" alt="Written in TypeScript" />
  </a>
  <a href="https://x.com/maciej_pyrc">
    <img src="https://img.shields.io/twitter/follow/maciej_pyrc" alt="Follow on X" />
  </a>
</div>

<br />

<p align="center">
  <a href="https://www.hype-stack.dev/discord">
    <img src="./.github/assets/discord.png" alt="Join our Discord community" />
  </a>
</p>

<br />

## What it is

react-cards-opening is the moment a card is opened, as a library. A card lifts out of wherever it was, flies to the
middle of the screen face down, hums, turns over, stays as long as it takes to read, and lands where it belongs. How
loud that is depends on how rare the card is: a common hops, an epic opens a wheel of rays, a legendary gets a foil
border, a shine and the whole screen.

It was built for the year in review inside
[Hype Stack](https://www.hype-stack.dev/wrapped?utm_source=react-cards-opening&utm_medium=referral&utm_campaign=readme),
where it turns achievements into cards. This is that code with the product taken out, checked against the original pixel
for pixel.

<p align="center">
  <a href="https://bettertyped.github.io/react-cards-opening/">
    <img width="720" src="./.github/assets/preview.png" alt="A legendary card face up in the middle of the screen, with rays behind it and a foil border" />
  </a>
</p>

## Install

```bash
pnpm add @react-cards-opening/ui @react-cards-opening/core gsap
```

Load the stylesheet once, anywhere in your app:

```tsx
import "@react-cards-opening/ui/styles.css";
```

You need React 18 or 19 and GSAP 3.13 or newer. Every class in the stylesheet starts with `rco-` and it only styles what
the library renders, so there is no Tailwind to set up, no reset to load, and nothing leaks into your page.

## Quick start

Describe the cards, keep track of which are opened, and give them somewhere to hide.

```tsx
import { useOpenedCards } from "@react-cards-opening/core";
import { CardHunt, GLYPHS, themeOf, type GlyphCard } from "@react-cards-opening/ui";
import "@react-cards-opening/ui/styles.css";

const cards: GlyphCard[] = [
  { id: "lantern-fox", rarity: "rare", name: "Lantern Fox", line: "Knows a shortcut.", art: GLYPHS.fox },
  { id: "ember-cat", rarity: "epic", name: "Ember Cat", line: "Sleeps on warm machines.", art: GLYPHS.cat },
  {
    id: "vault-dragon",
    rarity: "legendary",
    name: "Vault Dragon",
    line: "Keeps one of every card.",
    art: GLYPHS.dragon,
  },
];

// The grid the cards hide in: one number per cell, 0 (unlit) to 4. Use your own data.
const levels = Array.from({ length: 30 * 7 }, (_unused, day) => [0, 1, 2, 0, 3, 2, 4, 1, 0, 2][(day * 7) % 10]);

export function Hunt() {
  // Remembered on this device, under a key that changes with the deal.
  const { opened, open } = useOpenedCards("deal:ada:2026");
  return <CardHunt cards={cards} opened={opened} onOpen={open} levels={levels} theme={themeOf("grape", "dark")} />;
}
```

That is the whole hunt: a grid, a scan button, the reveal for each card found, and a list of finds that can be opened
again. [Your first opening](https://bettertyped.github.io/react-cards-opening/docs/first-opening/) builds it up from one
card and one button.

<p align="center">
	<a href="https://github.com/sponsors/prc5?tier=Platinum">
		<picture>
			<img width="830" src="https://raw.githubusercontent.com/prc5/sponsors/main/assets/Platinum.png" alt="Platinum sponsor banner"/>
		</picture>
	</a>
</p>

<p align="center">
	<a href="https://github.com/sponsors/prc5?tier=Platinum">
		<picture>
			<img width="830" src="https://raw.githubusercontent.com/prc5/sponsors/main/packages/platinum/sponsorkit/sponsors.svg" alt="Platinum sponsors"/>
		</picture>
	</a>
</p>

## Packages

Two packages, released together under one version number. A pair with the same version always fits.

| Package                                                                                         | What it holds                                                                                                                              |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [`@react-cards-opening/core`](https://bettertyped.github.io/react-cards-opening/docs/core/)     | The rules without a look: the queue, what each press means, rarity tiers, seeded rolls, opened-card storage. React is its only dependency. |
| [`@react-cards-opening/ui`](https://bettertyped.github.io/react-cards-opening/docs/components/) | The look: the card and its reveal, the scan grid, the whole hunt, ten themes, one stylesheet. GSAP inside.                                 |

## What is in it

| Part             | What it does                                                                                                                            | Docs                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `CardOpening`    | The reveal over the page. A card leaves an element you name, turns over in the middle of the screen and lands on another                | [CardOpening](https://bettertyped.github.io/react-cards-opening/docs/components/card-opening/)  |
| `CardHunt`       | A grid with cards hidden in it, the scan that finds them, and the list of finds, in one component                                       | [CardHunt](https://bettertyped.github.io/react-cards-opening/docs/components/card-hunt/)        |
| `ScanGrid`       | The grid alone, and the beam that hunts a cell down                                                                                     | [ScanGrid](https://bettertyped.github.io/react-cards-opening/docs/components/scan-grid/)        |
| `Card`           | A card standing still, at any size, for a collection or a shop. A legendary keeps its foil on CSS alone                                 | [Card](https://bettertyped.github.io/react-cards-opening/docs/components/card/)                 |
| Thirteen effects | Flight, hum, flip, burst, rays, flash, shockwaves, foil border, shine, sparkles and three for the scan. One page each, with the numbers | [Effects](https://bettertyped.github.io/react-cards-opening/docs/effects/)                      |
| `useCardOpening` | The queue and the rules of a press, with nothing drawn. Build your own reveal on it                                                     | [useCardOpening](https://bettertyped.github.io/react-cards-opening/docs/core/use-card-opening/) |
| `rollCards`      | Deals cards by rarity weight. With a seed, the same hand on a server and in a browser                                                   | [Rolls and odds](https://bettertyped.github.io/react-cards-opening/docs/core/rolls/)            |
| Ten themes       | Each in dark and light, or a whole theme from one accent colour                                                                         | [Theming](https://bettertyped.github.io/react-cards-opening/docs/theming/)                      |

<p align="center">
	<a href="https://github.com/sponsors/prc5?tier=Gold">
		<picture>
			<img width="830" src="https://raw.githubusercontent.com/prc5/sponsors/main/assets/Gold.png" alt="Gold sponsor banner"/>
		</picture>
	</a>
</p>

<p align="center">
	<a href="https://github.com/sponsors/prc5?tier=Gold">
		<picture>
			<img width="830" src="https://raw.githubusercontent.com/prc5/sponsors/main/packages/gold/sponsorkit/sponsors.svg" alt="Gold sponsors"/>
		</picture>
	</a>
</p>

## Recipes

### Open a card from a button

`CardOpening` on its own, with a button to leave from. This is the shape of a daily reward or a loot drop.

```tsx
import { rollCards, useCardOpening } from "@react-cards-opening/core";
import { CardOpening } from "@react-cards-opening/ui";
import { useRef, useState } from "react";

export function DailyCard({ userId, today }: { userId: string; today: string }) {
  const button = useRef<HTMLButtonElement>(null);
  // The same person gets the same card all day, on any device.
  const [cards] = useState(() => rollCards({ pool, count: 1, seed: `${userId}:${today}` }));
  const [opened, setOpened] = useState<string[]>([]);
  const hunt = useCardOpening({ cards, opened, onOpen: (id) => setOpened((now) => [...now, id]) });

  return (
    <>
      <button ref={button} onClick={() => hunt.start()} disabled={hunt.running || hunt.allOpened}>
        Open today's card
      </button>
      <CardOpening opening={hunt.opening} launch={() => button.current} />
    </>
  );
}
```

### Tiers of your own

A tier says how often it comes up and how loud its reveal is. The theme says what colour it wears.

```tsx
import type { RarityTier } from "@react-cards-opening/core";
import { themeOf } from "@react-cards-opening/ui";

const tiers: RarityTier[] = [
  { id: "bronze", label: "Bronze", weight: 70, effect: "quiet" },
  { id: "silver", label: "Silver", weight: 25, effect: "loud" },
  { id: "gold", label: "Gold", weight: 5, effect: "legendary" },
];
const theme = { ...themeOf("mono", "dark"), rarity: { bronze: "#d08a5a", silver: "#c3ccd6", gold: "#f2cc60" } };

<CardHunt rarities={tiers} theme={theme} {...rest} />;
```

### Only the rules

`core` on its own has no GSAP and no stylesheet. It answers what a press means and when a card counts as opened, and you
draw the rest. [Your own UI on core](https://bettertyped.github.io/react-cards-opening/docs/guides/own-ui-on-core/)
builds a reveal from a `div` and CSS.

```tsx
const hunt = useCardOpening({ cards, opened, onOpen });

hunt.start(); // open every unopened card, one after another
hunt.pressCard(); // face down: turn it. face up: send it home
hunt.pressBackdrop(); // stop. a turned card still lands
hunt.openAll(); // skip the show
```

<p align="center">
	<a href="https://github.com/sponsors/prc5?tier=Silver">
		<picture>
			<img width="830" src="https://raw.githubusercontent.com/prc5/sponsors/main/assets/Silver.png" alt="Silver sponsor banner"/>
		</picture>
	</a>
</p>

<p align="center">
	<a href="https://github.com/sponsors/prc5?tier=Silver">
		<picture>
			<img width="830" src="https://raw.githubusercontent.com/prc5/sponsors/main/packages/silver/sponsorkit/sponsors.svg" alt="Silver sponsors"/>
		</picture>
	</a>
</p>

## Try other BetterTyped projects

react-cards-opening is cut from Hype Stack, the full-stack template I build. Here is what else I maintain.

<p align="center">
  <a href="https://www.hype-stack.dev/?utm_source=react-cards-opening&utm_medium=referral&utm_campaign=readme">
    <img src="./.github/assets/banner-hype-stack.png" alt="Build your SaaS on Hype Stack" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="./.github/assets/banner-hyper-fetch.png" alt="Connect any API with Hyper Fetch" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/react-zoom-pan-pinch">
    <img src="https://raw.githubusercontent.com/prc5/prc5/main/assets/react-zoom-pan-pinch.png" alt="Pinch. Pan. Zoom. react-zoom-pan-pinch makes any component zoomable." />
  </a>
</p>

## Development

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

Node 24, pnpm 12, Nx, Vite 8, tsgo, oxlint and oxfmt. Commits follow conventional commits, because the next version
number is worked out from them. [UPSTREAM.md](./UPSTREAM.md) says where the code came from and how it is kept in step.

The look is guarded by a picture test: `apps/playground` plays the library frame by frame and compares every frame with
a stored one.

```bash
pnpm --filter @react-cards-opening/playground e2e
```

## Our sponsors

<p align="center">
	<a href="https://github.com/sponsors/prc5">
		<img src="https://raw.githubusercontent.com/prc5/sponsors/main/packages/other/sponsorkit/sponsors.svg?raw=true" alt="Sponsors" />
	</a>
</p>

## GSAP

GSAP is a peer dependency of `@react-cards-opening/ui`. You install it yourself and it comes under its own license,
which is free to use, commercial projects included, but is not MIT. Read the
[GSAP standard license](https://gsap.com/community/standard-license/) before you ship. `@react-cards-opening/core` does
not use it.

## License

[MIT](./LICENSE.md)
