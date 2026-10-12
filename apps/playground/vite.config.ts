import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import * as path from "path";
import { defineConfig } from "vite";

const packages = path.join(__dirname, "../../packages");

// The playground runs both packages from source, so a change shows without a build in between.
export default defineConfig({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/apps/playground",
  // Tailwind is here for one page only, tailwind.html: the check that a page's utilities beat the library's styles.
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@react-cards-opening/core": path.join(packages, "core/src/index.ts"),
      // The stylesheets first: an alias matches by prefix, and a package's name is a prefix of its stylesheet's.
      "@react-cards-opening/ui/styles.css": path.join(packages, "ui/src/styles.css"),
      "@react-cards-opening/effects/styles.css": path.join(packages, "effects/src/styles.css"),
      "@react-cards-opening/effects": path.join(packages, "effects/src/index.ts"),
      "@react-cards-opening/ui": path.join(packages, "ui/src/index.ts"),
    },
  },
  // Known up front. Left to find the page's imports on its first visit, Vite reloads the page a moment after it
  // opened, which a test that froze its clock on load cannot survive.
  optimizeDeps: { entries: ["index.html", "tailwind.html"] },
  server: { port: 4391, strictPort: true },
  build: {
    rollupOptions: {
      input: { index: path.join(__dirname, "index.html"), tailwind: path.join(__dirname, "tailwind.html") },
    },
  },
});
