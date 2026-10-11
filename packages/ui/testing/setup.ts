// oxlint-disable-next-line import/no-unassigned-import -- registers the DOM matchers on expect
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { gsap } from "gsap";
import { afterEach } from "vitest";

// A test that ends mid-reveal leaves targets GSAP can no longer find; that is the test's business, not a warning.
gsap.config({ nullTargetWarn: false });

afterEach(() => {
  cleanup();
  gsap.globalTimeline.clear();
});
