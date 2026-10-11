import { absoluteUrl } from "../site";
import type { Block, Demo, DocPage } from "./types";

/*
 * The text twin of a page: what `/docs/effects/burst/index.md` serves and what `llms.txt` points at. Built from the
 * same blocks the site draws, so the two cannot drift apart.
 */

/** Site paths in the text become full addresses: a Markdown file gets read far from the site it came from. */
const withAddresses = (text: string) =>
  text.replaceAll(/\]\((\/[^)]*)\)/g, (_match, path: string) => `](${absoluteUrl(path)})`);

const demoLine = (_demo: Demo, pagePath: string) => `> Live preview: see it play at ${absoluteUrl(pagePath)}`;

function blockToMarkdown(block: Block, pagePath: string): string {
  switch (block.kind) {
    case "h2":
      return `## ${block.text}`;
    case "h3":
      return `### ${block.text}`;
    case "p":
      return withAddresses(block.text);
    case "list":
      return block.items.map((item) => `- ${withAddresses(item)}`).join("\n");
    case "steps":
      return block.items.map((item, index) => `${index + 1}. ${withAddresses(item)}`).join("\n");
    case "note":
      return `> ${withAddresses(block.text)}`;
    case "code":
      return `${block.file ? `\`${block.file}\`\n\n` : ""}\`\`\`${block.language}\n${block.code}\n\`\`\``;
    case "table":
      return [
        `| ${block.head.join(" | ")} |`,
        `| ${block.head.map(() => "---").join(" | ")} |`,
        ...block.rows.map((row) => `| ${row.map((cell) => withAddresses(cell).replaceAll("|", "\\|")).join(" | ")} |`),
      ].join("\n");
    case "preview":
      return demoLine(block.demo, pagePath) + (block.caption ? `\n>\n> ${block.caption}` : "");
    case "faq":
      return block.items.map((item) => `### ${item.question}\n\n${withAddresses(item.answer)}`).join("\n\n");
    case "cards":
      return block.items.map((item) => `- [${item.title}](${absoluteUrl(item.path)}): ${item.text}`).join("\n");
  }
}

export function pageToMarkdown(page: DocPage, titleOf: (path: string) => string | undefined): string {
  const related = page.related.flatMap((path) => {
    const title = titleOf(path);
    return title ? [`- [${title}](${absoluteUrl(path)})`] : [];
  });
  return [
    `# ${page.title}`,
    withAddresses(page.lead),
    ...page.blocks.map((block) => blockToMarkdown(block, page.path)),
    ...(related.length > 0 ? ["## Related", related.join("\n")] : []),
    `Source: ${absoluteUrl(page.path)}`,
  ].join("\n\n");
}
