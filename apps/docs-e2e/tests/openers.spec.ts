import { expect, test } from "@playwright/test";

import { at, hydrated, watchErrors } from "./helpers";

/*
 * The pack, the reel, the case and the effects library, each on its own docs page and each running for real. Real
 * time, no fake clock.
 */

test.describe("a pack", () => {
  test("bursts on a press, deals face down, and turns a card over on each press", async ({ page }) => {
    // Arrange
    const errors = watchErrors(page);
    await page.goto(at("/docs/components/card-pack/"));
    await hydrated(page, ".rco-pack");
    const pack = page.locator(".rco-pack").first();
    await expect(pack).toHaveAttribute("data-stage", "sealed");

    // Act: the pack floats, so it is never still enough for a careful click.
    await pack.getByRole("button", { name: "Open the pack" }).click({ force: true });

    // Assert: five cards on the table, none of them turned.
    await expect(pack).toHaveAttribute("data-stage", "dealt");
    const turn = pack.getByRole("button", { name: "Turn this card over" });
    await expect(turn).toHaveCount(5);
    await expect(pack.locator(".rco-card[data-down]")).toHaveCount(5);

    // Act: a card in the middle of the table takes a press where its sparks are born.
    await expect(pack.locator(".rco-pack-deal").first()).toHaveCSS("opacity", "1");
    for (let left = 5; left > 0; left -= 1) {
      // oxlint-disable-next-line no-await-in-loop -- one press after another, as a visitor would
      await turn.first().click();
    }

    // Assert
    await expect(pack.locator(".rco-card[data-down]")).toHaveCount(0);
    await pack.getByRole("button", { name: "Done" }).click();
    await expect(pack).toHaveAttribute("data-stage", "done");
    await expect(pack.getByRole("button", { name: "Deal them again" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("lays a narrow table out in rows that fit it", async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(at("/docs/components/card-pack/"));
    await hydrated(page, ".rco-pack");
    const pack = page.locator(".rco-pack").first();

    // Act
    await pack.getByRole("button", { name: "Open the pack" }).click({ force: true });
    await expect(pack.locator(".rco-pack-deal").last()).toHaveCSS("opacity", "1");

    // Assert: every card is inside the pack, side to side.
    const room = await pack.boundingBox();
    const seats = await pack.locator(".rco-pack-seat").evaluateAll((all) =>
      all.map((seat) => {
        const box = seat.getBoundingClientRect();
        return { left: box.left, right: box.right };
      }),
    );
    expect(seats).toHaveLength(5);
    for (const seat of seats) {
      expect(seat.left).toBeGreaterThanOrEqual((room?.x ?? 0) - 1);
      expect(seat.right).toBeLessThanOrEqual((room?.x ?? 0) + (room?.width ?? 0) + 1);
    }
  });
});

test.describe("a reel", () => {
  test("spins, stops with the winning tile under the marker, and shows the card", async ({ page }) => {
    // Arrange
    const errors = watchErrors(page);
    await page.goto(at("/docs/components/card-spin/"));
    await hydrated(page, ".rco-reel");
    const panel = page.locator(".rco-spin").first();

    // Act
    await panel.getByRole("button", { name: "Spin" }).click();

    // Assert: the tile that won is the one the marker stands on.
    const won = panel.locator(".rco-reel-tile[data-won]");
    await expect(won).toHaveCount(1, { timeout: 12_000 });
    const tile = await won.boundingBox();
    const marker = await panel.locator(".rco-reel-marker").boundingBox();
    const line = (marker?.x ?? 0) + (marker?.width ?? 0) / 2;
    expect(line).toBeGreaterThan(tile?.x ?? 0);
    expect(line).toBeLessThan((tile?.x ?? 0) + (tile?.width ?? 0));
    await expect(page.locator(".rco-stage .rco-card-name")).toBeVisible({ timeout: 12_000 });
    await expect(page.locator(".rco-stage .rco-card-name")).toHaveText((await won.textContent()) ?? "");
    expect(errors).toEqual([]);
  });
});

test.describe("a case", () => {
  test("opens, and hands over everything in it on Take all", async ({ page }) => {
    // Arrange
    const errors = watchErrors(page);
    await page.goto(at("/docs/components/card-case/"));
    await hydrated(page, ".rco-case");
    const panel = page.locator(".rco-crate").first();
    await expect(panel.locator(".rco-shelf-slot[data-open]")).toHaveCount(0);

    // Act
    await panel.getByRole("button", { name: "Open the case" }).click();
    await expect(panel.locator(".rco-case")).toHaveAttribute("data-open", "");
    await panel.getByRole("button", { name: "Take all" }).click();

    // Assert: every card is on the shelf, and the lid is back on.
    await expect(panel.locator(".rco-shelf-slot[data-open]")).toHaveCount(5);
    await expect(panel.locator(".rco-case")).not.toHaveAttribute("data-open", "");
    await expect(panel.getByRole("button", { name: "Open it again" })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("the effects library", () => {
  test("has a button for every effect, and each one plays and cleans up", async ({ page }) => {
    // Arrange
    test.setTimeout(120_000);
    const errors = watchErrors(page);
    await page.goto(at("/docs/effects/library/"));
    await hydrated(page, ".d-fx-room");
    const gallery = page.locator(".d-fx").first();
    const buttons = gallery.locator(".d-fx-group .d-chip-button");
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(48);

    // Act: one after another, without waiting for the last to finish, the way a visitor mashes them.
    for (let index = 0; index < count; index += 1) {
      // oxlint-disable-next-line no-await-in-loop -- one press after another, as a visitor would
      await buttons.nth(index).click();
      // oxlint-disable-next-line no-await-in-loop
      await expect(gallery.locator(".rco-fx-play").first()).toBeAttached();
    }

    // Assert: a canvas for the particles, and once the longest has played out nothing is left on the stage.
    await expect(gallery.locator("canvas.rco-fx-canvas")).toHaveCount(1);
    await expect(gallery.locator(".rco-fx-play")).toHaveCount(0, { timeout: 9_000 });
    await expect(gallery.locator(".d-fx-room")).toHaveCSS("transform", /none|matrix\(1, 0, 0, 1, 0, 0\)/);
    expect(errors).toEqual([]);
  });

  test("draws particles on its canvas", async ({ page }) => {
    // Arrange
    await page.goto(at("/docs/effects/library/"));
    await hydrated(page, ".d-fx-room");
    const gallery = page.locator(".d-fx").first();

    // Act
    await gallery.getByRole("button", { name: "Confetti" }).click();
    await page.waitForTimeout(400);

    // Assert: something other than nothing is on the canvas.
    const lit = await gallery.locator("canvas.rco-fx-canvas").evaluate((canvas: HTMLCanvasElement) => {
      const pixels = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data ?? [];
      let count = 0;
      for (let alpha = 3; alpha < pixels.length; alpha += 4) if ((pixels[alpha] ?? 0) > 0) count += 1;
      return count;
    });
    expect(lit).toBeGreaterThan(200);
  });

  test("plays a plan on a pack as its legendary turns", async ({ page }) => {
    // Arrange
    const errors = watchErrors(page);
    await page.goto(at("/docs/effects/plans/"));
    await hydrated(page, ".rco-pack");
    const pack = page.locator(".rco-pack").first();
    await pack.getByRole("button", { name: "Open the pack" }).click({ force: true });
    await expect(pack.locator(".rco-pack-deal").last()).toHaveCSS("opacity", "1");

    // Act
    await pack.locator('.rco-pack-seat[data-effect="legendary"] .rco-pack-press').click();

    // Assert: the mythic plan's legendary show, on the pack's own layer.
    await expect(pack.locator(".rco-fx-layer .rco-fx-nova")).toBeAttached();
    await expect(pack.locator(".rco-fx-layer .rco-fx-pillar")).toBeAttached();
    await expect(pack.locator(".rco-fx-play")).toHaveCount(0, { timeout: 9_000 });
    expect(errors).toEqual([]);
  });
});
