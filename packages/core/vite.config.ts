import react from "@vitejs/plugin-react";
import * as path from "path";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/packages/core",
  plugins: [react(), dts({ entryRoot: "src", tsconfigPath: path.join(__dirname, "tsconfig.lib.json") })],
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    lib: {
      entry: "src/index.ts",
      fileName: "index",
      formats: ["es" as const],
    },
    rolldownOptions: {
      // A library bundles nothing it did not write: every package it imports stays an import, so there is one
      // React and one GSAP on the page and the consumer's bundler decides what ships.
      external: (id) => !id.startsWith(".") && !path.isAbsolute(id),
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["./testing/setup.ts"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "./test-output/vitest/coverage",
      provider: "v8" as const,
    },
  },
});
