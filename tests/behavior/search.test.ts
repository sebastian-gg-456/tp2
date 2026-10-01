import { describe, expect, it } from "vitest";
import {
  planSearch,
  searchElapsedMs,
  searchExpired,
  searchPointAt,
} from "../../src/domain/behavior/search";
import { createGridMap } from "../../src/domain/model/grid";

/** Sala 6x6 con un obstaculo que obliga a un rodeo. */
const MAP = createGridMap(6, 6, [
  { x: 3, y: 0 },
  { x: 3, y: 1 },
  { x: 3, y: 2 },
  { x: 3, y: 3 },
]);

const OPTIONS = { radiusCells: 2, pointCount: 4, durationMs: 8000, timeMs: 1000 };

describe("H4.4: search plan", () => {
  it("returns an empty plan when the origin is a wall", () => {
    const plan = planSearch(MAP, { x: 3, y: 1 }, OPTIONS);

    expect(plan.points).toHaveLength(0);
    expect(plan.origin).toEqual({ x: 3, y: 1 });
  });

  it("never crosses a wall", () => {
    const plan = planSearch(MAP, { x: 0, y: 2 }, OPTIONS);

    expect(plan.points).not.toContainEqual({ x: 3, y: 2 });
    expect(plan.points).not.toContainEqual({ x: 3, y: 3 });
  });

  it("respects the point budget", () => {
    const plan = planSearch(MAP, { x: 0, y: 2 }, OPTIONS);

    expect(plan.points.length).toBeLessThanOrEqual(OPTIONS.pointCount);
  });

  it("respects the radius", () => {
    const plan = planSearch(MAP, { x: 0, y: 2 }, { ...OPTIONS, radiusCells: 1, pointCount: 99 });

    expect(plan.points).toHaveLength(3);
    expect(plan.points.every((point) => Math.abs(point.x) + Math.abs(point.y - 2) === 1)).toBe(true);
  });

  it("excludes the origin from the plan", () => {
    const plan = planSearch(MAP, { x: 2, y: 2 }, { ...OPTIONS, radiusCells: 1, pointCount: 4 });

    expect(plan.points).not.toContainEqual({ x: 2, y: 2 });
  });

  it("is deterministic for the same memory", () => {
    const first = planSearch(MAP, { x: 1, y: 1 }, OPTIONS);
    const second = planSearch(MAP, { x: 1, y: 1 }, OPTIONS);

    expect(first.points).toEqual(second.points);
  });

  it("walks outward by distance from the last known position", () => {
    const plan = planSearch(MAP, { x: 2, y: 2 }, { ...OPTIONS, radiusCells: 2, pointCount: 3 });

    const depths = plan.points.map((point) => Math.abs(point.x - 2) + Math.abs(point.y - 2));
    expect(depths[0]).toBeLessThanOrEqual(depths[depths.length - 1] ?? 0);
  });

  it("rejects a negative point count", () => {
    expect(() => planSearch(MAP, { x: 1, y: 1 }, { ...OPTIONS, pointCount: -1 }))
      .toThrow("non-negative integer");
  });

  it("rejects a negative radius", () => {
    expect(() => planSearch(MAP, { x: 1, y: 1 }, { ...OPTIONS, radiusCells: -1 }))
      .toThrow("finite and non-negative");
  });
});

describe("H4.4: search window", () => {
  it("indexes the plan points defensively", () => {
    const plan = planSearch(MAP, { x: 2, y: 2 }, OPTIONS);

    expect(searchPointAt(plan, 0)).toEqual(plan.points[0] ?? null);
    expect(searchPointAt(plan, -1)).toBeNull();
    expect(searchPointAt(plan, 99)).toBeNull();
  });

  it("expires when the window is consumed", () => {
    const plan = planSearch(MAP, { x: 2, y: 2 }, OPTIONS);

    expect(searchExpired(plan, OPTIONS.timeMs)).toBe(false);
    expect(searchExpired(plan, OPTIONS.timeMs + 7999)).toBe(false);
    expect(searchExpired(plan, OPTIONS.timeMs + 8000)).toBe(true);
  });

  it("reports the elapsed time without going negative", () => {
    const plan = planSearch(MAP, { x: 2, y: 2 }, OPTIONS);

    expect(searchElapsedMs(plan, OPTIONS.timeMs + 500)).toBe(500);
    expect(searchElapsedMs(plan, OPTIONS.timeMs - 500)).toBe(0);
  });
});