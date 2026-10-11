import { absoluteUrl, SITE } from "../site";

/*
 * What every page tells a search engine, built in one place so the tags in the HTML, the sitemap and the checks all
 * read the same values.
 */

export interface Crumb {
  label: string;
  path: string;
}

export interface SeoInput {
  /** The page's own title, the same words as its H1. The site's name is added here. */
  title: string;
  description: string;
  /** Path on the site, with its slashes: "/docs/effects/burst/". */
  path: string;
  type?: "website" | "article";
  /** The trail from the home page down to this page, this page last. */
  crumbs?: readonly Crumb[];
  /** When the page's content last changed, as YYYY-MM-DD. From the content, never from the build. */
  updated?: string;
  /** Questions the page visibly answers. */
  faq?: readonly { question: string; answer: string }[];
  /** Extra JSON-LD nodes. */
  nodes?: readonly object[];
  noindex?: boolean;
}

/** Which drawn image a page shares with: one per section. */
const imageFor = (path: string) => {
  const section = /^\/docs\/([^/]+)\/[^/]+\/$/.exec(path)?.[1] ?? /^\/([^/]+)\//.exec(path)?.[1] ?? "home";
  const known = ["core", "components", "effects", "guides", "examples", "docs"];
  return absoluteUrl(`/og/${known.includes(section) ? section : "home"}.png`);
};

export const fullTitle = (title: string) =>
  title === SITE.title ? `${SITE.title}: ${SITE.tagline}` : `${title} | ${SITE.name}`;

const publisher = { "@type": "Organization", name: SITE.organization.name, url: SITE.organization.url } as const;

export const breadcrumbList = (crumbs: readonly Crumb[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((crumb, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: crumb.label,
    item: absoluteUrl(crumb.path),
  })),
});

export const techArticle = (input: Pick<SeoInput, "title" | "description" | "path" | "updated">) => ({
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: input.title,
  description: input.description,
  url: absoluteUrl(input.path),
  mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(input.path) },
  author: { "@type": "Person", name: SITE.author.name, url: SITE.author.url },
  publisher,
  ...(input.updated ? { datePublished: input.updated, dateModified: input.updated } : {}),
});

export const faqPage = (faq: NonNullable<SeoInput["faq"]>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((entry) => ({
    "@type": "Question",
    name: entry.question,
    acceptedAnswer: { "@type": "Answer", text: entry.answer },
  })),
});

/** The home page's nodes: the site, and the library as source code someone can install. */
export const siteNodes = () => [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.title,
    alternateName: SITE.name,
    url: absoluteUrl("/"),
    description: SITE.description,
    publisher,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: SITE.name,
    description: SITE.description,
    codeRepository: SITE.repo,
    programmingLanguage: "TypeScript",
    runtimePlatform: "React",
    license: "https://opensource.org/licenses/MIT",
    author: { "@type": "Person", name: SITE.author.name, url: SITE.author.url },
    publisher,
  },
];

/** One entry of a route's `meta`: a title, a named or property tag, or a JSON-LD node under "script:ld+json". */
type MetaEntry = Record<string, unknown>;

/** The `head()` of a route: title, description, canonical, share tags and structured data. */
export function seoHead(input: SeoInput): { meta: MetaEntry[]; links: { rel: string; href: string }[] } {
  const title = fullTitle(input.title);
  const url = absoluteUrl(input.path);
  const image = imageFor(input.path);
  const type = input.type ?? "website";
  const nodes: object[] = [
    ...(type === "article" ? [techArticle(input)] : []),
    ...(input.crumbs && input.crumbs.length > 1 ? [breadcrumbList(input.crumbs)] : []),
    ...(input.faq?.length ? [faqPage(input.faq)] : []),
    ...(input.nodes ?? []),
  ];
  return {
    meta: [
      { title },
      { name: "description", content: input.description },
      ...(input.noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
      { property: "og:type", content: type },
      { property: "og:site_name", content: SITE.title },
      { property: "og:title", content: title },
      { property: "og:description", content: input.description },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:alt", content: title },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: input.description },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: title },
      ...nodes.map((node) => ({ "script:ld+json": node })),
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
