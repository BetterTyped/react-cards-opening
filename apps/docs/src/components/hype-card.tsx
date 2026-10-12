import { useEffect, useState } from "react";

import { hypeStack } from "../site";

/*
 * The card that sends a reader on to Hype Stack. The library is a free tool from it, and this is where every page
 * says so out loud: in the column beside a docs page on a wide screen, and in the corner of the window everywhere
 * else. It is laid out the way Hype Stack's own sidebar offer is: a small lit label, a headline that ends on the
 * name in its colour, one line of why, three short points, the price, and a button the full width of the card.
 */

const NAME = "Ship faster with Hype Stack";

const POINTS = ["Full-stack TypeScript", "Auth, billing and teams built in", "Code you own, no lock-in"] as const;

function Pitch() {
  return (
    <>
      <span className="d-ad-label">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
        </svg>
        From Hype Stack
      </span>
      <strong>
        Ship <em>faster</em> with <b>Hype Stack</b>
      </strong>
      <span className="d-ad-text">
        Stop building from scratch. A free React and Hono template, with features written into your repo by one CLI
        command.
      </span>
      <span className="d-ad-points">
        {POINTS.map((point) => (
          <span key={point}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
            </svg>
            {point}
          </span>
        ))}
      </span>
      <span className="d-ad-price">
        <b>Free</b> MIT template
      </span>
      <span className="d-ad-go">
        Explore the stack
        <i aria-hidden>›</i>
      </span>
    </>
  );
}

/** The card in the column beside a docs page. */
export function HypeStackCard() {
  return (
    <a className="d-ad" href={hypeStack("docs-sidebar")} target="_blank" rel="noopener" aria-label={NAME}>
      <Pitch />
    </a>
  );
}

/** Closed for this visit: the card stays away until the tab is closed, and comes back the next time. */
const CLOSED = "react-cards-opening:docs:hype-card";

/**
 * The same card pinned to the corner of the window, for every page that has no column to put it in. It can be
 * closed, and it is drawn only once the page runs, so someone who closed it never sees it flash back.
 *
 * `beside` is a docs page: the column has the card on a wide screen, so this one steps aside there. `strip` is a
 * page that fills the window with things to look at: the card folds down to one line, so it covers none of them.
 */
export function HypeStackFloat({ as = "card" }: { as?: "card" | "beside" | "strip" }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    try {
      setShown(window.sessionStorage.getItem(CLOSED) === null);
    } catch {
      // Blocked storage: the card shows, and closing it lasts for this page.
      setShown(true);
    }
  }, []);
  if (!shown) return null;
  const close = () => {
    setShown(false);
    try {
      window.sessionStorage.setItem(CLOSED, "1");
    } catch {
      // Blocked storage: closed for this page only.
    }
  };
  return (
    <aside
      className="d-float"
      data-docs={as === "beside" ? "" : undefined}
      data-strip={as === "strip" ? "" : undefined}
      aria-label="From Hype Stack"
    >
      <a className="d-ad" href={hypeStack("docs-float")} target="_blank" rel="noopener" aria-label={NAME}>
        <Pitch />
      </a>
      <button type="button" className="d-float-close" onClick={close} aria-label="Close the Hype Stack card">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </aside>
  );
}
