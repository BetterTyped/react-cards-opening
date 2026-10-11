import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { gsap } from "gsap";

import { ownTheClock, play, reduceMotion } from "../testing/clock";
import { CardCase } from "./card-case";
import { CardHunt } from "./card-hunt";
import { CardPack, type CardPackProps } from "./card-pack";
import { CardSpin } from "./card-spin";
import { CardWheel } from "./card-wheel";
import { EFFECT_SETS, type EffectPlan } from "./effects";
import { GLYPHS } from "./glyphs";
import type { GlyphCard } from "./types";
import { useOpenedCards } from "@react-cards-opening/core";

const CARDS: GlyphCard[] = [
  { id: "fox", name: "Lantern Fox", rarity: "rare", line: "Knows a shortcut.", art: GLYPHS.fox },
  { id: "owl", name: "Night Owl", rarity: "common", line: "Up late again.", art: GLYPHS.owl },
  { id: "dragon", name: "Vault Dragon", rarity: "legendary", line: "Keeps one of every card.", art: GLYPHS.dragon },
];

type Opener = "pack" | "spin" | "wheel" | "case" | "hunt";

function Game({
  kind,
  onOpen,
  effects,
  cards = CARDS,
  ...pack
}: {
  kind: Opener;
  onOpen?: (id: string) => void;
  effects?: EffectPlan;
  cards?: GlyphCard[];
} & Partial<CardPackProps<GlyphCard>>) {
  const { opened, open } = useOpenedCards(null);
  const shared = {
    cards,
    opened,
    effects,
    onOpen: (id: string) => {
      open(id);
      onOpen?.(id);
    },
  };
  if (kind === "pack") return <CardPack {...pack} {...shared} />;
  if (kind === "spin") return <CardSpin {...shared} />;
  if (kind === "wheel") return <CardWheel {...shared} />;
  if (kind === "case") return <CardCase {...shared} />;
  return <CardHunt {...shared} levels={Array.from({ length: 70 }, (_unused, cell) => (cell % 3 === 0 ? 0 : 2))} />;
}

const overlay = () => within(document.body.querySelector<HTMLElement>(".rco-stage") as HTMLElement);
const faceDown = () => document.querySelectorAll(".rco-pack-seat:not([data-up])");

describe("the new openers", () => {
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

  describe("CardPack", () => {
    it("starts sealed, and says what is inside", () => {
      render(<Game kind="pack" />);

      expect(screen.getByRole("button", { name: "Open the pack" })).toBeEnabled();
      expect(screen.getByText("3 cards inside. Press the pack.")).toBeInTheDocument();
      expect(document.querySelector(".rco-pack")).toHaveAttribute("data-stage", "sealed");
      expect(document.querySelectorAll(".rco-pack-seat")).toHaveLength(0);
    });

    it("deals every card face down when the pack is pressed, and opens none of them", async () => {
      const onOpen = vi.fn<(id: string) => void>();
      const user = userEvent.setup();
      render(<Game kind="pack" onOpen={onOpen} />);

      await user.click(screen.getByRole("button", { name: "Open the pack" }));
      await play(2);

      expect(document.querySelector(".rco-pack")).toHaveAttribute("data-stage", "dealt");
      expect(faceDown()).toHaveLength(3);
      expect(screen.getAllByRole("button", { name: "Turn this card over" })).toHaveLength(3);
      expect(screen.getByText("3 to turn.")).toBeInTheDocument();
      expect(onOpen).not.toHaveBeenCalled();
    });

    it("turns cards over in any order, one press each, and gathers them on Done", async () => {
      const onOpen = vi.fn<(id: string) => void>();
      const onDone = vi.fn<() => void>();
      const user = userEvent.setup();
      render(<Game kind="pack" onOpen={onOpen} onDone={onDone} />);
      await user.click(screen.getByRole("button", { name: "Open the pack" }));
      await play(2);

      const turn = () => screen.getAllByRole("button", { name: "Turn this card over" });
      await user.click(turn()[2] as HTMLElement);
      expect(onOpen).toHaveBeenLastCalledWith("dragon");
      expect(faceDown()).toHaveLength(2);
      expect(screen.queryByRole("button", { name: "Done" })).toBeNull();

      await user.click(turn()[0] as HTMLElement);
      await user.click(turn()[0] as HTMLElement);
      expect(onOpen.mock.calls.map(([id]) => id)).toEqual(["dragon", "fox", "owl"]);
      expect(screen.getByText("That is all of them.")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Done" }));
      expect(onDone).toHaveBeenCalledOnce();
      expect(document.querySelector(".rco-pack")).toHaveAttribute("data-stage", "done");
      expect(screen.getByText("3 cards, all yours.")).toBeInTheDocument();

      // Dealt again, they are face down again, and turning them opens nothing a second time.
      await user.click(screen.getByRole("button", { name: "Deal them again" }));
      expect(document.querySelector(".rco-pack")).toHaveAttribute("data-stage", "sealed");
    });

    it("gives a rarer card rays of its own and a common one none", async () => {
      const user = userEvent.setup();
      render(<Game kind="pack" />);
      await user.click(screen.getByRole("button", { name: "Open the pack" }));
      await play(2);

      const seats = [...document.querySelectorAll(".rco-pack-seat")];

      expect(seats.map((seat) => seat.getAttribute("data-effect"))).toEqual(["quiet", "quiet", "legendary"]);
      expect(seats.map((seat) => seat.querySelector(".rco-pack-rays") !== null)).toEqual([false, false, true]);
    });

    it("plays its plan of effects as a card turns, in that card's colour", async () => {
      const user = userEvent.setup();
      render(<Game kind="pack" effects={EFFECT_SETS.radiant} />);
      await user.click(screen.getByRole("button", { name: "Open the pack" }));
      await play(2);

      await user.click(screen.getAllByRole("button", { name: "Turn this card over" })[2] as HTMLElement);
      await play(0.3);

      const layer = document.querySelector(".rco-pack .rco-fx-layer");
      expect(layer?.querySelector(".rco-fx-nova")).not.toBeNull();
      expect(layer?.querySelector(".rco-fx-pillar")).not.toBeNull();

      await play(5);
      expect(layer?.querySelector(".rco-fx-play")).toBeNull();
    });

    it("renders nothing for an empty pack", () => {
      const { container } = render(<Game kind="pack" cards={[]} />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("CardSpin", () => {
    it("spins once a press, stops on the next card, and shows it", async () => {
      const onOpen = vi.fn<(id: string) => void>();
      const user = userEvent.setup();
      render(<Game kind="spin" onOpen={onOpen} />);

      expect(screen.getByText("3 spins left.")).toBeInTheDocument();
      expect(document.querySelectorAll(".rco-reel-tile").length).toBeGreaterThan(40);
      await user.click(screen.getByRole("button", { name: "Spin" }));
      expect(screen.getByText("Spinning.")).toBeInTheDocument();
      expect(onOpen).not.toHaveBeenCalled();

      // The spin, the lock, the flight and the turn.
      await play(9);
      expect(onOpen).toHaveBeenCalledExactlyOnceWith("fox");
      expect(overlay().getByText("Lantern Fox")).toBeInTheDocument();
      expect(document.querySelector(".rco-reel-tile[data-won]")).toHaveTextContent("Lantern Fox");

      // The hold and the way to its badge. One spin was one card.
      await play(7);
      expect(onOpen).toHaveBeenCalledOnce();
      expect(screen.getByText("2 spins left.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Spin" })).toBeEnabled();
    });

    it("hands over the rest on Take all", async () => {
      const onOpen = vi.fn<(id: string) => void>();
      const user = userEvent.setup();
      render(<Game kind="spin" onOpen={onOpen} />);

      await user.click(screen.getByRole("button", { name: "Spin" }));
      await user.click(screen.getByRole("button", { name: "Take all" }));

      expect(onOpen.mock.calls.map(([id]) => id)).toEqual(["fox", "owl", "dragon"]);
    });
  });

  describe("CardWheel", () => {
    it("has a wedge for every card of the deal, and spins once a press to the next one", async () => {
      const onOpen = vi.fn<(id: string) => void>();
      const user = userEvent.setup();
      render(<Game kind="wheel" onOpen={onOpen} />);

      expect(document.querySelectorAll(".rco-wheel-wedge")).toHaveLength(8);
      expect(screen.getByText("3 spins left.")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Spin" }));
      expect(onOpen).not.toHaveBeenCalled();

      // The spin, the stop, the flight and the turn.
      await play(9.5);
      expect(onOpen).toHaveBeenCalledExactlyOnceWith("fox");
      expect(document.querySelectorAll(".rco-wheel-wedge[data-won]")).toHaveLength(1);
      expect(overlay().getByText("Lantern Fox")).toBeInTheDocument();
    });

    it("stops with the winner's wedge under the pointer, however often it has spun", async () => {
      const user = userEvent.setup();
      render(<Game kind="wheel" cards={CARDS.slice(0, 2)} />);
      const turnOf = () => {
        const won = document.querySelector<HTMLElement>(".rco-wheel-wedge[data-won]");
        const disc = document.querySelector<HTMLElement>(".rco-wheel-disc");
        const wedge = Number(won?.style.getPropertyValue("--rco-wheel-turn"));
        // Where the wedge's middle stands once the disc has turned: from the top, in degrees, between -180 and 180.
        const at = (((wedge + (gsap.getProperty(disc, "rotation") as number)) % 360) + 540) % 360;
        return at - 180;
      };

      await user.click(screen.getByRole("button", { name: "Spin" }));
      await play(6.2);
      expect(Math.abs(turnOf())).toBeLessThan(22.5);

      await play(16);
      await user.click(screen.getByRole("button", { name: "Spin" }));
      await play(6.2);
      expect(Math.abs(turnOf())).toBeLessThan(22.5);
    });
  });

  describe("CardCase", () => {
    it("opens and gives up its cards one after another, each to its place on the shelf", async () => {
      const onOpen = vi.fn<(id: string) => void>();
      const user = userEvent.setup();
      render(<Game kind="case" onOpen={onOpen} cards={CARDS.slice(0, 2)} />);

      expect(screen.getByText("2 cards are in this case.")).toBeInTheDocument();
      expect(document.querySelectorAll(".rco-shelf-slot")).toHaveLength(2);
      expect(document.querySelectorAll(".rco-shelf-slot[data-open]")).toHaveLength(0);
      await user.click(screen.getByRole("button", { name: "Open the case" }));
      expect(document.querySelector(".rco-case")).toHaveAttribute("data-open");

      await play(6);
      expect(onOpen).toHaveBeenCalledExactlyOnceWith("fox");
      expect(overlay().getByText("Lantern Fox")).toBeInTheDocument();

      await play(16);
      expect(onOpen.mock.calls.map(([id]) => id)).toEqual(["fox", "owl"]);
      expect(document.querySelectorAll(".rco-shelf-slot[data-open]")).toHaveLength(2);
      expect(document.querySelector(".rco-case")).not.toHaveAttribute("data-open");
    });
  });

  describe("an effects plan on the reveal", () => {
    it("plays as the card turns, on the layer behind it, and not before", async () => {
      const user = userEvent.setup();
      render(<Game kind="spin" cards={[CARDS[2] as GlyphCard]} effects={{ legendary: ["shockwave", "flash"] }} />);

      await user.click(screen.getByRole("button", { name: "Spin" }));
      await play(5);
      const layer = document.querySelector(".rco-stage .rco-fx-layer");
      expect(layer).not.toBeNull();
      expect(layer?.querySelector(".rco-fx-play")).toBeNull();

      await play(4);
      expect(layer?.querySelector(".rco-fx-shockwave")).not.toBeNull();
      expect(layer?.querySelector(".rco-fx-flash")).not.toBeNull();
    });

    it("plays nothing for a tier the plan does not name, or when motion is reduced", async () => {
      motion();
      motion = reduceMotion(true);
      const user = userEvent.setup();
      render(<Game kind="hunt" cards={[CARDS[2] as GlyphCard]} effects={EFFECT_SETS.storm} />);

      await user.click(screen.getByRole("button", { name: "Scan" }));
      await play(4);

      expect(overlay().getByText("Vault Dragon")).toBeInTheDocument();
      expect(document.querySelector(".rco-fx-play")).toBeNull();
    });
  });
});
