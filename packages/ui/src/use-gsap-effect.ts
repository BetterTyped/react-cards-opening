import { gsap } from "gsap";
import { useEffect, useLayoutEffect, useState } from "react";

/** A layout effect in the browser, a plain one on a server, where a layout effect only earns a warning. */
export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Wraps a function so that whatever it animates later (from a click, a timeline callback) still belongs to the
 * component, and is taken down with it.
 */
export type ContextSafe = <F extends (...args: never[]) => unknown>(fn: F) => F;

/**
 * Runs GSAP code when `deps` change and takes down everything it made when the component goes away. Nothing is
 * reverted between runs: a card that is mid-flight when the next effect runs keeps the styles it has.
 */
export function useGsapEffect(build: (safe: ContextSafe) => void | (() => void), deps: readonly unknown[]): void {
  const [context] = useState(() => gsap.context(() => {}));

  useIsomorphicLayoutEffect(() => {
    const safe: ContextSafe = (fn) => context.add(null as unknown as string, fn) as typeof fn;
    context.add(() => build(safe));
    // oxlint-disable-next-line react/exhaustive-deps -- the caller names what the animation depends on
  }, deps);

  useIsomorphicLayoutEffect(() => () => context.revert(), [context]);
}
