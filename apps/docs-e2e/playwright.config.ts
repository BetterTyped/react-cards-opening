import { defineConfig, devices } from "@playwright/test";

/*
 * The browser tests of the docs site. They run against the built site (apps/docs/dist/client), served by
 * server.mjs under the same base path GitHub Pages gives it. Build the docs first:
 *
 *   pnpm --filter "./packages/*" build && pnpm --filter @react-cards-opening/docs build
 */

const PORT = Number(process.env.DOCS_E2E_PORT ?? 4633);
const ORIGIN = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  timeout: 60_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: `${ORIGIN}/react-cards-opening/`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: "node server.mjs",
    url: `${ORIGIN}/react-cards-opening/`,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
    timeout: 20_000,
  },
});
