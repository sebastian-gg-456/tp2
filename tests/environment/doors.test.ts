import { describe, expect, it } from "vitest";
import {
  advanceDoors,
  composeNavigationMap,
  findDoor,
  initialDoors,
  toggleDoor,
  validateDoorSpecs,
  type DoorSpec,
} from "../../src/domain/environment/doors";
import { createGridMap, isWalkable, type GridMap } from "../../src/domain/model/grid";

const MAP: GridMap = createGridMap(6, 3, [
  { x: 2, y: 0 },
  { x: 2, y: 1 },
  { x: 4, y: 0 },
]);

const AUTO: DoorSpec = {
  id: "auto",
  kind: "auto",
  cells: [{ x: 2, y: 0 }],
  openMs: 1000,
  closedMs: 500,
  startOpen: true,
};

const SHUTTER: DoorSpec = {
  id: "persiana",
  kind: "shutter",
  cells: [{ x: 4, y: 0 }],
  openMs: 1,
  closedMs: 800,
  startOpen: false,
};

const SPECS = [AUTO, SHUTTER];

describe("upgrade 10: door specifications", () => {
  it("accepts specifications that carve real walls", () => {
    expect(() => validateDoorSpecs(MAP, SPECS)).not.toThrow();
  });

  it("rejects a door that does not carve a wall", () => {
    expect(() => validateDoorSpecs(MAP, [
      { ...AUTO, cells: [{ x: 0, y: 0 }] },
    ])).toThrow("must carve a wall cell");
  });

  it("rejects duplicated identifiers", () => {
    expect(() => validateDoorSpecs(MAP, [AUTO, AUTO])).toThrow("Duplicated door id");
  });

  it("rejects a door outside the grid", () => {
    expect(() => validateDoorSpecs(MAP, [
      { ...AUTO, cells: [{ x: 9, y: 9 }] },
    ])).toThrow("outside the grid");
  });

  it("rejects non positive timings", () => {
    expect(() => validateDoorSpecs(MAP, [{ ...AUTO, openMs: 0 }])).toThrow("positive openMs");
    expect(() => validateDoorSpecs(MAP, [{ ...AUTO, closedMs: 0 }])).toThrow("positive closedMs");
  });
});

describe("upgrade 10: navigation map", () => {
  it("keeps a closed door cell blocked and frees it when open", () => {
    const closed = composeNavigationMap(MAP, initialDoors(SPECS));
    expect(isWalkable(closed, { x: 4, y: 0 })).toBe(false);

    const opened = composeNavigationMap(MAP, toggleDoor(initialDoors(SPECS), "persiana"));
    expect(isWalkable(opened, { x: 4, y: 0 })).toBe(true);
    expect(isWalkable(opened, { x: 2, y: 1 })).toBe(false);
  });

  it("always frees the cells of an open door even when the wall declared them", () => {
    const withAutoOpen = composeNavigationMap(MAP, initialDoors(SPECS));
    expect(isWalkable(withAutoOpen, { x: 2, y: 0 })).toBe(true);
  });

  it("rejects a door cell outside the grid", () => {
    const broken = [{ ...initialDoors(SPECS)[0]!, cells: [{ x: 42, y: 42 }] }];
    expect(() => composeNavigationMap(MAP, broken)).toThrow("outside the grid");
  });
});

describe("upgrade 10: automatic cycle", () => {
  it("starts with the declared state and remaining time", () => {
    const doors = initialDoors(SPECS);
    expect(findDoor(doors, "auto")?.open).toBe(true);
    expect(findDoor(doors, "auto")?.remainingMs).toBe(500);
    expect(findDoor(doors, "persiana")?.open).toBe(false);
  });

  it("closes and reopens on schedule", () => {
    const start = initialDoors(SPECS);
    const closing = advanceDoors(start, 500, { requestShutter: false, holdShutter: false });
    expect(findDoor(closing.doors, "auto")?.open).toBe(false);
    expect(closing.changedIds).toContain("auto");

    const reopening = advanceDoors(closing.doors, 1000, { requestShutter: false, holdShutter: false });
    expect(findDoor(reopening.doors, "auto")?.open).toBe(true);
  });

  it("reports no change while the timer is still running", () => {
    const result = advanceDoors(initialDoors(SPECS), 100, { requestShutter: false, holdShutter: false });
    expect(result.changedIds).toHaveLength(0);
  });

  it("rejects a negative delta", () => {
    expect(() => advanceDoors(initialDoors(SPECS), -1, { requestShutter: false, holdShutter: false }))
      .toThrow("finite non-negative delta");
  });
});

describe("upgrade 10: shutter shortcut", () => {
  it("stays closed until a chase requests it", () => {
    const start = initialDoors(SPECS);
    const idle = advanceDoors(start, 2000, { requestShutter: false, holdShutter: false });
    expect(findDoor(idle.doors, "persiana")?.open).toBe(false);
    expect(idle.shutterOpened).toBe(false);
  });

  it("opens while a chase holds it and closes when the window ends", () => {
    const start = initialDoors(SPECS);
    const opening = advanceDoors(start, 16, { requestShutter: true, holdShutter: false });
    expect(opening.shutterOpened).toBe(true);
    expect(findDoor(opening.doors, "persiana")?.open).toBe(true);

    const closing = advanceDoors(opening.doors, 800, { requestShutter: false, holdShutter: false });
    expect(closing.shutterClosed).toBe(true);
    expect(findDoor(closing.doors, "persiana")?.open).toBe(false);
  });

  it("stays open while a search holds the shortcut", () => {
    const opened = toggleDoor(initialDoors(SPECS), "persiana");
    const held = advanceDoors(opened, 5000, { requestShutter: false, holdShutter: true });
    expect(findDoor(held.doors, "persiana")?.open).toBe(true);
  });
});

describe("upgrade 10: operator toggle", () => {
  it("flips a door and returns the same list for unknown ids", () => {
    const start = initialDoors(SPECS);
    const flipped = toggleDoor(start, "persiana");
    expect(findDoor(flipped, "persiana")?.open).toBe(true);
    expect(toggleDoor(start, "no-existe")).toBe(start);
  });
});
