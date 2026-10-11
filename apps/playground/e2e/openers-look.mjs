// Not a test: plays the pack, the reel and the case in a real browser and saves what they look like.
// node apps/playground/e2e/openers-look.mjs <out dir> [query]  (the playground must be serving on 4391)
import { chromium } from "@playwright/test";
import * as path from "path";

const out = process.argv[2];
const query = process.argv[3] ?? "";
const browser = await chromium.launch();
const shoot = async (page, name) => page.screenshot({ path: path.join(out, `${name}.png`) });
const wait = (page, ms) => page.waitForTimeout(ms);
const errors = [];

async function open(view, width = 1180, height = 760) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.on("pageerror", (error) => errors.push(`${view}: ${error.message}`));
  page.on("console", (message) => message.type() === "error" && errors.push(`${view}: ${message.text()}`));
  await page.goto(`http://localhost:4391/?view=${view}${query}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

{
  const page = await open("pack");
  await shoot(page, "pack-1-sealed");
  await page.click(".rco-pack-sealed", { force: true });
  await wait(page, 450);
  await shoot(page, "pack-2-burst");
  await wait(page, 1300);
  await page.hover(".rco-pack-seat:nth-of-type(4) .rco-pack-press");
  await wait(page, 300);
  await shoot(page, "pack-3-dealt-hover");
  const seats = await page.locator(".rco-pack-press").count();
  for (let index = 0; index < seats; index += 1) {
    await page.locator(".rco-pack-press").nth(index).click({ force: true });
    await wait(page, index === 3 ? 450 : 250);
    if (index === 3) await shoot(page, "pack-4-legendary-flip");
  }
  await wait(page, 1200);
  await shoot(page, "pack-5-all-up");
  await page.getByRole("button", { name: /done/i }).click();
  await wait(page, 900);
  await shoot(page, "pack-6-done");
  await page.close();
  const narrow = await open("pack", 390, 800);
  await narrow.click(".rco-pack-sealed", { force: true });
  await wait(narrow, 1700);
  await narrow.locator(".rco-pack-press").nth(2).click({ force: true });
  await wait(narrow, 900);
  await shoot(narrow, "pack-7-narrow");
  await narrow.close();
}
{
  const page = await open("spin");
  await shoot(page, "spin-1-rest");
  await page.locator(".rco-button-main").click();
  await wait(page, 1600);
  await shoot(page, "spin-2-spinning");
  await wait(page, 4300);
  await shoot(page, "spin-3-locked");
  await wait(page, 1900);
  await shoot(page, "spin-4-reveal");
  await page.close();
}
{
  const page = await open("case");
  await shoot(page, "case-1-closed");
  await page.locator(".rco-button-main").click();
  await wait(page, 1100);
  await shoot(page, "case-2-open");
  await wait(page, 2200);
  await shoot(page, "case-3-reveal");
  await wait(page, 9000);
  await shoot(page, "case-4-later");
  await page.close();
}
console.log(errors.length ? errors.join("\n") : "no page errors");
await browser.close();
