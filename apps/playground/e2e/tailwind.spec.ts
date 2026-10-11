import { expect, type Page, test } from "@playwright/test";

/*
 * Styling by hand with Tailwind, for real: a page with Tailwind 4, the library's stylesheet imported into the
 * `components` layer, and utilities handed to the parts through `classNames`. The utilities have to win, and
 * Tailwind's reset must leave an untouched hunt exactly as it is without Tailwind.
 */

const read = (page: Page, selector: string, properties: readonly string[]) =>
  page.evaluate(
    ({ target, names }) => {
      const node = document.querySelector(target);
      if (!node) throw new Error(`Nothing on the page matches ${target}`);
      const computed = getComputedStyle(node);
      return Object.fromEntries(names.map((name) => [name, computed.getPropertyValue(name)]));
    },
    { target: selector, names: properties },
  );

test.describe("with Tailwind", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tailwind.html", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
  });

  test("a utility on a part beats the library's own style for it", async ({ page }) => {
    // What the same utilities compute to on a plain button of the page's own.
    const probe = await read(page, "#probe", [
      "background-color",
      "color",
      "font-size",
      "font-family",
      "border-top-left-radius",
      "padding-left",
      "text-transform",
    ]);

    const headline = await read(page, "#styled .rco-hunt-headline", ["font-size", "font-family"]);
    const button = await read(page, "#styled .rco-button-main", [
      "background-color",
      "color",
      "border-top-left-radius",
      "padding-left",
    ]);
    const root = await read(page, "#styled .rco-hunt", ["border-top-left-radius", "padding-top"]);
    const cell = await read(page, "#styled .rco-cell[data-cell]", ["border-top-left-radius"]);
    const badgeName = await read(page, "#styled .rco-badge-name", ["text-transform"]);

    expect(headline).toEqual({ "font-size": probe["font-size"], "font-family": probe["font-family"] });
    expect(button).toEqual({
      "background-color": probe["background-color"],
      color: probe.color,
      "border-top-left-radius": probe["border-top-left-radius"],
      "padding-left": probe["padding-left"],
    });
    expect(root).toEqual({ "border-top-left-radius": "0px", "padding-top": "40px" });
    expect(cell).toEqual({ "border-top-left-radius": "0px" });
    expect(badgeName).toEqual({ "text-transform": probe["text-transform"] });
  });

  test("a hunt nobody restyled keeps the library's look under Tailwind's reset", async ({ page }) => {
    const button = await read(page, "#plain .rco-button-main", [
      "height",
      "padding-left",
      "border-top-left-radius",
      "font-size",
      "font-weight",
    ]);
    const badge = await read(page, "#plain .rco-badge", ["padding-left", "padding-right", "border-top-left-radius"]);
    const headline = await read(page, "#plain .rco-hunt-headline", ["font-weight", "letter-spacing"]);
    const panel = await read(page, "#plain .rco-hunt", ["border-top-left-radius", "padding-top"]);

    expect(button).toEqual({
      height: "44px",
      "padding-left": "24px",
      "border-top-left-radius": "9999px",
      "font-size": "15px",
      "font-weight": "600",
    });
    expect(badge).toEqual({ "padding-left": "6px", "padding-right": "14px", "border-top-left-radius": "14px" });
    expect(headline["font-weight"]).toBe("600");
    expect(headline["letter-spacing"]).not.toBe("normal");
    expect(panel).toEqual({ "border-top-left-radius": "28px", "padding-top": "24px" });
  });
});
