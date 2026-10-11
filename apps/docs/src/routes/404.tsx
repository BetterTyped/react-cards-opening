import { createFileRoute } from "@tanstack/react-router";

import { NotFound, notFoundHead } from "./__root";

/** Rendered once at build time and saved as 404.html: what GitHub Pages serves for an address nothing lives at. */
export const Route = createFileRoute("/404")({
  head: notFoundHead,
  component: NotFound,
});
