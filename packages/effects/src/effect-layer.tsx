import { type CSSProperties, type Ref, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react";

import { clearEffects, type EffectInput, playEffects, type PlayOptions } from "./effects";

/** A layout effect in the browser, a plain one on a server, where a layout effect only earns a warning. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface EffectLayerHandle {
  /** Plays one effect, or several at once. Answers the timeline, or nothing when the layer is not on the page. */
  play: (effects: EffectInput | readonly EffectInput[], options?: PlayOptions) => gsap.core.Timeline | null;
  /** Takes everything off the layer, mid-play or not. */
  clear: () => void;
  /** The layer's own element, for `playEffects`. */
  element: () => HTMLElement | null;
}

export interface EffectLayerProps {
  handle?: Ref<EffectLayerHandle>;
  /**
   * The ground the layer is on, when you know it: a theme from the ui package, or just `{ bg }` as a plain hex. On
   * a light ground the lights are painted, not added up.
   */
  theme?: { bg: string };
  /** The colour effects wear when a play does not name one. */
  tone?: string;
  className?: string;
  style?: CSSProperties;
}

/** How bright a hex colour is, from 0 to 1, near enough to tell a light ground from a dark one. */
function brightness(hex: string): number {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((char) => char + char).join("") : value;
  const [r, g, b] = [0, 2, 4].map((at) => Number.parseInt(full.slice(at, at + 2), 16) || 0);
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
}

/**
 * A place for effects: a sheet laid over its nearest positioned parent that lets every press through. Take its
 * handle and call `play("shockwave")`, or `play(["flash", "confetti"], { at: someElement })`. The effects the
 * openers play are played on one of these; this is the same thing for a show of your own.
 */
export function EffectLayer({ handle, theme, tone, className, style }: EffectLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const blend = theme && brightness(theme.bg) > 0.6 ? "normal" : "add";

  useImperativeHandle(
    handle,
    () => ({
      play: (effects, options) => (ref.current ? playEffects(ref.current, effects, { blend, ...options }) : null),
      clear: () => {
        if (ref.current) clearEffects(ref.current);
      },
      element: () => ref.current,
    }),
    [blend],
  );

  useIsomorphicLayoutEffect(() => {
    const layer = ref.current;
    return () => {
      if (layer) clearEffects(layer);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className ? `rco-fx-layer ${className}` : "rco-fx-layer"}
      aria-hidden
      style={tone ? ({ "--rco-tone": tone, ...style } as CSSProperties) : style}
    />
  );
}
