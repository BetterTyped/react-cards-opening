import { chromium } from "@playwright/test";
// Draws the pictures the repository shows the world: the README's banner, the social preview, and the share image
// of every section of the docs. Run it by hand after changing .github/assets/src/art.html or the lists below:
//   node .github/scripts/art.mjs
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const source = path.join(root, ".github/assets/src/art.html");
const assets = path.join(root, ".github/assets");
const og = path.join(root, "apps/docs/public/og");

/** The library's glyphs, read from its source so the pictures are drawn with the real ones. */
async function readGlyphs() {
  const text = await readFile(path.join(root, "packages/ui/src/glyphs.ts"), "utf8");
  const glyphs = {};
  for (const [, name, rows] of text.matchAll(/(\w+): \[((?:\s*"[.xo]{9}",?){9})\s*\]/g)) {
    glyphs[name] = [...rows.matchAll(/"([.xo]{9})"/g)].map((match) => match[1]);
  }
  return glyphs;
}

/** One share image per section of the docs. The file name is what `apps/docs/src/seo/head.ts` asks for. */
const SHARE = [
  ["home", "Card *opening* for React", "A card flies out, hums, flips and lands."],
  ["docs", "The *docs*", "Install it, open a first card, make it yours."],
  ["core", "The *rules*", "The queue, the presses, the odds. No look."],
  ["components", "Five *components*", "The reveal, the hunt, the grid, the card."],
  ["effects", "Thirteen *effects*", "From a hop to a legendary foil, one page each."],
  ["guides", "*Guides*", "Your own face, your own tiers, your own UI."],
  ["examples", "*Examples*", "Whole pieces to copy and change."],
];

/** The repository's own pictures: [file, shape, width, height, scale, title, line]. */
const REPO = [
  [
    "banner.png",
    "banner",
    1280,
    400,
    2,
    "Card *opening* for React",
    "A card flies out, hums, flips and lands. The rarer it is, the louder.",
  ],
  ["social-preview.png", "share", 1280, 640, 1, "Card *opening* for React", "A card flies out, hums, flips and lands."],
];

const glyphs = await readGlyphs();
const browser = await chromium.launch();

async function shoot({ file, shape, width, height, scale, title, line }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  const url = pathToFileURL(source);
  url.searchParams.set("shape", shape);
  url.searchParams.set("title", title);
  url.searchParams.set("line", line);
  await page.goto(url.href);
  await page.evaluate((set) => window.drawGlyphs(set), glyphs);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: file });
  await page.close();
  console.log(`art: ${path.relative(root, file)}`);
}

await mkdir(og, { recursive: true });
for (const [name, title, line] of SHARE) {
  await shoot({ file: path.join(og, `${name}.png`), shape: "share", width: 1200, height: 630, scale: 1, title, line });
}
for (const [name, shape, width, height, scale, title, line] of REPO) {
  await shoot({ file: path.join(assets, name), shape, width, height, scale, title, line });
}
await browser.close();
