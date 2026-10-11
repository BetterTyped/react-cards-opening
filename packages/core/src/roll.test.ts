import type { OpeningCard } from "./opening";
import { DEFAULT_RARITIES, type RarityTier, tierOf } from "./rarity";
import { chances, pickCard, rollCards } from "./roll";

const pool = (counts: Record<string, number>): OpeningCard[] =>
  Object.entries(counts).flatMap(([rarity, count]) =>
    Array.from({ length: count }, (_unused, index) => ({ id: `${rarity}-${index}`, rarity })),
  );

describe("chances", () => {
  it("shares a draw by tier weight across every card in the pool", () => {
    const odds = chances(pool({ common: 1, legendary: 1 }));

    expect(odds.get("common-0")).toBeCloseTo(55 / 59);
    expect(odds.get("legendary-0")).toBeCloseTo(4 / 59);
  });

  it("adds up to one", () => {
    const odds = chances(pool({ common: 4, rare: 3, epic: 2, legendary: 1 }));

    expect([...odds.values()].reduce((sum, chance) => sum + chance, 0)).toBeCloseTo(1);
  });

  it("gives a card with an unknown tier no chance", () => {
    const odds = chances([
      { id: "known", rarity: "common" },
      { id: "typo", rarity: "comon" },
    ]);

    expect(odds.get("known")).toBe(1);
    expect(odds.get("typo")).toBe(0);
  });
});

describe("rollCards", () => {
  const cards = pool({ common: 12, rare: 8, epic: 5, legendary: 3 });

  it("deals the same cards for the same seed", () => {
    const first = rollCards({ pool: cards, count: 6, seed: "ada:2026" });
    const second = rollCards({ pool: cards, count: 6, seed: "ada:2026" });

    expect(first.map((card) => card.id)).toEqual(second.map((card) => card.id));
    expect(rollCards({ pool: cards, count: 6, seed: "grace:2026" }).map((card) => card.id)).not.toEqual(
      first.map((card) => card.id),
    );
  });

  it("never deals a card twice", () => {
    const dealt = rollCards({ pool: cards, count: cards.length, seed: "all" });

    expect(new Set(dealt.map((card) => card.id)).size).toBe(cards.length);
  });

  it("stops at the size of the pool", () => {
    expect(rollCards({ pool: cards.slice(0, 3), count: 10, seed: "small" })).toHaveLength(3);
  });

  it("deals legendaries far less often than commons", () => {
    const even = pool({ common: 1, rare: 1, epic: 1, legendary: 1 });
    const first: Record<string, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
    for (let round = 0; round < 4000; round += 1) {
      first[rollCards({ pool: even, count: 1, seed: `round-${round}` })[0].rarity] += 1;
    }

    expect(first.common / 4000).toBeCloseTo(0.55, 1);
    expect(first.rare / 4000).toBeCloseTo(0.28, 1);
    expect(first.legendary / 4000).toBeLessThan(0.07);
    expect(first.legendary).toBeGreaterThan(0);
  });

  it("follows a custom tier list and leaves weightless tiers out", () => {
    const tiers: RarityTier[] = [
      { id: "bronze", label: "Bronze", weight: 1, effect: "quiet" },
      { id: "retired", label: "Retired", weight: 0, effect: "quiet" },
    ];

    const dealt = rollCards({ pool: pool({ bronze: 2, retired: 5 }), count: 7, rarities: tiers, seed: "custom" });

    expect(dealt.map((card) => card.rarity)).toEqual(["bronze", "bronze"]);
  });
});

describe("tierOf", () => {
  it("opens a card with an unknown tier quietly instead of throwing", () => {
    expect(tierOf(DEFAULT_RARITIES, "mythic")).toEqual({ id: "mythic", label: "mythic", weight: 0, effect: "quiet" });
  });
});

describe("pickCard", () => {
  it("leaves the card in the pool, so it can come up again", () => {
    const one = [{ id: "only", rarity: "common" }];

    expect(pickCard(one)?.id).toBe("only");
    expect(pickCard(one)?.id).toBe("only");
  });

  it("goes by tier weight and by the source it is given", () => {
    const two = [
      { id: "common", rarity: "common" },
      { id: "legendary", rarity: "legendary" },
    ];

    expect(pickCard(two, { random: () => 0 })?.id).toBe("common");
    expect(pickCard(two, { random: () => 0.99 })?.id).toBe("legendary");
  });

  it("picks evenly when no tier is known, and nothing from an empty pool", () => {
    expect(
      pickCard(
        [
          { id: "a", rarity: "?" },
          { id: "b", rarity: "?" },
        ],
        { random: () => 0.6 },
      )?.id,
    ).toBe("b");
    expect(pickCard([])).toBeUndefined();
  });
});
