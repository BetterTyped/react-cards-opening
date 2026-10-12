import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { Code } from "../components/code";
import { CombosGallery } from "../components/galleries";
import { HeroFan } from "../components/hero-fan";
import { OpenerTabs } from "../components/home-stage";
import { LookControls, useLookTheme } from "../components/look";
import { SiteFrame } from "../components/shell";
import { SiteLink } from "../components/site-link";
import { EffectsDemo } from "../demos/effects";
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

/** The install line as a button: press it and it is on the clipboard. */
function Command() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = async () => {
    await navigator.clipboard.writeText(INSTALL);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button type="button" className="h-command" onClick={() => void copy()} aria-label={`Copy: ${INSTALL}`}>
      <i aria-hidden>$</i>
      <code>{INSTALL}</code>
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function Home() {
  const theme = useLookTheme();
  return (
    <SiteFrame>
      <section className="h-hero">
        <div className="h-glow" aria-hidden />
        <div className="h-copy">
          <p className="h-kicker">
            <b>Open source</b>
            <span>
              A free tool from{" "}
              <a href={hypeStack("docs-home")} target="_blank" rel="noopener">
                Hype Stack
              </a>
            </span>
          </p>
          <h1>
            Card opening, <span>for React.</span>
          </h1>
          <p className="h-lead">
            Packs, wheels, reels, cases and hunts. Six rarities, each arriving with a show of its own. One stylesheet,
            no CSS framework.
          </p>
          <div className="h-actions">
            <SiteLink path="/docs/" className="d-pill d-pill-solid">
              Get started
            </SiteLink>
            <Command />
          </div>
        </div>
        <HeroFan theme={theme} />
        <p className="h-note">Live in the page, not a recording. Hover a card, or open one.</p>
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
              Stack them into a <em>show</em>
            </h2>
            <p>Each tile is a handful of effect names played together. Press one to play it again.</p>
          </div>
          <SiteLink path="/docs/effects/" className="d-pill">
            The whole gallery
          </SiteLink>
        </div>
        <CombosGallery first={8} />
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
            Three packages, released together under one version. The rules are in one, with React as their only
            dependency. The effects are in another, and work without cards. The look brings both together.
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
