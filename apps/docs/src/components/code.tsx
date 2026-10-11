import { useEffect, useRef, useState } from "react";

import { highlight } from "../content/highlight";
import type { CodeLanguage } from "../content/types";

/** A block of code someone will copy: highlighted in the HTML itself, with one button that takes all of it. */
export function Code({ code, language, file }: { code: string; language: CodeLanguage; file?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };
  let offset = 0;
  return (
    <figure className="d-code">
      <figcaption>
        <span>{file ?? language}</span>
        <button type="button" onClick={() => void copy()} aria-live="polite">
          {copied ? "Copied" : "Copy"}
        </button>
      </figcaption>
      {/* Long lines scroll sideways, so the block has to be reachable from the keyboard. */}
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <pre tabIndex={0}>
        <code>
          {highlight(code, language).map(([kind, text]) => {
            const key = offset;
            offset += text.length;
            return kind === "plain" ? (
              text
            ) : (
              <span key={key} data-token={kind}>
                {text}
              </span>
            );
          })}
        </code>
      </pre>
    </figure>
  );
}
