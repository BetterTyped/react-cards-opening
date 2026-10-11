import { readFileSync } from "node:fs";
import path from "node:path";

import { customTheme, DEFAULT_THEME, isThemeId, rarityColor, THEME_LIST, themeOf, themeStyle } from "./theme";

describe("themes", () => {
  it("ships ten, each in dark and light", () => {
    expect(THEME_LIST).toHaveLength(10);
    for (const { id } of THEME_LIST) {
      expect(themeOf(id, "dark").levels).toHaveLength(5);
      expect(themeOf(id, "light").bg).not.toBe(themeOf(id, "dark").bg);
    }
  });

  it("wears moss in the dark when asked for nothing", () => {
    expect(themeOf()).toBe(DEFAULT_THEME);
    expect(isThemeId("moss")).toBe(true);
    expect(isThemeId("github")).toBe(false);
  });

  it("deepens rarity colours for a light ground instead of washing them out", () => {
    const light = themeOf("grape", "light");

    expect(light.rarity.common).toBe("#6e7781");
    expect(light.rarity.legendary).not.toBe(themeOf("grape", "dark").rarity.legendary);
  });

  it("makes a whole theme from one colour, with gold for the top tier", () => {
    const theme = customTheme("#ff5a36", "dark");

    expect(theme.levels[4]).toBe("#ff5a36");
    expect(theme.rarity.legendary).toBe("#f2cc60");
    expect(new Set(Object.values(theme.rarity)).size).toBe(4);
  });

  it("gives a gold accent its own light tint for legendary, so the two never blur", () => {
    expect(customTheme("#f2b500", "dark").rarity.legendary).not.toBe("#f2cc60");
  });

  it("dresses a tier it has no colour for in the muted tone", () => {
    expect(rarityColor(DEFAULT_THEME, "mythic")).toBe(DEFAULT_THEME.muted);
  });

  it("hands the colours over as custom properties", () => {
    expect(themeStyle(DEFAULT_THEME)).toMatchObject({
      "--rco-bg": DEFAULT_THEME.bg,
      "--rco-l0": DEFAULT_THEME.levels[0],
      "--rco-accent": DEFAULT_THEME.levels[4],
    });
  });
});

describe("the stylesheet", () => {
  const css = readFileSync(path.join(import.meta.dirname, "styles.css"), "utf8").replaceAll(/\/\*[\s\S]*?\*\//g, "");

  it("only ever selects what the library renders", () => {
    // Every rule's selector, at any depth, with the at-rules and keyframe steps left out.
    const selectors = [...css.matchAll(/(^|[{}])\s*([^{}@]+?)\s*\{/g)]
      .map((match) => match[2].trim())
      .filter((selector) => !/^(from|to|[\d.,%\s]+)$/.test(selector));
    const loose = selectors
      .flatMap((selector) => selector.split(",").map((part) => part.trim()))
      .filter((part) => !part.includes("rco-"));

    expect(selectors.length).toBeGreaterThan(60);
    expect(loose).toEqual([]);
  });

  it("names every animation its own", () => {
    const names = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]);

    expect(names.length).toBeGreaterThan(0);
    expect(names.filter((name) => !name.startsWith("rco-"))).toEqual([]);
  });

  it("names no colour of its own outside the neutral ones every theme shares", () => {
    const hexes = [...css.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((match) => match[0]);

    expect(hexes).toEqual([]);
  });
});
