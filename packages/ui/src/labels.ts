/** The words on the card itself. Nothing here is shown as text; it is what a screen reader and a tooltip say. */
export interface CardOpeningLabels {
  turnCard: string;
  turnCardHint: string;
  closeCard: string;
  closeCardHint: string;
}

export const CARD_OPENING_LABELS: CardOpeningLabels = {
  turnCard: "Turn the card over, then keep it",
  turnCardHint: "Click to turn it over, click again to keep it",
  closeCard: "Close this card",
  closeCardHint: "Click to close",
};

/** Where a hunt stands, for the lines that are written from it. */
export interface HuntState {
  total: number;
  found: number;
  pending: number;
  /** Cards still to come in this run after the one on screen. */
  left: number;
  running: boolean;
  replay: boolean;
  hero: boolean;
}

export interface CardHuntLabels extends CardOpeningLabels {
  headline: (state: HuntState) => string;
  subline: (state: HuntState) => string;
  /** The main button, before a scan and between scans. */
  scan: (state: HuntState) => string;
  openAll: string;
  replay: string;
  /** A badge for a card nobody has found yet. */
  hidden: string;
  /** What a screen reader calls the list of badges. */
  finds: string;
  openCard: (name: string) => string;
  openBadge: string;
  /** The small last line on a found card, given where it was found. */
  found: (where: string) => string;
}

const cards = (count: number) => (count === 1 ? "card" : "cards");

export const CARD_HUNT_LABELS: CardHuntLabels = {
  ...CARD_OPENING_LABELS,
  headline: ({ total, found, pending, left, running, replay }) => {
    if (running) {
      if (replay) return "Scanning again.";
      return left > 0 ? `Scanning. ${left} more after this one.` : "Scanning for the last one.";
    }
    if (pending === 0) return `You found all ${total}.`;
    if (found > 0) return `${pending} more ${pending === 1 ? "is" : "are"} hiding in here.`;
    return `${total} ${cards(total)} ${total === 1 ? "is" : "are"} hiding in here.`;
  },
  subline: ({ pending }) =>
    pending === 0
      ? "Run the scan again to watch them come out."
      : "Run the scan. Each card opens where the beam finds it.",
  scan: ({ found }) => (found > 0 ? "Keep scanning" : "Scan"),
  openAll: "Find all",
  replay: "Scan again",
  hidden: "Still hidden",
  finds: "Your finds",
  openCard: (name) => `Open ${name}`,
  openBadge: "Open this card",
  found: (where) => `Found on ${where}`,
};

/** Where a ready-made opener stands, for the lines that are written from it. */
export interface OpenerState {
  total: number;
  /** Opened so far. */
  opened: number;
  pending: number;
  /** Cards still to come in this run, after the one on screen. */
  left: number;
  running: boolean;
  replay: boolean;
}

export interface CardSpinLabels extends CardOpeningLabels {
  headline: (state: OpenerState) => string;
  subline: (state: OpenerState) => string;
  /** The main button: one spin. */
  spin: string;
  /** The button that takes whatever is left without the show. */
  openAll: string;
  replay: string;
  hidden: string;
  finds: string;
  openBadge: string;
}

const times = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export const CARD_SPIN_LABELS: CardSpinLabels = {
  ...CARD_OPENING_LABELS,
  headline: ({ total, pending, running, replay }) => {
    if (running) return replay ? "Spinning again." : "Spinning.";
    if (pending === 0) return `You got all ${total}.`;
    return `${times(pending, "spin", "spins")} left.`;
  },
  subline: ({ pending }) =>
    pending === 0 ? "Spin again to watch them come up." : "Every spin stops on one of your cards.",
  spin: "Spin",
  openAll: "Take all",
  replay: "Spin again",
  hidden: "Not won yet",
  finds: "Your cards",
  openBadge: "Open this card",
};

export interface CardCaseLabels extends CardOpeningLabels {
  headline: (state: OpenerState) => string;
  subline: (state: OpenerState) => string;
  /** The main button, and what a screen reader calls the case itself. */
  open: string;
  openAll: string;
  replay: string;
  /** What a screen reader calls a place on the shelf with nothing on it yet. */
  emptySlot: string;
  /** The same for a place with a card on it. */
  openCard: (name: string) => string;
  shelf: string;
}

export const CARD_CASE_LABELS: CardCaseLabels = {
  ...CARD_OPENING_LABELS,
  headline: ({ total, opened, pending, left, running, replay }) => {
    if (running) {
      if (replay) return "Opening it again.";
      return left > 0 ? `Opening. ${left} more inside.` : "Opening. This is the last one.";
    }
    if (pending === 0) return `The case is empty. You got all ${total}.`;
    if (opened > 0) return `${times(pending, "card is", "cards are")} still inside.`;
    return `${times(total, "card is", "cards are")} in this case.`;
  },
  subline: ({ pending }) =>
    pending === 0 ? "Open it again to watch them come out." : "Open it and they come out one after another.",
  open: "Open the case",
  openAll: "Take all",
  replay: "Open it again",
  emptySlot: "Nothing here yet",
  openCard: (name) => `Look at ${name} again`,
  shelf: "Your cards",
};

/** Where a pack stands, for the line under the table. */
export interface PackState {
  total: number;
  /** Cards still face down. */
  left: number;
  stage: "sealed" | "dealt" | "done";
  replay: boolean;
}

export interface CardPackLabels extends CardOpeningLabels {
  /** What a screen reader calls the sealed pack. */
  tear: string;
  /** The line under the table. */
  hint: (state: PackState) => string;
  /** What a screen reader calls a card that is still face down. */
  flip: string;
  /** The same for a card that is turned: a press looks at it up close. */
  openCard: (name: string) => string;
  /** The button that appears once every card is turned. */
  done: string;
  replay: string;
}

export const CARD_PACK_LABELS: CardPackLabels = {
  ...CARD_OPENING_LABELS,
  tear: "Open the pack",
  hint: ({ total, left, stage }) => {
    if (stage === "sealed") return `${times(total, "card", "cards")} inside. Press the pack.`;
    if (stage === "done") return `${times(total, "card", "cards")}, all yours.`;
    return left > 0 ? `${left} to turn.` : "That is all of them.";
  },
  flip: "Turn this card over",
  openCard: (name) => `Look at ${name} up close`,
  done: "Done",
  replay: "Deal them again",
};
