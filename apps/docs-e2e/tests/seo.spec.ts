import { expect, test } from "@playwright/test";

import {
  at,
  BASE,
  builtFile,
  dashesIn,
  oneComponentPage,
  oneEffectPage,
  publicOrigin,
  sitemapPages,
  type SitePage,
} from "./helpers";

/* oxlint-disable no-await-in-loop -- one page and one link at a time, so a failure names the first one that broke */

/*
 * What a search engine, a link preview and a language model get from every page of the site. The list of pages is
 * the built sitemap, so a page added to the docs is checked the day it is added.
 */

const PAGES = sitemapPages();
const DOCS = PAGES.filter((page) => page.isDoc);

/** What the head and the body of a page say, read from the live document. */
function readPage() {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- runs in the page, so it carries its helper
  const content = (selector: string) => document.querySelector<HTMLMetaElement>(selector)?.content ?? null;
  return {
    headings: [...document.querySelectorAll("h1")].map((heading) => heading.textContent ?? ""),
    title: document.title,
    description: content('meta[name="description"]'),
    canonicals: [...document.querySelectorAll('link[rel="canonical"]')].map((link) => link.getAttribute("href")),
    share: {
      "og:title": content('meta[property="og:title"]'),
      "og:description": content('meta[property="og:description"]'),
      "og:url": content('meta[property="og:url"]'),
      "og:image": content('meta[property="og:image"]'),
      "twitter:card": content('meta[name="twitter:card"]'),
    },
    structured: [...document.querySelectorAll('script[type="application/ld+json"]')].map(
      (script) => script.textContent ?? "",
    ),
    text: document.body.innerText,
  };
}

/** Every `@type` named anywhere in a page's JSON-LD, or the reason one of its blocks does not parse. */
function structuredTypes(blocks: readonly string[]): { types: string[]; broken: string[] } {
  const types: string[] = [];
  const broken: string[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node !== "object" || node === null) return;
    for (const [key, value] of Object.entries(node)) {
      if (key === "@type") types.push(...(Array.isArray(value) ? value.map(String) : [String(value)]));
      else walk(value);
    }
  };
  for (const block of blocks) {
    try {
      walk(JSON.parse(block));
    } catch (error) {
      broken.push(`${error instanceof Error ? error.message : String(error)}: ${block.slice(0, 80)}`);
    }
  }
  return { types, broken };
}

/** An address as the test server knows it, when it is a page of this site; null for anywhere else. */
function internalPath(href: string, origins: readonly string[]): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (!origins.includes(url.origin) || !url.pathname.startsWith(BASE)) return null;
  return `${url.pathname}${url.search}`;
}

test.describe("every page in the sitemap", () => {
  for (const entry of PAGES) {
    test(`${entry.path} has a title, a description, share tags and clean text`, async ({ page }) => {
      // Act
      const response = await page.goto(entry.path);
      const found = await page.evaluate(readPage);
      const { types, broken } = structuredTypes(found.structured);

      // Assert
      expect(response?.status(), "the page answers 200").toBe(200);
      expect.soft(found.headings, "exactly one <h1>").toHaveLength(1);
      expect.soft(found.title.length, `title length of "${found.title}"`).toBeGreaterThanOrEqual(30);
      expect.soft(found.title.length, `title length of "${found.title}"`).toBeLessThanOrEqual(65);
      expect
        .soft(found.description?.length ?? 0, `description length of "${found.description}"`)
        .toBeGreaterThanOrEqual(50);
      expect
        .soft(found.description?.length ?? 0, `description length of "${found.description}"`)
        .toBeLessThanOrEqual(170);
      expect.soft(found.canonicals, "exactly one canonical, the sitemap's own address").toEqual([entry.url]);
      for (const [tag, value] of Object.entries(found.share)) {
        expect.soft(value ?? "", `${tag} is present`).not.toBe("");
      }
      expect.soft(found.share["og:url"], "og:url is the sitemap's own address").toBe(entry.url);
      expect.soft(broken, "every JSON-LD block parses").toEqual([]);
      if (entry.isDoc) {
        expect.soft(types, "a docs page is a TechArticle").toContain("TechArticle");
        expect.soft(types, "a docs page has its breadcrumbs").toContain("BreadcrumbList");
      }
      const written = [
        found.text,
        found.title,
        found.description ?? "",
        ...Object.values(found.share).map((value) => value ?? ""),
        ...found.structured,
      ].join("\n");
      expect.soft(dashesIn(written), "no em dash and no en dash anywhere in the page's words").toEqual([]);
    });
  }

  for (const entry of DOCS) {
    test(`${entry.path} has a Markdown twin`, async ({ request }) => {
      // Act
      const response = await request.get(`${entry.path}index.md`);
      const body = response.ok() ? await response.text() : "";

      // Assert
      expect(response.status(), `${entry.path}index.md answers 200`).toBe(200);
      expect(body.startsWith("# "), `the twin starts with a heading, got "${body.slice(0, 40)}"`).toBe(true);
    });
  }
});

test.describe("the site as a whole", () => {
  test("an address nothing lives at answers 404 and says so", async ({ page }) => {
    // Act
    const response = await page.goto(at("/definitely-not-a-page/"));

    // Assert
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  });

  test("llms.txt lists every docs page", async ({ request }) => {
    // Act
    const response = await request.get(at("/llms.txt"));
    const listed = await response.text();

    // Assert
    expect(response.status()).toBe(200);
    const missing = DOCS.filter((entry) => !listed.includes(entry.url)).map((entry) => entry.url);
    expect(missing, "docs pages llms.txt does not mention").toEqual([]);
  });

  test("the share image of every page is a file on the site", async ({ request }) => {
    // Arrange
    const images = new Map<string, string>();
    for (const entry of PAGES) {
      const html = builtFile(`${entry.path.slice(BASE.length)}index.html`);
      const image = /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/.exec(html)?.[1];
      if (image && !images.has(image)) images.set(image, entry.path);
    }

    // Act
    const missing: string[] = [];
    for (const [image, firstPage] of images) {
      const local = internalPath(image, [publicOrigin()]);
      const response = local ? await request.get(local) : null;
      const type = response?.headers()["content-type"] ?? "";
      if (response?.status() !== 200 || !type.startsWith("image/")) {
        missing.push(`${image} (og:image of ${firstPage}) answered ${response?.status() ?? "nothing"} ${type}`);
      }
    }

    // Assert
    expect(images.size, "pages name a share image").toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });
});

test.describe("with JavaScript off", () => {
  test.use({ javaScriptEnabled: false });

  const readable: SitePage[] = [PAGES[0] ?? oneEffectPage(), oneEffectPage(), oneComponentPage()];
  for (const entry of readable) {
    test(`${entry.path} can be read: the heading and the first paragraph are in the HTML`, async ({ page }) => {
      // Act
      await page.goto(entry.path);

      // Assert
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText(/\S/);
      await expect(page.locator("main p").first()).toHaveText(/\S.{20,}/);
    });
  }

  test("every internal link answers 200", async ({ page, request, baseURL }) => {
    test.slow();
    // Arrange: links to the site's public address count as its own, they are the same pages once it is deployed.
    const origins = [new URL(baseURL ?? "").origin, publicOrigin()];
    const links = new Map<string, string>();

    // Act: the links as the server sends them, before any script has touched the page.
    for (const entry of PAGES) {
      await page.goto(entry.path);
      const hrefs = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLAnchorElement | HTMLLinkElement>("a[href], link[href]")].map(
          (link) => link.href,
        ),
      );
      for (const href of hrefs) {
        const local = internalPath(href, origins);
        if (local && !links.has(local)) links.set(local, entry.path);
      }
    }
    const dead: string[] = [];
    for (const [link, firstPage] of links) {
      // No following of redirects: a link should point at the address the page really lives at.
      const response = await request.get(link, { maxRedirects: 0 });
      if (response.status() !== 200) dead.push(`${link} (linked from ${firstPage}) answered ${response.status()}`);
    }

    // Assert
    expect(links.size, "the pages link to each other").toBeGreaterThan(PAGES.length);
    expect(dead).toEqual([]);
  });
});
