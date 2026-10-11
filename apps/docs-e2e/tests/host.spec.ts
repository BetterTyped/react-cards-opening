import { expect, type Page, test } from "@playwright/test";

import { at, hydrated, stylesOf } from "./helpers";

/* oxlint-disable no-await-in-loop -- a handful of readings from one page, in order */

/*
 * The "hostile host" check. The library is dropped into other people's pages, so it has to look the same whatever
 * their stylesheet says about buttons, paragraphs and lists, and it has to leave their buttons and paragraphs alone.
 */

/** What a careless global stylesheet does to the tags the library also uses. */
const HOSTILE_CSS = `
  button{border:3px solid red;background:yellow;padding:20px;font-family:serif;font-size:30px;border-radius:0;letter-spacing:4px;box-shadow:0 0 0 9px red}
  p{margin:40px;font-family:serif;font-size:30px;text-transform:uppercase}
  ul,li{list-style:disc;padding-left:40px;margin:30px}
  i{font-style:italic;display:inline}
  span{letter-spacing:5px}
  svg,img{display:inline;width:60px;height:60px;max-width:100%}
  *{box-sizing:content-box;transition:all 2s}
`;

const SIDES = ["top", "right", "bottom", "left"] as const;

/** What has to stay the same on a library element when the host's stylesheet turns hostile. */
const GUARDED = [
  ...SIDES.map((side) => `border-${side}-width`),
  ...SIDES.map((side) => `padding-${side}`),
  ...SIDES.map((side) => `margin-${side}`),
  "box-sizing",
  "background-color",
  "font-family",
  "font-size",
  "letter-spacing",
  "text-transform",
  "border-top-left-radius",
  "box-shadow",
  "max-width",
  "transition-duration",
  "width",
  "height",
];

/** Library elements of every kind the hostile rules aim at. */
const LIBRARY_ELEMENTS = [
  { name: "the scan button", selector: ".rco-hunt .rco-button-main" },
  { name: "the headline", selector: ".rco-hunt .rco-hunt-headline" },
  { name: "the subline", selector: ".rco-hunt .rco-hunt-subline" },
  { name: "a grid cell", selector: ".rco-hunt .rco-cell[data-cell]" },
  { name: "the list of finds", selector: ".rco-hunt .rco-finds" },
  { name: "a badge", selector: ".rco-hunt .rco-badge" },
  { name: "a badge's glyph pixel", selector: ".rco-hunt .rco-badge .rco-glyph-pixel" },
  { name: "the button's icon", selector: ".rco-hunt .rco-button-main .rco-icon" },
] as const;

const HUNT_PAGE = at("/docs/components/card-hunt/");

/** The property values that differ between two readings, as "name: before -> after". */
const changed = (before: Record<string, string>, after: Record<string, string>): string[] =>
  Object.keys(before)
    .filter((name) => before[name] !== after[name])
    .map((name) => `${name}: ${before[name]} -> ${after[name]}`);

/**
 * Opens the page and pins the box the hunt sits in. The hostile rules change the page around the library too (this
 * site is the host here), and a hunt in a narrower column is a different hunt: what is under test is the library
 * in the same box, before and after.
 */
async function openHunt(page: Page) {
  await page.goto(HUNT_PAGE);
  await hydrated(page, ".rco-hunt");
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    const box = document.querySelector(".rco-hunt")?.parentElement;
    box?.setAttribute(
      "style",
      "width:820px!important;min-width:820px!important;max-width:none!important;padding:0!important;margin:0!important;border:0!important;box-sizing:border-box!important;display:block!important",
    );
  });
}

test.describe("a host page with an aggressive stylesheet", () => {
  for (const element of LIBRARY_ELEMENTS) {
    test(`${element.name} keeps its box, its type and its colours`, async ({ page }) => {
      // Arrange
      await openHunt(page);
      const before = await stylesOf(page, element.selector, GUARDED);

      // Act
      await page.addStyleTag({ content: HOSTILE_CSS });
      const after = await stylesOf(page, element.selector, GUARDED);

      // Assert
      expect(changed(before, after), `${element.name} (${element.selector}) changed`).toEqual([]);
    });
  }

  test("the hunt is the same picture before and after", async ({ page }) => {
    // Arrange
    await openHunt(page);
    const hunt = page.locator(".rco-hunt").first();
    const size = async () => {
      const box = await hunt.boundingBox();
      return { width: box?.width, height: box?.height };
    };
    const before = await size();

    // Act
    await page.addStyleTag({ content: HOSTILE_CSS });
    const after = await size();

    // Assert: the panel is the size it was to the pixel. Where the page puts it is the page's business.
    expect(after).toEqual(before);
  });
});

test.describe("the library's stylesheet", () => {
  test("leaves the page's own elements alone", async ({ page }) => {
    // Arrange: plain elements of the page's own, outside anything the library renders.
    await openHunt(page);
    const probe = async () =>
      page.evaluate(() => {
        const host = document.createElement("div");
        host.innerHTML = `<button id="probe-button">x</button><p id="probe-p">x</p><ul id="probe-ul"><li>x</li></ul><i id="probe-i">x</i>`;
        document.body.append(host);
        // oxlint-disable-next-line unicorn/consistent-function-scoping -- runs in the page, so it carries its helper
        const read = (id: string) => {
          const style = getComputedStyle(document.querySelector(`#${id}`) as Element);
          return [
            "margin-top",
            "padding-left",
            "border-top-width",
            "font-style",
            "list-style-type",
            "box-sizing",
            "background-color",
          ].map((name) => `${name}:${style.getPropertyValue(name)}`);
        };
        const result = { button: read("probe-button"), p: read("probe-p"), ul: read("probe-ul"), i: read("probe-i") };
        host.remove();
        return result;
      });
    const withLibrary = await probe();

    // Act: the same elements with the library's stylesheet taken out of the page.
    await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        let own = false;
        try {
          own = [...sheet.cssRules].some((rule) => rule.cssText.includes(".rco-root"));
        } catch {
          own = false;
        }
        if (own) sheet.disabled = true;
      }
    });
    const without = await probe();

    // Assert
    expect(withLibrary).toEqual(without);
  });
});
