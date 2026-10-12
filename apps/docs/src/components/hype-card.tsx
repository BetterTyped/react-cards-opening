import { useEffect, useState } from "react";

import { hypeStack, SITE } from "../site";

const SHOTS = ["members", "sign-in", "billing"] as const;
const PUT_AWAY = "react-cards-opening:docs:hype-card";

/**
 * The one thing this site asks of a reader, on every page: what Hype Stack is, what it looks like, and one button.
 * On a wide screen it stands in the bottom right corner and stays there as the page scrolls. On a narrow one it
 * closes the page. It can be put away, and comes back with the next visit. The pictures are Hype Stack's own screens.
 */
export function HypeCard() {
  const [away, setAway] = useState(false);
  useEffect(() => {
    try {
      setAway(window.sessionStorage.getItem(PUT_AWAY) === "1");
    } catch {
      // Storage is off: the card stays.
    }
  }, []);

  if (away) return null;
  return (
    <aside className="d-hype" aria-label="Hype Stack">
      <a className="d-hype-card" href={hypeStack("docs-sidebar")} target="_blank" rel="noopener">
        <span className="d-hype-shots" aria-hidden>
          {SHOTS.map((shot) => (
            <img
              key={shot}
              src={`${SITE.base}hype-stack/${shot}.jpg`}
              alt=""
              width={640}
              height={360}
              loading="lazy"
              decoding="async"
            />
          ))}
        </span>
        <strong>Build the rest with Hype Stack</strong>
        <span className="d-hype-text">
          The full stack React template this library came out of. Auth, billing and a database, installed as code you
          own.
        </span>
        <span className="d-hype-cta">See Hype Stack</span>
        <small>The template is free and MIT licensed</small>
      </a>
      <button
        type="button"
        className="d-hype-close"
        aria-label="Put this card away"
        onClick={() => {
          setAway(true);
          try {
            window.sessionStorage.setItem(PUT_AWAY, "1");
          } catch {
            // Storage is off: it is away for this page only.
          }
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </aside>
  );
}
