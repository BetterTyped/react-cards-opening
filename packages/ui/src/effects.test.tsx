import { ownTheClock, play, reduceMotion } from "../testing/clock";
import { EFFECT_SETS, effectsFor, playSteps, SIGNATURE_EFFECTS } from "./effects";
import { DEFAULT_RARITIES, tierOf } from "@react-cards-opening/core";
import { isEffectName } from "@react-cards-opening/effects";

function stage(): HTMLElement {
  const room = document.createElement("div");
  const layer = document.createElement("div");
  layer.className = "rco-fx-layer";
  room.append(layer);
  document.body.append(room);
  return layer;
}

describe("a plan of effects", () => {
  const legendary = tierOf(DEFAULT_RARITIES, "legendary");
  const common = tierOf(DEFAULT_RARITIES, "common");

  it("answers by what a tier does, and by its id first", () => {
    const plan = { quiet: ["sparks"], legendary: ["nova"], common: ["glitter"] } as const;

    expect(effectsFor(plan, legendary)).toEqual(["nova"]);
    expect(effectsFor(plan, common)).toEqual(["glitter"]);
    expect(effectsFor(plan, tierOf(DEFAULT_RARITIES, "rare"))).toEqual(["sparks"]);
    expect(effectsFor(plan, tierOf(DEFAULT_RARITIES, "epic"))).toEqual([]);
    expect(effectsFor(undefined, legendary)).toEqual([]);
  });

  it("ships sets that only name real effects and grow louder with the tier", () => {
    for (const [id, set] of Object.entries(EFFECT_SETS)) {
      for (const name of [...set.quiet, ...set.loud, ...set.legendary])
        expect(isEffectName(name), `${id}: ${name}`).toBe(true);
      expect(set.legendary.length, id).toBeGreaterThan(set.loud.length);
      expect(set.loud.length, id).toBeGreaterThan(set.quiet.length);
    }
  });
});

describe("the signature shows", () => {
  const names = (tier: string) =>
    (SIGNATURE_EFFECTS[tier as keyof typeof SIGNATURE_EFFECTS] ?? []).map((step) =>
      typeof step === "string" ? step : step.effect,
    );

  it("give each of the six default tiers a show, made of real effects", () => {
    for (const tier of DEFAULT_RARITIES) {
      expect(names(tier.id).length, tier.id).toBeGreaterThanOrEqual(2);
      expect(
        names(tier.id).every((name) => isEffectName(name)),
        tier.id,
      ).toBe(true);
    }
  });

  it("are different shows, not one show in six colours: no two tiers share more than a couple of effects", () => {
    const tiers = DEFAULT_RARITIES.map((tier) => tier.id);
    for (const [index, one] of tiers.entries()) {
      for (const other of tiers.slice(index + 1)) {
        const shared = names(one).filter((name) => names(other).includes(name));
        expect(shared.length, `${one} and ${other} share ${shared.join(", ")}`).toBeLessThanOrEqual(2);
      }
      // And each has something no other tier has.
      const own = names(one).filter((name) => tiers.every((other) => other === one || !names(other).includes(name)));
      expect(own.length, `${one} has effects of its own`).toBeGreaterThanOrEqual(2);
    }
  });

  it("grow with the tier: a mythic's show has more to it than a legendary's, and so on down", () => {
    const sizes = DEFAULT_RARITIES.map((tier) => names(tier.id).length);

    expect(sizes).toEqual(sizes.toSorted((a, b) => a - b));
    expect(sizes.at(-1)).toBeGreaterThanOrEqual(12);
  });

  it("have a show for a tier that is not one of the six, by what it does", () => {
    const relic = { id: "relic", label: "Relic", weight: 1, effect: "loud" } as const;
    const beyond = { id: "beyond", label: "Beyond", weight: 1, effect: "mythic" } as const;

    expect(effectsFor(SIGNATURE_EFFECTS, relic)).toBe(SIGNATURE_EFFECTS.loud);
    expect(effectsFor(SIGNATURE_EFFECTS, beyond)).toBe(SIGNATURE_EFFECTS.mythic);
    // A plan written for three levels gives a mythic its loudest.
    expect(effectsFor(EFFECT_SETS.storm, beyond)).toBe(EFFECT_SETS.storm.legendary);
    expect(effectsFor(false, beyond)).toEqual([]);
  });
});

describe("the steps of a show", () => {
  let release: () => void;
  let motion: () => void;

  beforeEach(() => {
    release = ownTheClock();
    motion = reduceMotion(false);
  });

  afterEach(() => {
    release();
    motion();
    document.body.replaceChildren();
  });

  it("play at their own moment, and after their own delay", async () => {
    const layer = stage();
    const steps = [{ effect: "converge", on: "hum" }, "nova", { effect: "rays", delay: 0.4 }] as const;

    expect(playSteps(layer, steps, { moment: "hum" })).not.toBeNull();
    expect(layer.querySelector(".rco-fx-converge")).not.toBeNull();
    expect(layer.querySelector(".rco-fx-nova")).toBeNull();

    playSteps(layer, steps, { moment: "turn" });
    await play(0.05);
    expect(layer.querySelector(".rco-fx-nova")).not.toBeNull();
    expect(layer.querySelector(".rco-fx-rays")).toBeNull();

    await play(0.45);
    expect(layer.querySelector(".rco-fx-rays")).not.toBeNull();
  });

  it("answer nothing when no step belongs to the moment", () => {
    const layer = stage();

    expect(playSteps(layer, ["nova"], { moment: "hum" })).toBeNull();
    expect(layer.querySelector(".rco-fx-play")).toBeNull();
  });
});
