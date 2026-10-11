import { createFileRoute, notFound } from "@tanstack/react-router";

import { crumbsOf, DocArticle } from "../../components/doc-article";
import { DocsFrame } from "../../components/shell";
import { pageAt } from "../../registry/pages";
import { seoHead } from "../../seo/head";

/** Every docs page but the first: its address is its path in the registry. */
export const Route = createFileRoute("/docs/$")({
  loader: ({ params }) => {
    const path = `/docs/${params._splat?.replace(/\/+$/, "") ?? ""}/`;
    // An address nothing lives at answers "not found", never an empty page with a 200.
    if (!pageAt(path)) throw notFound();
    return { path };
  },
  head: ({ loaderData }) => {
    const page = loaderData ? pageAt(loaderData.path) : undefined;
    if (!page) return {};
    const faq = page.blocks.flatMap((block) => (block.kind === "faq" ? block.items : []));
    return seoHead({
      title: page.tagline ? `${page.title}: ${page.tagline}` : page.title,
      description: page.description,
      path: page.path,
      type: "article",
      crumbs: [{ label: "Home", path: "/" }, ...crumbsOf(page)],
      updated: page.updated,
      faq,
    });
  },
  component: DocsPage,
});

function DocsPage() {
  const { path } = Route.useLoaderData();
  const page = pageAt(path);
  return <DocsFrame>{page ? <DocArticle key={page.path} page={page} /> : null}</DocsFrame>;
}
