import { type CSSProperties, type Ref, useImperativeHandle, useRef } from "react";

import { cn } from "./class-names";
import { clearEffects, type EffectInput, playEffects, type PlayOptions } from "./effects";
import type { CardTheme } from "./theme";
import { useIsomorphicLayoutEffect } from "./use-gsap-effect";

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
  /** The page's theme, when there is one: on a light theme the lights are painted, not added up. */
  theme?: CardTheme;
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
      className={cn("rco-fx-layer", className)}
      aria-hidden
      style={tone ? ({ "--rco-tone": tone, ...style } as CSSProperties) : style}
    />
  );
}
