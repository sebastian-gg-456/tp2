import { describe, expect, it } from "vitest";
import { lineIsOccluded, occludingCells } from "../../src/domain/perception/occlusion";
import { createGridMap } from "../../src/domain/model/grid";

const TILE = 10;
const MAP = createGridMap(5, 5, [
  { x: 2, y: 0 },
  { x: 2, y: 1 },
  { x: 2, y: 2 },
  { x: 2, y: 3 },
  { x: 1, y: 1 },
]);

describe("shared occlusion", () => {
  it("reports a clear line in an empty corridor", () => {
    expect(lineIsOccluded(MAP, TILE, { x: 5, y: 15 }, { x: 45, y: 15 })).toBe(true);
    expect(lineIsOccluded(MAP, TILE, { x: 5, y: 35 }, { x: 15, y: 35 })).toBe(false);
  });

  it("blocks when a wall cell intersects the segment", () => {
    expect(lineIsOccluded(MAP, TILE, { x: 15, y: 15 }, { x: 35, y: 15 })).toBe(true);
  });

  it("treats an endpoint inside a wall as occluded", () => {
    expect(lineIsOccluded(MAP, TILE, { x: 15, y: 15 }, { x: 25, y: 15 })).toBe(true);
    expect(lineIsOccluded(MAP, TILE, { x: 25, y: 15 }, { x: 35, y: 15 })).toBe(true);
  });

  it("is symmetric", () => {
    const a = lineIsOccluded(MAP, TILE, { x: 15, y: 15 }, { x: 35, y: 15 });
    const b = lineIsOccluded(MAP, TILE, { x: 35, y: 15 }, { x: 15, y: 15 });

    expect(a).toBe(b);
  });

  it("reports the blocking cells used by the scene feedback", () => {
    expect(occludingCells(MAP, TILE, { x: 5, y: 35 }, { x: 45, y: 35 })).toEqual([{ x: 2, y: 3 }]);
  });

  it("reports no cells for a clear line", () => {
    expect(occludingCells(MAP, TILE, { x: 5, y: 35 }, { x: 15, y: 35 })).toEqual([]);
  });

  it("agrees between the boolean and the cell variant", () => {
    const from = { x: 15, y: 15 };
    const to = { x: 45, y: 15 };

    expect(lineIsOccluded(MAP, TILE, from, to)).toBe(occludingCells(MAP, TILE, from, to).length > 0);
  });

  it("treats a corner graze as blocked on both diagonals", () => {
    const corner = createGridMap(4, 4, [{ x: 1, y: 1 }]);

    expect(lineIsOccluded(corner, TILE, { x: 15, y: 5 }, { x: 5, y: 15 })).toBe(true);
  });
});