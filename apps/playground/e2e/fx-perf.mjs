// Not a test: plays every effect on a full-window stage and measures what each frame of it costs.
//
//   node apps/playground/e2e/fx-perf.mjs [out.json] [names,comma,separated]
//
// It builds the playground's page for production and serves it itself, on a port of its own. Every cost is in
// milliseconds per frame of a 60 Hz screen, so 16.7 is the whole budget:
//
//   main    what the page's own thread spends: script, style, layout, paint (CPU slowed four times)
//   raster  what the raster threads spend turning paint into pixels
//   gpu     what the GPU process spends: where blurs, masks, blend modes and backdrop filters are paid for
//
// The screen is a retina one and the stage fills the window, which is how a reveal over a page runs.
//
// Headless Chromium has no GPU: it composites in software, so `gpu` there is CPU time. It ranks effects the right
// way round and runs anywhere. For what a real screen does, run it in a window:
//
//   FX_PERF_HEADED=1 node apps/playground/e2e/fx-perf.mjs
//
// That opens Chromium on this machine's GPU, leaves the CPU at full speed, and counts the frames that came late
// against the screen's own refresh rate.
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

import { servePlayground } from "./serve.mjs";

const out = process.argv[2];
const only = process.argv[3]?.split(",").filter(Boolean);
const HEADED = Boolean(process.env.FX_PERF_HEADED);
const RUNS = Number(process.env.FX_PERF_RUNS ?? 2);
const THROTTLE = Number(process.env.FX_PERF_THROTTLE ?? (HEADED ? 1 : 4));
/** `?fx=` takes several names: `FX_PERF_STACKS="flash,nova,coins;frost,hex"` measures stacks instead of singles. */
const stacks = process.env.FX_PERF_STACKS?.split(";").filter(Boolean);

const served = await servePlayground();
const { origin } = served;
const EFFECT_LIST = served.effects;
const seconds = Object.fromEntries(EFFECT_LIST.map((effect) => [effect.name, effect.seconds]));
const jobs = stacks
  ? stacks.map((stack) => ({
      name: stack,
      kind: "stack",
      seconds: Math.max(...stack.split(",").map((one) => seconds[one] ?? 2)),
    }))
  : EFFECT_LIST.filter((effect) => !only || only.includes(effect.name)).map((effect) => ({
      name: effect.name,
      kind: effect.kind,
      seconds: effect.seconds,
    }));

const browser = await chromium.launch({ headless: !HEADED, args: process.env.FX_PERF_ARGS?.split(" ") ?? [] });
// One page for the whole run: it is loaded afresh for every play, so each effect starts from a cold stage, the way
// the first reveal on a page does.
// `FX_PERF_SIZE=1728x1000` for a bigger window: what an effect costs grows with the pixels it covers.
const [WIDTH, HEIGHT] = (process.env.FX_PERF_SIZE ?? "1280x800").split("x").map(Number);
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 2 });
const session = await page.context().newCDPSession(page);
await session.send("Performance.enable");
await session.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });

const percentile = (sorted, share) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * share))] ?? 0;

const TRACED = "devtools.timeline,disabled-by-default-devtools.timeline,gpu,cc,viz,toplevel";

async function open(job) {
  await page.goto(`${origin}/?view=fx&fx=${job.name}&width=300&tier=${process.env.FX_PERF_TIER ?? "legendary"}`, {
    waitUntil: "networkidle",
  });
  await page.evaluate(() => document.fonts.ready);
  // `FX_PERF_CSS` is a rule to try before writing it into the stylesheet: what would this cost without its blur?
  if (process.env.FX_PERF_CSS) await page.addStyleTag({ content: process.env.FX_PERF_CSS });
  await page.waitForTimeout(300);
}

/** Plays the effect once more with tracing on, and adds up what the raster threads and the GPU process spent. */
async function trace(job) {
  await open(job);
  await browser.startTracing(page, { categories: TRACED.split(",") });
  await page.evaluate(() => document.querySelector(".fx-play").click());
  await page.waitForTimeout(job.seconds * 1000 + 150);
  const events = JSON.parse((await browser.stopTracing()).toString()).traceEvents ?? [];
  const sums = { raster: 0, gpu: 0, paint: 0 };
  // The GPU's work, in slices of a twentieth of a second: the busiest slice is where frames get dropped.
  const slices = new Map();
  for (const event of events) {
    if (event.ph !== "X" || !event.dur) continue;
    if (event.name === (HEADED ? "GPUTask" : "Display::DrawAndSwap")) {
      const slice = Math.floor(event.ts / 50_000);
      slices.set(slice, (slices.get(slice) ?? 0) + event.dur);
    }
    // In a window the GPU process does real GPU work, and says so as GPU tasks. Headless, it draws in software.
    if (event.name === "TaskGraphRunner::RunTask") sums.raster += event.dur;
    else if (event.name === (HEADED ? "GPUTask" : "Display::DrawAndSwap")) sums.gpu += event.dur;
    else if (event.name === "Paint" || event.name === "PrePaint" || event.name === "Layerize") sums.paint += event.dur;
  }
  const budget = Math.max(1, job.seconds * 60);
  return {
    ...Object.fromEntries(
      Object.entries(sums).map(([name, micros]) => [name, Number((micros / 1000 / budget).toFixed(2))]),
    ),
    // How much of its busiest twentieth of a second the GPU process spent working: near 100 it is falling behind.
    peak: Math.round(Math.max(0, ...slices.values()) / 500),
  };
}

async function measure(job) {
  await open(job);
  // What a frame takes on this screen when nothing is happening: the measure every frame of the effect is held to.
  const still = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const gaps = [];
        let last = performance.now();
        const tick = (now) => {
          gaps.push(now - last);
          last = now;
          if (gaps.length < 40) requestAnimationFrame(tick);
          else resolve(gaps.slice(5).toSorted((a, b) => a - b)[17]);
        };
        requestAnimationFrame(tick);
      }),
  );
  await page.evaluate(() => {
    window.__frames = [];
    window.__nodes = 0;
    let last = performance.now();
    const tick = (now) => {
      window.__frames.push(now - last);
      last = now;
      window.__nodes = Math.max(window.__nodes, document.querySelectorAll(".rco-fx-play *").length);
      window.__raf = requestAnimationFrame(tick);
    };
    window.__raf = requestAnimationFrame(tick);
  });
  const read = async () =>
    Object.fromEntries(
      (await session.send("Performance.getMetrics")).metrics.map((metric) => [metric.name, metric.value]),
    );
  const before = await read();
  await page.evaluate(() => document.querySelector(".fx-play").click());
  await page.waitForTimeout(job.seconds * 1000 + 150);
  const after = await read();
  const { frames, nodes } = await page.evaluate(() => {
    cancelAnimationFrame(window.__raf);
    return { frames: window.__frames.slice(1), nodes: window.__nodes };
  });
  const sorted = frames.toSorted((a, b) => a - b);
  // Per frame of a 60 Hz screen, whatever rate this one refreshed at.
  const cost = (name) => ((after[name] - before[name]) * 1000) / Math.max(1, job.seconds * 60);
  const late = frames.filter((frame) => frame > still * 1.5);
  return {
    name: job.name,
    kind: job.kind,
    seconds: job.seconds,
    frames: frames.length,
    hz: Math.round(1000 / still),
    p95: Number(percentile(sorted, 0.95).toFixed(1)),
    worst: Number((sorted.at(-1) ?? 0).toFixed(1)),
    // Frames that took more than one and a half of this screen's frames to arrive, and the time lost to them.
    slow: late.length,
    lost: Math.round(late.reduce((sum, frame) => sum + frame - still, 0)),
    main: Number(cost("TaskDuration").toFixed(2)),
    script: Number(cost("ScriptDuration").toFixed(2)),
    style: Number(cost("RecalcStyleDuration").toFixed(2)),
    layout: Number(cost("LayoutDuration").toFixed(2)),
    nodes,
  };
}

// The first canvas a browser draws compiles its shaders, once, and can stall for half a second doing it. That is
// the browser's to pay and not any one effect's, so it is paid here, before anything is measured.
page.setDefaultTimeout(90_000);
await open({ name: "sparks,coins,flames" });
const laid = await page.evaluate(() => {
  const layer = document.querySelector(".rco-fx-layer");
  return layer ? `${getComputedStyle(layer).position} ${layer.clientWidth}x${layer.clientHeight}` : "no layer";
});
if (laid !== `absolute ${WIDTH}x${HEIGHT}`) {
  console.error(`The stage is not laid out the way it should be (${laid}): the library's stylesheet did not load.`);
  process.exit(1);
}
await page.evaluate(() => document.querySelector(".fx-play").click());
await page.waitForTimeout(3500);

const cell = (value, width) => String(value).padStart(width);

const results = [];
for (const job of jobs) {
  // Once unmeasured: the first time a browser meets a blend mode or a filter it compiles a shader for it, and that
  // one stall is the browser's to pay, once, not something every play costs.
  await open(job);
  await page.evaluate(() => document.querySelector(".fx-play").click());
  await page.waitForTimeout(job.seconds * 1000 + 150);
  const runs = [];
  for (let run = 0; run < RUNS; run += 1) runs.push(await measure(job));
  // The machine is never quiet: the better of the runs is the nearer to what the effect itself costs.
  const best = { ...runs.reduce((a, b) => (b.main + b.lost < a.main + a.lost ? b : a)), ...(await trace(job)) };
  results.push(best);
  console.log(
    `${best.name.padEnd(16)} ${best.kind.padEnd(9)} main ${cell(best.main, 6)}  (script ${cell(best.script, 5)} style ${cell(best.style, 4)} paint ${cell(best.paint, 5)})  raster ${cell(best.raster, 6)}  gpu ${cell(best.gpu, 6)} (peak ${cell(best.peak, 3)}%)  worst frame ${cell(best.worst, 6)}  late ${cell(best.slow, 3)}/${String(best.frames).padEnd(3)} (${cell(best.lost, 4)}ms lost)  nodes ${best.nodes}`,
  );
}

if (out) writeFileSync(out, JSON.stringify(results, null, 2));
await browser.close();
served.close();
// The build leaves helpers running that would keep this script from ending on its own.
process.exit(0);
