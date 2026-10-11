import { createFileRoute } from "@tanstack/react-router";

import { Code } from "../components/code";
import { HeroDeal } from "../components/hero-deal";
import { LookControls, useLookTheme } from "../components/look";
import { SiteFrame } from "../components/shell";
import { SiteLink } from "../components/site-link";
import { CardShelf } from "../demos/card-shelf";
import { HuntDemo } from "../demos/hunt";
import { EFFECTS } from "../registry/effects";
import { TIER_CARDS } from "../registry/sample";
import { seoHead, siteNodes } from "../seo/head";
import { hypeStack, INSTALL, PACKAGES, SITE } from "../site";

export const Route = createFileRoute("/")({
  head: () => seoHead({ title: SITE.title, description: SITE.description, path: "/", nodes: siteNodes() }),
  component: Home,
});

const RULES = `const { opened, open } = useOpenedCards("deal:ada");
const hunt = useCardOpening({ cards, opened, onOpen: open });

hunt.start();        // open every unopened card
hunt.pressCard();    // face down: turn it. face up: send it home
hunt.pressBackdrop(); // stop. a turned card still lands
hunt.openAll();      // skip the show`;

const QUICK = `import { useOpenedCards } from "@react-cards-opening/core";
import { CardHunt } from "@react-cards-opening/ui";
import "@react-cards-opening/ui/styles.css";

export function Hunt({ cards, levels }) {
  const { opened, open } = useOpenedCards("deal:ada");
  return <CardHunt cards={cards} opened={opened} onOpen={open} levels={levels} />;
}`;

function Home() {
  const theme = useLookTheme();
  return (
    <SiteFrame>
      <section className="d-hero">
        <div className="d-hero-copy">
          <p className="d-hero-kicker">
            <i className="d-dot" aria-hidden />
            A free tool from{" "}
            <a href={hypeStack("docs-home")} target="_blank" rel="noopener">
              Hype Stack
            </a>
          </p>
          <h1>
            Card <em>opening</em> for React
          </h1>
          <p className="d-hero-lead">
            A card lifts out of the page, hums, turns over and lands. How loud that is depends on how rare it is: a
            common hops, an epic opens a wheel of rays, a legendary gets a foil border and the whole screen.
          </p>
          <div className="d-hero-actions">
            <SiteLink path="/docs/" className="d-pill d-pill-solid">
              Read the docs
            </SiteLink>
            <SiteLink path="/docs/effects/" className="d-pill">
              See all {EFFECTS.length} effects
            </SiteLink>
          </div>
          <Code code={INSTALL} language="bash" file="Install" />
        </div>
        <div className="d-hero-stage">
          <HeroDeal />
          <p className="d-hero-note">Press the card. Press it again to send it home.</p>
        </div>
      </section>

      <div className="d-facts">
        <p>
          <strong>{EFFECTS.length}</strong>
          <span>effects, each with its own page and the numbers behind it</span>
        </p>
        <p>
          <strong>6</strong>
          <span>tiers from common to mythic, each with a show of its own</span>
        </p>
        <p>
          <strong>10</strong>
          <span>themes in dark and light, or one from a single colour</span>
        </p>
        <p>
          <strong>0</strong>
          <span>CSS frameworks needed: one stylesheet, nothing leaks</span>
        </p>
      </div>

      <section className="d-band">
        <div className="d-band-head">
          <div>
            <h2>Hide them. Then hunt.</h2>
            <p>
              <code>CardHunt</code> hides a deal in a grid and scans for it. A beam sweeps, a reticle locks on, the cell
              cracks in the colour of what it held, and the card comes out of it. Five are in this one.
            </p>
          </div>
          <LookControls />
        </div>
        <div className="d-band-stage">
          <HuntDemo theme={theme} columns={38} />
        </div>
      </section>

      <section className="d-band">
        <div className="d-band-head">
          <div>
            <h2>Four tiers, three shows</h2>
            <p>
              Common and rare differ by colour alone, which is what keeps the loud ones special. Bring three tiers of
              your own or seven: each picks its show with one word.
            </p>
          </div>
          <SiteLink path="/docs/rarity-tiers/" className="d-pill">
            How tiers work
          </SiteLink>
        </div>
        <div className="d-stage" style={{ background: theme.bg, color: theme.fg }}>
          <CardShelf cards={TIER_CARDS} theme={theme} />
        </div>
      </section>

      <section className="d-band d-split">
        <div>
          <h2>The rules, without a look</h2>
          <p>
            <code>@react-cards-opening/core</code> is the queue, what every press means and when a card counts as
            opened. It depends on React and nothing else. Keep it and draw the reveal your own way, or deal cards on a
            server with the same seeded roll the browser shows.
          </p>
          <p className="d-band-more">
            <SiteLink path="/docs/guides/own-ui-on-core/" className="d-pill">
              Build your own reveal
            </SiteLink>
          </p>
        </div>
        <Code code={RULES} language="tsx" file="rules.tsx" />
      </section>

      <section className="d-band d-split">
        <Code code={QUICK} language="tsx" file="hunt.tsx" />
        <div>
          <h2>Two packages, one version</h2>
          <p>
            They are released together under one version number, so the pair you install is a pair that was tested
            together.
          </p>
          <ul className="d-packages">
            {PACKAGES.map((entry) => (
              <li key={entry.name}>
                <code>{entry.name}</code>
                <span>{entry.holds}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="d-promo">
        <div>
          <h2>It came out of Hype Stack</h2>
          <p>
            This reveal was built for the year in review inside Hype Stack, the full stack React template: auth,
            billing, a database and a CLI that installs features as code you own. The library is free. The template is
            how it stays that way.
          </p>
        </div>
        <div className="d-promo-actions">
          <a className="d-pill d-pill-hype" href={hypeStack("docs-home")} target="_blank" rel="noopener">
            See Hype Stack
          </a>
          <a className="d-pill" href={hypeStack("docs-home", "/wrapped")} target="_blank" rel="noopener">
            Watch it in Wrapped
          </a>
        </div>
      </section>
    </SiteFrame>
  );
}
