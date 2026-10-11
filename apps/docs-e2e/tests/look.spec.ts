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
  test("the theme toggle flips dark mode and the choice survives a reload", async ({ page }) => {
    // Arrange: a browser that asks for light, so the page opens light.
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(at("/docs/"));
    await hydrated(page, ".d-bar");
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);

    // Act
    await page.getByRole("button", { name: "Use dark mode" }).click();

    // Assert
    await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);
    expect(await page.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe("dark");

    // Act: the same page again, and then back to light.
    await page.reload();
    await hydrated(page, ".d-bar");

    // Assert
    await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);
    await page.getByRole("button", { name: "Use light mode" }).click();
    await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);
    expect(await page.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe("light");
    await page.reload();
    await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);
  });

  test("the Hype Stack link says where the visitor came from", async ({ page }) => {
    // Act
    await page.goto(at("/"));
    const link = page.locator("header").getByRole("link", { name: "Hype Stack" });

    // Assert
    await expect(link).toHaveCount(1);
    const href = (await link.getAttribute("href")) ?? "";
    expect(href.startsWith("https://www.hype-stack.dev/"), `href is ${href}`).toBe(true);
    expect(href).toContain("utm_source=react-cards-opening");
  });
});
