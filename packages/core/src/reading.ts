import type { ShowPlan } from "./show";

/** How fast text on a screen is read: about 240 words a minute. */
const WORDS_PER_SECOND = 4;
/** Reading starts a beat after the card turns: its text is still on the way in. */
const READ_LEAD = 0.8;

/**
 * How much there is to read, in words, given every run of text shown. A sentence counts in full. A word or a number
 * standing alone ("Legendary", "1,107") is taken in at a glance, and a three-letter label hardly at all.
 */
export function wordsToRead(texts: readonly string[]): number {
  return texts.reduce((sum, text) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return sum;
    if (words.length > 1) return sum + words.length;
    return sum + (words[0].length <= 3 ? 0.1 : 0.6);
  }, 0);
}

/** The seconds something has to stay up for all of its text to be read. */
export const readingSeconds = (texts: readonly string[]) => READ_LEAD + wordsToRead(texts) / WORDS_PER_SECOND;

/** How long a card stays face up: as long as its own text takes to read, and never less than its show takes. */
export const holdSeconds = (texts: readonly string[], plan: Pick<ShowPlan, "minHoldSeconds">) =>
  Math.max(readingSeconds(texts), plan.minHoldSeconds);
