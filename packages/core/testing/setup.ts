// oxlint-disable-next-line import/no-unassigned-import -- registers the DOM matchers on expect
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
