import { act, renderHook } from "@testing-library/react";

import type { OpeningCard } from "./opening";
import { pickSpot, useCardSpots } from "./spots";
import { useCardOpening, useOpeningPhase } from "./use-card-opening";
import { useOpenedCards } from "./use-opened-cards";

const CARDS: OpeningCard[] = [
  { id: "fox", rarity: "common" },
  { id: "owl", rarity: "epic" },
];

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("useOpenedCards", () => {
  it("remembers opened cards under its key and reads them back", () => {
    const first = renderHook(() => useOpenedCards("deal:ada"));
    act(() => first.result.current.open("fox"));
    act(() => first.result.current.open("fox"));

    expect(first.result.current.opened).toEqual(["fox"]);

    const second = renderHook(() => useOpenedCards("deal:ada"));
    expect(second.result.current.ready).toBe(true);
    expect(second.result.current.opened).toEqual(["fox"]);
  });

  it("starts a new deal unopened", () => {
    const first = renderHook(() => useOpenedCards("deal:ada"));
    act(() => first.result.current.open("fox"));

    expect(renderHook(() => useOpenedCards("deal:grace")).result.current.opened).toEqual([]);
  });

  it("keeps working when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    const { result } = renderHook(() => useOpenedCards("deal:ada"));
    act(() => result.current.open("owl"));

    expect(result.current.ready).toBe(true);
    expect(result.current.opened).toEqual(["owl"]);
  });

  it("ignores stored junk", () => {
    window.localStorage.setItem("deal:ada", '{"fox":true}');

    expect(renderHook(() => useOpenedCards("deal:ada")).result.current.opened).toEqual([]);
  });

  it("forgets everything on reset", () => {
    const { result } = renderHook(() => useOpenedCards("deal:ada"));
    act(() => result.current.open("fox"));
    act(() => result.current.reset());

    expect(result.current.opened).toEqual([]);
    expect(window.localStorage.getItem("deal:ada")).toBeNull();
  });

  it("keeps a keyless deal in memory only", () => {
    const { result } = renderHook(() => useOpenedCards(null));
    act(() => result.current.open("fox"));

    expect(result.current.opened).toEqual(["fox"]);
    expect(window.localStorage.length).toBe(0);
  });
});

describe("pickSpot", () => {
  it("hides on a lit cell nobody holds", () => {
    const levels = [0, 2, 0, 3, 1];

    for (let round = 0; round < 40; round += 1) expect([1, 4]).toContain(pickSpot(levels, [3]));
  });

  it("falls back to any free cell when nothing is lit", () => {
    expect(pickSpot([0, 0, 0], [0, 2])).toBe(1);
  });

  it("takes its randomness from the source it is given", () => {
    expect(pickSpot([1, 1, 1, 1], [], () => 0.99)).toBe(3);
    expect(pickSpot([1, 1, 1, 1], [], () => 0)).toBe(0);
  });
});

describe("useCardSpots", () => {
  it("brings the spots back after a reload", () => {
    const first = renderHook(() => useCardSpots("spots:ada"));
    act(() => first.result.current[1]({ fox: 12 }));

    const second = renderHook(() => useCardSpots("spots:ada"));
    expect(second.result.current[0]).toEqual({ fox: 12 });
  });

  it("drops stored values that are not cells", () => {
    window.sessionStorage.setItem("spots:ada", '{"fox":4,"owl":"nine"}');

    expect(renderHook(() => useCardSpots("spots:ada")).result.current[0]).toEqual({ fox: 4 });
  });
});

describe("useCardOpening", () => {
  function setup() {
    const onRunChange = vi.fn<(running: boolean) => void>();
    const hook = renderHook(() => {
      const store = useOpenedCards(null);
      const opening = useCardOpening({ cards: CARDS, opened: store.opened, onOpen: store.open, onRunChange });
      return { ...opening, phase: useOpeningPhase(opening.opening) };
    });
    return { ...hook, onRunChange };
  }

  it("walks a run from the first card to rest", () => {
    const { result, onRunChange } = setup();

    act(() => void result.current.start());
    expect(result.current.current?.id).toBe("fox");
    expect(result.current.left).toBe(1);
    expect(result.current.running).toBe(true);
    expect(onRunChange).toHaveBeenLastCalledWith(true);

    act(() => {
      result.current.opening.enter("turn");
      result.current.opening.reveal();
    });
    expect(result.current.phase).toBe("turn");
    expect(result.current.pending.map((card) => card.id)).toEqual(["owl"]);

    act(() => result.current.opening.landed());
    expect(result.current.current?.id).toBe("owl");
    expect(result.current.left).toBe(0);

    act(() => {
      result.current.opening.reveal();
      result.current.opening.landed();
    });
    expect(result.current.running).toBe(false);
    expect(result.current.allOpened).toBe(true);
    expect(onRunChange).toHaveBeenLastCalledWith(false);
  });

  it("opens only the queue it is given", () => {
    const { result } = setup();

    act(() => void result.current.start(["owl"]));

    expect(result.current.current?.id).toBe("owl");
    expect(result.current.left).toBe(0);
  });

  it("opens everything at once", () => {
    const { result } = setup();

    act(() => result.current.openAll());

    expect(result.current.allOpened).toBe(true);
    expect(result.current.running).toBe(false);
  });
});
