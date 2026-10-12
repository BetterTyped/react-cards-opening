import { expect, test } from "@playwright/test";

import { at, hydrated, watchErrors } from "./helpers";

/*
 * The pages that show rather than explain: the effects gallery, the components gallery, and the sky behind all of
 * it. Real time, no fake clock.
 */

test.describe("the effects gallery", () => {
  test("has a tile for each show, each combination and every effect, and the ones on screen play", async ({ page }) => {
    // Arrange
    const errors = watchErrors(page);
    await page.goto(at("/docs/effects/"));
    await hydrated(page, ".g-wall");
    const walls = page.locator(".g-wall");

    // Assert: six signature shows, two dozen combinations, then every effect kind by kind.
    await expect(walls.nth(0).locator(".g-tile")).toHaveCount(6);
    await expect(walls.nth(1).locator(".g-tile")).toHaveCount(24);
    expect(await page.locator('.g-wall[data-size="small"] .g-tile').count()).toBeGreaterThanOrEqual(60);

    // Assert: left alone, a tile on screen turns its card over and plays behind it.
    const first = walls.nth(0).locator(".g-tile").nth(1);
    await expect(first.locator(".rco-card[data-down]")).toHaveCount(1);
    await expect(first.locator(".rco-card:not([data-down])")).toHaveCount(1, { timeout: 12_000 });
    await expect(first.locator(".rco-fx-layer")).toHaveCount(1);

    // Assert: a tile far down the page holds no layer until it is scrolled to.
    const last = page.locator('.g-wall[data-size="small"] .g-tile').last();
    await expect(last.locator(".rco-fx-layer")).toHaveCount(0);
    await last.scrollIntoViewIfNeeded();
    await expect(last.locator(".rco-fx-layer")).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test("plays a tile again on a press", async ({ page }) => {
    // Arrange
    await page.goto(at("/docs/effects/"));
    await hydrated(page, ".g-wall");
    const tile = page.locator(".g-wall").nth(1).locator(".g-tile").first();
    await tile.scrollIntoViewIfNeeded();
    await expect(tile.locator(".rco-card:not([data-down])")).toHaveCount(1, { timeout: 12_000 });

    // Act
    await tile.getByRole("button", { name: "Play Dragon hoard again" }).click();

    // Assert: it starts over, face down, and turns again.
    await expect(tile.locator(".rco-card[data-down]")).toHaveCount(1);
    await expect(tile.locator(".rco-card:not([data-down])")).toHaveCount(1, { timeout: 6_000 });
  });

  test("takes the width of the page, with Hype Stack folded to a strip that covers no tile", async ({ page }) => {
    // Act
    await page.goto(at("/docs/effects/"));
    await hydrated(page, ".g-wall");

    // Assert: no column beside the page, three tiles to a row, and the strip is short.
    await expect(page.locator(".d-rail")).toHaveCount(0);
    const wall = await page.locator(".g-wall").first().boundingBox();
    expect(wall?.width ?? 0).toBeGreaterThan(900);
    const strip = page.locator(".d-float[data-strip]");
    await expect(strip).toBeVisible();
    await expect(strip).toContainText("Ship faster with Hype Stack");
    expect((await strip.boundingBox())?.height ?? 999).toBeLessThan(90);
  });
});

test.describe("the components gallery", () => {
  test("shows every component live, and the pack in it opens", async ({ page }) => {
    // Arrange
    test.setTimeout(90_000);
    const errors = watchErrors(page);
    await page.goto(at("/docs/components/"));
    await hydrated(page, ".g-parts");
    const parts = page.locator(".g-part");

    // Assert: the five openers and six pieces, each with a way to its own page.
    await expect(parts).toHaveCount(11);
    await expect(page.locator(".g-part[data-wide]")).toHaveCount(5);
    await expect(parts.first().getByRole("link", { name: "Props and code" })).toHaveAttribute(
      "href",
      at("/docs/components/card-pack/"),
    );

    // Act: the pack is the first thing on the page, and it is the real one.
    const pack = parts.first().locator(".rco-pack");
    await expect(pack).toHaveAttribute("data-stage", "sealed");
    await pack.getByRole("button", { name: "Open the pack" }).click({ force: true });

    // Assert
    await expect(pack).toHaveAttribute("data-stage", "dealt");

    // Assert: a component further down arrives when the page gets to it.
    const wheel = parts.nth(1);
    await wheel.scrollIntoViewIfNeeded();
    await expect(wheel.locator(".rco-wheel-wedge").first()).toBeVisible();
    const glyphs = parts.nth(9);
    await glyphs.scrollIntoViewIfNeeded();
    await expect(glyphs.locator(".g-part-stage > *")).not.toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test.describe("the sky behind the site", () => {
  for (const path of ["/", "/docs/installation/"]) {
    test(`on ${path} it is fixed to the window and stays put as the page scrolls`, async ({ page }) => {
      // Arrange
      await page.goto(at(path));
      await hydrated(page, ".d-bar");
      const sky = page.locator(".d-sky");

      // Assert
      await expect(sky).toHaveCSS("position", "fixed");
      await expect(sky).toHaveCSS("pointer-events", "none");
      const before = await sky.boundingBox();

      // Act
      await page.mouse.wheel(0, 1600);
      await page.waitForTimeout(300);

      // Assert: same place in the window, and something is drawn on it.
      expect(await sky.boundingBox()).toEqual(before);
      const lit = await sky.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
        const pixels = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data ?? [];
        let count = 0;
        for (let alpha = 3; alpha < pixels.length; alpha += 4) if ((pixels[alpha] ?? 0) > 0) count += 1;
        return count;
      });
      expect(lit).toBeGreaterThan(100);
    });
  }

  test("the home page's install line is a button no wider than the one beside it needs", async ({ page }) => {
    // Arrange
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(at("/"));
    await hydrated(page, ".h-fan");
    const command = page.locator(".h-command");

    // Assert
    expect((await command.boundingBox())?.width ?? 999).toBeLessThanOrEqual(340);

    // Act
    await command.click();

    // Assert: short on the page, whole on the clipboard.
    await expect(command).toContainText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "pnpm add @react-cards-opening/ui @react-cards-opening/core gsap",
    );
  });
});
