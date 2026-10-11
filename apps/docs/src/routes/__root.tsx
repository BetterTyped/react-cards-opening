import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { LookProvider } from "../components/look";
import { SiteFrame, THEME_SCRIPT } from "../components/shell";
import { SiteLink } from "../components/site-link";
import { seoHead } from "../seo/head";
import { SITE } from "../site";
import docsCss from "../styles/docs.css?url";
import libraryCss from "@react-cards-opening/ui/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#f1ebe2" },
      { name: "author", content: SITE.author.name },
    ],
    links: [
      { rel: "icon", href: `${SITE.base}favicon.svg`, type: "image/svg+xml" },
      { rel: "stylesheet", href: libraryCss },
      { rel: "stylesheet", href: docsCss },
      { rel: "alternate", type: "text/plain", href: `${SITE.base}llms.txt`, title: "llms.txt" },
    ],
  }),
  shellComponent: RootDocument,
  component: Root,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Before anything paints: dark or light, the way the reader left it. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Root() {
  return (
    <LookProvider>
      <Outlet />
    </LookProvider>
  );
}

export const notFoundHead = () =>
  seoHead({
    title: "Page not found",
    description: "This page does not exist. The docs, the components and the examples are one click away.",
    path: "/404/",
    noindex: true,
  });

export function NotFound() {
  return (
    <SiteFrame>
      <section className="d-plain">
        <h1>Page not found</h1>
        <p>Nothing lives at this address. It may have moved when a page was renamed.</p>
        <p>
          <SiteLink path="/docs/" className="d-pill d-pill-solid">
            Open the docs
          </SiteLink>
        </p>
      </section>
    </SiteFrame>
  );
}
