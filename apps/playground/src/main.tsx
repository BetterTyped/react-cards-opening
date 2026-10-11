// oxlint-disable-next-line import/no-unassigned-import -- the page's font
import "@fontsource-variable/inter";
import { gsap } from "gsap";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import { cards, describeDay, found, hero, lead, levels, theme } from "./sample";
// oxlint-disable-next-line import/no-unassigned-import -- the page around the piece
import "./page.css";
import { CardHunt } from "@react-cards-opening/ui";

/*
 * One hunt on a bare page, set up from the address bar (see sample.ts). It is where the library is worked on, and
 * what the picture test in e2e/ plays frame by frame.
 */
function Page() {
  const [opened, setOpened] = useState<readonly string[]>(found);
  return (
    <div className="page" data-hero={hero ? "" : undefined}>
      <CardHunt
        cards={cards}
        opened={opened}
        onOpen={(id) => setOpened((now) => (now.includes(id) ? now : [...now, id]))}
        levels={levels}
        lead={lead}
        theme={theme}
        hero={hero}
        describeSpot={describeDay}
      />
    </div>
  );
}

// For the tests: the animation clock, to read where it stands.
(window as unknown as { gsap: typeof gsap }).gsap = gsap;

const root = document.querySelector("#root");
if (root) {
  // ?strict runs every effect twice, the way React does in development: a check that nothing depends on running once.
  const strict = new URLSearchParams(window.location.search).has("strict");
  createRoot(root).render(
    strict ? (
      <StrictMode>
        <Page />
      </StrictMode>
    ) : (
      <Page />
    ),
  );
}
