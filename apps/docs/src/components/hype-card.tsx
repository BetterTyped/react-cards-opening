import { hypeStack, SITE } from "../site";

const SHOTS = ["members", "sign-in", "billing"] as const;

/**
 * The one thing this site asks of a reader, in the docs' right column: what Hype Stack is, what it looks like, and
 * one button. The pictures are Hype Stack's own screens.
 */
export function HypeCard() {
  return (
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
        The full stack React template this library came out of. Auth, billing and a database, installed as code you own.
      </span>
      <span className="d-hype-cta">See Hype Stack</span>
      <small>The template is free and MIT licensed</small>
    </a>
  );
}
