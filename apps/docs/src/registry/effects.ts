import type { Demo } from "../content/types";

/*
 * Every effect of a reveal, one entry each. A page, a sidebar line, a sitemap line and a line of llms.txt are made
 * from each entry, so an effect added here gets all four.
 */

export interface EffectDoc {
  id: string;
  name: string;
  /** A few words after the name in the browser tab: what it is. */
  tagline: string;
  /** What a search result shows: 50 to 170 characters. */
  description: string;
  /** What it is and when it plays, as the page's first paragraph. */
  lead: string;
  /** Which tiers get it, by their `effect`. */
  tiers: "every tier" | "loud and legendary tiers" | "legendary tiers" | "the scan";
  /** The tier a tile's dot wears. */
  tier: "common" | "rare" | "epic" | "legendary";
  demo: Demo;
  /** What to do with the preview. */
  caption: string;
  /** How it is built, a paragraph each. */
  how: readonly string[];
  /** What changes it, a line each. */
  tune: readonly string[];
}

export const EFFECTS: readonly EffectDoc[] = [
  {
    id: "flight",
    name: "Flight",
    tagline: "the card leaves its place",
    description:
      "The first move of every reveal: the card lifts out of the element it was found in and flies to the middle of the screen, face down.",
    lead: "Flight is how a card gets from where it was to where it is looked at. It starts at the size and place of an element you name (a grid cell, a button, a slot in a collection) and ends in the middle of the screen at full size, face down, with the room dimmed behind it.",
    tiers: "every tier",
    tier: "common",
    demo: { type: "open", tier: "common" },
    caption: "Press the card. It lifts out of its own place on the shelf.",
    how: [
      "The start is measured the moment the card leaves, not when the reveal is built. If something plays first (a scan closing in) and the page scrolls meanwhile, the card still comes out of the right spot.",
      "The move takes 0.75 seconds on an `expo.out` ease and ends with a tilt of up to four degrees, picked at random, so two cards in a row never arrive the same way. The backdrop fades in over 0.4 seconds alongside it.",
      "With nothing to leave from, the card grows out of the middle of the screen instead. With reduced motion it is simply there.",
    ],
    tune: [
      "`launch` on `CardOpening` names the element. Return `{ element, lead }` to play a timeline of your own first.",
      "`width` and `ratio` set the size it arrives at. A narrow screen caps the width at 78% of its own.",
      "`--rco-z` moves the overlay up or down the stack.",
    ],
  },
  {
    id: "hum",
    name: "Hum",
    tagline: "the wait before the turn",
    description:
      "The beat a face-down card holds before it turns: its edge lights up in its tier's colour, and it hops or shakes depending on how rare it is.",
    lead: "The hum is the half second where the viewer knows the tier before they know the card. The back's edge glows in the tier's colour, and the card moves: a small hop for a quiet tier, a side to side shake for a loud one, a longer shake for a legendary.",
    tiers: "every tier",
    tier: "epic",
    demo: { type: "tiers" },
    caption: "Open them left to right and watch only the back: each tier waits differently.",
    how: [
      "The glow is a box shadow tweened from a faint white ring to a 70 pixel bloom in the tier's colour over half a second.",
      "A quiet tier hops 8 pixels and settles in 0.4 seconds. A loud tier shakes 5 pixels each way in the same time. A legendary shakes for 0.7 seconds. That one number is the only thing that tells a legendary apart before it turns.",
      "A press on the card during the hum skips straight to the turn. With reduced motion the glow stays and the movement goes.",
    ],
    tune: [
      "The tier's `effect` picks the hum: `quiet` hops, `loud` and `legendary` shake.",
      "`showFor(effect)` returns the plan as data (`hum.kind`, `hum.seconds`) if you draw the reveal yourself.",
    ],
  },
  {
    id: "flip",
    name: "Flip",
    tagline: "the card turns over",
    description:
      "The turn itself: the card straightens, rotates face up with a little overshoot, and its rows of text rise in one after another.",
    lead: "The flip is the moment the reveal exists for. The card straightens out of its tilt, turns over on its vertical axis, and the rows on its face rise in from below: picture, name, rarity, text, note.",
    tiers: "every tier",
    tier: "rare",
    demo: { type: "open", tier: "rare" },
    caption: "Press the card, then press it again while it is face down to turn it early.",
    how: [
      "Two tweens run together: the card rotates back to level in 0.5 seconds, and its inner layer turns from 180 degrees to 0 in 0.6 seconds on `back.out(1.4)`, so it swings a touch past flat and settles.",
      "The front and back are two layers with `backface-visibility: hidden` inside a `preserve-3d` wrapper, under a 1100 pixel perspective. Nothing is swapped mid-turn.",
      "Every element with the class `rco-line` rises 14 pixels and fades in, 0.06 seconds apart. A face of your own joins in by giving its rows that class.",
    ],
    tune: [
      "`renderFace` and `renderBack` on `CardOpening` draw the two sides.",
      "`--rco-radius` rounds both, and the foil border follows it.",
    ],
  },
  {
    id: "burst",
    name: "Burst",
    tagline: "sparks as the card turns",
    description:
      "Twenty two square particles in the tier's colour thrown outward from the card as it turns face up. Every tier gets it.",
    lead: "The burst is the one effect every tier shares. As the card turns, 22 small squares in its tier's colour fly out from its centre in a ring and fade, so even a common card lands with something.",
    tiers: "every tier",
    tier: "common",
    demo: { type: "open", tier: "common" },
    caption: "Press the card. The burst fires 0.2 seconds into the turn.",
    how: [
      "The particles are 22 elements that already sit in the card, invisible. Nothing is created when it fires.",
      "Each flies along its own angle to a distance set by its index, so the ring is uneven on purpose: `width * 0.7` plus up to 90 pixels across, `height * 0.55` plus up to 70 down. They scale from 0.6 to 1 and fade over 1.1 seconds on `expo.out`.",
      "The tween sets `immediateRender: false` in its to-vars. Without it the sparks would be drawn at the card the moment the reveal is built, before the card has even left.",
    ],
    tune: [
      "The colour is the tier's, from `theme.rarity`.",
      "The burst plays with reduced motion too: it is light, not movement of the page.",
    ],
  },
  {
    id: "rays",
    name: "Rays",
    tagline: "a wheel of light behind it",
    description:
      "A wheel of rays that opens behind a loud card as it turns and slowly rotates while the card is up. Epic and legendary tiers get it.",
    lead: "Rays are what makes a loud tier read as loud from across the room. A wheel of soft wedges in the tier's colour opens behind the card as it turns and keeps turning while the card is face up.",
    tiers: "loud and legendary tiers",
    tier: "epic",
    demo: { type: "open", tier: "epic" },
    caption: "Press the card. After it lands, press it again: in a peek the wheel turns for as long as you look.",
    how: [
      "The wheel is one element, 90% of the viewport's shorter side across: a repeating conic gradient (8 degrees lit, 16 dark) under a radial mask that fades it out toward the edge.",
      "It fades in and grows from 0.6 to full size in half a second, then turns 60 degrees over 2.6 seconds. In a peek, where the card can stay up for a minute, it loops instead: one full turn every 16 seconds.",
    ],
    tune: [
      "A tier gets rays when its `effect` is `loud` or `legendary`.",
      "A legendary adds a second, finer wheel turning the other way. See [Flash](/docs/effects/flash/) for the rest of its show.",
    ],
  },
  {
    id: "flash",
    name: "Flash",
    tagline: "the screen lights up",
    description:
      "A full-screen flash in the tier's colour the instant a legendary turns, and a softer one over the grid when a loud card is found.",
    lead: "The flash is the loudest thing in the library and the shortest. When a legendary turns over, the whole screen lights up in its colour for a twelfth of a second and fades over the next one.",
    tiers: "legendary tiers",
    tier: "legendary",
    demo: { type: "open", tier: "legendary" },
    caption: "Press the card. The flash is on the first frame of the turn.",
    how: [
      "It is a radial gradient over the whole overlay, from the tier's colour mixed with white at the centre to nothing at three quarters out. It reaches 0.9 opacity in 0.08 seconds and fades over a full second.",
      "A hunt has a second, smaller flash: when the scan finds a loud card, the panel around the grid flashes to 0.7 as the cell cracks and the grid shakes for a quarter of a second. Both are skipped with reduced motion.",
    ],
    tune: [
      "The overlay's flash belongs to tiers whose `effect` is `legendary`.",
      "The panel's flash belongs to `loud` and `legendary` tiers. `showFor(effect).jolt` says whether it plays.",
    ],
  },
  {
    id: "shockwaves",
    name: "Shockwaves",
    tagline: "two rings roll out",
    description:
      "Two glowing rings that expand from a legendary card as it turns, one a fifth of a second behind the other.",
    lead: "Shockwaves give the legendary turn its weight. Two rings in the tier's colour start at the card's centre and roll outward past its edges, the second chasing the first.",
    tiers: "legendary tiers",
    tier: "legendary",
    demo: { type: "open", tier: "legendary" },
    caption: "Press the card and watch its edges as it turns.",
    how: [
      "Each ring is a circle as wide as the card with no fill, drawn by a 3 pixel box shadow and a 40 pixel glow. It scales from 0.2 to 4.5 and fades over 1.3 seconds on `expo.out`.",
      "The second ring starts 0.2 seconds after the first. Only `transform` and `opacity` move, so the rings cost nothing to lay out.",
    ],
    tune: ["They belong to tiers whose `effect` is `legendary`, and are skipped with reduced motion."],
  },
  {
    id: "foil-border",
    name: "Foil border",
    tagline: "a border that turns",
    description:
      "A conic gradient that spins behind a legendary card's edge, in the theme's own legendary colour, never a fixed gold.",
    lead: "The foil border is what a legendary wears for as long as it is on screen. A gradient of the tier's colour, its lighter tint and white turns slowly behind the card and shows as a 4 pixel edge of moving light.",
    tiers: "legendary tiers",
    tier: "legendary",
    demo: { type: "cards" },
    caption: "The last card has it standing still too: a `Card` draws the border with CSS alone.",
    how: [
      "The border is a rounded box 4 pixels larger than the card on every side, with its overflow hidden. Inside it, a square twice the card's size carries a conic gradient and rotates: one turn every 2.4 seconds.",
      "The colours come from the theme's legendary colour: it, 35% of it in white, it again, 60% in white, white. A second hue on a green or purple theme clashes, so there is no gold unless the theme's legendary is gold.",
      "In the reveal a GSAP loop turns it. On a `Card` standing still the same markup turns on a CSS animation, so a shelf of legendaries needs no JavaScript to shimmer.",
    ],
    tune: [
      "`theme.rarity.legendary` (or whichever tier has the `legendary` effect) sets the colour.",
      "`--rco-radius` rounds the card and the border together.",
    ],
  },
  {
    id: "shine",
    name: "Shine",
    tagline: "light across the face",
    description:
      "A band of light that sweeps across a legendary card's face every couple of seconds, blended so it brightens what is under it.",
    lead: "The shine is the foil on the face itself. A narrow band of light crosses the card from one side to the other, rests out of sight, and crosses again, for as long as the card is up.",
    tiers: "legendary tiers",
    tier: "legendary",
    demo: { type: "open", tier: "legendary" },
    caption: "Press the card and leave it up. The band crosses, waits 1.2 seconds, and crosses again.",
    how: [
      "The band is a layer over the face with a linear gradient three times the card's width: transparent, the tier's colour, near-white, the tier's colour, transparent. `mix-blend-mode: screen` makes it lighten the face instead of covering it.",
      "It moves by its background position, from 115% to -15% in 0.9 seconds. Both ends put the band wholly off the card. Run it any further and the gradient's next copy slides back on and sits there, lit, through the pause.",
      "`background-repeat: no-repeat` matters for the same reason: one band, one pass.",
    ],
    tune: ["It belongs to tiers whose `effect` is `legendary`. A `Card` standing still plays it with CSS."],
  },
  {
    id: "sparkles",
    name: "Sparkles",
    tagline: "glints around the card",
    description:
      "Sixteen small diamonds around a legendary card that blink on and off in a random order while it is face up.",
    lead: "Sparkles are the last layer of the legendary show and the quietest. Sixteen diamonds sit in a loose ring around the card and glint one after another, never in the same order twice.",
    tiers: "legendary tiers",
    tier: "legendary",
    demo: { type: "open", tier: "legendary" },
    caption: "Press the card and look just outside its corners.",
    how: [
      "Each diamond is a 12 pixel square turned 45 degrees, in the tier's colour mixed with white, with a 12 pixel glow. They are placed by angle around the card, a little further out on some than others.",
      "One loop drives all sixteen: scale and fade in over a quarter of a second, out over half, each starting 0.12 seconds after another picked at random.",
    ],
    tune: ["They belong to tiers whose `effect` is `legendary`, and are skipped with reduced motion."],
  },
  {
    id: "beam-and-lock",
    name: "Beam and lock",
    tagline: "the scan finds a cell",
    description:
      "The scan's hunt: a beam sweeps the grid lighting each column, doubles back, and a reticle closes in on the cell that holds a card.",
    lead: "The beam and the lock are how a `ScanGrid` finds something. A line of light crosses the grid, colouring each column as it passes, overshoots, comes back, and stops. A band lights the row and a reticle closes in on one cell.",
    tiers: "the scan",
    tier: "rare",
    demo: { type: "scan", tier: "rare" },
    caption: "Press Scan. The first pass reads the whole grid; later ones go straight for the cell.",
    how: [
      "The first pass on a blank grid goes edge to edge in 1.7 seconds and takes the veil off: every column it crosses shows its real colours. Later passes overshoot the target by 6 to 12 columns and come back, which reads as searching.",
      "The beam is moved with a quick setter, not a tween a frame. Each column it enters flares to 1.9 times its brightness and settles in 0.55 seconds. Tiles never change size, so they never spill over their neighbours.",
      "The lock is a band that grows along the row in 0.35 seconds and a square that shrinks from three times its size, turning 45 degrees, in 0.45. Then it ticks twice.",
    ],
    tune: [
      "`rows` and `levels` shape the grid. Seven rows makes a year of weeks.",
      "`veiled` and `onUnveil` control the blank state.",
      "`theme.levels[4]` colours the beam's glow; the reticle wears the hunted card's tier.",
    ],
  },
  {
    id: "crack",
    name: "Crack",
    tagline: "the cell gives up its card",
    description:
      "The moment the scan lands: the cell flares in the card's colour, a ring rolls out, sparks fly, and a loud find shakes the whole grid.",
    lead: "The crack is the scan's payoff and the card's cue. The cell the reticle locked on lights up in the colour of what it holds, throws a ring and 18 sparks, and a beat later the card lifts out of it.",
    tiers: "the scan",
    tier: "epic",
    demo: { type: "scan", tier: "epic" },
    caption: "Press Scan. This one is epic, so the grid shakes as the cell cracks.",
    how: [
      "The cell gets a 2 pixel ring and an 18 pixel glow in the tier's colour. A circle 160 pixels across scales up from nothing and fades over 0.8 seconds, and 18 squares fly out in an uneven ring over 0.95.",
      "A loud find adds two things: the panel flashes, and the grid shakes 5 pixels each way for a quarter of a second.",
      "The crack plays out on an undimmed page. The room only darkens 0.15 seconds after it ends, as the card leaves, so the find and the reveal read as two beats.",
    ],
    tune: [
      "The colour is the tier's. The shake and the flash belong to `loud` and `legendary` tiers.",
      "`seek()` on the grid's handle returns the timeline, so the crack can be played with no card at all.",
    ],
  },
  {
    id: "found-pulse",
    name: "Found pulse",
    tagline: "found cells keep breathing",
    description:
      "What a grid looks like after the hunt: found cells breathe in their tier's colour, throw a spark now and then, and open their card on a press.",
    lead: "The found pulse keeps a finished grid alive. Every cell that gave up a card keeps a ring in its tier's colour that slowly swells and settles, and every so often one of them throws a few sparks.",
    tiers: "the scan",
    tier: "legendary",
    demo: { type: "hunt", only: ["rare", "legendary"] },
    caption: "Find both cards, then leave the grid alone for a few seconds. Press a lit cell to see its card again.",
    how: [
      "The breathing is a CSS animation on box shadow alone, 2.4 seconds a cycle, on a handful of cells. It stops with reduced motion.",
      "Every 1.7 seconds a random found cell throws six sparks. They are the crack's own particles played with the Web Animations API, so nothing is added to the page and nothing reads computed styles. The timer only runs while the grid is on screen.",
      "A found cell holds a button. Pressing it brings the card up out of the cell, face up, with no scan and no turn.",
    ],
    tune: [
      "`markers` on `ScanGrid` says which cells are found and in what colour.",
      "`idle` turns the sparks off while something else is going on.",
    ],
  },
];
