import { expect, test } from "@playwright/test";

import { at, hydrated, watchErrors } from "./helpers";

/*
 * The previews are the library running for real, so they double as its browser tests: a card opened from a shelf,
 * a whole hunt, a peek, a stop. Real time, no fake clock: this is what a visitor's browser does.
 */

test.describe("a card on a shelf", () => {
  test("opens where it lies, lands face up, and can be looked at again", async ({ page }) => {
    // Arrange
    const errors = watchErrors(page);
    await page.goto(at("/docs/examples/collection/"));
    await hydrated(page, ".d-place");
    const place = page.locator(".d-place").first();
    await expect(place.locator(".rco-card")).toHaveAttribute("data-down", "");

    // Act: open it, then turn it early with a press on the card.
    await place.click();
    const card = page.getByRole("button", { name: "Turn the card over, then keep it" });
    await expect(card).toBeVisible();
    await card.click();
    await expect(page.locator(".rco-stage .rco-card-name")).toBeVisible();
    // A second press sends it home.
    await card.click();

    // Assert: face up on the shelf, and the overlay is out of the way.
    await expect(place.locator(".rco-card")).not.toHaveAttribute("data-down", "");
    await expect(place).toBeEnabled();
    await expect(page.locator(".rco-backdrop")).toHaveCSS("pointer-events", "none");

    // Act: look at it again, and put it back with Escape.
    await place.click();
    await expect(page.getByRole("button", { name: "Close this card" })).toBeFocused();
    await page.keyboard.press("Escape");

    // Assert: focus is back on what was pressed.
    await expect(place).toBeFocused();
    expect(errors).toEqual([]);
  });

  test("goes back unopened when the backdrop is pressed before it turns", async ({ page }) => {
    // Arrange
    await page.goto(at("/docs/examples/collection/"));
    await hydrated(page, ".d-place");
    const place = page.locator(".d-place").first();

    // Act
    await place.click();
    await expect(page.locator(".rco-backdrop")).toHaveCSS("pointer-events", "auto");
    await page.mouse.click(8, 8);

    // Assert
    await expect(place).toBeEnabled();
    await expect(place.locator(".rco-card")).toHaveAttribute("data-down", "");
  });
});

test.describe("a hunt", () => {
  test("finds every card with one press of Find all, then offers the replay", async ({ page }) => {
    // Arrange
    const errors = watchErrors(page);
    await page.goto(at("/docs/components/card-hunt/"));
    await hydrated(page, ".rco-hunt");
    const hunt = page.locator(".rco-hunt").first();
    await expect(hunt.getByText("Still hidden")).toHaveCount(5);

    // Act
    await hunt.getByRole("button", { name: "Scan" }).click();
    await hunt.getByRole("button", { name: "Find all" }).click();

    // Assert
    await expect(hunt.getByText("Still hidden")).toHaveCount(0);
    await expect(hunt.getByText("You found all 5.")).toBeVisible();
    await expect(hunt.getByRole("button", { name: "Scan again" })).toBeVisible();
    await expect(hunt.locator(".rco-cell[data-found]")).toHaveCount(5);
    expect(errors).toEqual([]);
  });

  test("opens a found card again from its badge", async ({ page }) => {
    // Arrange
    await page.goto(at("/docs/components/card-hunt/"));
    await hydrated(page, ".rco-hunt");
    const hunt = page.locator(".rco-hunt").first();
    await hunt.getByRole("button", { name: "Scan" }).click();
    await hunt.getByRole("button", { name: "Find all" }).click();

    // Act
    await hunt.getByTitle("Open this card").first().click();

    // Assert
    const card = page.getByRole("button", { name: "Close this card" });
    await expect(card).toBeVisible();
    await card.click();
    await expect(hunt.getByTitle("Open this card").first()).toBeFocused();
  });
});

test.describe("the rules on their own", () => {
  test("drive a reveal with no ui package: every card opens, in order", async ({ page }) => {
    // Arrange
    await page.goto(at("/docs/guides/own-ui-on-core/"));
    await hydrated(page, ".d-headless");
    const demo = page.locator(".d-headless");

    // Act
    await demo.getByRole("button", { name: "Skip the show" }).click();

    // Assert
    await expect(demo.locator(".d-headless-list li[data-open]")).toHaveCount(4);
    await expect(demo.getByText("phase: idle")).toBeVisible();
  });
});
