import type { ReactNode } from "react";

import { SiteLink } from "./site-link";

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g;

/** The little Markdown a page's text may carry: `code`, **bold** and [links](/docs/charts/). */
export function Inline({ text }: { text: string }): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const at = match.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    const [whole] = match;
    const key = `${at}-${whole}`;
    if (match[1]) parts.push(<code key={key}>{whole.slice(1, -1)}</code>);
    else if (match[2]) parts.push(<strong key={key}>{whole.slice(2, -2)}</strong>);
    else {
      const [, label, href] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(whole) ?? [];
      parts.push(
        <SiteLink key={key} path={href ?? "/"}>
          {label}
        </SiteLink>,
      );
    }
    last = at + whole.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** The same text with the marks taken out, for places that take plain words: titles, alt text, structured data. */
export const plain = (text: string) =>
  text
    .replaceAll(/`([^`]+)`/g, "$1")
    .replaceAll(/\*\*([^*]+)\*\*/g, "$1")
    .replaceAll(/\[([^\]]+)\]\([^)]+\)/g, "$1");
