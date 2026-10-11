import { holdSeconds, readingSeconds, wordsToRead } from "./reading";
import { showFor } from "./show";

describe("showFor", () => {
  it("keeps quiet tiers to a hop and a burst", () => {
    expect(showFor("quiet")).toMatchObject({
      jolt: false,
      hum: { kind: "hop", seconds: 0.4 },
      rays: false,
      legendary: false,
      minHoldSeconds: 1.75,
    });
  });

  it("shakes a loud tier and opens the rays", () => {
    expect(showFor("loud")).toMatchObject({ jolt: true, hum: { kind: "shake", seconds: 0.4 }, rays: true });
    expect(showFor("loud").legendary).toBe(false);
  });

  it("gives a legendary the longest hum and hold", () => {
    expect(showFor("legendary")).toMatchObject({
      hum: { kind: "shake", seconds: 0.7 },
      legendary: true,
      minHoldSeconds: 2.65,
    });
  });

  it("drops the hum, the flight and the legendary show when motion is reduced", () => {
    expect(showFor("legendary", true)).toMatchObject({
      hum: null,
      legendary: false,
      flightSeconds: 0.01,
      flipSeconds: 0.01,
      minHoldSeconds: 1,
    });
  });
});

describe("reading time", () => {
  it("counts a sentence in full and a lone word at a glance", () => {
    expect(wordsToRead(["You shipped on a Sunday"])).toBe(5);
    expect(wordsToRead(["Legendary"])).toBeCloseTo(0.6);
    expect(wordsToRead(["Oct"])).toBeCloseTo(0.1);
    expect(wordsToRead(["", "  "])).toBe(0);
  });

  it("reads four words a second after a short lead", () => {
    expect(readingSeconds(["one two three four five six seven eight"])).toBeCloseTo(2.8);
  });

  it("never holds a card for less than its show takes", () => {
    expect(holdSeconds(["Fox"], showFor("legendary"))).toBe(2.65);
    expect(
      holdSeconds(["a long line that takes a good while to read through to its very end"], showFor("quiet")),
    ).toBeCloseTo(4.55);
  });
});
