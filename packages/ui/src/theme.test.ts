import { readFileSync } from "node:fs";
import path from "node:path";

import {
  customTheme,
  DEFAULT_THEME,
  isThemeId,
  RARITY_ON_DARK,
  RARITY_ON_LIGHT,
  rarityColor,
  THEME_LIST,
  themeOf,
  themeStyle,
} from "./theme";
import { DEFAULT_RARITIES } from "@react-cards-opening/core";

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

  it("makes a whole theme from one colour, and leaves rarity its six", () => {
    const theme = customTheme("#ff5a36", "dark");

    expect(theme.levels[4]).toBe("#ff5a36");
    expect(theme.rarity).toBe(RARITY_ON_DARK);
    expect(customTheme("#ff5a36", "light").rarity).toBe(RARITY_ON_LIGHT);
  });

  it("gives every default tier a colour of its own on every theme, in both modes", () => {
    for (const { id } of THEME_LIST) {
      for (const mode of ["dark", "light"] as const) {
        const colours = DEFAULT_RARITIES.map((tier) => rarityColor(themeOf(id, mode), tier.id));

        expect(new Set(colours).size, `${id} ${mode}`).toBe(DEFAULT_RARITIES.length);
        expect(
          colours.every((colour) => /^#[0-9a-f]{6}$/.test(colour)),
          `${id} ${mode}`,
        ).toBe(true);
      }
    }
  });

  it("dresses a tier it has no colour for in the muted tone", () => {
    expect(rarityColor(DEFAULT_THEME, "relic")).toBe(DEFAULT_THEME.muted);
  });

  it("hands the colours over as custom properties", () => {
    expect(themeStyle(DEFAULT_THEME)).toMatchObject({
      "--rco-bg": DEFAULT_THEME.bg,
      "--rco-l0": DEFAULT_THEME.levels[0],
      "--rco-accent": DEFAULT_THEME.levels[4],
    });
  });
});

// What `:where()` holds weighs nothing; take it out, brackets and all.
const bare = (selector: string) => {
  let out = "";
  let depth = 0;
  for (let at = 0; at < selector.length; at += 1) {
    if (depth === 0 && selector.startsWith(":where(", at)) {
      depth = 1;
      at += ":where(".length - 1;
    } else if (depth > 0) {
      if (selector[at] === "(") depth += 1;
      if (selector[at] === ")") depth -= 1;
    } else out += selector[at];
  }
  return out;
};
const weigh = (selector: string) => {
  const rest = bare(selector);
  const ids = (rest.match(/#[\w-]+/g) ?? []).length;
  const classes = (rest.match(/\.[\w-]+|\[[^\]]*\]|(?<!:):[\w-]+/g) ?? []).length;
  const tags = (rest.replaceAll(/\.[\w-]+|\[[^\]]*\]|::?[\w-]+|#[\w-]+/g, " ").match(/[a-z][\w-]*/gi) ?? []).length;
  return `${ids},${classes},${tags}`;
};

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

  it("gives every rule the weight of exactly one class, so a class of the page's own can always win", () => {
    const selectors = [...css.matchAll(/(^|[{}])\s*([^{}@]+?)\s*\{/g)]
      .map((match) => match[2].trim())
      .filter((selector) => !/^(from|to|[\d.,%\s]+)$/.test(selector))
      .flatMap((selector) => selector.split(/,(?![^(]*\))/).map((part) => part.trim()));

    // One rule weighs nothing on purpose: the ground rules for a component's own root, so that a margin or a
    // width the page gives the root is never fought over.
    const off = selectors
      .filter((selector) => selector !== ":where(.rco-root)")
      .filter((selector) => weigh(selector) !== "0,1,0")
      .map((selector) => `${selector} weighs ${weigh(selector)}`);

    expect(selectors.length).toBeGreaterThan(80);
    expect(off).toEqual([]);
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
