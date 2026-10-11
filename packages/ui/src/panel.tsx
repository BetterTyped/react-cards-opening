import type { CSSProperties, ReactNode, Ref } from "react";

import { cn, type PanelClassNames } from "./class-names";
import { GLYPHS } from "./glyphs";
import { PixelGlyph } from "./pixel-glyph";
import { type CardTheme, rarityColor, themeStyle } from "./theme";
import type { GlyphCard } from "./types";

/*
 * What the ready-made openers share around their own piece: a panel on the theme's ground with a headline, a line
 * under it and a row of buttons, and under the piece a list of what was won. Not exported: each opener is the
 * component people use, and this is how they stay alike.
 */

export function Panel({
  kind,
  theme,
  tone,
  names,
  className,
  style,
  panelRef,
  flashRef,
  headline,
  subline,
  actions,
  buttons,
  children,
}: {
  /** The opener's own class on the root: "spin", "case". */
  kind: string;
  theme: CardTheme;
  /** The colour of the card that is up, for everything in the panel that follows it. */
  tone: string;
  names: PanelClassNames;
  className?: string;
  style?: CSSProperties;
  panelRef?: Ref<HTMLDivElement>;
  flashRef?: Ref<HTMLDivElement>;
  headline: string;
  subline: string;
  /** Extra buttons of the page's own. */
  actions?: ReactNode;
  buttons: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      ref={panelRef}
      className={cn(`rco-root rco-panel rco-${kind}`, className, names.root)}
      style={{ ...themeStyle(theme), "--rco-tone": tone, ...style } as CSSProperties}
    >
      <div ref={flashRef} className={cn("rco-panel-flash", names.flash)} aria-hidden />
      <div className={cn("rco-panel-head", names.head)}>
        <div className="rco-panel-words">
          <p className={cn("rco-panel-headline", names.headline)}>{headline}</p>
          <p className={cn("rco-panel-subline", names.subline)}>{subline}</p>
        </div>
        <div className={cn("rco-panel-actions", names.actions)}>
          {actions ? <div className="rco-slot">{actions}</div> : null}
          {buttons}
        </div>
      </div>
      {children}
    </div>
  );
}

/** The list of what was won, one badge a card: a question mark until it is, then a button that brings it back up. */
export function Finds<C extends GlyphCard>({
  cards,
  opened,
  theme,
  names,
  disabled,
  labels,
  whereOf,
  onPeek,
}: {
  cards: readonly C[];
  opened: readonly string[];
  theme: CardTheme;
  names: PanelClassNames;
  /** A run is on: the badges cannot be pressed for now. */
  disabled: boolean;
  labels: { finds: string; hidden: string; openBadge: string };
  /** The small line under a won card's name. */
  whereOf: (card: C) => string;
  onPeek: (card: C, element: HTMLElement) => void;
}) {
  return (
    <ul className={cn("rco-finds", names.finds)} aria-label={labels.finds}>
      {cards.map((card) => {
        const colour = rarityColor(theme, card.rarity);
        return (
          <li key={card.id} className="rco-find">
            {opened.includes(card.id) ? (
              <button
                type="button"
                className={cn("rco-badge", names.badge)}
                data-rco-badge={card.id}
                disabled={disabled}
                onClick={(event) => onPeek(card, event.currentTarget)}
                title={labels.openBadge}
                style={{ "--rco-tone": colour } as CSSProperties}
              >
                <span className={cn("rco-badge-art", names.badgeArt)}>
                  <PixelGlyph art={card.art ?? GLYPHS.question} colour={colour} cell={3} />
                </span>
                <span className="rco-badge-words">
                  <span className={cn("rco-badge-name", names.badgeName)}>{card.name}</span>
                  <span className={cn("rco-badge-where", names.badgeWhere)}>{whereOf(card)}</span>
                </span>
              </button>
            ) : (
              <span className={cn("rco-badge", names.badge)}>
                <span className={cn("rco-badge-art", names.badgeArt)}>
                  <PixelGlyph art={GLYPHS.question} colour={theme.muted} cell={3} />
                </span>
                <span className={cn("rco-badge-name", names.badgeName)}>{labels.hidden}</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** The badge of a card, wherever it is in the panel: where a won card lands. */
export function badgeIn(root: HTMLElement | null, id: string): HTMLElement | null {
  return (
    [...(root?.querySelectorAll<HTMLElement>("[data-rco-badge]") ?? [])].find(
      (badge) => badge.dataset.rcoBadge === id,
    ) ?? null
  );
}
