import { gsap } from "gsap";
import { type CSSProperties, type Ref, useEffect, useImperativeHandle, useRef } from "react";

import { type CardTheme, DEFAULT_THEME, themeStyle } from "./theme";
import type { CardLaunch, CardShow } from "./types";
import { prefersReducedMotion } from "@react-cards-opening/core";

/** Particles a cell throws when it cracks, reused for the found tiles' idle sparkle. */
const CRACK = 18;

/** A found cell: it glows in its card's colour and can be pressed to look at the card again. */
export interface ScanMarker {
  id: string;
  name: string;
  colour: string;
}

export interface ScanGridHandle {
  /**
   * Hunts a cell down: the beam sweeps, a reticle locks on, the cell cracks in the card's colour. Answers what a
   * `CardOpening` needs to send the card out of that cell, or null when the grid has no such cell.
   */
  seek: (
    cell: number,
    show: CardShow,
    options?: {
      /** Something bigger than the grid to flash on a loud find, like the panel around it. */
      flash?: HTMLElement | null;
      /** The beam has settled on the cell. */
      onLock?: () => void;
    },
  ) => CardLaunch | null;
  /** Forgets which cells the beam has lit, so a veiled grid is blank again. */
  reset: () => void;
  /** The element of a cell. */
  cell: (index: number) => HTMLElement | null;
}

export interface ScanGridProps {
  /** One number per cell, 0 (unlit) to 4 (brightest). Cells fill top to bottom, then left to right. */
  levels: readonly number[];
  /** Empty slots before the first cell, so a calendar's first column lines up with its weekday. */
  lead?: number;
  /** Cells in a column. Seven makes a year of weeks. */
  rows?: number;
  theme?: CardTheme;
  /** The colour of the lock and the crack: the tier of the card being hunted. */
  tone?: string;
  /** Blank until the beam has passed: every cell it has not lit yet shows as unlit. */
  veiled?: boolean;
  /** The beam finished its first pass. Stop veiling. */
  onUnveil?: () => void;
  /** Nothing is being hunted: a blank grid may twitch, and found cells throw a spark now and then. */
  idle?: boolean;
  /** Found cells, by cell index. */
  markers?: ReadonlyMap<number, ScanMarker>;
  onMarkerPress?: (marker: ScanMarker, element: HTMLElement) => void;
  markersDisabled?: boolean;
  /** What a screen reader calls a found cell. */
  markerLabel?: (name: string) => string;
  handle?: Ref<ScanGridHandle>;
  className?: string;
  style?: CSSProperties;
}

const NO_MARKERS: ReadonlyMap<number, ScanMarker> = new Map();
const openLabel = (name: string) => `Open ${name}`;

/**
 * A grid of cells with something hidden in it, and the scan that finds it. Blank at first, cells shifting as if
 * something moves under them. A beam sweeps it, colouring each column as it goes, doubles back and locks onto a
 * cell. The cell flares in the colour of what it held. Pair it with `CardOpening` and the card flies out of it.
 */
export function ScanGrid({
  levels,
  lead = 0,
  rows = 7,
  theme = DEFAULT_THEME,
  tone,
  veiled = false,
  onUnveil,
  idle = true,
  markers = NO_MARKERS,
  onMarkerPress,
  markersDisabled = false,
  markerLabel = openLabel,
  handle,
  className,
  style,
}: ScanGridProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const beamColumnRef = useRef(0);
  const total = lead + levels.length;
  const columns = Math.ceil(total / rows);

  // Read through a ref: the handle is asked from a timeline that was built renders ago.
  const latest = useRef({ lead, rows, columns, veiled, onUnveil });
  latest.current = { lead, rows, columns, veiled, onUnveil };

  useImperativeHandle(
    handle,
    () => ({
      cell: (index) => rootRef.current?.querySelector<HTMLElement>(`.rco-cell[data-cell="${index}"]`) ?? null,
      reset: () => {
        for (const cell of rootRef.current?.querySelectorAll<HTMLElement>("[data-lit]") ?? []) delete cell.dataset.lit;
      },
      seek: (cellIndex, { tone: colour, plan, reduced }, { flash, onLock } = {}) => {
        const root = rootRef.current;
        const find = (selector: string) => root?.querySelector<HTMLElement>(selector) ?? null;
        const grid = find(".rco-grid");
        const beam = find(".rco-beam");
        const reticle = find(".rco-reticle");
        const band = find(".rco-band");
        const ring = find(".rco-ring");
        if (!root || !grid || !beam || !reticle || !band || !ring) return null;

        const now = latest.current;
        const cells = [...grid.querySelectorAll<HTMLElement>(".rco-cell")];
        const slot = now.lead + cellIndex;
        const hit = cells[slot];
        if (!hit) return null;
        const target = Math.floor(slot / now.rows);
        const sparks = root.querySelectorAll<HTMLElement>(".rco-crack-bit");

        // Geometry, in the grid's own pixels: where a (fractional) column sits.
        const columnLeft = (column: number) => cells[Math.min(cells.length - 1, column * now.rows)]?.offsetLeft ?? 0;
        const cellWidth = hit.offsetWidth;
        // A quick setter: moving the beam every frame must not build (and style-read) a tween every frame.
        const setBeamX = gsap.quickSetter(beam, "x", "px");
        const placeBeam = (column: number) => {
          const low = Math.floor(column);
          const high = Math.min(now.columns - 1, low + 1);
          const left = columnLeft(low) + (columnLeft(high) - columnLeft(low)) * (column - low);
          setBeamX(left + cellWidth / 2);
        };
        let lastColumn = -1;
        const sweep = { column: beamColumnRef.current };
        const onSweep = () => {
          placeBeam(sweep.column);
          const column = Math.round(sweep.column);
          if (column === lastColumn) return;
          lastColumn = column;
          const strip = cells
            .slice(column * now.rows, column * now.rows + now.rows)
            .filter((cell) => cell.dataset.cell !== undefined);
          // The first pass colours the grid in; later passes make it shimmer.
          for (const cell of strip) cell.dataset.lit = "";
          // Light only: tiles never change size, so they never spill over their neighbours.
          gsap.fromTo(
            strip,
            { filter: "brightness(1.9)" },
            { filter: "brightness(1)", duration: 0.55, ease: "power2.out", overwrite: "auto" },
          );
        };

        const tl = gsap.timeline();
        tl.set([reticle, band, ring], { autoAlpha: 0 });
        tl.set(beam, { autoAlpha: 1 });
        placeBeam(sweep.column);

        if (reduced) {
          tl.call(() => latest.current.onUnveil?.());
        } else {
          if (now.veiled) {
            // The first pass reads the whole grid, edge to edge, then doubles back.
            tl.set(sweep, { column: 0 });
            tl.to(sweep, { column: now.columns - 1, duration: 1.7, ease: "sine.inOut", onUpdate: onSweep });
            tl.call(() => latest.current.onUnveil?.());
          } else {
            const away = target > now.columns / 2 ? -1 : 1;
            const past = Math.max(0, Math.min(now.columns - 1, target + away * gsap.utils.random(6, 12, 1)));
            tl.to(sweep, {
              column: past,
              duration: Math.max(0.5, Math.abs(past - sweep.column) * 0.03),
              ease: "sine.inOut",
              onUpdate: onSweep,
            });
          }
          tl.to(sweep, { column: target, duration: 0.85, ease: "power3.inOut", onUpdate: onSweep });
        }
        tl.call(() => {
          beamColumnRef.current = target;
          placeBeam(target);
          onLock?.();
        });

        // The lock: a band along the row, a reticle closing in on the cell.
        const cx = hit.offsetLeft + hit.offsetWidth / 2;
        const cy = hit.offsetTop + hit.offsetHeight / 2;
        const reach = hit.offsetWidth + 14;
        tl.set(band, { top: hit.offsetTop - 3, height: hit.offsetHeight + 6, transformOrigin: `${cx}px 50%` });
        tl.set(reticle, { width: reach, height: reach });
        tl.fromTo(band, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.35, ease: "power3.out" });
        tl.fromTo(
          reticle,
          { left: cx, top: cy, scale: 3, rotate: 45, autoAlpha: 0 },
          { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out" },
          "<",
        );
        // Two ticks of the reticle; the cell itself stays its size.
        tl.to(reticle, { scale: 1.12, duration: 0.09, yoyo: true, repeat: 3, ease: "power1.inOut" });

        // The crack: the cell pops in its colour, throws sparks, a ring rolls out, and a loud find flashes.
        tl.set(hit, { "--rco-hit": colour, attr: { "data-hit": "" } } as gsap.TweenVars);
        tl.fromTo(
          ring,
          { left: cx, top: cy, scale: 0, autoAlpha: 1, boxShadow: `0 0 0 3px ${colour}` },
          { scale: 1, autoAlpha: 0, duration: 0.8, ease: "expo.out" },
          "<",
        );
        tl.fromTo(
          sparks,
          { left: cx, top: cy, x: 0, y: 0, scale: 0.6, autoAlpha: 1 },
          {
            x: (index: number) => Math.cos((index / CRACK) * Math.PI * 2) * (60 + ((index * 37) % 80)),
            y: (index: number) => Math.sin((index / CRACK) * Math.PI * 2) * (40 + ((index * 23) % 50)),
            scale: 1,
            autoAlpha: 0,
            duration: 0.95,
            ease: "expo.out",
            // To-vars, or the sparks are drawn at the cell the moment the timeline is built and give the spot away.
            immediateRender: false,
          },
          "<",
        );
        if (plan.jolt) {
          tl.fromTo(
            flash ?? find(".rco-scan-flash"),
            { autoAlpha: 0 },
            {
              keyframes: [
                { autoAlpha: 0.7, duration: 0.08 },
                { autoAlpha: 0, duration: 0.7 },
              ],
            },
            "<",
          );
          tl.to(grid, { keyframes: [{ x: -5 }, { x: 5 }, { x: -3 }, { x: 0 }], duration: 0.24 }, "<");
        }
        tl.to([beam, band, reticle], { autoAlpha: 0, duration: 0.3 }, "<");

        return {
          element: hit,
          lead: tl,
          release: () => {
            hit.removeAttribute("data-hit");
            // A hunt stopped mid-crack leaves nothing hanging over the grid.
            gsap.set([beam, band, reticle, ring, ...sparks], { autoAlpha: 0 });
          },
        };
      },
    }),
    [],
  );

  // While blank and idle, the grid twitches now and then: something is in there. Web Animations, not GSAP: a GSAP
  // tween reads the cell's computed transform first, and on a busy page that one read can cost a whole-page style
  // pass. Only while the grid is on screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !veiled || !idle || prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;
    const cells = [...root.querySelectorAll<HTMLElement>(".rco-cell[data-cell]")];
    if (cells.length === 0) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const twitch = () => {
      for (let index = 0; index < 4; index += 1) {
        const cell = cells[Math.floor(Math.random() * cells.length)];
        const dx = (Math.random() * 2 - 1).toFixed(1);
        cell.animate(
          [
            { transform: "none" },
            { transform: `translate(${dx}px, -1px)` },
            { transform: `translate(${-dx}px, 1px)` },
            { transform: "none" },
          ],
          { duration: 300, easing: "ease-out" },
        );
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !timer) timer = setInterval(twitch, 220);
      if (!entry?.isIntersecting && timer) {
        clearInterval(timer);
        timer = null;
      }
    });
    observer.observe(root);
    return () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [veiled, idle]);

  // A finished grid keeps a little life: now and then a found tile throws a few sparks. Web Animations on the crack
  // particles already in the grid, so nothing is inserted and nothing reads computed styles.
  const found = markers.size;
  useEffect(() => {
    const root = rootRef.current;
    if (!root || veiled || !idle || found === 0) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;
    const sparks = [...root.querySelectorAll<HTMLElement>(".rco-crack-bit")].slice(0, 6);
    let timer: ReturnType<typeof setInterval> | null = null;
    const spark = () => {
      const tiles = [...root.querySelectorAll<HTMLElement>(".rco-cell[data-found]")];
      const tile = tiles[Math.floor(Math.random() * tiles.length)];
      if (!tile) return;
      const colour = tile.style.getPropertyValue("--rco-found");
      const x = tile.offsetLeft + tile.offsetWidth / 2;
      const y = tile.offsetTop + tile.offsetHeight / 2;
      sparks.forEach((particle, index) => {
        const angle = (index / sparks.length) * Math.PI * 2 + Math.random();
        const reach = 18 + Math.random() * 22;
        // Where it is and what colour it wears are part of the animation, not written onto the particle: the next
        // crack finds every particle the way it left it, in the colour of the card it is cracking for.
        const at = { left: `${x}px`, top: `${y}px`, background: colour, visibility: "visible" };
        particle.animate(
          [
            { ...at, transform: "translate(0, 0) scale(0.5)", opacity: 1 },
            {
              ...at,
              transform: `translate(${Math.cos(angle) * reach}px, ${Math.sin(angle) * reach}px) scale(1)`,
              opacity: 0,
            },
          ],
          { duration: 800, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        );
      });
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !timer) timer = setInterval(spark, 1700);
      if (!entry?.isIntersecting && timer) {
        clearInterval(timer);
        timer = null;
      }
    });
    observer.observe(root);
    return () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [veiled, idle, found]);

  return (
    <div
      ref={rootRef}
      className={className ? `rco-root rco-scan ${className}` : "rco-root rco-scan"}
      style={{ ...themeStyle(theme), "--rco-tone": tone ?? theme.fg, ...style } as CSSProperties}
    >
      <div className="rco-scan-flash" aria-hidden />
      <div
        className="rco-grid"
        data-veiled={veiled ? "" : undefined}
        style={{
          gridTemplateRows: `repeat(${rows}, auto)`,
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: total }, (_unused, slot) => {
          const cell = slot - lead;
          if (cell < 0) {
            // oxlint-disable-next-line react/no-array-index-key -- one cell per slot, positional
            return <i key={slot} className="rco-cell" data-level={0} />;
          }
          const marker = veiled ? undefined : markers.get(cell);
          return (
            <i
              // oxlint-disable-next-line react/no-array-index-key -- one cell per slot, positional
              key={slot}
              className="rco-cell"
              data-cell={cell}
              data-level={Math.min(4, Math.max(0, levels[cell]))}
              data-found={marker ? "" : undefined}
              style={marker ? ({ "--rco-found": marker.colour } as CSSProperties) : undefined}
            >
              {marker ? (
                // Inside the tile, so the tile itself is never swapped for another element mid-scan.
                <button
                  type="button"
                  className="rco-cell-press"
                  disabled={markersDisabled}
                  onClick={(event) => onMarkerPress?.(marker, event.currentTarget)}
                  aria-label={markerLabel(marker.name)}
                  title={marker.name}
                />
              ) : null}
            </i>
          );
        })}
        <i className="rco-band" aria-hidden />
        <i className="rco-reticle" aria-hidden />
        <i className="rco-ring" aria-hidden />
        <span className="rco-crack" aria-hidden>
          {Array.from({ length: CRACK }, (_unused, index) => (
            // oxlint-disable-next-line react/no-array-index-key -- particles are positional
            <i key={index} className="rco-crack-bit" />
          ))}
        </span>
      </div>
      <span className="rco-beam" aria-hidden>
        <i className="rco-beam-glow" />
        <i className="rco-beam-line" />
      </span>
    </div>
  );
}
