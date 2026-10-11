import { createFileRoute } from "@tanstack/react-router";

import { crumbsOf, DocArticle } from "../../components/doc-article";
import { DocsFrame } from "../../components/shell";
import { pageAt } from "../../registry/pages";
import { seoHead } from "../../seo/head";

const page = pageAt("/docs/");

export const Route = createFileRoute("/docs/")({
  head: () =>
    page
      ? seoHead({
          title: `${page.title}: ${page.tagline}`,
          description: page.description,
          path: page.path,
          type: "article",
          crumbs: [{ label: "Home", path: "/" }, ...crumbsOf(page)],
          updated: page.updated,
        })
      : {},
  component: () => <DocsFrame>{page ? <DocArticle page={page} /> : null}</DocsFrame>,
});
