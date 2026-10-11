import { defineConfig } from "vitest/config";

/** The docs' own checks read the page registry; nothing here renders, so no browser and no app plugins. */
export default defineConfig({
  root: __dirname,
  test: { globals: true, environment: "node", include: ["src/**/*.test.ts"] },
});
