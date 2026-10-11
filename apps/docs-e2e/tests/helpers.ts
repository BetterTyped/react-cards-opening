import type { Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/*
 * What the specs share: where the built site is, which pages it has, and the few things about the page that are
 * easy to get wrong twice (waiting for React, reading computed styles).
 */

/** Every address of the site starts with the repository's name, the way GitHub Pages serves it. */
export const BASE = "/react-cards-opening/";

/** The built docs on disk. `DOCS_E2E_ROOT` points the tests and the server at a copy instead. */
export const SITE_ROOT = path.resolve(
  process.env.DOCS_E2E_ROOT ?? path.join(path.dirname(fileURLToPath(import.meta.url)), "../../docs/dist/client"),
);

/** A path on the site ("/docs/effects/burst/") as the address the test server answers at. */
export const at = (sitePath: string) => `${BASE}${sitePath.replace(/^\/+/, "")}`;

/** A file of the built site, read from disk. */
export function builtFile(relative: string): string {
  const file = path.join(SITE_ROOT, relative);
  if (!existsSync(file)) {
    throw new Error(
      `${file} is missing. Build the docs first: pnpm --filter "./packages/*" build && pnpm --filter @react-cards-opening/docs build`,
    );
  }
  return readFileSync(file, "utf8");
}

export interface SitePage {
  /** The public address, exactly as the sitemap has it. */
  url: string;
  /** The same page on the test server: "/react-cards-opening/docs/effects/burst/". */
  path: string;
  /** Under /docs/: an article with a Markdown twin. */
  isDoc: boolean;
}

/** Every page the sitemap lists, read from the built file. */
export function sitemapPages(): SitePage[] {
  const xml = builtFile("sitemap.xml");
  const pages = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc = ""]) => {
    const pathname = new URL(loc).pathname;
    return { url: loc, path: pathname, isDoc: pathname.startsWith(`${BASE}docs/`) };
  });
  if (pages.length === 0) throw new Error("sitemap.xml lists no pages.");
  return pages;
}

/** The first page of the sitemap whose path matches, for the specs that need "one effect page" or "one component page". */
export function pageMatching(pattern: RegExp): SitePage {
  const found = sitemapPages().find((page) => pattern.test(page.path));
  if (!found) throw new Error(`No page in sitemap.xml matches ${pattern}.`);
  return found;
}

export const oneEffectPage = () => pageMatching(/\/docs\/effects\/[^/]+\/$/);
export const oneComponentPage = () => pageMatching(/\/docs\/components\/[^/]+\/$/);

/** Where the site says it lives ("https://bettertyped.github.io"), taken from the sitemap. */
export const publicOrigin = () => new URL(sitemapPages()[0]?.url ?? "").origin;

/**
 * Collects what the page complains about: console errors and uncaught exceptions. Start it before the page is
 * opened, read the list at the end.
 */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => {
    errors.push(`page error: ${error.message}`);
  });
  return errors;
}

/**
 * Waits until React has taken over the server's HTML around an element. A click that lands before that does
 * nothing, and clicking again to be safe would flip a toggle twice. React marks every node it owns with a key of
 * its own, which is the one sign of hydration a page gives without being asked.
 */
export async function hydrated(page: Page, selector: string): Promise<void> {
  await page.waitForFunction((target) => {
    const node = document.querySelector(target);
    return node !== null && Object.keys(node).some((key) => key.startsWith("__reactFiber$"));
  }, selector);
}

/**
 * The em dash and the en dash, which the site never uses. Built from their code points so this file does not have
 * them in it either.
 */
const DASHES = new RegExp(`[${String.fromCodePoint(0x2013)}${String.fromCodePoint(0x2014)}]`, "g");

/** Every dash found in a text, each with a few words around it so it can be found on the page. */
export function dashesIn(text: string): string[] {
  return [...text.matchAll(DASHES)].map((match) => {
    const index = match.index ?? 0;
    return text.slice(Math.max(0, index - 30), index + 30).replace(/\s+/g, " ");
  });
}

/* ---------- computed styles ---------- */

/** The computed value of each named property of the first element matching a selector. */
export function stylesOf(page: Page, selector: string, properties: readonly string[]): Promise<Record<string, string>> {
  return page.evaluate(
    ({ target, names }) => {
      const node = document.querySelector(target);
      if (!node) throw new Error(`Nothing on the page matches ${target}`);
      const computed = getComputedStyle(node);
      return Object.fromEntries(names.map((name) => [name, computed.getPropertyValue(name)]));
    },
    { target: selector, names: properties },
  );
}
