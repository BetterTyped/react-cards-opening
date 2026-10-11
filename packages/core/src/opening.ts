/** The least a card needs to be opened: something to call it and the tier that picks its show. */
export interface OpeningCard {
  id: string;
  /** A tier id from the rarity list in use. */
  rarity: string;
}

/** One pass over a queue of cards, opened one after another. */
export interface OpeningRun {
  /** Changes on every run, so replaying the same cards starts fresh. */
  id: number;
  queue: readonly string[];
  /** A replay shows cards again. Nothing is opened by it, so `onOpen` stays quiet. */
  replay: boolean;
}

/**
 * A card that was already opened, brought up again to look at. It stays until it is closed. `O` is what it comes
 * out of: an element in a browser, anything else where there are none.
 */
export interface OpeningPeek<O = HTMLElement> {
  /** Changes on every peek, so looking at the same card twice starts fresh. */
  id: number;
  card: string;
  /** What was pressed. The card comes out of it and goes back into it. */
  origin: O;
}

/**
 * Where a card is in its reveal. `lead` is whatever plays before the card shows up (a scan closing in, a lid
 * lifting), `flight` its way to the middle of the screen, `hum` the wait face down, `turn` the flip, `hold` the time
 * it stays face up, and `land` its way home.
 */
export type OpeningPhase = "idle" | "lead" | "flight" | "hum" | "turn" | "hold" | "land" | "peek";

/**
 * What the opening asks of whatever draws it. The opening decides what a press means; the renderer owns the clock,
 * so it is the one that can jump a reveal ahead or take it down.
 */
export interface OpeningDriver {
  /** Turn the face-down card over now. */
  turn: () => void;
  /** Send the card home now. Call `landed` once it is there. */
  finish: () => void;
  /** Take the reveal down where it stands. Nothing lands. */
  cancel: () => void;
  /** Put a peeked card back. Call `closed` once it is away. */
  close: () => void;
}

export interface OpeningState<O = HTMLElement> {
  run: OpeningRun | null;
  /** Which card of the run's queue is up. */
  step: number;
  peek: OpeningPeek<O> | null;
}

const ORDER: readonly OpeningPhase[] = ["lead", "flight", "hum", "turn", "hold", "land"];
const TURN = ORDER.indexOf("turn");

const noop = () => {};

/**
 * The rules of a card opening, with nothing drawn: which card is up, what a press on the card or on the backdrop
 * means at each moment, when a card counts as opened, and what stopping does. It keeps no clock. A renderer plays
 * the reveal, says which phase it has reached, and is asked through its driver to jump ahead or stop.
 */
export class Opening<C extends OpeningCard = OpeningCard, O = HTMLElement> {
  private state: OpeningState<O> = { run: null, step: 0, peek: null };
  private phase: OpeningPhase = "idle";
  private readonly listeners = new Set<() => void>();
  private readonly phaseListeners = new Set<() => void>();
  private driver: OpeningDriver | null = null;
  // Once stopping, the card on screen still lands, but no further one is opened.
  private stopping = false;
  private revealed: string | null = null;
  private serial = 0;
  private cards: readonly C[] = [];
  private opened: readonly string[] = [];
  private onOpen: (id: string) => void = noop;

  /** The cards as they are now. Call it whenever they change; `useCardOpening` does on every render. */
  sync = ({
    cards,
    opened,
    onOpen,
  }: {
    cards: readonly C[];
    opened: readonly string[];
    onOpen: (id: string) => void;
  }): void => {
    this.cards = cards;
    this.opened = opened;
    this.onOpen = onOpen;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): OpeningState<O> => this.state;

  /** The phase changes several times a card, so it has its own subscription: only what shows it re-renders. */
  subscribePhase = (listener: () => void): (() => void) => {
    this.phaseListeners.add(listener);
    return () => this.phaseListeners.delete(listener);
  };

  getPhase = (): OpeningPhase => this.phase;

  /** The card that is up: the run's current one, or the one being peeked at. */
  current = (): C | null => {
    const { run, step, peek } = this.state;
    const id = run ? run.queue[step] : peek?.card;
    return this.cards.find((card) => card.id === id) ?? null;
  };

  /** Cards nobody has opened yet, in the order they were given. */
  pending = (): C[] => this.cards.filter((card) => !this.opened.includes(card.id));

  /**
   * Opens cards one after another. With nothing passed, every card still unopened. A replay goes over cards again
   * without opening anything. Answers false when there is nothing to open or a card is already up.
   */
  start = ({ queue, replay = false }: { queue?: readonly string[]; replay?: boolean } = {}): boolean => {
    if (this.state.run || this.state.peek) return false;
    const ids = queue ?? (replay ? this.cards : this.pending()).map((card) => card.id);
    if (ids.length === 0) return false;
    this.serial += 1;
    this.stopping = false;
    this.setState({ run: { id: this.serial, queue: ids, replay }, step: 0, peek: null });
    this.enter("lead");
    return true;
  };

  /** Skips the show: whatever is playing is taken down and every unopened card is opened at once. */
  openAll = (): void => {
    this.driver?.cancel();
    this.stopping = false;
    for (const card of this.pending()) this.onOpen(card.id);
    this.rest();
  };

  /** Brings an opened card up again, out of `origin`. Ignored while a run is on. */
  peek = (card: string, origin: O): void => {
    if (this.state.run) return;
    this.serial += 1;
    this.setState({ run: null, step: 0, peek: { id: this.serial, card, origin } });
    this.enter("peek");
  };

  /** Puts a peeked card back. */
  close = (): void => {
    if (this.state.peek) this.driver?.close();
  };

  /** A press on the card: face down, it turns now. Once the turn has begun, a press sends it home. */
  pressCard = (): void => {
    if (this.state.peek) {
      this.driver?.close();
      return;
    }
    if (!this.state.run || this.phase === "land") return;
    if (this.turned()) {
      this.driver?.finish();
      return;
    }
    this.driver?.turn();
    this.enter("turn");
  };

  /**
   * A press beside the card stops the run. A card already turned over has been opened, so it still lands; one
   * still face down is put back unopened. Either way nothing else is opened until a run is started again.
   */
  pressBackdrop = (): void => {
    if (this.state.peek) {
      this.driver?.close();
      return;
    }
    if (!this.state.run || this.phase === "land") return;
    if (this.turned()) {
      this.stopping = true;
      this.driver?.finish();
      return;
    }
    this.driver?.cancel();
    this.rest();
  };

  /** The renderer takes over the clock. Answers a function that lets go of it. */
  attach = (driver: OpeningDriver): (() => void) => {
    this.driver = driver;
    return () => {
      if (this.driver === driver) this.driver = null;
    };
  };

  /** The renderer reached a phase. */
  enter = (phase: OpeningPhase): void => {
    if (this.phase === phase) return;
    this.phase = phase;
    for (const listener of this.phaseListeners) listener();
  };

  /** The card is face up: it counts as opened. Safe to call more than once a card; a replay opens nothing. */
  reveal = (): void => {
    const { run, step } = this.state;
    if (!run || run.replay) return;
    const key = `${run.id}:${step}`;
    if (this.revealed === key) return;
    this.revealed = key;
    const id = run.queue[step];
    if (id !== undefined) this.onOpen(id);
  };

  /** The card is home. The next one comes up, unless that was the last or the run was stopped. */
  landed = (): void => {
    const { run, step } = this.state;
    if (!run) return;
    const stop = this.stopping;
    this.stopping = false;
    if (stop || step + 1 >= run.queue.length) {
      this.rest();
      return;
    }
    this.setState({ run, step: step + 1, peek: null });
    this.enter("lead");
  };

  /** The peeked card is away. */
  closed = (): void => {
    if (!this.state.peek) return;
    this.rest();
  };

  private turned(): boolean {
    return ORDER.indexOf(this.phase) >= TURN;
  }

  private rest(): void {
    this.setState({ run: null, step: 0, peek: null });
    this.enter("idle");
  }

  private setState(next: OpeningState<O>): void {
    this.state = next;
    for (const listener of this.listeners) listener();
  }
}
