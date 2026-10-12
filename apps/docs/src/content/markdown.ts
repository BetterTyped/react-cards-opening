import { COMBOS, namesIn, OPENER_PARTS, PIECE_PARTS } from "../registry/gallery";
import { absoluteUrl } from "../site";
import type { Block, Demo, DocPage } from "./types";
import { EFFECT_KINDS, EFFECT_LIST, SIGNATURE_EFFECTS } from "@react-cards-opening/ui";

/*
 * The text twin of a page: what `/docs/effects/burst/index.md` serves and what `llms.txt` points at. Built from the
 * same blocks the site draws, so the two cannot drift apart.
 */

/** Site paths in the text become full addresses: a Markdown file gets read far from the site it came from. */
const withAddresses = (text: string) =>
  text.replaceAll(/\]\((\/[^)]*)\)/g, (_match, path: string) => `](${absoluteUrl(path)})`);

const demoLine = (_demo: Demo, pagePath: string) => `> Live preview: see it play at ${absoluteUrl(pagePath)}`;

const TIERS = ["common", "uncommon", "rare", "epic", "legendary", "mythic"] as const;

/** A gallery in words: the same names the tiles carry, as a list. */
function galleryToMarkdown(show: Extract<Block, { kind: "gallery" }>["show"]): string {
  switch (show) {
    case "shows":
      return TIERS.map((tier) => `- **${tier}**: ${namesIn(SIGNATURE_EFFECTS[tier]).join(", ")}`).join("\n");
    case "combos":
      return COMBOS.map((combo) => `- **${combo.name}** (${combo.tier}): ${namesIn(combo.steps).join(", ")}`).join(
        "\n",
      );
    case "effects":
      return EFFECT_KINDS.map(
        ({ kind, label }) =>
          `- **${label}**: ${EFFECT_LIST.filter((effect) => effect.kind === kind)
            .map((effect) => effect.name)
            .join(", ")}`,
      ).join("\n");
    case "components":
      return [...OPENER_PARTS, ...PIECE_PARTS]
        .map((part) => `- [${part.name}](${absoluteUrl(part.path)}): ${part.line}`)
        .join("\n");
  }
}

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
    case "gallery":
      return `${galleryToMarkdown(block.show)}\n\n> Live: see them play at ${absoluteUrl(pagePath)}`;
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
