import { useCallback, useEffect, useLayoutEffect, useState } from "react";

/** A layout effect in the browser, a plain one on a server, where a layout effect only earns a warning. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Which cards have been opened, remembered on this device (or, with no key, for this visit only). Key it by the
 * deal (who it is for and when it was dealt), so a new deal starts unopened. Storage can be blocked or empty, so
 * every read and write fails soft: at worst the cards can be opened again, they can never change.
 */
export function useOpenedCards(storageKey: string | null): {
  opened: readonly string[];
  open: (id: string) => void;
  /** Forgets every opened card, here and in storage. */
  reset: () => void;
  /** False until storage has been read. Wait for it before deciding what a returning visitor sees first. */
  ready: boolean;
} {
  const [opened, setOpened] = useState<readonly string[]>([]);
  const [ready, setReady] = useState(false);

  // Before the first paint, not after it: a page that leads with unopened cards would otherwise show that for a
  // frame to someone who opened everything last week.
  useIsomorphicLayoutEffect(() => {
    // No key: remembered for this visit only.
    if (!storageKey) {
      setReady(true);
      return;
    }
    let stored: string[] = [];
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) stored = parsed.filter((id): id is string => typeof id === "string");
    } catch {
      stored = [];
    }
    setOpened(stored);
    setReady(true);
  }, [storageKey]);

  const open = useCallback(
    (id: string) => {
      setOpened((current) => {
        if (current.includes(id)) return current;
        const next = [...current, id];
        if (!storageKey) return next;
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // Private windows and blocked storage: the card is still opened for this visit.
        }
        return next;
      });
    },
    [storageKey],
  );

  const reset = useCallback(() => {
    setOpened([]);
    if (!storageKey) return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Blocked storage held nothing to forget.
    }
  }, [storageKey]);

  return { opened, open, reset, ready };
}
