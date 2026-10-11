import { chromium } from "@playwright/test";
// Takes the README's picture of a legendary card face up: the docs' own hero, played for real and caught at the
// moment everything is on screen. The docs server must be running (node apps/docs-e2e/server.mjs).
//   node .github/scripts/preview.mjs [out.png]
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = process.argv[2] ?? path.join(root, ".github/assets/preview.png");
const ORIGIN = `http://127.0.0.1:${process.env.DOCS_E2E_PORT ?? 4633}/react-cards-opening`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 810 },
  deviceScaleFactor: 1,
  colorScheme: "dark",
});
await page.goto(`${ORIGIN}/`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.locator(".d-deal .d-place").click();
// The flight, the hum and the turn, then long enough for the rays to be open and the shine mid-sweep.
await page.waitForTimeout(Number(process.env.PREVIEW_WAIT ?? 3300));
await page.screenshot({ path: out });
await browser.close();
console.log(`preview: ${path.relative(root, out)}`);
