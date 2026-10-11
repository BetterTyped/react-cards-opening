import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { SECTIONS } from "../registry/pages";
import { SITE } from "../site";

/*
 * Search across the docs: every page's name, what it is, and the section it lives in. The list is the same registry
 * the sidebar is drawn from, so there is no index to build and nothing to fetch.
 */

interface Entry {
  path: string;
  title: string;
  section: string;
  text: string;
  /** Everything a query is matched against, lower case. */
  haystack: string;
}

/** How well a page answers a query: its name counts most, then its section, then what it says. */
function score(entry: Entry, words: readonly string[]): number {
  const title = entry.title.toLowerCase();
  let total = 0;
  for (const word of words) {
    if (!entry.haystack.includes(word)) return 0;
    if (title.startsWith(word)) total += 6;
    else if (title.includes(word)) total += 4;
    else if (entry.section.toLowerCase().includes(word)) total += 2;
    else total += 1;
  }
  return total;
}

export function Search() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const entries = useMemo<Entry[]>(
    () =>
      SECTIONS.flatMap((section) =>
        section.pages.map((page) => ({
          path: page.path,
          title: page.title,
          section: section.title,
          text: page.description,
          haystack: `${page.title} ${section.title} ${page.description}`.toLowerCase(),
        })),
      ),
    [],
  );

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return entries.slice(0, 8);
    return entries
      .map((entry) => ({ entry, points: score(entry, words) }))
      .filter((item) => item.points > 0)
      .toSorted((a, b) => b.points - a.points)
      .slice(0, 12)
      .map((item) => item.entry);
  }, [entries, query]);

  // Cmd or Ctrl with K from anywhere, and "/" when nothing is being typed into.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const go = (entry: Entry | undefined) => {
    if (!entry) return;
    setOpen(false);
    setQuery("");
    // The site lives under a base path; the router adds it.
    void navigate({ href: `${SITE.base.replace(/\/$/, "")}${entry.path}` });
  };

  return (
    <>
      <button type="button" className="d-search-button" onClick={() => setOpen(true)} aria-label="Search the docs">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="m21 21-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
        </svg>
        <span>Search</span>
        <kbd>/</kbd>
      </button>
      {/* A click on the dialog itself is a click on its backdrop; Escape is the keyboard's way out. */}
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        ref={dialogRef}
        className="d-search"
        aria-label="Search the docs"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className="d-search-panel">
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Search components, effects, guides"
            aria-label="Search"
            aria-controls="d-search-results"
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              setPicked(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setPicked((now) => Math.min(results.length - 1, now + 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setPicked((now) => Math.max(0, now - 1));
              }
              if (event.key === "Enter") go(results[picked]);
            }}
          />
          <ul id="d-search-results">
            {results.map((entry, index) => (
              <li key={entry.path}>
                <button
                  type="button"
                  aria-current={index === picked ? "true" : undefined}
                  onPointerMove={() => setPicked(index)}
                  onClick={() => go(entry)}
                >
                  <strong>{entry.title}</strong>
                  <small>{entry.section}</small>
                  <span>{entry.text}</span>
                </button>
              </li>
            ))}
            {results.length === 0 ? <li className="d-search-none">Nothing in the docs matches that.</li> : null}
          </ul>
        </div>
      </dialog>
    </>
  );
}
