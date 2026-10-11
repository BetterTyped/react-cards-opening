import { anchorOf, type Block } from "../content/types";
import { Code } from "./code";
import { Inline } from "./inline";
import { Preview } from "./preview";
import { SiteLink } from "./site-link";

/** One block of a page. The Markdown twin of the page is written from the same blocks in `content/markdown.ts`. */
function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "h2":
      return (
        <h2 id={anchorOf(block.text)}>
          <a href={`#${anchorOf(block.text)}`}>{block.text}</a>
        </h2>
      );
    case "h3":
      return <h3 id={anchorOf(block.text)}>{block.text}</h3>;
    case "p":
      return (
        <p>
          <Inline text={block.text} />
        </p>
      );
    case "list":
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item}>
              <Inline text={item} />
            </li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="d-steps">
          {block.items.map((item) => (
            <li key={item}>
              <Inline text={item} />
            </li>
          ))}
        </ol>
      );
    case "note":
      return (
        <aside className="d-note">
          <Inline text={block.text} />
        </aside>
      );
    case "code":
      return <Code code={block.code} language={block.language} file={block.file} />;
    case "table":
      return (
        <div className="d-table">
          <table>
            <thead>
              <tr>
                {block.head.map((cell) => (
                  <th key={cell} scope="col">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, index) => (
                    // oxlint-disable-next-line react/no-array-index-key -- a row's cells are positional
                    <td key={index}>
                      <Inline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "preview":
      return <Preview demo={block.demo} caption={block.caption} />;
    case "faq":
      return (
        <dl className="d-faq">
          {block.items.map((item) => (
            <div key={item.question}>
              <dt>{item.question}</dt>
              <dd>
                <Inline text={item.answer} />
              </dd>
            </div>
          ))}
        </dl>
      );
    case "cards":
      return (
        <ul className="d-cards">
          {block.items.map((item) => (
            <li key={item.path}>
              <SiteLink path={item.path}>
                {item.tier ? <i className="d-card-tier" data-tier={item.tier} aria-hidden /> : null}
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </SiteLink>
            </li>
          ))}
        </ul>
      );
  }
}

export function Blocks({ blocks }: { blocks: readonly Block[] }) {
  return (
    <>
      {blocks.map((block, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- a page's blocks never reorder
        <BlockView key={index} block={block} />
      ))}
    </>
  );
}
