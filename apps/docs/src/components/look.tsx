import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { type CardTheme, isThemeId, THEME_LIST, type ThemeId, type ThemeMode, themeOf } from "@react-cards-opening/ui";

/*
 * The look a reader picked: a theme, in dark or light. Every preview on the site plays in it, and the choice follows
 * the reader from page to page. It lives in its own file so a demo can read it without pulling in the previews.
 */

export interface Look {
  theme: ThemeId;
  mode: ThemeMode;
}

// Grape in the dark: the site's own violet, and the one a legendary's gold stands out on most.
const DEFAULT_LOOK: Look = { theme: "grape", mode: "dark" };
const STORED = "react-cards-opening:docs:look";

const LookContext = createContext<{ look: Look; setLook: (next: Look) => void }>({
  look: DEFAULT_LOOK,
  setLook: () => {},
});

export function LookProvider({ children }: { children: ReactNode }) {
  const [look, setLookState] = useState(DEFAULT_LOOK);
  // After the first paint, so the server's HTML and the browser's first render agree.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORED);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== "object") return;
      const { theme, mode } = parsed as Partial<Look>;
      setLookState({
        theme: typeof theme === "string" && isThemeId(theme) ? theme : DEFAULT_LOOK.theme,
        mode: mode === "light" ? "light" : "dark",
      });
    } catch {
      // Blocked storage: the default look.
    }
  }, []);
  const value = useMemo(
    () => ({
      look,
      setLook: (next: Look) => {
        setLookState(next);
        try {
          window.localStorage.setItem(STORED, JSON.stringify(next));
        } catch {
          // Blocked storage: the choice lasts for this page.
        }
      },
    }),
    [look],
  );
  return <LookContext.Provider value={value}>{children}</LookContext.Provider>;
}

export const useLook = () => useContext(LookContext);

/** The colours of the look in use, ready to hand to a component's `theme`. */
export const useLookTheme = (): CardTheme => {
  const { look } = useLook();
  return useMemo(() => themeOf(look.theme, look.mode), [look]);
};

/** A theme, and dark or light: what a reader can change about every preview on the site. */
export function LookControls() {
  const { look, setLook } = useLook();
  return (
    <div className="d-look">
      <div role="group" aria-label="Theme" className="d-look-swatches">
        {THEME_LIST.map(({ id, label, theme }) => (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={look.theme === id}
            onClick={() => setLook({ ...look, theme: id })}
            style={{ background: theme.levels[4] }}
          />
        ))}
      </div>
      <div role="group" aria-label="Dark or light" className="d-look-chips">
        {(["dark", "light"] as const).map((mode) => (
          <button key={mode} type="button" aria-pressed={look.mode === mode} onClick={() => setLook({ ...look, mode })}>
            {mode === "dark" ? "Dark" : "Light"}
          </button>
        ))}
      </div>
    </div>
  );
}
