# Where this code came from

The scan and the card reveal were written for the year in review inside Hype Stack. This repository is that code as a
library: the same motion and the same look, with the product taken out.

## The snapshot

- **Taken:** 2026-10-11
- **Source:** `apps/frontend/src/features/wrapped/modules/wrapped-engine/year-scan.tsx` in the Hype Stack repository,
  with `use-opened-drops.ts`, `rng.ts`, the reading-time helpers from `motion.tsx`, the pixel art table from
  `scenes.tsx` and the palettes from `packages/enums/src/wrapped/index.ts`
- **Base commit:** `8330e4a31ef5897940caffc23b74cf41d6632a93`, plus the uncommitted changes to `year-scan.tsx` in the
  working tree that day

## How this copy differs

- **Two packages.** The rules a reveal follows (the queue, what a press means, when a card counts as opened) moved out
  of the GSAP timeline into `@react-cards-opening/core`, where they have tests and no animation library.
- **Three components for one.** `YearScan` became `ScanGrid` (the grid and the scan), `CardOpening` (the reveal) and
  `CardHunt` (the panel that wires them). The scan's part of the timeline is handed to the reveal as a nested timeline
  and plays in the same place, at the same times.
- **Plain CSS.** Every Tailwind class became a rule in `packages/ui/src/styles.css`, on `rco-` classes and `--rco-*`
  variables. `@gsap/react`, `lucide-react`, `clsx` and `tailwind-merge` are gone.
- **Open where it was closed.** The grid is any number of rows, not a calendar. Tiers are a list you pass, with an
  effect level each, not four fixed names. Where a card leaves from and lands is an element you name. Every word is a
  label you can replace.
- **Names.** A "drop" is a card. The `github` palette is `moss`.
- **Two fixes.** A hunt stopped while a cell is cracking no longer leaves the ring and sparks frozen on the grid. A
  static `Card` component was added for collections.

## How the look is kept

`apps/playground` plays the library frame by frame on a clock the test controls and compares every frame with a stored
picture (`apps/playground/e2e`). Those pictures were first checked against the original file itself: it was rendered on
Tailwind next to the library, both driven by the same clock and the same random seed, and every frame of every tier
matched, on a desktop and a phone, in dark and light, through a whole five-card deal and its replay.

## Carrying a change across

When the original changes, change the same lines here: the timeline in `packages/ui/src/card-opening.tsx` and
`packages/ui/src/scan-grid.tsx` keeps the original's order, numbers and comments so the two can be read side by side.
Run the picture test, look at what moved, and update the stored pictures only if the change was meant.

## Log

- 2026-10-11: snapshot taken, library cut from it.
