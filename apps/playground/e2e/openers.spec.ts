import { expect, type Page, test } from "@playwright/test";

import { advance, freeze, open, settle } from "./harness";

/*
 * The pack, the reel, the case and the effects, held still. Like look.spec.ts: a clock the test owns, a seeded
 * random source, and at the moments worth looking at the page has to be the stored picture. If a change was meant,
 * look at the new picture and run `pnpm e2e:update`.
 */

const DESKTOP = { width: 1280, height: 760 };

async function start(page: Page, query: string) {
  await page.setViewportSize(DESKTOP);
  await freeze(page);
  await open(page, `/?${query}`);
  // CSS transitions are not on the page's clock: with the clock held, the browser moves them on only when it
  // happens to draw a frame, and a card caught mid-turn is drawn a pixel softer than one at rest. What is checked
  // here is where things end up, so every transition lands at once. GSAP, which is on the clock, plays as written.
  await page.addStyleTag({ content: "* { transition: none !important; }" });
}

/**
 * A press that never moves the pointer. A card lifts under a pointer and settles back on the browser's own time,
 * not the page's clock, so a real click leaves the picture a pixel out now and then.
 */
async function press(page: Page, selector: string, nth = 0) {
  await page
    .locator(selector)
    .nth(nth)
    .evaluate((element: HTMLElement) => element.click());
  await settle(page);
}

/** A picture of the page as it stands. */
async function shot(page: Page, name: string) {
  await settle(page);
  await expect(page).toHaveScreenshot(name);
}

test("a pack: sealed, burst, dealt, and gathered", async ({ page }) => {
  await start(page, "view=pack");
  await shot(page, "pack-sealed.png");

  await press(page, ".rco-pack-sealed");
  await advance(page, 304);
  await shot(page, "pack-burst.png");
  await advance(page, 1904);
  await shot(page, "pack-dealt.png");

  // A card that has just turned is still a layer of its own to the browser, and for a few frames it is drawn a
  // pixel softer than it will be. Which frame a picture lands on is the browser's business, so the turning is
  // checked by what is on the page, and the picture is taken once the cards have been gathered and are at rest.
  for (const seat of [3, 0, 1, 2, 4]) {
    await press(page, ".rco-pack-press", seat);
    await advance(page, 208);
  }
  await expect(page.locator(".rco-pack-seat[data-up]")).toHaveCount(5);
  await expect(page.locator(".rco-pack .rco-card[data-down]")).toHaveCount(0);
  await expect(page.getByText("That is all of them.")).toBeVisible();
  await advance(page, 2000);

  await press(page, ".rco-pack-foot .rco-button-main");
  await advance(page, 1008);
  await shot(page, "pack-done.png");
});

test("a reel: at rest, and stopped on its card", async ({ page }) => {
  await start(page, "view=spin");
  await shot(page, "spin-rest.png");

  await press(page, ".rco-button-main");
  await advance(page, 5808);
  await shot(page, "spin-locked.png");
});

test("a case: shut, and open with its light on", async ({ page }) => {
  await start(page, "view=case");
  await shot(page, "case-shut.png");

  await press(page, ".rco-button-main");
  await advance(page, 1104);
  await shot(page, "case-open.png");
});

const STACKS = [
  { name: "hit", effects: "flash,nova,pillar,stardust", at: 304 },
  { name: "storm", effects: "lightning,shockwave,comets,sparks", at: 160 },
  { name: "party", effects: "confetti,fireworks,starburst,rays", at: 608 },
  { name: "frame", effects: "letterbox,speedlines,echo,rim", at: 208 },
] as const;

for (const stack of STACKS) {
  test(`effects stacked: ${stack.name}`, async ({ page }) => {
    await start(page, `view=fx&fx=${stack.effects}`);

    await press(page, ".fx-play");
    await advance(page, stack.at);

    await shot(page, `fx-${stack.name}.png`);
  });
}

test("effects leave nothing behind", async ({ page }) => {
  await start(page, "view=fx&fx=quake,glitch,nova,embers,snow");
  await shot(page, "fx-before.png");

  await press(page, ".fx-play");
  await advance(page, 6000);

  // The same picture as before anything played.
  await shot(page, "fx-before.png");
});
