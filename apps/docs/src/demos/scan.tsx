import { useMemo, useRef, useState } from "react";

import { cardOfTier, sampleLevels } from "../registry/sample";
import { DEFAULT_RARITIES, pickSpot, prefersReducedMotion, showFor, tierOf } from "@react-cards-opening/core";
import { type CardTheme, rarityColor, ScanGrid, type ScanGridHandle, type ScanMarker } from "@react-cards-opening/ui";

/**
 * The grid on its own, without a card: a button hunts a cell down, and the cell stays lit in the tier's colour.
 * The same `seek` a `CardOpening` is handed, played by hand.
 */
export function ScanDemo({ theme, tier }: { theme: CardTheme; tier: string }) {
  const scan = useRef<ScanGridHandle>(null);
  const levels = useMemo(() => sampleLevels(30, "docs-scan"), []);
  const [veiled, setVeiled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<readonly number[]>([]);
  const card = cardOfTier(tier);
  const tone = rarityColor(theme, tier);

  const markers = new Map<number, ScanMarker>(
    found.map((cell, index) => [cell, { id: `${card.id}-${index}`, name: card.name, colour: tone }]),
  );

  const seek = () => {
    const cell = pickSpot(levels, found);
    const reduced = prefersReducedMotion();
    const launch = scan.current?.seek(cell, {
      tone,
      plan: showFor(tierOf(DEFAULT_RARITIES, tier).effect, reduced),
      reduced,
    });
    if (!launch?.lead) return;
    setBusy(true);
    launch.lead.eventCallback("onComplete", () => {
      launch.release?.();
      setFound((now) => [...now, cell]);
      setBusy(false);
    });
  };

  return (
    <div className="d-scan-demo">
      <ScanGrid
        handle={scan}
        levels={levels}
        theme={theme}
        tone={tone}
        veiled={veiled}
        onUnveil={() => setVeiled(false)}
        idle={!busy}
        markers={markers}
        markersDisabled
      />
      <div className="d-scan-actions">
        <button type="button" className="d-chip-button" onClick={seek} disabled={busy} data-theme-accent>
          {found.length === 0 ? "Scan" : "Scan for another"}
        </button>
        <span>{found.length === 0 ? "Nothing found yet" : `${found.length} found`}</span>
      </div>
    </div>
  );
}
