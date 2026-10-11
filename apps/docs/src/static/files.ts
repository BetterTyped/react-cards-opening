import { pageToMarkdown } from "../content/markdown";
import { PAGES, SECTIONS, titleOf } from "../registry/pages";
import { absoluteUrl, SITE } from "../site";

/*
 * The files a static site needs beside its pages: the sitemap, llms.txt, a Markdown twin of every docs page. They
 * are written from the same registry the pages are drawn from, after the build (see scripts/emit.mjs).
 */

export interface StaticFile {
  /** Where it goes in the built site, no leading slash. */
  path: string;
  body: string;
}

/** Pages that are not docs pages. Their date is the day their copy last changed. */
const OTHER_PAGES = [{ path: "/", updated: "2026-10-11" }] as const;

const escapeXml = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/** Every address that should be found, and nothing that redirects or answers "not found". */
export function sitemap(): string {
  const entries = [...OTHER_PAGES, ...PAGES].map(
    (page) => `  <url><loc>${escapeXml(absoluteUrl(page.path))}</loc><lastmod>${page.updated}</lastmod></url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

const mirrorOf = (path: string) => `${path}index.md`;

/** The site for a model that reads text: what the library is, and a link to every page as Markdown. */
export function llmsTxt(): string {
  const sections = SECTIONS.map((section) => {
    const links = section.pages.map(
      (page) => `- [${page.title}](${absoluteUrl(mirrorOf(page.path))}): ${page.description}`,
    );
    return `## ${section.title}\n\n${links.join("\n")}`;
  });
  return [
    `# ${SITE.title}`,
    `> ${SITE.description}`,
    `react-cards-opening is two React packages on npm: @react-cards-opening/core holds the rules of a card opening with nothing drawn, and @react-cards-opening/ui draws it on GSAP timelines with one stylesheet and no CSS framework. Source: ${SITE.repo}`,
    ...sections,
    `## Optional\n\n- [Every page in one file](${absoluteUrl("/llms-full.txt")})`,
  ].join("\n\n");
}

export function staticFiles(): StaticFile[] {
  const twins = PAGES.map((page) => ({
    path: mirrorOf(page.path).slice(1),
    body: `${pageToMarkdown(page, titleOf)}\n`,
  }));
  return [
    { path: "sitemap.xml", body: sitemap() },
    { path: "llms.txt", body: `${llmsTxt()}\n` },
    { path: "llms-full.txt", body: `${twins.map((twin) => twin.body).join("\n---\n\n")}` },
    // A project site on GitHub Pages cannot serve the host's robots.txt, so this one only counts once the site has a
    // domain of its own. Until then crawlers are allowed by default and the sitemap is handed in by hand.
    { path: "robots.txt", body: `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl("/sitemap.xml")}\n` },
    // GitHub Pages runs Jekyll unless told not to, and Jekyll drops files it does not like the name of.
    { path: ".nojekyll", body: "" },
    ...twins,
  ];
}
