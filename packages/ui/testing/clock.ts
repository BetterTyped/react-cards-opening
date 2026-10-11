import { act } from "@testing-library/react";
import { gsap } from "gsap";

/**
 * Plays GSAP forward by hand. jsdom has no frames worth the name, so the tests take the ticker's place: time moves
 * a frame at a time, and after each one React and any promise the reveal is waiting on get their turn.
 */
export async function play(seconds: number): Promise<void> {
  const FRAME = 1 / 60;
  for (let elapsed = 0; elapsed < seconds; elapsed += FRAME) {
    // oxlint-disable-next-line no-await-in-loop -- one frame after another, as a browser would
    await act(async () => {
      gsap.updateRoot(gsap.globalTimeline.time() + FRAME);
      await Promise.resolve();
    });
  }
}

/** Takes the ticker away from GSAP for a test and gives it back after. */
export function ownTheClock(): () => void {
  gsap.ticker.remove(gsap.updateRoot);
  const frames = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    // Whoever waits for "the next frame" gets it on the next turn of the event loop.
    queueMicrotask(() => callback(performance.now()));
    return 0;
  });
  return () => {
    frames.mockRestore();
    gsap.ticker.add(gsap.updateRoot);
  };
}

/** Answers `prefers-reduced-motion` for a test. */
export function reduceMotion(reduced: boolean): () => void {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}
