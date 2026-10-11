import { createFileRoute } from "@tanstack/react-router";

import { Code } from "../components/code";
import { HeroAir, OpenerTabs } from "../components/home-stage";
import { LookControls, useLookTheme } from "../components/look";
import { SiteFrame } from "../components/shell";
import { SiteLink } from "../components/site-link";
import { CardShelf } from "../demos/card-shelf";
import { EffectsDemo } from "../demos/effects";
import { TIER_CARDS } from "../registry/sample";
import { seoHead, siteNodes } from "../seo/head";
import { hypeStack, INSTALL, PACKAGES, SITE } from "../site";
import { EFFECT_LIST } from "@react-cards-opening/ui";

export const Route = createFileRoute("/")({
  head: () => seoHead({ title: SITE.title, description: SITE.description, path: "/", nodes: siteNodes() }),
  component: Home,
});

const QUICK = `import { useOpenedCards } from "@react-cards-opening/core";
import { CardPack } from "@react-cards-opening/ui";
import "@react-cards-opening/ui/styles.css";

export function Pack({ cards }) {
  const { opened, open } = useOpenedCards("pack:42");
  return <CardPack cards={cards} opened={opened} onOpen={open} />;
}`;

function Home() {
  const theme = useLookTheme();
  return (
    <SiteFrame>
      <section className="h-hero">
        <HeroAir theme={theme} />
        <p className="h-kicker">
          <i className="d-dot" aria-hidden />
          A free tool from{" "}
          <a href={hypeStack("docs-home")} target="_blank" rel="noopener">
            Hype Stack
          </a>
        </p>
        <h1>
          Card <em>opening</em> for React
        </h1>
        <p className="h-lead">
          Packs, wheels, reels, cases and hunts. Six rarities, each with a show of its own. One stylesheet.
        </p>
        <div className="h-actions">
          <SiteLink path="/docs/" className="d-pill d-pill-solid">
            Get started
          </SiteLink>
          <SiteLink path="/docs/effects/library/" className="d-pill">
            Play all {EFFECT_LIST.length} effects
          </SiteLink>
        </div>
        <p className="h-install">
          <i aria-hidden>$</i>
          {INSTALL}
        </p>
        <div className="h-table">
          <CardShelf cards={TIER_CARDS} theme={theme} layout="fan" />
        </div>
        <p className="h-note">Six rarities, common to mythic. Open one.</p>
      </section>

      <ul className="h-facts">
        <li>
          <strong>5</strong>
          <span>ways to open a card, all ending in the same reveal</span>
        </li>
        <li>
          <strong>6</strong>
          <span>rarities, each arriving its own way</span>
        </li>
        <li>
          <strong>{EFFECT_LIST.length}</strong>
          <span>effects, one name each, made to be stacked</span>
        </li>
        <li>
          <strong>0</strong>
          <span>CSS frameworks needed, and nothing leaks into your page</span>
        </li>
      </ul>

      <section className="h-section">
        <div className="h-head">
          <div>
            <h2>
              Five ways to <em>open</em> a card
            </h2>
            <p>The same five cards in each. What was won is decided before anything moves.</p>
          </div>
          <LookControls />
        </div>
        <OpenerTabs theme={theme} />
      </section>

      <section className="h-section">
        <div className="h-head">
          <div>
            <h2>
              {EFFECT_LIST.length} effects, <em>one name</em> each
            </h2>
            <p>Particles, light, shockwaves and screen effects. Press a few at once.</p>
          </div>
          <SiteLink path="/docs/effects/library/" className="d-pill">
            The whole library
          </SiteLink>
        </div>
        <div className="h-frame">
          <div className="d-stage" style={{ background: theme.bg, color: theme.fg }}>
            <EffectsDemo theme={theme} />
          </div>
        </div>
      </section>

      <section className="h-section h-split">
        <Code code={QUICK} language="tsx" file="pack.tsx" />
        <div>
          <h2>
            A pack in <em>eight lines</em>
          </h2>
          <p>
            Two packages, released together under one version. The rules are in one, with React as their only
            dependency. The look is in the other.
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

      <section className="h-promo">
        <div>
          <h2>It came out of Hype Stack</h2>
          <p>
            The reveal was built for the year in review inside Hype Stack, the full stack React template: auth, billing,
            a database and a CLI that installs features as code you own. The library is free. The template is how it
            stays that way.
          </p>
        </div>
        <div className="h-promo-actions">
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
