import { defineConfig } from "@playwright/test";

const PORT = 4391;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  // The stored pictures, one folder, named for what they show and the system that drew them: type is drawn a
  // little differently on every system, so a picture only answers for its own.
  snapshotPathTemplate: "{testDir}/pictures/{arg}-{platform}{ext}",
  expect: { toHaveScreenshot: { animations: "disabled", caret: "hide", scale: "css", maxDiffPixelRatio: 0.0002 } },
  fullyParallel: true,
  reporter: [["list"]],
  timeout: 600_000,
  workers: 4,
  use: {
    baseURL: `http://localhost:${PORT}`,
    browserName: "chromium",
    deviceScaleFactor: 1,
  },
  webServer: {
    command: "pnpm exec vite",
    port: PORT,
    reuseExistingServer: true,
  },
});
