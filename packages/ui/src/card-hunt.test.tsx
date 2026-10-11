import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ownTheClock, play, reduceMotion } from "../testing/clock";
import { CardHunt, type CardHuntProps } from "./card-hunt";
import { GLYPHS } from "./glyphs";
import type { GlyphCard } from "./types";
import { useOpenedCards } from "@react-cards-opening/core";

const CARDS: GlyphCard[] = [
  { id: "fox", name: "Lantern Fox", rarity: "rare", line: "Knows a shortcut.", art: GLYPHS.fox },
  { id: "dragon", name: "Vault Dragon", rarity: "legendary", line: "Keeps one of every card.", art: GLYPHS.dragon },
];

const LEVELS = Array.from({ length: 70 }, (_unused, cell) => (cell % 3 === 0 ? 0 : 2));

function Hunt({ onOpen, ...rest }: Partial<CardHuntProps<GlyphCard>> & { onOpen?: (id: string) => void }) {
  const { opened, open } = useOpenedCards(null);
  return (
    <CardHunt
      cards={CARDS}
      levels={LEVELS}
      {...rest}
      opened={opened}
      onOpen={(id) => {
        open(id);
        onOpen?.(id);
      }}
    />
  );
}

const overlay = () => within(document.body.querySelector<HTMLElement>(".rco-stage") as HTMLElement);

describe("CardHunt", () => {
  let release: () => void;
  let motion: () => void;

  beforeEach(() => {
    release = ownTheClock();
    motion = reduceMotion(false);
  });

  afterEach(() => {
    release();
    motion();
  });

  it("says how many cards are hiding and offers the scan", () => {
    render(<Hunt />);

    expect(screen.getByText("2 cards are hiding in here.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scan" })).toBeEnabled();
    expect(screen.getAllByText("Still hidden")).toHaveLength(2);
    expect(document.querySelectorAll(".rco-cell[data-cell]")).toHaveLength(LEVELS.length);
  });

  it("renders nothing for an empty deal", () => {
    const { container } = render(<Hunt cards={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("finds a card, shows it face up, and lists it once it has landed", async () => {
    const onOpen = vi.fn<(id: string) => void>();
    const user = userEvent.setup();
    render(<Hunt cards={[CARDS[0]]} onOpen={onOpen} />);

    await user.click(screen.getByRole("button", { name: "Scan" }));
    expect(screen.getByText("Scanning for the last one.")).toBeInTheDocument();
    expect(onOpen).not.toHaveBeenCalled();

    // The sweep, the lock, the crack, the flight, the hum and the turn.
    await play(8);
    expect(onOpen).toHaveBeenCalledExactlyOnceWith("fox");
    expect(overlay().getByText("Lantern Fox")).toBeInTheDocument();
    expect(overlay().getByText("Rare")).toBeInTheDocument();

    // The hold and the way home.
    await play(6);
    expect(screen.getByText("You found all 1.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scan again" })).toBeEnabled();
    expect(screen.getByTitle("Open this card")).toHaveTextContent("Lantern Fox");
    expect(document.querySelectorAll(".rco-cell[data-found]")).toHaveLength(1);
  });

  it("opens the rest at once on Find all", async () => {
    const onOpen = vi.fn<(id: string) => void>();
    const user = userEvent.setup();
    render(<Hunt onOpen={onOpen} />);

    await user.click(screen.getByRole("button", { name: "Scan" }));
    await user.click(screen.getByRole("button", { name: "Find all" }));

    expect(onOpen.mock.calls.map(([id]) => id)).toEqual(["fox", "dragon"]);
    expect(screen.getByText("You found all 2.")).toBeInTheDocument();
    expect(screen.queryByText("Still hidden")).not.toBeInTheDocument();
  });

  it("puts a face-down card back unopened when the backdrop is pressed", async () => {
    const onOpen = vi.fn<(id: string) => void>();
    const user = userEvent.setup();
    render(<Hunt cards={[CARDS[0]]} onOpen={onOpen} />);
    await user.click(screen.getByRole("button", { name: "Scan" }));
    // Into the flight: the card is out and still face down.
    await play(5.2);

    await user.click(document.body.querySelector(".rco-backdrop") as HTMLElement);
    await play(1);

    expect(onOpen).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Scan" })).toBeEnabled();
    expect(screen.getByText("Still hidden")).toBeInTheDocument();
  });

  it("turns the card early on a press and sends it home on the next", async () => {
    const onOpen = vi.fn<(id: string) => void>();
    const user = userEvent.setup();
    render(<Hunt cards={[CARDS[0]]} onOpen={onOpen} />);
    await user.click(screen.getByRole("button", { name: "Scan" }));
    await play(5.2);
    const card = overlay().getByRole("button", { name: "Turn the card over, then keep it" });

    await user.click(card);
    await play(0.2);
    await user.click(card);
    await play(1.5);

    expect(onOpen).toHaveBeenCalledExactlyOnceWith("fox");
    expect(screen.getByText("You found all 1.")).toBeInTheDocument();
  });

  it("brings a found card up again from its badge and gives focus back on Escape", async () => {
    const user = userEvent.setup();
    render(<Hunt cards={[CARDS[0]]} />);
    await user.click(screen.getByRole("button", { name: "Scan" }));
    await user.click(screen.queryByRole("button", { name: "Find all" }) ?? document.body);
    await play(15);
    const badge = screen.getByTitle("Open this card");

    await user.click(badge);
    await play(1);
    expect(overlay().getByRole("button", { name: "Close this card" })).toHaveFocus();

    await user.keyboard("{Escape}");
    await play(1);

    expect(badge).toHaveFocus();
    expect(badge).toBeEnabled();
  });

  it("shows a found card right after Find all, while the reveal it cut short is still fading", async () => {
    const user = userEvent.setup();
    render(<Hunt />);
    await user.click(screen.getByRole("button", { name: "Scan" }));
    // Far enough for a card to be in the air, so there is something to fade out.
    await play(5);
    await user.click(screen.getByRole("button", { name: "Find all" }));

    await user.click(screen.getAllByTitle("Open this card")[0]);
    await play(1.2);

    const flyer = document.body.querySelector<HTMLElement>(".rco-flyer");
    expect(flyer?.style.visibility).not.toBe("hidden");
    expect(Number(flyer?.style.opacity)).toBe(1);
    expect(overlay().getByRole("button", { name: "Close this card" })).toHaveFocus();
  });

  it("still opens every card for someone who asked for less motion", async () => {
    motion();
    motion = reduceMotion(true);
    const onOpen = vi.fn<(id: string) => void>();
    const user = userEvent.setup();
    render(<Hunt cards={[CARDS[1]]} onOpen={onOpen} />);

    await user.click(screen.getByRole("button", { name: "Scan" }));
    // No sweep and no flight to wait for: the lock, the crack, the turn, and the rays a loud tier still gets.
    await play(6.4);
    expect(onOpen).toHaveBeenCalledExactlyOnceWith("dragon");

    await play(8);
    expect(screen.getByText("You found all 1.")).toBeInTheDocument();
  });

  it("says what it is told to say", () => {
    render(
      <Hunt
        labels={{
          headline: ({ pending }) => `${pending} to go`,
          scan: () => "Search the board",
          hidden: "Not yet",
        }}
      />,
    );

    expect(screen.getByText("2 to go")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search the board" })).toBeInTheDocument();
    expect(screen.getAllByText("Not yet")).toHaveLength(2);
  });

  it("puts a class of the page's own on any part, next to the library's", async () => {
    const user = userEvent.setup();
    render(
      <Hunt
        cards={[CARDS[1]]}
        classNames={{
          root: "my-panel",
          headline: "my-headline",
          scanButton: "my-button",
          scan: "my-scan",
          cell: "my-cell",
          badge: "my-badge",
          stage: "my-stage",
          face: "my-face",
          name: "my-name",
          foilBorder: "my-foil",
        }}
      />,
    );

    expect(document.querySelector(".rco-hunt")).toHaveClass("my-panel");
    expect(screen.getByText("1 card is hiding in here.")).toHaveClass("rco-hunt-headline", "my-headline");
    expect(screen.getByRole("button", { name: "Scan" })).toHaveClass("rco-button-main", "my-button");
    expect(document.querySelector(".rco-scan")).toHaveClass("my-scan");
    expect(document.querySelectorAll(".rco-cell.my-cell")).toHaveLength(LEVELS.length);
    expect(document.querySelector(".rco-badge")).toHaveClass("my-badge");

    await user.click(screen.getByRole("button", { name: "Scan" }));
    expect(document.body.querySelector(".rco-stage")).toHaveClass("my-stage");
    expect(document.body.querySelector(".rco-stage .rco-face")).toHaveClass("my-face");
    expect(document.body.querySelector(".rco-stage .rco-card-name")).toHaveClass("rco-line", "my-name");
    expect(document.body.querySelector(".rco-stage .rco-legend-border")).toHaveClass("my-foil");
  });

  it("gives a legendary its foil and leaves it off a rare", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Hunt cards={[CARDS[1]]} />);
    await user.click(screen.getByRole("button", { name: "Scan" }));
    expect(document.body.querySelector(".rco-stage .rco-legend-border")).toBeInTheDocument();
    expect(document.body.querySelectorAll(".rco-stage .rco-sparkle")).toHaveLength(16);
    unmount();

    render(<Hunt cards={[CARDS[0]]} />);
    await user.click(screen.getByRole("button", { name: "Scan" }));
    expect(document.body.querySelector(".rco-stage .rco-legend-border")).not.toBeInTheDocument();
  });

  it("keeps two hunts on one page apart", async () => {
    const first = vi.fn<(id: string) => void>();
    const second = vi.fn<(id: string) => void>();
    const user = userEvent.setup();
    render(
      <>
        <Hunt onOpen={first} />
        <Hunt onOpen={second} />
      </>,
    );
    const [scanFirst] = screen.getAllByRole("button", { name: "Scan" });

    await user.click(scanFirst);
    await user.click(screen.getByRole("button", { name: "Find all" }));

    expect(first).toHaveBeenCalledTimes(2);
    expect(second).not.toHaveBeenCalled();
    expect(screen.getAllByRole("button", { name: "Scan" })).toHaveLength(1);
  });
});
