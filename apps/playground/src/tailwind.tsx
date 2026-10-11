import { createRoot } from "react-dom/client";

// The components straight from their files, not through the package's entry: the entry brings the stylesheet in
// unlayered, and this page is about what happens when a project layers it.
import { CardHunt } from "../../../packages/ui/src/card-hunt";
import { GLYPHS } from "../../../packages/ui/src/glyphs";
import { themeOf } from "../../../packages/ui/src/theme";
import type { GlyphCard } from "../../../packages/ui/src/types";
// oxlint-disable-next-line import/no-unassigned-import -- Tailwind, with the library's stylesheet layered under it
import "./tailwind.css";

const noop = () => {};

const theme = themeOf("moss", "dark");
const cards: GlyphCard[] = [
  { id: "night-owl", name: "Night Owl", rarity: "common", line: "The quiet hours are yours.", art: GLYPHS.owl },
  { id: "dragon-hoard", name: "Dragon Hoard", rarity: "legendary", line: "Yours does.", art: GLYPHS.dragon },
];
const levels = Array.from({ length: 30 * 7 }, (_unused, cell) => (cell * 7) % 5);
const describeDay = (cell: number) => `day ${cell + 1}`;
const OPENED = ["night-owl"];

/*
 * A hunt restyled with nothing but Tailwind utilities, and next to it one that is left alone. e2e/tailwind.spec.ts
 * reads the computed styles of both: the utilities have to win on the first, and Tailwind's reset must not reach
 * into the second.
 */
function Page() {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 p-8">
      <div id="styled">
        <CardHunt
          cards={cards}
          opened={OPENED}
          onOpen={noop}
          levels={levels}
          theme={theme}
          describeSpot={describeDay}
          classNames={{
            root: "rounded-none p-10",
            headline: "font-serif text-5xl",
            scanButton: "rounded-md bg-pink-500 px-8 text-white",
            cell: "rounded-none",
            badge: "rounded-md",
            badgeName: "uppercase",
          }}
        />
      </div>
      <div id="plain">
        <CardHunt
          cards={cards}
          opened={OPENED}
          onOpen={noop}
          levels={levels}
          theme={theme}
          describeSpot={describeDay}
        />
      </div>
      <button id="probe" type="button" className="rounded-md bg-pink-500 px-8 font-serif text-5xl text-white uppercase">
        probe
      </button>
    </div>
  );
}

const root = document.querySelector("#root");
if (root) createRoot(root).render(<Page />);
