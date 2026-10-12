import { render } from "@testing-library/react";
import { gsap } from "gsap";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createRef } from "react";

import { ownTheClock, play, reduceMotion } from "../testing/clock";
import { EffectLayer, type EffectLayerHandle } from "./effect-layer";
import { clearEffects, EFFECT_KINDS, EFFECT_LIST, EFFECTS, isEffectName, playEffects } from "./effects";
import type { EffectStage } from "./stage";
import { corners, drawing, onEdge, spawn } from "./stage";

const css = readFileSync(path.join(import.meta.dirname, "styles.css"), "utf8");

/** Dice that roll the same way every time for the same word. */
function createRng(seed: string): { next: () => number } {
  let state = [...seed].reduce((sum, char) => (sum * 31 + char.codePointAt(0)!) | 0, 7) || 1;
  return {
    next: () => {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

function stage(): HTMLElement {
  const room = document.createElement("div");
  const layer = document.createElement("div");
  layer.className = "rco-fx-layer";
  room.append(layer);
  document.body.append(room);
  return layer;
}

describe("the effects", () => {
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

  it("are dozens, each under its own name, with something to say for itself", () => {
    const names = EFFECT_LIST.map((effect) => effect.name);

    expect(names.length).toBeGreaterThanOrEqual(48);
    expect(new Set(names).size).toBe(names.length);
    for (const { kind } of EFFECT_KINDS) {
      expect(EFFECT_LIST.filter((effect) => effect.kind === kind).length).toBeGreaterThanOrEqual(10);
    }
    for (const effect of EFFECT_LIST) {
      expect(effect.label.length, effect.name).toBeGreaterThan(2);
      expect(effect.about.length, effect.name).toBeGreaterThan(20);
      expect(effect.seconds, effect.name).toBeGreaterThan(0);
      expect(EFFECTS[effect.name]).toBe(effect);
    }
    expect(isEffectName("shockwave")).toBe(true);
    expect(isEffectName("nothing-like-it")).toBe(false);
  });

  it.each(EFFECT_LIST.map((effect) => [effect.name, effect] as const))(
    "%s plays, is drawn by the stylesheet, and cleans up after itself",
    async (_name, effect) => {
      const layer = stage();
      const random = createRng(`test:${effect.name}`);

      const timeline = playEffects(layer, effect.name, { tone: "#f5c451", random: random.next });
      const root = layer.querySelector<HTMLElement>(".rco-fx-play");

      expect(root).not.toBeNull();
      expect(root?.style.getPropertyValue("--rco-tone")).toBe("#f5c451");
      expect(timeline.duration()).toBeGreaterThanOrEqual(effect.seconds);
      // Every part an effect puts on the stage has a rule of its own. A part with none is a part nobody drew.
      const classes = [...(root?.querySelectorAll("*") ?? [])].flatMap((part) => Array.from(part.classList));
      const undrawn = [...new Set(classes)].filter((name) => !new RegExp(`\\.${name}[\\s,{:]`).test(css));
      expect(undrawn).toEqual([]);
      // Light, waves and what lies across the stage are made of parts. Particles and what only moves the stage are not.
      const drawn = effect.kind !== "particles" && !["shake", "quake", "punch"].includes(effect.name);
      expect(classes.length > 0, `${effect.name} has parts`).toBe(drawn);

      await play(effect.seconds + 0.2);

      expect(layer.querySelector(".rco-fx-play")).toBeNull();
      // Whatever shook the stage let go of it.
      const room = layer.parentElement;
      expect(["x", "y", "rotation", "skewX"].map((property) => gsap.getProperty(room, property))).toEqual([0, 0, 0, 0]);
      expect(gsap.getProperty(room, "scale")).toBe(1);
    },
  );

  it("plays several at once, centred on what it is told to celebrate", () => {
    const layer = stage();
    const card = document.createElement("div");
    layer.parentElement?.append(card);
    card.getBoundingClientRect = () => ({ left: 100, top: 40, width: 200, height: 260 }) as DOMRect;
    layer.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 }) as DOMRect;

    playEffects(layer, ["shockwave", "rays", "flash"], { at: card, tone: "#22d3ee" });
    const root = layer.querySelector<HTMLElement>(".rco-fx-play");

    expect(root?.style.getPropertyValue("--rco-fx-x")).toBe("200.0px");
    expect(root?.style.getPropertyValue("--rco-fx-y")).toBe("170.0px");
    expect(root?.style.getPropertyValue("--rco-fx-u")).toBe("200.0px");
    expect(root?.querySelector(".rco-fx-shockwave")).not.toBeNull();
    expect(root?.querySelector(".rco-fx-rays")).not.toBeNull();
    expect(root?.querySelector(".rco-fx-flash")).not.toBeNull();
  });

  it("plays nothing when motion is reduced", () => {
    motion();
    motion = reduceMotion(true);
    const layer = stage();

    const timeline = playEffects(layer, ["quake", "flash", "confetti"]);

    expect(layer.querySelector(".rco-fx-play")).toBeNull();
    expect(timeline.duration()).toBe(0);
  });

  it("takes everything off a layer when asked, mid-play", () => {
    const layer = stage();
    playEffects(layer, ["rays", "letterbox"]);
    expect(layer.querySelectorAll(".rco-fx-play")).toHaveLength(1);

    clearEffects(layer);

    expect(layer.querySelector(".rco-fx-play")).toBeNull();
  });

  it("lets an effect of the page's own draw an outline, the way the hex wave does", async () => {
    const layer = stage();

    playEffects(layer, {
      name: "triangle",
      kind: "wave",
      label: "Triangle",
      about: "Three sides, thrown out from the card.",
      seconds: 0.4,
      play: (onStage, timeline) => {
        const [line] = drawing(onStage, "hex", { tag: "polygon" });
        line?.setAttribute("points", corners(3));
        timeline.fromTo(
          line?.parentElement ?? null,
          { opacity: 1, scale: 0.3 },
          { opacity: 0, scale: 3, duration: 0.4 },
          0,
        );
      },
    });
    const points = layer.querySelector(".rco-fx-hex-line")?.getAttribute("points")?.split(" ") ?? [];

    // Three corners on a circle of 100, the first straight up.
    expect(points).toHaveLength(3);
    expect(points[0]).toBe("0.00,-100.00");
    expect(layer.querySelector("svg.rco-fx-hex")).toHaveAttribute("viewBox", "-100 -100 200 200");
    await play(0.6);
    expect(layer.querySelector(".rco-fx-play")).toBeNull();
  });

  it("takes an effect of the page's own", async () => {
    const layer = stage();
    const played = vi.fn<(stage: EffectStage) => void>();

    playEffects(layer, {
      name: "mine",
      kind: "light",
      label: "Mine",
      about: "Made up for a test.",
      seconds: 0.3,
      play: played,
    });

    expect(played).toHaveBeenCalledOnce();
    expect(played.mock.calls[0]?.[0].scale).toBe(1);
    await play(0.5);
    expect(layer.querySelector(".rco-fx-play")).toBeNull();
  });

  it("is played from an EffectLayer by its handle, and cleared when the layer goes", () => {
    const handle = createRef<EffectLayerHandle>();
    const { container, unmount } = render(
      <div>
        <EffectLayer handle={handle} tone="#a78bfa" className="mine" />
      </div>,
    );
    const layer = container.querySelector<HTMLElement>(".rco-fx-layer");

    expect(layer).toHaveClass("mine");
    expect(handle.current?.element()).toBe(layer);
    handle.current?.play("nova");
    expect(layer?.querySelector(".rco-fx-nova")).not.toBeNull();
    handle.current?.clear();
    expect(layer?.querySelector(".rco-fx-play")).toBeNull();
    handle.current?.play("halo");
    unmount();
    expect(document.querySelector(".rco-fx-play")).toBeNull();
  });
});

describe("the stylesheet", () => {
  const rules = css.replaceAll(/\/\*[\s\S]*?\*\//g, "");
  const selectors = [...rules.matchAll(/(^|[{}])\s*([^{}@]+?)\s*\{/g)]
    .map((match) => (match[2] ?? "").trim())
    .flatMap((selector) => selector.split(",").map((one) => one.trim()));

  it("only ever selects what an effect puts on the stage, at the weight of one class", () => {
    expect(selectors.length).toBeGreaterThan(60);
    expect(selectors.filter((selector) => !selector.includes("rco-fx"))).toEqual([]);
    // One class, or one attribute: nothing nested, nothing doubled, so a class of the page's own always wins.
    expect(selectors.filter((selector) => !/^(\.[\w-]+|\[class\^="rco-fx"\])$/.test(selector))).toEqual([]);
  });

  it("names no colour of its own", () => {
    expect([...rules.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((match) => match[0])).toEqual([]);
  });
});

/** A stage for a card 150 wide in the middle of an 800 by 600 layer. */
const on = (random: () => number): EffectStage => ({
  root: document.createElement("span"),
  field: { emit: () => {}, clear: () => {}, destroy: () => {}, count: () => 0 },
  x: 400,
  y: 300,
  size: 150,
  scale: 0.5,
  render: 1,
  unit: 150,
  ratio: 4 / 3,
  width: 800,
  height: 600,
  tone: "#f5c451",
  accent: "#ffffff",
  subject: null,
  random,
});

describe("particles", () => {
  it("are the same particles for the same dice", () => {
    const spec = { count: 24, speed: [100, 400], life: [0.5, 1], size: [4, 8] } as const;

    const first = spawn(on(createRng("a").next), spec);
    const again = spawn(on(createRng("a").next), spec);
    const other = spawn(on(createRng("b").next), spec);

    expect(first).toEqual(again);
    expect(first).not.toEqual(other);
    expect(first).toHaveLength(24);
  });

  it("are scaled to what they celebrate", () => {
    const [one] = spawn(
      on(() => 0.5),
      { count: 1, angle: () => 0, speed: 200, size: 10, gravity: 100 },
    );

    expect(one?.vx).toBeCloseTo(100);
    expect(one?.vy).toBeCloseTo(0);
    expect(one?.size).toBe(5);
    expect(one?.gravity).toBe(50);
  });

  it("can be born on the card's outline, where they are seen from the first frame", () => {
    const right = spawn(
      on(() => 0.5),
      { count: 1, angle: () => 0, from: "edge" },
    )[0];
    const down = spawn(
      on(() => 0.5),
      { count: 1, angle: () => Math.PI / 2, from: "edge" },
    )[0];

    // A card 150 wide and 200 tall around (400, 300): its right edge is 75 away, its foot 100.
    expect(right?.x).toBeCloseTo(400 + 75 * 0.92);
    expect(right?.y).toBeCloseTo(300);
    expect(down?.y).toBeCloseTo(300 + 100 * 0.92);
    expect(onEdge(Math.PI, 4 / 3)[0]).toBeCloseTo(-150);
  });

  it("wait their turn when they are given a delay", () => {
    const [late] = spawn(
      on(() => 0.5),
      { count: 1, delay: 0.4 },
    );

    expect(late?.age).toBe(-0.4);
  });
});
