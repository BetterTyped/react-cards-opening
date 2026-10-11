import { Link } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";

/** A link is the current page only at that page: "/docs/" is not current on every page under it. */
const EXACT = { exact: true } as const;

type Rest = Omit<ComponentProps<"a">, "href" | "children">;

/**
 * A link to a page of this site by its path ("/docs/effects/burst/"), or to anywhere else by its address. Pages are
 * listed in a registry and linked by path, so this is the one place that turns a path into a route.
 */
export function SiteLink({ path, children, ...rest }: { path: string; children: ReactNode } & Rest) {
  if (!path.startsWith("/")) {
    return (
      <a href={path} target="_blank" rel="noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  const [bare, hash] = path.split("#");
  if (bare === "/") {
    return (
      <Link to="/" hash={hash} activeOptions={EXACT} {...rest}>
        {children}
      </Link>
    );
  }
  if (bare === "/docs/") {
    return (
      <Link to="/docs/" hash={hash} activeOptions={EXACT} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <Link
      to="/docs/$/"
      params={{ _splat: bare.replace(/^\/docs\//, "").replace(/\/$/, "") }}
      hash={hash}
      activeOptions={EXACT}
      {...rest}
    >
      {children}
    </Link>
  );
}
