import type { CodeLanguage } from "./types";

/*
 * A small highlighter, enough for the code these docs show: comments, strings, numbers, keywords, JSX tags and
 * the names of things being called. It runs the same on the server and in the browser, so highlighted code is in
 * the HTML a crawler reads and nothing is shipped to do it again.
 */

export type TokenKind = "plain" | "comment" | "string" | "number" | "keyword" | "tag" | "call" | "property";
export type Token = readonly [kind: TokenKind, text: string];

const KEYWORDS = new Set(
  "import export from const let var function return if else for while of in new type interface extends as default true false null undefined async await class typeof satisfies readonly".split(
    " ",
  ),
);

const SCRIPT =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d[\d_]*(?:\.\d+)?\b)|(<\/?[A-Za-z][\w.]*|\/?>)|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)(?=\s*:)|([A-Za-z_$][\w$]*)/g;

const CSS = /(\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*")|(--[\w-]+|[a-z-]+(?=\s*:))|(\b\d[\w.%]*)|([.#][\w-]+|@[\w-]+)/g;

const BASH = /(#[^\n]*)|("(?:[^"\\\n]|\\.)*")|(^|\n)(\s*(?:pnpm|npm|yarn|bun|npx|node|git)\b)|(\s--?[\w-]+)/g;

function scan(code: string, pattern: RegExp, kindOf: (match: RegExpMatchArray) => TokenKind): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of code.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) tokens.push(["plain", code.slice(last, at)]);
    tokens.push([kindOf(match), match[0]]);
    last = at + match[0].length;
  }
  if (last < code.length) tokens.push(["plain", code.slice(last)]);
  return tokens;
}

export function highlight(code: string, language: CodeLanguage): Token[] {
  if (language === "bash") {
    return scan(code, BASH, (match) => {
      if (match[1]) return "comment";
      if (match[2]) return "string";
      if (match[4]) return "call";
      return "property";
    });
  }
  if (language === "css") {
    return scan(code, CSS, (match) => {
      if (match[1]) return "comment";
      if (match[2]) return "string";
      if (match[3]) return "property";
      if (match[4]) return "number";
      return "tag";
    });
  }
  return scan(code, SCRIPT, (match) => {
    if (match[1]) return "comment";
    if (match[2]) return "string";
    if (match[3]) return "number";
    if (match[4]) return "tag";
    if (match[5]) return KEYWORDS.has(match[5]) ? "keyword" : "call";
    if (match[6]) return KEYWORDS.has(match[6]) ? "keyword" : "property";
    return match[7] && KEYWORDS.has(match[7]) ? "keyword" : "plain";
  });
}
