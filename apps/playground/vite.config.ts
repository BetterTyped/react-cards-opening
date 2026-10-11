import react from "@vitejs/plugin-react";
import * as path from "path";
import { defineConfig } from "vite";

const packages = path.join(__dirname, "../../packages");

// The playground runs both packages from source, so a change shows without a build in between.
export default defineConfig({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/apps/playground",
  plugins: [react()],
  resolve: {
    alias: {
      "@react-cards-opening/core": path.join(packages, "core/src/index.ts"),
      "@react-cards-opening/ui": path.join(packages, "ui/src/index.ts"),
    },
  },
  // Known up front. Left to find the page's imports on its first visit, Vite reloads the page a moment after it
  // opened, which a test that froze its clock on load cannot survive.
  optimizeDeps: { entries: ["index.html"] },
  server: { port: 4391, strictPort: true },
});
