import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** The docs are a GitHub Pages project site, so every address starts with the repository's name. */
export const BASE = "/react-cards-opening/";

export default defineConfig({
  root: __dirname,
  base: BASE,
  cacheDir: "../../node_modules/.vite/apps/docs",
  plugins: [
    // Pages has no server: every route is rendered to an HTML file at build time, found by following links
    // from the home page, each in its own folder so addresses end in a slash.
    tanstackStart({
      router: { quoteStyle: "double" },
      // Nothing links to the "not found" page, so the crawl is told about it.
      pages: [{ path: "/404/" }],
      prerender: { enabled: true, crawlLinks: true, autoSubfolderIndex: true, failOnError: true },
    }),
    react(),
  ],
});
