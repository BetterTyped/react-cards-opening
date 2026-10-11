import { Opening, type OpeningCard, type OpeningDriver } from "./opening";

const CARDS: OpeningCard[] = [
  { id: "fox", rarity: "common" },
  { id: "owl", rarity: "rare" },
  { id: "dragon", rarity: "legendary" },
];

const press = () => vi.fn<() => void>();

function setup(opened: string[] = []) {
  // What a card comes out of is anything here: these tests have no page.
  const opening = new Opening<OpeningCard, unknown>();
  const onOpen = vi.fn<(id: string) => void>((id) => {
    opened.push(id);
    opening.sync({ cards: CARDS, opened, onOpen });
  });
  opening.sync({ cards: CARDS, opened, onOpen });
  const driver = { turn: press(), finish: press(), cancel: press(), close: press() } satisfies OpeningDriver;
  opening.attach(driver);
  return { opening, onOpen, driver };
}

/** Plays a card up to the moment it sits face up. */
function faceUp(opening: Opening<OpeningCard, unknown>) {
  opening.enter("flight");
  opening.enter("hum");
  opening.enter("turn");
  opening.reveal();
  opening.enter("hold");
}

describe("Opening", () => {
  it("queues every unopened card and skips the ones already opened", () => {
    const { opening } = setup(["owl"]);

    expect(opening.start()).toBe(true);

    expect(opening.getState().run?.queue).toEqual(["fox", "dragon"]);
    expect(opening.current()?.id).toBe("fox");
    expect(opening.getPhase()).toBe("lead");
  });

  it("has nothing to start once every card is opened", () => {
    const { opening } = setup(["fox", "owl", "dragon"]);

    expect(opening.start()).toBe(false);
    expect(opening.getState().run).toBeNull();
  });

  it("turns a face-down card on the first press and sends it home on the second", () => {
    const { opening, driver } = setup();
    opening.start();
    opening.enter("flight");
    opening.enter("hum");

    opening.pressCard();
    expect(driver.turn).toHaveBeenCalledTimes(1);
    expect(driver.finish).not.toHaveBeenCalled();
    expect(opening.getPhase()).toBe("turn");

    opening.pressCard();
    expect(driver.turn).toHaveBeenCalledTimes(1);
    expect(driver.finish).toHaveBeenCalledTimes(1);
  });

  it("opens a card once, however often the renderer says it is face up", () => {
    const { opening, onOpen } = setup();
    opening.start();
    faceUp(opening);
    opening.reveal();

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith("fox");
  });

  it("moves to the next card when one lands and rests after the last", () => {
    const { opening, onOpen } = setup();
    opening.start();

    for (const id of ["fox", "owl", "dragon"]) {
      expect(opening.current()?.id).toBe(id);
      faceUp(opening);
      opening.enter("land");
      opening.landed();
    }

    expect(onOpen.mock.calls.map(([id]) => id)).toEqual(["fox", "owl", "dragon"]);
    expect(opening.getState().run).toBeNull();
    expect(opening.getPhase()).toBe("idle");
  });

  it("puts a face-down card back unopened when the backdrop is pressed", () => {
    const { opening, onOpen, driver } = setup();
    opening.start();
    opening.enter("flight");

    opening.pressBackdrop();

    expect(driver.cancel).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
    expect(opening.getState().run).toBeNull();
    expect(opening.pending().map((card) => card.id)).toEqual(["fox", "owl", "dragon"]);
  });

  it("lets a turned card land when the backdrop is pressed, then opens nothing more", () => {
    const { opening, onOpen, driver } = setup();
    opening.start();
    faceUp(opening);

    opening.pressBackdrop();
    expect(driver.finish).toHaveBeenCalledTimes(1);
    expect(driver.cancel).not.toHaveBeenCalled();
    expect(opening.getState().run).not.toBeNull();

    opening.enter("land");
    opening.landed();

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(opening.getState().run).toBeNull();
    expect(opening.pending().map((card) => card.id)).toEqual(["owl", "dragon"]);
  });

  it("forgets a stop once the run is over, so the next run goes through every card", () => {
    const { opening } = setup();
    opening.start();
    faceUp(opening);
    opening.pressBackdrop();
    opening.enter("land");
    opening.landed();

    opening.start();
    faceUp(opening);
    opening.enter("land");
    opening.landed();

    expect(opening.current()?.id).toBe("dragon");
  });

  it("ignores presses while the card is on its way home", () => {
    const { opening, driver } = setup();
    opening.start();
    faceUp(opening);
    opening.enter("land");

    opening.pressCard();
    opening.pressBackdrop();

    expect(driver.finish).not.toHaveBeenCalled();
    expect(driver.cancel).not.toHaveBeenCalled();
  });

  it("opens everything at once and takes the show down", () => {
    const { opening, onOpen, driver } = setup(["fox"]);
    opening.start();
    opening.enter("flight");

    opening.openAll();

    expect(driver.cancel).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls.map(([id]) => id)).toEqual(["owl", "dragon"]);
    expect(opening.getState().run).toBeNull();
  });

  it("replays every card without opening any", () => {
    const { opening, onOpen } = setup(["fox", "owl", "dragon"]);

    expect(opening.start({ replay: true })).toBe(true);
    expect(opening.getState().run).toMatchObject({ queue: ["fox", "owl", "dragon"], replay: true });

    faceUp(opening);
    opening.enter("land");
    opening.landed();

    expect(onOpen).not.toHaveBeenCalled();
    expect(opening.current()?.id).toBe("owl");
  });

  it("gives every run a new id, so the same cards replay from the start", () => {
    const { opening } = setup(["fox", "owl", "dragon"]);
    opening.start({ replay: true });
    const first = opening.getState().run?.id;
    opening.pressBackdrop();

    opening.start({ replay: true });

    expect(opening.getState().run?.id).not.toBe(first);
  });

  it("peeks at an opened card and puts it back on a press", () => {
    const { opening, driver } = setup(["fox"]);
    const badge = { name: "badge" };

    opening.peek("fox", badge);
    expect(opening.current()?.id).toBe("fox");
    expect(opening.getState().peek?.origin).toBe(badge);
    expect(opening.getPhase()).toBe("peek");

    opening.pressCard();
    expect(driver.close).toHaveBeenCalledTimes(1);

    opening.closed();
    expect(opening.getState().peek).toBeNull();
    expect(opening.getPhase()).toBe("idle");
  });

  it("does not start a run over a peeked card, or peek during a run", () => {
    const { opening } = setup(["fox"]);
    opening.peek("fox", null);
    expect(opening.start()).toBe(false);
    opening.closed();

    opening.start();
    opening.peek("fox", null);
    expect(opening.getState().peek).toBeNull();
  });

  it("tells state listeners about a new card but not about every phase", () => {
    const { opening } = setup();
    const onState = vi.fn<() => void>();
    const onPhase = vi.fn<() => void>();
    opening.subscribe(onState);
    opening.subscribePhase(onPhase);

    opening.start();
    faceUp(opening);

    expect(onState).toHaveBeenCalledTimes(1);
    expect(onPhase).toHaveBeenCalledTimes(5);
  });

  it("stops asking a renderer that has let go", () => {
    const { opening, driver } = setup();
    const detach = opening.attach(driver);
    detach();
    opening.start();
    opening.enter("flight");

    opening.pressCard();

    expect(driver.turn).not.toHaveBeenCalled();
  });
});
