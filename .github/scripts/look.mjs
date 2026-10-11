import { chromium } from "@playwright/test";
// Takes pictures of pages of the built docs, for looking at a change before it ships.
//   node .github/scripts/look.mjs <out dir> <width> <path> [<path> ...]      (the docs server must be running)
// A path may end in "#dark" or "#full" (or both, "#dark#full") for dark mode and the whole page.
import path from "node:path";

const [out, width, ...paths] = process.argv.slice(2);
const ORIGIN = `http://127.0.0.1:${process.env.DOCS_E2E_PORT ?? 4633}/react-cards-opening`;
const browser = await chromium.launch();
for (const entry of paths) {
  const [pathname, ...flags] = entry.split("#");
  const dark = flags.includes("dark");
  const page = await browser.newPage({
    viewport: { width: Number(width), height: 900 },
    deviceScaleFactor: 1,
    colorScheme: dark ? "dark" : "light",
  });
  await page.goto(`${ORIGIN}${pathname}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const name = `${pathname.replaceAll("/", "_").replace(/^_|_$/g, "") || "home"}-${width}${dark ? "-dark" : ""}.png`;
  await page.screenshot({ path: path.join(out, name), fullPage: flags.includes("full") });
  console.log(name);
  await page.close();
}
await browser.close();
