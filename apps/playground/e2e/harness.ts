import type { Page } from "@playwright/test";

const START = new Date("2026-03-14T10:00:00Z");

/**
 * Makes a page repeatable: `Math.random` comes from a seed, and time only moves when a test moves it. Two pages
 * set up this way and driven by the same calls do the same thing on the same frame.
 */
export async function freeze(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let state = 1;
    const next = () => {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    Math.random = next;
    (window as unknown as { reseed: (seed: number) => void }).reseed = (seed) => {
      state = seed;
    };
  });
  await page.clock.install({ time: START });
}

/** Opens a page, waits for its font, and stops the clock with the random source at a known place. */
export async function open(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.clock.pauseAt(new Date(START.getTime() + 60_000));
  await settle(page);
  // A few frames at rest: whatever the jump to the pause did to an animation clock is behind both pages now.
  await advance(page, 96);
  // Frames come on a 16ms grid of the page's own performance clock, which starts at a different moment on every
  // page. Step onto the grid, so the first frame after a press is a whole frame away on both.
  const off = await page.evaluate(() => performance.now() % 16);
  if (off > 0) {
    await page.clock.runFor(16 - off);
    await settle(page);
  }
  await page.evaluate(() => (window as unknown as { reseed: (seed: number) => void }).reseed(20261011));
}

/** Lets the page finish what it has queued (a React render, a resolved promise) without moving its clock. */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const channel = new MessageChannel();
        channel.port1.addEventListener("message", () => resolve(), { once: true });
        channel.port1.start();
        channel.port2.postMessage(null);
      }),
  );
}

/** One frame. A page that sets state from an animation callback renders before the next one, as it does live. */
const FRAME = 16;

/**
 * Moves the clock a frame at a time, with room after each for what the page queued. Give it a multiple of 16.
 *
 * The whole walk runs inside the page, in one call: asking the browser for each frame from here costs a round trip
 * a frame, and a five-card deal is thousands of frames. It drives the same clock `page.clock` does.
 */
export async function advance(page: Page, ms: number): Promise<void> {
  await page.evaluate(
    async ({ total, frame }) => {
      const { controller } = (
        globalThis as unknown as { __pwClock: { controller: { runFor(ms: number): Promise<void> } } }
      ).__pwClock;
      // oxlint-disable-next-line unicorn/consistent-function-scoping -- runs in the page, so it carries its helper
      const breathe = () =>
        new Promise<void>((resolve) => {
          const channel = new MessageChannel();
          channel.port1.addEventListener("message", () => resolve(), { once: true });
          channel.port1.start();
          channel.port2.postMessage(null);
        });
      for (let elapsed = 0; elapsed < total; elapsed += frame) {
        await controller.runFor(Math.min(frame, total - elapsed));
        await breathe();
      }
    },
    { total: ms, frame: FRAME },
  );
}
