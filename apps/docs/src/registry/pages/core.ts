import type { DocPage } from "../../content/types";

const UPDATED = "2026-10-11";

const overview: DocPage = {
  path: "/docs/core/",
  section: "core",
  title: "Core",
  tagline: "opening logic with no look",
  nav: "Overview",
  description:
    "The headless half of react-cards-opening: the queue, the press rules, rarity tiers, seeded rolls and opened-card storage, with React as its only dependency.",
  lead: "`@react-cards-opening/core` is everything about opening cards that is not a picture. It decides which card is up, what a press means at each moment, when a card counts as opened and how often a tier comes up. It depends on React and nothing else, so it runs anywhere React does.",
  blocks: [
    { kind: "code", language: "bash", code: "pnpm add @react-cards-opening/core" },
    { kind: "h2", text: "What is in it" },
    {
      kind: "cards",
      items: [
        {
          path: "/docs/core/use-card-opening/",
          title: "useCardOpening",
          text: "The queue and the rules of a press, as a hook.",
        },
        {
          path: "/docs/core/use-opened-cards/",
          title: "useOpenedCards",
          text: "Which cards are opened, remembered on the device.",
        },
        { path: "/docs/core/rolls/", title: "Rolls and odds", text: "Deal cards by tier weight, from a seed." },
        { path: "/docs/core/show-plan/", title: "Show plan", text: "A tier's reveal as plain data." },
        { path: "/docs/core/spots/", title: "Hiding places", text: "Where each card hides in a grid." },
        {
          path: "/docs/core/reduced-motion/",
          title: "Reduced motion",
          text: "What changes for someone who asked for less.",
        },
      ],
    },
    { kind: "h2", text: "Why it is separate" },
    {
      kind: "list",
      items: [
        "**Your own look.** A game with its own art direction keeps the rules and draws the reveal with Motion, CSS or a canvas. [Your own UI on core](/docs/guides/own-ui-on-core/) builds one in sixty lines.",
        "**The server.** `rollCards` with a seed deals the same cards in Node as in the browser, so the server decides and the client only shows.",
        "**Tests.** The rules are a plain class with no clock. A press in a test is a method call, and nothing has to be animated to assert on it.",
      ],
    },
    { kind: "h2", text: "How the two halves talk" },
    {
      kind: "p",
      text: 'The opening keeps no clock. A renderer plays the reveal and tells the opening which phase it reached (`flight`, `hum`, `turn`, `hold`, `land`). When a press means "turn now" or "send it home", the opening asks the renderer to jump through a small driver. `CardOpening` is one such renderer; yours can be another.',
    },
    {
      kind: "code",
      language: "ts",
      code: `const detach = opening.attach({
  turn: () => timeline.play("turn"), // turn the face-down card now
  finish: () => timeline.progress(1), // send the card home now
  cancel: () => timeline.kill(), // take the reveal down
  close: () => closePeek(), // put a peeked card back
});`,
    },
  ],
  related: ["/docs/core/use-card-opening/", "/docs/guides/own-ui-on-core/", "/docs/components/", "/docs/core/rolls/"],
  updated: UPDATED,
};

const useCardOpening: DocPage = {
  path: "/docs/core/use-card-opening/",
  section: "core",
  title: "useCardOpening",
  tagline: "the rules as a hook",
  nav: "useCardOpening",
  description:
    "useCardOpening keeps the queue of a card opening and answers what a press on the card or the backdrop means at each moment. No animation, no markup.",
  lead: "`useCardOpening` is a card opening without a look. Give it the cards, which of them are opened, and what to do when one is. It keeps the queue, tracks the card that is up, and turns presses into decisions: turn it now, send it home, stop the run.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "headless" },
      caption: "The hook with a plain div and CSS. No ui package on this one.",
    },
    { kind: "h2", text: "Usage" },
    {
      kind: "code",
      language: "tsx",
      code: `import { useCardOpening, useOpenedCards } from "@react-cards-opening/core";

const { opened, open } = useOpenedCards("deal:ada:2026");
const hunt = useCardOpening({ cards, opened, onOpen: open });

hunt.start(); // open every unopened card, one after another
hunt.start(["ash-phoenix"]); // or only these
hunt.replay(); // go over all of them again, opening nothing
hunt.openAll(); // skip the show`,
    },
    { kind: "h2", text: "Options" },
    {
      kind: "table",
      head: ["Option", "Type", "What it is"],
      rows: [
        ["`cards`", "`readonly C[]`", "Every card in the deal, opened or not. A card is at least `{ id, rarity }`."],
        ["`opened`", "`readonly string[]`", "Ids already opened. Keep it in any state you like."],
        ["`onOpen`", "`(id: string) => void`", "A card was turned face up for the first time."],
        ["`onRunChange?`", "`(running: boolean) => void`", "A run started or came to rest."],
      ],
    },
    { kind: "h2", text: "What it returns" },
    {
      kind: "table",
      head: ["Field", "Type", "What it is"],
      rows: [
        ["`opening`", "`Opening`", "The rules themselves. Hand it to whatever draws the reveal."],
        ["`current`", "`C | null`", "The card that is up, in a run or a peek."],
        ["`pending`", "`readonly C[]`", "Cards nobody has opened yet."],
        ["`run`", "`OpeningRun | null`", "The queue being opened: `{ id, queue, replay }`."],
        ["`step`", "`number`", "Which card of the queue is up."],
        ["`left`", "`number`", "How many come after the one that is up."],
        ["`running`", "`boolean`", "A run is on."],
        ["`allOpened`", "`boolean`", "Nothing is left to open."],
        ["`peeking`", "`OpeningPeek | null`", "An opened card being looked at again."],
        ["`start(queue?)`", "`=> boolean`", "Opens unopened cards. False when there is nothing to open."],
        ["`replay()`", "`=> boolean`", "Goes over every card again. `onOpen` stays quiet."],
        ["`openAll()`", "`=> void`", "Takes the show down and opens everything at once."],
        ["`peek(id, origin)`", "`=> void`", "Brings an opened card up out of what was pressed."],
        ["`close()`", "`=> void`", "Puts a peeked card back."],
        ["`pressCard()`", "`=> void`", "A press on the card. See the rules below."],
        ["`pressBackdrop()`", "`=> void`", "A press beside the card."],
      ],
    },
    { kind: "h2", text: "The rules of a press" },
    {
      kind: "table",
      head: ["When", "A press on the card", "A press beside it"],
      rows: [
        ["Face down", "Turns it over now.", "Stops the run. The card goes back unopened."],
        ["Turning or face up", "Sends it home now.", "Stops the run. This card still lands, nothing else opens."],
        ["On its way home", "Nothing.", "Nothing."],
        ["Peeking", "Puts it back.", "Puts it back."],
      ],
    },
    {
      kind: "p",
      text: "A card counts as opened the moment it is face up, not when it lands. That way whatever your page does about it (a list growing by one, a request to a server) happens while the viewer is reading, and the card can leave the instant they press.",
    },
    { kind: "h2", text: "The phase" },
    {
      kind: "p",
      text: "The phase changes several times a card, so it has its own hook. Only the component that shows it re-renders.",
    },
    {
      kind: "code",
      language: "tsx",
      code: `import { useOpeningPhase } from "@react-cards-opening/core";

const phase = useOpeningPhase(hunt.opening);
// "idle" | "lead" | "flight" | "hum" | "turn" | "hold" | "land" | "peek"`,
    },
    { kind: "h2", text: "Without React" },
    {
      kind: "p",
      text: "The hook is a thin wrapper over the `Opening` class, which has no React in it. Use the class directly in a store, a test or a game loop.",
    },
    {
      kind: "code",
      language: "ts",
      code: `import { Opening } from "@react-cards-opening/core";

const opening = new Opening();
opening.sync({ cards, opened, onOpen });
opening.subscribe(() => render(opening.getState()));
opening.start();`,
    },
  ],
  related: [
    "/docs/guides/own-ui-on-core/",
    "/docs/core/use-opened-cards/",
    "/docs/components/card-opening/",
    "/docs/core/show-plan/",
  ],
  updated: UPDATED,
};

const useOpenedCards: DocPage = {
  path: "/docs/core/use-opened-cards/",
  section: "core",
  title: "useOpenedCards",
  tagline: "remember what was opened",
  nav: "useOpenedCards",
  description:
    "useOpenedCards remembers which cards were opened on this device in local storage, keyed by the deal, and keeps working when storage is blocked.",
  lead: "`useOpenedCards` is the list of opened card ids, kept in local storage under a key you choose. It is the simplest thing to hand `useCardOpening` when the cards are not worth a database row. Every read and write fails soft: at worst a card can be opened again, it can never change.",
  blocks: [
    { kind: "h2", text: "Usage" },
    {
      kind: "code",
      language: "tsx",
      code: `import { useCardOpening, useOpenedCards } from "@react-cards-opening/core";

const { opened, open, reset, ready } = useOpenedCards(\`deal:\${userId}:\${dealtAt}\`);
const hunt = useCardOpening({ cards, opened, onOpen: open });`,
    },
    { kind: "h2", text: "Key it by the deal" },
    {
      kind: "p",
      text: "The key should change when the cards do: who they are for, and when they were dealt. A new deal then starts unopened without anything being cleared. Pass `null` for a deal that should be forgotten on reload, like a demo.",
    },
    { kind: "h2", text: "What it returns" },
    {
      kind: "table",
      head: ["Field", "Type", "What it is"],
      rows: [
        ["`opened`", "`readonly string[]`", "Ids opened so far, in the order they were opened."],
        ["`open`", "`(id: string) => void`", "Marks one opened. Safe to call twice."],
        ["`reset`", "`() => void`", "Forgets all of them, here and in storage."],
        ["`ready`", "`boolean`", "False until storage has been read."],
      ],
    },
    { kind: "h2", text: "Wait for ready" },
    {
      kind: "p",
      text: "Storage is read in a layout effect, before the first paint. A page that shows unopened cards first should still wait for `ready`, or someone who opened everything last week sees the unopened state on the server's HTML.",
    },
    {
      kind: "code",
      language: "tsx",
      code: `if (!ready) return <Skeleton />;
return opened.length === cards.length ? <Collection /> : <Hunt />;`,
    },
    { kind: "h2", text: "When the server should know" },
    {
      kind: "p",
      text: "Local storage is per device. If opened cards have to follow an account, keep `opened` in your own state and write to your API from `onOpen`. [Keep opened cards](/docs/guides/keep-opened-cards/) shows both.",
    },
  ],
  related: [
    "/docs/guides/keep-opened-cards/",
    "/docs/core/use-card-opening/",
    "/docs/core/spots/",
    "/docs/guides/server-rendering/",
  ],
  updated: UPDATED,
};

const rolls: DocPage = {
  path: "/docs/core/rolls/",
  section: "core",
  title: "Rolls and odds",
  tagline: "deal cards by weight",
  nav: "Rolls and odds",
  description:
    "Deal cards by rarity weight with rollCards, read each card's chance with chances, and make a roll repeatable on any device with a seed.",
  lead: "`rollCards` deals cards from a pool, rarer tiers coming up less often. With a seed, the same pool deals the same cards every time, in a browser or on a server. `chances` answers what the odds of each card are, which is the number people ask to see.",
  blocks: [
    { kind: "h2", text: "Deal a hand" },
    {
      kind: "code",
      language: "ts",
      code: `import { rollCards } from "@react-cards-opening/core";

const hand = rollCards({ pool: allCards, count: 5, seed: \`\${userId}:2026-10-11\` });`,
    },
    {
      kind: "table",
      head: ["Option", "Type", "What it is"],
      rows: [
        ["`pool`", "`readonly C[]`", "The cards that can come up."],
        ["`count`", "`number`", "How many to deal. Never more than the pool holds."],
        ["`rarities?`", "`readonly RarityTier[]`", "Your tiers. The four defaults otherwise."],
        ["`seed?`", "`string`", "Leave it out for a roll that differs every time."],
      ],
    },
    {
      kind: "p",
      text: "No card is dealt twice. A card whose tier weighs nothing, or is not in the list, is never dealt.",
    },
    { kind: "h2", text: "Read the odds" },
    {
      kind: "code",
      language: "ts",
      code: `import { chances } from "@react-cards-opening/core";

const odds = chances(allCards); // Map<id, 0..1>
const label = \`\${(odds.get("ash-phoenix")! * 100).toFixed(1)}%\`;`,
    },
    {
      kind: "p",
      text: "A card's chance is its tier's weight over the weights of every card in the pool. The numbers are for the next single draw; they add up to one.",
    },
    { kind: "h2", text: "Roll on the server" },
    {
      kind: "p",
      text: "A roll in the browser is a roll the visitor can redo. Deal on the server, store the result, and send only the dealt cards down. The seed makes it cheap to check later: the same inputs give the same hand.",
    },
    {
      kind: "code",
      language: "ts",
      file: "server.ts",
      code: `import { rollCards } from "@react-cards-opening/core";

export async function dealFor(userId: string) {
  const dealt = await db.deals.find(userId);
  if (dealt) return dealt.cards;
  const cards = rollCards({ pool: CATALOG, count: 5, seed: \`\${userId}:\${SEASON}\` });
  await db.deals.insert({ userId, cards });
  return cards;
}`,
    },
    { kind: "h2", text: "A seeded source of your own" },
    {
      kind: "code",
      language: "ts",
      code: `import { createRng } from "@react-cards-opening/core";

const rng = createRng("season-4");
rng.next(); // a float in [0, 1)
rng.int(6); // an integer in [0, 6)
rng.pick(["heads", "tails"]);
const art = rng.fork("art"); // a separate stream that does not disturb this one`,
    },
  ],
  related: [
    "/docs/rarity-tiers/",
    "/docs/guides/custom-tiers/",
    "/docs/core/spots/",
    "/docs/guides/keep-opened-cards/",
  ],
  updated: UPDATED,
};

const showPlan: DocPage = {
  path: "/docs/core/show-plan/",
  section: "core",
  title: "Show plan",
  tagline: "a reveal as plain data",
  nav: "Show plan",
  description:
    "showFor turns a tier's effect level into the plan of its reveal as plain data, and holdSeconds works out how long a card stays face up to be read.",
  lead: "A show plan is a tier's reveal written down as data: how the card waits face down, which effects fire, how long each part takes. A renderer follows the plan instead of asking whether a card is epic, which is why three tiers or seven get the right show with no extra code.",
  blocks: [
    { kind: "h2", text: "showFor" },
    {
      kind: "code",
      language: "ts",
      code: `import { showFor } from "@react-cards-opening/core";

showFor("legendary");
// {
//   jolt: true,                              the place it was found flashes and shakes
//   hum: { kind: "shake", seconds: 0.7 },    what the face-down card does
//   rays: true,                              a wheel of rays opens behind it
//   legendary: true,                         flash, shockwaves, foil, shine, sparkles
//   flightSeconds: 0.75,
//   flipSeconds: 0.6,
//   minHoldSeconds: 2.65,
// }`,
    },
    {
      kind: "table",
      head: ["Effect", "jolt", "hum", "rays", "legendary", "minHoldSeconds"],
      rows: [
        ["`quiet`", "no", "hop, 0.4 s", "no", "no", "1.75"],
        ["`loud`", "yes", "shake, 0.4 s", "yes", "no", "1.75"],
        ["`legendary`", "yes", "shake, 0.7 s", "yes", "yes", "2.65"],
      ],
    },
    {
      kind: "p",
      text: "The second argument is reduced motion. With it, the hum is gone, the flight and the flip are instant, the legendary show is off and the shortest hold is one second.",
    },
    { kind: "h2", text: "How long a card stays up" },
    {
      kind: "code",
      language: "ts",
      code: `import { holdSeconds, showFor } from "@react-cards-opening/core";

const texts = [card.name, "Legendary", card.line, "Found on Mar 14"];
holdSeconds(texts, showFor("legendary")); // seconds face up`,
    },
    {
      kind: "p",
      text: "A card stays face up for as long as its own text takes to read, and never less than its show takes to play out. Reading is counted at four words a second after a 0.8 second lead. A sentence counts in full; a word standing alone, like a tier's name, is taken in at a glance and counts for little.",
    },
    {
      kind: "table",
      head: ["Function", "Returns"],
      rows: [
        ["`wordsToRead(texts)`", "How much there is to read, in words."],
        ["`readingSeconds(texts)`", "The seconds that takes."],
        ["`holdSeconds(texts, plan)`", "The longer of that and the plan's `minHoldSeconds`."],
      ],
    },
    {
      kind: "note",
      text: "The viewer is never made to wait: a press on a face-up card sends it home at once. The hold is only how long it stays if nobody presses.",
    },
  ],
  related: ["/docs/rarity-tiers/", "/docs/core/reduced-motion/", "/docs/guides/own-ui-on-core/", "/docs/effects/"],
  updated: UPDATED,
};

const spots: DocPage = {
  path: "/docs/core/spots/",
  section: "core",
  title: "Hiding places",
  tagline: "where a card hides in a grid",
  nav: "Hiding places",
  description:
    "pickSpot chooses a lit, free cell of a grid for a card to hide in, and useCardSpots remembers each card's cell so a replay reopens the same tiles.",
  lead: "A hunt hides each card on a cell of a grid. `pickSpot` chooses one: lit, and not taken by another card. `useCardSpots` remembers the choice for the rest of the visit, so a card found on one tile is found on that tile again in a replay.",
  blocks: [
    { kind: "h2", text: "Pick a cell" },
    {
      kind: "code",
      language: "ts",
      code: `import { pickSpot } from "@react-cards-opening/core";

const levels = [0, 2, 0, 3, 1, 4]; // one number per cell, 0 is unlit
const cell = pickSpot(levels, [3]); // 1, 4 or 5: lit, and 3 is taken`,
    },
    {
      kind: "p",
      text: "Cards hide where there is something to find: an unlit cell is only used when nothing lit is free. The third argument is the random source. Pass `createRng(seed).next` to place cards the same way on every device.",
    },
    { kind: "h2", text: "Remember it" },
    {
      kind: "code",
      language: "tsx",
      code: `import { useCardSpots } from "@react-cards-opening/core";

const [spots, setSpots] = useCardSpots("deal:ada:2026:spots");
// spots["ash-phoenix"] === 142`,
    },
    {
      kind: "p",
      text: "It works like `useState`, with session storage behind it: the spots survive a reload and are gone when the tab closes. Pass `null` to keep them in memory. `CardHunt` does all of this for you through its `sessionKey` prop.",
    },
    { kind: "h2", text: "Why not decide it up front" },
    {
      kind: "p",
      text: "A cell is picked when its card's turn comes, not when the deal is made. Nothing in the page's HTML or state says where an unfound card is, so there is nothing to peek at in the inspector.",
    },
  ],
  related: [
    "/docs/components/scan-grid/",
    "/docs/components/card-hunt/",
    "/docs/core/rolls/",
    "/docs/effects/beam-and-lock/",
  ],
  updated: UPDATED,
};

const reducedMotion: DocPage = {
  path: "/docs/core/reduced-motion/",
  section: "core",
  title: "Reduced motion",
  tagline: "less movement, same cards",
  nav: "Reduced motion",
  description:
    "What a card opening does for someone whose system asks for reduced motion: no sweep, no shake, no legendary show, and every card still opens.",
  lead: "Someone who asked their system for less motion still gets to open every card. What changes is how: the things that move the page are taken out, the things that are only light stay, and nothing takes longer than it has to.",
  blocks: [
    { kind: "h2", text: "What changes" },
    {
      kind: "table",
      head: ["Part", "With reduced motion"],
      rows: [
        ["The scan's sweep", "Skipped. The grid shows at once and the reticle locks on."],
        ["Flight and flip", "Instant."],
        ["The hum", "The glow stays, the hop and the shake go."],
        ["The legendary show", "Off: no flash, shockwaves, foil, shine or sparkles."],
        ["Landing", "A short fade where the card is."],
        ["Idle twitch and sparks", "Off."],
        ["The found pulse", "Off."],
        ["Burst, rays, the lock, the crack", "Stay. They are light, not movement of the page."],
        ["Shortest hold", "One second instead of 1.75."],
      ],
    },
    { kind: "h2", text: "Ask yourself" },
    {
      kind: "code",
      language: "tsx",
      code: `import { prefersReducedMotion, usePrefersReducedMotion, showFor } from "@react-cards-opening/core";

prefersReducedMotion(); // right now, as a boolean. False on a server.

function Reveal() {
  const reduced = usePrefersReducedMotion(); // as state, kept current
  const plan = showFor("legendary", reduced);
}`,
    },
    { kind: "h2", text: "The keyboard" },
    {
      kind: "list",
      items: [
        "The card is a button. Enter or Space turns it, and again sends it home.",
        "A card being looked at again takes focus. Escape, Enter or Space puts it back, and focus returns to what was pressed.",
        "Found cells and badges are buttons with the card's name as their label.",
        "The overlay is a live region, so a screen reader hears the card when it turns.",
      ],
    },
  ],
  related: [
    "/docs/core/show-plan/",
    "/docs/components/card-opening/",
    "/docs/guides/labels-and-translation/",
    "/docs/effects/",
  ],
  updated: UPDATED,
};

export const CORE: readonly DocPage[] = [
  overview,
  useCardOpening,
  useOpenedCards,
  rolls,
  showPlan,
  spots,
  reducedMotion,
];
