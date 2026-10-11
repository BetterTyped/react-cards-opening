import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";

/**
 * A random lit cell nobody else is hiding on. `levels` is the grid, one number per cell, 0 for an unlit one. A grid
 * with nothing lit falls back to any free cell.
 */
export function pickSpot(
  levels: readonly number[],
  taken: readonly number[],
  random: () => number = Math.random,
): number {
  const active = levels.flatMap((level, cell) => (level > 0 && !taken.includes(cell) ? [cell] : []));
  const pool = active.length > 0 ? active : levels.map((_level, cell) => cell).filter((cell) => !taken.includes(cell));
  return pool[Math.floor(random() * pool.length)] ?? 0;
}

/**
 * Where each card hides, by card id: random the first time, then the same cell for the rest of the visit, so a
 * replay reopens the same tiles. With a key it survives a reload (session storage); null keeps it in memory.
 */
export function useCardSpots(
  sessionKey: string | null,
): [spots: Record<string, number>, setSpots: Dispatch<SetStateAction<Record<string, number>>>] {
  const [spots, setSpots] = useState<Record<string, number>>({});
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!sessionKey) return;
    try {
      const raw = window.sessionStorage.getItem(sessionKey);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") {
        const restored = Object.fromEntries(
          Object.entries(parsed).filter((entry): entry is [string, number] => typeof entry[1] === "number"),
        );
        // What this visit already found wins over anything placed before storage was read.
        setSpots((now) => ({ ...now, ...restored }));
      }
    } catch {
      // Blocked storage: the spots live for this page only.
    }
    loadedRef.current = true;
  }, [sessionKey]);

  useEffect(() => {
    if (!sessionKey || !loadedRef.current) return;
    try {
      window.sessionStorage.setItem(sessionKey, JSON.stringify(spots));
    } catch {
      // Blocked storage: nothing to keep.
    }
  }, [sessionKey, spots]);

  return [spots, setSpots];
}
