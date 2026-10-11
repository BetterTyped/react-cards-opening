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
