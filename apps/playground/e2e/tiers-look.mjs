// Not a test: opens one card of every tier through the hunt and lays what each reveal looks like on one sheet.
// node apps/playground/e2e/tiers-look.mjs <out dir> [tier,tier]  (the playground must be serving on 4391)
import { chromium } from "@playwright/test";
import * as path from "path";

const out = process.argv[2];
const only = process.argv[3]?.split(",");
const TIERS = [
  ["common", "night-owl"],
  ["uncommon", "window-plant"],
  ["rare", "trailblazer"],
  ["epic", "firestarter"],
  ["legendary", "dragon-hoard"],
  ["mythic", "ash-phoenix"],
].filter(([tier]) => !only || only.includes(tier));
/** Milliseconds after the card starts to turn. Negative ones are the hum before it. */
const MOMENTS = [-350, 120, 380, 800, 1500];
const SIZE = { width: 900, height: 700 };
const browser = await chromium.launch();
const rows = [];
const errors = [];
for (const [tier, card] of TIERS) {
  const page = await browser.newPage({ viewport: SIZE, deviceScaleFactor: 1 });
  page.on("pageerror", (error) => errors.push(`${tier}: ${error.message}`));
  await page.clock.install({ time: new Date("2026-03-14T10:00:00Z") });
  await page.goto(`http://localhost:4391/?only=${card}${process.env.FX_QUERY ?? ""}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.clock.runFor(500);
  await page.getByRole("button", { name: "Scan" }).click();
  // Walk the clock a frame at a time until the card starts to turn, keeping the last frames of the hum.
  const turned = () =>
    page.evaluate(
      () =>
        window.gsap.getProperty(".rco-flyer-inner", "rotationY") < 179.5 &&
        document.querySelector(".rco-flyer")?.style.visibility !== "hidden" &&
        Number(getComputedStyle(document.querySelector(".rco-flyer")).opacity) > 0.5,
    );
  const hum = [];
  let guard = 0;
  while (!(await turned()) && guard < 900) {
    await page.clock.runFor(16);
    guard += 1;
    hum.push(null);
  }
  const frames = [];
  // The hum frame is taken on a second pass: the same clock, stopped a little earlier.
  let at = 0;
  for (const moment of MOMENTS.filter((time) => time > 0)) {
    for (; at < moment; at += 16) await page.clock.runFor(16);
    frames.push((await page.screenshot()).toString("base64"));
  }
  await page.close();
  const early = await browser.newPage({ viewport: SIZE, deviceScaleFactor: 1 });
  await early.clock.install({ time: new Date("2026-03-14T10:00:00Z") });
  await early.goto(`http://localhost:4391/?only=${card}${process.env.FX_QUERY ?? ""}`, { waitUntil: "networkidle" });
  await early.evaluate(() => document.fonts.ready);
  await early.clock.runFor(500);
  await early.getByRole("button", { name: "Scan" }).click();
  for (let frame = 0; frame < hum.length - Math.round(120 / 16); frame += 1) await early.clock.runFor(16);
  frames.unshift((await early.screenshot()).toString("base64"));
  await early.close();
  rows.push({ tier, frames });
}
const sheet = await browser.newPage({ viewport: { width: 5 * 364 + 4, height: 100 }, deviceScaleFactor: 1 });
await sheet.setContent(
  `<body style="margin:0;background:#111;color:#fff;font:15px system-ui">${rows
    .map(
      (row) =>
        `<div style="position:relative;display:flex;gap:4px;margin-bottom:4px"><b style="position:absolute;left:6px;top:4px">${row.tier}</b>${row.frames
          .map((data) => `<img width="360" height="280" src="data:image/png;base64,${data}">`)
          .join("")}</div>`,
    )
    .join("")}</body>`,
);
await sheet.screenshot({ path: path.join(out, `tiers${only ? "-" + only.join("-") : ""}.png`), fullPage: true });
console.log(errors.length ? errors.join("\n") : "no page errors");
await browser.close();
