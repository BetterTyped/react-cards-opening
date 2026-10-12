import { expect, type Page, test } from "@playwright/test";

import { at, hydrated, oneComponentPage, oneEffectPage, watchErrors } from "./helpers";

/*
 * The site's own chrome: the bar, the docs drawer, dark mode, and the one rule every page has to keep at every
 * width, which is that nothing makes it scroll sideways.
 */

const PAGES = [
  at("/"),
  at("/docs/"),
  oneEffectPage().path,
  oneComponentPage().path,
  at("/docs/theming/"),
  at("/docs/guides/own-ui-on-core/"),
  at("/docs/examples/collection/"),
];

const WIDTHS = [1440, 768, 390] as const;

const THEME_KEY = "react-cards-opening:docs:theme";

/** How far the page can scroll sideways, and which elements reach past its right edge when it can. */
function sidewaysOverflow(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const wide = root.scrollWidth > window.innerWidth;
    const reaching = wide
      ? [...document.querySelectorAll("body *")]
          .filter((node) => node.getBoundingClientRect().right > window.innerWidth + 0.5)
          .slice(0, 5)
          .map((node) => {
            const classes = (node.getAttribute("class") ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 3);
            return `${[node.tagName.toLowerCase(), ...classes].join(".")} ends at ${Math.round(node.getBoundingClientRect().right)} px`;
          })
      : [];
    return { scrollWidth: root.scrollWidth, innerWidth: window.innerWidth, reaching };
  });
}

/**
 * Widths at which the site scrolls sideways today, each with what is too wide. The tests of a width listed here
 * are `test.fixme`: whole and waiting, and they run again the day the entry is deleted.
 */
const KNOWN_SIDEWAYS: Partial<Record<(typeof WIDTHS)[number], string>> = {};

/** Opens a page and checks it is no wider than the window. */
async function fitsTheWindow(page: Page, path: string) {
  // Act
  await page.goto(path);
  await hydrated(page, ".d-bar");
  await page.evaluate(() => document.fonts.ready);
  const measured = await sidewaysOverflow(page);

  // Assert
  expect(
    measured.scrollWidth,
    `the page is ${measured.scrollWidth} px wide in a ${measured.innerWidth} px window. Past the edge: ${measured.reaching.join("; ")}`,
  ).toBeLessThanOrEqual(measured.innerWidth);
}

for (const width of WIDTHS) {
  test.describe(`at ${width} px wide`, () => {
    test.use({ viewport: { width, height: 900 } });

    const known = KNOWN_SIDEWAYS[width];
    for (const path of PAGES) {
      const title = `${path} does not scroll sideways`;
      if (known) test.fixme(`${title}. Known: ${known}`, ({ page }) => fitsTheWindow(page, path));
      else test(title, ({ page }) => fitsTheWindow(page, path));
    }
  });
}

test.describe("every kind of page", () => {
  for (const path of PAGES) {
    test(`${path} opens without a console error or an uncaught exception`, async ({ page }) => {
      // Arrange
      const errors = watchErrors(page);

      // Act
      await page.goto(path);
      await hydrated(page, ".d-bar");
      // Long enough for the previews to start playing and say so if they cannot.
      await page.waitForTimeout(1500);

      // Assert
      expect(errors).toEqual([]);
    });
  }
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the menu button opens the docs drawer and a link in it goes to that page", async ({ page }) => {
    // Arrange
    await page.goto(at("/docs/"));
    await hydrated(page, ".d-bar");

    // Act
    await page.getByRole("button", { name: "Open the docs menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Docs menu" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "Installation", exact: true }).click();

    // Assert
    await expect(page).toHaveURL(new RegExp(`${at("/docs/installation/")}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/install/i);
    await expect(drawer).toBeHidden();
  });
});

test.describe("the bar", () => {
  test("the site opens in the dark, the toggle flips it, and the choice survives a reload", async ({ page }) => {
    // Arrange: even a browser that asks for light gets the dark: it is the site's own look, not a preference.
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(at("/docs/"));
    await hydrated(page, ".d-bar");
    const html = page.locator("html");
    await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);

    // Act
    await page.getByRole("button", { name: "Use light mode" }).click();

    // Assert
    await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);
    expect(await page.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe("light");

    // Act: the same page again, and then back to dark.
    await page.reload();
    await hydrated(page, ".d-bar");

    // Assert
    await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);
    await page.getByRole("button", { name: "Use dark mode" }).click();
    await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);
    expect(await page.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe("dark");
    await page.reload();
    await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);
  });

  test("beside a docs page, Hype Stack is a card in the column under the headings", async ({ page }) => {
    // Act
    await page.goto(at("/docs/installation/"));
    const card = page.locator(".d-rail .d-ad");

    // Assert: the card, with its three points, in the column and not floating; nothing about it in the bar.
    await expect(card).toBeVisible();
    await expect(card).toContainText("Ship faster with Hype Stack");
    await expect(card.locator(".d-ad-points > span")).toHaveCount(3);
    await expect(card).toContainText("Explore the stack");
    await expect(page.locator(".d-float")).toBeHidden();
    await expect(page.locator("header").getByRole("link", { name: /Hype Stack/ })).toHaveCount(0);
  });

  test("on the home page, which has no column, the card floats in the corner and can be closed", async ({ page }) => {
    // Act
    await page.goto(at("/"));
    await hydrated(page, ".d-bar");
    const float = page.locator(".d-float");

    // Assert: pinned to the bottom right, and still there after scrolling.
    await expect(float).toBeVisible();
    await expect(float).toHaveCSS("position", "fixed");
    await expect(float).toContainText("Ship faster with Hype Stack");
    await page.mouse.wheel(0, 1400);
    await expect(float).toBeInViewport();

    // Act: close it, and go somewhere else.
    await page.getByRole("button", { name: "Close the Hype Stack card" }).click();
    await expect(float).toHaveCount(0);
    await page.goto(at("/docs/examples/collection/"));
    await hydrated(page, ".d-bar");

    // Assert: closed for the visit.
    await expect(page.locator(".d-float")).toHaveCount(0);
  });

  test("the card's links say where the visitor came from", async ({ page }) => {
    // Act
    await page.goto(at("/docs/installation/"));
    const href = (await page.locator(".d-rail .d-ad").getAttribute("href")) ?? "";

    // Assert
    expect(href.startsWith("https://www.hype-stack.dev/?"), `href is ${href}`).toBe(true);
    const query = new URL(href).searchParams;
    expect(query.get("ref")).toBe("react-cards-opening");
    expect(query.get("utm_source")).toBe("react-cards-opening");
    expect(query.get("utm_campaign")).toBe("docs-sidebar");
  });

  test("a long list of headings scrolls above the card, never under it", async ({ page }) => {
    // Arrange: a short window and a page with many headings.
    await page.setViewportSize({ width: 1440, height: 700 });
    await page.goto(at("/docs/effects/library/"));

    // Assert
    const list = await page.locator(".d-rail .d-toc").boundingBox();
    const card = await page.locator(".d-rail .d-ad").boundingBox();
    expect((list?.y ?? 0) + (list?.height ?? 0)).toBeLessThanOrEqual((card?.y ?? 0) + 1);
    await expect(page.locator(".d-rail .d-ad")).toBeInViewport();
  });

  test("on a phone the card is a strip along the bottom of every page", async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: 390, height: 844 });

    for (const path of ["/", "/docs/installation/"]) {
      // Act
      // oxlint-disable-next-line no-await-in-loop -- one page after another
      await page.goto(at(path));
      // oxlint-disable-next-line no-await-in-loop
      await hydrated(page, ".d-bar");
      const float = page.locator(".d-float");

      // Assert: across the bottom, inside the screen, one line of words and the way in.
      // oxlint-disable-next-line no-await-in-loop
      await expect(float).toBeVisible();
      // oxlint-disable-next-line no-await-in-loop
      const box = await float.boundingBox();
      expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
      expect(box?.height ?? 999).toBeLessThan(90);
      // oxlint-disable-next-line no-await-in-loop
      await expect(float.locator(".d-ad-text")).toBeHidden();
    }
  });
});
