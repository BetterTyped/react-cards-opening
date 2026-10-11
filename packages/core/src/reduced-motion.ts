import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Whether this visitor asked their system for less motion. False where there is no window to ask. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
}

/** The same answer as state, kept current when the setting changes while the page is open. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(QUERY);
    const read = () => setReduced(media.matches);
    read();
    media.addEventListener("change", read);
    return () => media.removeEventListener("change", read);
  }, []);
  return reduced;
}
