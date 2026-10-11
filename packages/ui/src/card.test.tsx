import { render, screen } from "@testing-library/react";

import { Card } from "./card";
import { GLYPHS } from "./glyphs";
import { themeOf } from "./theme";
import type { RarityTier } from "@react-cards-opening/core";

const DRAGON = {
  id: "dragon",
  name: "Vault Dragon",
  rarity: "legendary",
  line: "Keeps one of every card.",
  art: GLYPHS.dragon,
};

describe("Card", () => {
  it("draws the ready-made face: the name, the tier as a word, the line", () => {
    render(<Card card={DRAGON} />);

    expect(screen.getByText("Vault Dragon")).toBeInTheDocument();
    expect(screen.getByText("Legendary")).toBeInTheDocument();
    expect(screen.getByText("Keeps one of every card.")).toBeInTheDocument();
    expect(document.querySelectorAll(".rco-glyph-pixel")).toHaveLength(81 * 2);
  });

  it("wears its tier's colour on the theme", () => {
    const theme = themeOf("grape", "dark");
    render(<Card card={DRAGON} theme={theme} />);

    expect(document.querySelector<HTMLElement>(".rco-card")?.style.getPropertyValue("--rco-tone")).toBe(
      theme.rarity.legendary,
    );
  });

  it("gives the foil border and the shine to a legendary only", () => {
    const { rerender } = render(<Card card={DRAGON} />);
    expect(document.querySelector(".rco-legend-border")).toBeInTheDocument();
    expect(document.querySelector(".rco-foil")).toBeInTheDocument();

    rerender(<Card card={{ ...DRAGON, rarity: "epic" }} />);
    expect(document.querySelector(".rco-legend-border")).not.toBeInTheDocument();
    expect(document.querySelector(".rco-foil")).not.toBeInTheDocument();
  });

  it("follows a tier list of the page's own", () => {
    const tiers: RarityTier[] = [{ id: "gold", label: "Gold", weight: 1, effect: "legendary" }];
    render(
      <Card
        card={{ ...DRAGON, rarity: "gold" }}
        rarities={tiers}
        theme={{ ...themeOf(), rarity: { gold: "#f2cc60" } }}
      />,
    );

    expect(screen.getByText("Gold")).toBeInTheDocument();
    expect(document.querySelector(".rco-legend-border")).toBeInTheDocument();
    expect(document.querySelector<HTMLElement>(".rco-card")?.style.getPropertyValue("--rco-tone")).toBe("#f2cc60");
  });

  it("opens a card of an unknown tier quietly, in the muted colour", () => {
    const theme = themeOf();
    render(<Card card={{ ...DRAGON, rarity: "mythic" }} theme={theme} />);

    expect(document.querySelector(".rco-card")).toHaveAttribute("data-effect", "quiet");
    expect(document.querySelector<HTMLElement>(".rco-card")?.style.getPropertyValue("--rco-tone")).toBe(theme.muted);
  });

  it("hands a face of the page's own the tone and the tier", () => {
    render(<Card rarity="epic">{({ tone, tier }) => <p data-tone={tone}>{tier.label} creature</p>}</Card>);

    expect(screen.getByText("Epic creature")).toHaveAttribute("data-tone", themeOf().rarity.epic);
  });

  it("lies face down when told to", () => {
    const { rerender } = render(<Card card={DRAGON} faceDown />);
    expect(document.querySelector(".rco-card")).toHaveAttribute("data-down");

    rerender(<Card card={DRAGON} />);
    expect(document.querySelector(".rco-card")).not.toHaveAttribute("data-down");
  });
});
