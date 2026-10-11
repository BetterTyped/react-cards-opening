// Not a test: draws every effect at three moments and lays them out on one sheet per kind, to be looked at.
// node apps/playground/e2e/fx-sheet.mjs <out dir> [kind] (the playground must be serving on 4391)
import { chromium } from "@playwright/test";
import * as path from "path";

const out = process.argv[2];
const onlyKind = process.argv[3];
const only = process.argv[4]?.split(",");
const SIZE = 640;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
await page.goto("http://localhost:4391/?view=fx", { waitUntil: "networkidle" });
const list = await page
  .evaluate(async () => {
    const ui =
      await import("/@fs/Users/maciejpyrc/Praca/better-typed/open-source/react-cards-opening/packages/ui/src/effects.ts");
    return ui.EFFECT_LIST.map((effect) => ({ name: effect.name, kind: effect.kind, seconds: effect.seconds }));
  })
  .catch(() => null);
await page.close();
const effects = list ?? [];
const kinds = [...new Set(effects.map((effect) => effect.kind))].filter(
  (kind) => !onlyKind || onlyKind === "all" || kind === onlyKind,
);
const SHARES = [0.08, 0.25, 0.5, 0.78];
for (const kind of kinds) {
  const mine = effects.filter((one) => one.kind === kind && (!only || only.includes(one.name)));
  for (let chunk = 0; chunk * 5 < mine.length; chunk += 1) {
    const rows = [];
    for (const effect of mine.slice(chunk * 5, chunk * 5 + 5)) {
      const shot = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
      await shot.clock.install({ time: new Date("2026-03-14T10:00:00Z") });
      await shot.goto(`http://localhost:4391/?view=fx&fx=${effect.name}&width=190${process.env.FX_QUERY ?? ""}`, {
        waitUntil: "networkidle",
      });
      await shot.evaluate(() => document.fonts.ready);
      await shot.clock.runFor(500);
      await shot.click(".fx-play");
      const frames = [];
      let at = 0;
      for (const share of SHARES) {
        const until = Math.round(effect.seconds * share * 1000);
        for (; at < until; at += 16) await shot.clock.runFor(16);
        frames.push((await shot.screenshot()).toString("base64"));
      }
      rows.push({ name: effect.name, frames });
      await shot.close();
    }
    const sheet = await browser.newPage({ viewport: { width: 4 * 324 + 4, height: 100 }, deviceScaleFactor: 1 });
    const html = `<body style="margin:0;background:#111;color:#fff;font:15px system-ui">${rows
      .map(
        (row) =>
          `<div style="position:relative;display:flex;gap:4px;margin-bottom:4px"><b style="position:absolute;left:6px;top:4px">${row.name}</b>${row.frames
            .map((data) => `<img width="320" height="320" src="data:image/png;base64,${data}">`)
            .join("")}</div>`,
      )
      .join("")}</body>`;
    await sheet.setContent(html);
    await sheet.screenshot({ path: path.join(out, `sheet-${kind}-${chunk}.png`), fullPage: true });
    await sheet.close();
  }
}
await browser.close();
