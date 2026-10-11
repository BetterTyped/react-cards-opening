import type { Block } from "../content/types";

/*
 * Props tables that cannot fall behind the code. A table is written as an object keyed by the props of the real
 * component or function, so a prop added to the library without a line here stops the typecheck, and so does a line
 * left behind for a prop that is gone. An optional prop has to say so, which is how the table knows to mark it.
 */

type Required3 = readonly [type: string, text: string];
type Optional3 = readonly [type: string, text: string, optional: "optional"];

/** One line per prop of `P`: its type as people read it, and what it does. Optional props end with "optional". */
export type PropDocs<P> = { [K in keyof P]-?: undefined extends P[K] ? Optional3 : Required3 };

/** The table a page shows, from a `PropDocs`. Optional props get a question mark after their name. */
export function propsTable<P>(docs: PropDocs<P>, head: readonly string[] = ["Prop", "Type", "What it does"]): Block {
  const rows = Object.entries(docs as Record<string, Required3 | Optional3>).map(([name, [type, text, optional]]) => [
    `\`${name}${optional ? "?" : ""}\``,
    `\`${type}\``,
    text,
  ]);
  return { kind: "table", head, rows };
}
