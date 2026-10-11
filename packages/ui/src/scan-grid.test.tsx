import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";

import { ScanGrid, type ScanGridHandle, type ScanMarker } from "./scan-grid";
import { showFor } from "@react-cards-opening/core";

const LEVELS = [0, 1, 2, 3, 4, 9, -2, 2, 2, 2, 2, 2, 2, 2];
const SHOW = { tone: "#f2cc60", plan: showFor("loud"), reduced: false };

const level = (cell: number) => document.querySelector(`.rco-cell[data-cell="${cell}"]`)?.getAttribute("data-level");

describe("ScanGrid", () => {
  it("draws one cell per level, in columns of the rows it is given, after the empty slots", () => {
    render(<ScanGrid levels={LEVELS} lead={2} rows={4} />);

    expect(document.querySelectorAll(".rco-cell")).toHaveLength(LEVELS.length + 2);
    expect(document.querySelectorAll(".rco-cell[data-cell]")).toHaveLength(LEVELS.length);
    expect(document.querySelector<HTMLElement>(".rco-grid")?.style.gridTemplateColumns).toBe(
      "repeat(4, minmax(0, 1fr))",
    );
  });

  it("keeps a level inside the ramp, whatever number it is handed", () => {
    render(<ScanGrid levels={LEVELS} />);

    expect(level(4)).toBe("4");
    expect(level(5)).toBe("4");
    expect(level(6)).toBe("0");
  });

  it("marks found cells and says which one was pressed", async () => {
    const onMarkerPress = vi.fn<(marker: ScanMarker, element: HTMLElement) => void>();
    const markers = new Map([[3, { id: "fox", name: "Lantern Fox", colour: "#7aa2ff" }]]);
    render(<ScanGrid levels={LEVELS} markers={markers} onMarkerPress={onMarkerPress} />);

    await userEvent.click(screen.getByRole("button", { name: "Open Lantern Fox" }));

    expect(document.querySelectorAll(".rco-cell[data-found]")).toHaveLength(1);
    expect(onMarkerPress).toHaveBeenCalledExactlyOnceWith(markers.get(3), expect.any(HTMLButtonElement));
  });

  it("hides found cells while it is veiled", () => {
    const markers = new Map([[3, { id: "fox", name: "Lantern Fox", colour: "#7aa2ff" }]]);
    render(<ScanGrid levels={LEVELS} markers={markers} veiled />);

    expect(document.querySelector(".rco-grid")).toHaveAttribute("data-veiled");
    expect(screen.queryByRole("button", { name: "Open Lantern Fox" })).not.toBeInTheDocument();
  });

  it("hands a card its cell, something to play first, and a way to put the cell back", () => {
    const handle = createRef<ScanGridHandle>();
    render(<ScanGrid levels={LEVELS} lead={2} handle={handle} />);

    const launch = handle.current?.seek(5, SHOW);

    expect(launch?.element).toBe(document.querySelector('.rco-cell[data-cell="5"]'));
    expect(launch?.lead?.duration()).toBeGreaterThan(1);
    launch?.lead?.progress(1);
    expect(launch?.element).toHaveAttribute("data-hit");
    launch?.release?.();
    expect(launch?.element).not.toHaveAttribute("data-hit");
  });

  it("answers null for a cell it does not have", () => {
    const handle = createRef<ScanGridHandle>();
    render(<ScanGrid levels={LEVELS} handle={handle} />);

    expect(handle.current?.seek(400, SHOW)).toBeNull();
  });

  it("takes the veil off after the first pass, and forgets what it lit on reset", () => {
    const handle = createRef<ScanGridHandle>();
    const onUnveil = vi.fn<() => void>();
    render(<ScanGrid levels={LEVELS} veiled onUnveil={onUnveil} handle={handle} />);

    handle.current?.seek(8, SHOW)?.lead?.progress(1);
    expect(onUnveil).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll("[data-lit]").length).toBeGreaterThan(0);

    handle.current?.reset();
    expect(document.querySelectorAll("[data-lit]")).toHaveLength(0);
  });
});
