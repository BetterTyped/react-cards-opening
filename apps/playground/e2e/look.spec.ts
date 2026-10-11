import { expect, type Page, test } from "@playwright/test";

import { advance, freeze, open, settle } from "./harness";

/*
 * The look, held still. The hunt is played on a clock the test owns, with a seeded random source, and at the
 * moments worth looking at the page has to be the stored picture, to the pixel.
 *
 * The pictures in e2e/pictures were first checked against the scan this library was cut from: that file, untouched,
 * on Tailwind, driven by the same clock and the same seed, matched every frame of every tier (see UPSTREAM.md). A
 * change that moves a pixel fails here. If the change was meant, look at the new picture and run `pnpm e2e:update`.
 */

/** Milliseconds from the press that starts the scan to each moment, for a tier that hums for 0.4 seconds. */
const MOMENTS = { lock: 3008, crack: 3520, "face-down": 5216, burst: 6304, "face-up": 7504 } as const;
/** A legendary hums 0.3 seconds longer, so everything after the hum comes that much later. */
const LEGENDARY = { ...MOMENTS, burst: 6608, "face-up": 8000 } as const;

const DESKTOP = { width: 1280, height: 760 };
const PHONE = { width: 390, height: 800 };

async function start(page: Page, query: string) {
  await freeze(page);
  await open(page, `/?${query}`);
}

async function press(page: Page, name: string | RegExp) {
  await page.getByRole("button", { name }).click();
  // The pointer out of the way: a button that shows up under it would lift on hover whenever the browser gets round
  // to checking, which is not on the page's clock.
  await page.mouse.move(2, 2);
  await settle(page);
}

/** Plays up to each moment in turn and compares the page with its picture. */
async function through(page: Page, tag: string, moments: Record<string, number>) {
  let at = 0;
  for (const [name, time] of Object.entries(moments)) {
    await advance(page, time - at);
    at = time;
    await expect(page).toHaveScreenshot(`${tag}-${name}.png`);
  }
}

/** Plays until the found card's badge can be pressed: the run is over and the panel is at rest. */
async function untilFound(page: Page) {
  const badge = page.getByTitle("Open this card").first();
  for (let step = 0; step < 80; step += 1) {
    if ((await badge.count()) > 0 && (await badge.isEnabled())) return;
    await advance(page, 304);
  }
  throw new Error("The run did not come to an end.");
}

const TIERS = [
  { tier: "common", card: "night-owl", moments: MOMENTS },
  { tier: "rare", card: "trailblazer", moments: MOMENTS },
  { tier: "epic", card: "firestarter", moments: MOMENTS },
  { tier: "legendary", card: "dragon-hoard", moments: LEGENDARY },
] as const;

test.describe("on a desktop", () => {
  test.use({ viewport: DESKTOP, deviceScaleFactor: 1 });

  for (const { tier, card, moments } of TIERS) {
    test(`a ${tier} card, from the lock to its badge`, async ({ page }) => {
      await start(page, `hero&only=${card}`);
      if (tier === "common") await expect(page).toHaveScreenshot("blank.png");
      await press(page, "Scan");

      await through(page, tier, moments);
      await untilFound(page);
      await expect(page).toHaveScreenshot(`${tier}-found.png`);
    });
  }

  test("a legendary on a light theme", async ({ page }) => {
    await start(page, "hero&only=dragon-hoard&theme=grape&mode=light");
    await press(page, "Scan");

    await through(page, "light", { "face-up": LEGENDARY["face-up"] });
    await untilFound(page);
    await expect(page).toHaveScreenshot("light-found.png");
  });

  test("a found card, looked at again", async ({ page }) => {
    await start(page, "only=firestarter&theme=synthwave");
    await press(page, "Scan");
    await untilFound(page);

    await page.getByTitle("Open this card").click();
    await page.mouse.move(2, 2);
    await settle(page);
    await advance(page, 1200);

    await expect(page).toHaveScreenshot("peek.png");
  });

  test("a whole deal, found", async ({ page }) => {
    await start(page, "");
    await press(page, "Scan");
    const again = page.getByRole("button", { name: "Scan again" });
    for (let step = 0; step < 140 && !(await again.isVisible()); step += 1) await advance(page, 704);

    await expect(page).toHaveScreenshot("deal-found.png");
  });

  test("a returning visitor: found cards placed, the rest still hidden", async ({ page }) => {
    await start(page, "found=night-owl,dragon-hoard");

    await expect(page).toHaveScreenshot("returning.png");
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: PHONE, deviceScaleFactor: 1 });

  test("a legendary card, from a blank grid to its badge", async ({ page }) => {
    await start(page, "hero&only=dragon-hoard");
    await expect(page).toHaveScreenshot("phone-blank.png");
    await press(page, "Scan");

    await through(page, "phone", { crack: LEGENDARY.crack, "face-up": LEGENDARY["face-up"] });
    await untilFound(page);
    await expect(page).toHaveScreenshot("phone-found.png");
  });
});
