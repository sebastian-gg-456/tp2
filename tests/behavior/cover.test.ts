import { describe, expect, it } from "vitest";
import {
  assessCover,
  collectCover,
  coverQuality,
  COVER_THRESHOLD,
  isCoverCell,
} from "../../src/domain/behavior/cover";
import { createGridMap } from "../../src/domain/model/grid";

/** Nicho: (1,1) queda rodeado por tres muros, es cobertura de calidad 0.75. */
const WALLS = createGridMap(6, 5, [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 2 },
  { x: 3, y: 2 },
]);

/** El mismo nivel mas un muro en la linea de vision entre (3,1) y (1,1). */
const VISION = createGridMap(6, 5, [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 2 },
  { x: 2, y: 1 },
  { x: 3, y: 2 },
]);

const TILE = 32;

describe("upgrade 6: cover quality", () => {
  it("measures the fraction of blocked cardinal neighbours", () => {
    expect(coverQuality(WALLS, { x: 1, y: 1 })).toBe(COVER_THRESHOLD);
  });

  it("returns zero for a blocked cell", () => {
    expect(coverQuality(WALLS, { x: 1, y: 0 })).toBe(0);
  });

  it("returns zero for an open cell without walls around", () => {
    expect(coverQuality(WALLS, { x: 2, y: 3 })).toBe(0);
  });

  it("returns a partial score for a cell beside a single wall", () => {
    expect(coverQuality(WALLS, { x: 2, y: 2 })).toBe(0.5);
    expect(isCoverCell(WALLS, { x: 2, y: 2 })).toBe(false);
  });

  it("identifies a cover cell by the threshold", () => {
    expect(isCoverCell(WALLS, { x: 1, y: 1 })).toBe(true);
    expect(isCoverCell(WALLS, { x: 2, y: 2 })).toBe(false);
  });
});

describe("upgrade 6: cover collection", () => {
  it("collects cover cells within the radius sorted by proximity", () => {
    const cover = collectCover(WALLS, { x: 2, y: 2 }, 2);

    expect(cover.length).toBeGreaterThanOrEqual(1);
    expect(cover[0]?.cell).toEqual({ x: 1, y: 1 });
  });

  it("never includes the origin cell", () => {
    const cover = collectCover(WALLS, { x: 1, y: 1 }, 1);
    expect(cover.map((entry) => entry.cell)).not.toContainEqual({ x: 1, y: 1 });
  });

  it("returns empty when no cover is reachable", () => {
    expect(collectCover(createGridMap(3, 3, []), { x: 1, y: 1 }, 1)).toHaveLength(0);
  });

  it("rejects a negative radius", () => {
    expect(() => collectCover(WALLS, { x: 1, y: 1 }, -1)).toThrow("finite and non-negative");
  });
});

describe("upgrade 6: cover assessment", () => {
  it("detects that the player is hidden behind cover", () => {
    const assessment = assessCover(
      WALLS,
      VISION,
      TILE,
      { x: 3 * TILE + TILE / 2, y: 1 * TILE + TILE / 2 },
      { x: 1 * TILE + TILE / 2, y: 1 * TILE + TILE / 2 },
      3,
    );

    expect(assessment.standingInCover).toBe(true);
    expect(assessment.breaksGuardSight).toBe(true);
    expect(assessment.hidden).toBe(true);
  });

  it("does not hide a player with a clear line of sight", () => {
    const assessment = assessCover(
      WALLS,
      VISION,
      TILE,
      { x: 5 * TILE + TILE / 2, y: 1 * TILE + TILE / 2 },
      { x: 4 * TILE + TILE / 2, y: 4 * TILE + TILE / 2 },
      2,
    );

    expect(assessment.breaksGuardSight).toBe(false);
    expect(assessment.hidden).toBe(false);
  });

  it("does not hide an exposed player even when the line is broken", () => {
    const assessment = assessCover(
      WALLS,
      VISION,
      TILE,
      { x: 3 * TILE + TILE / 2, y: 1 * TILE + TILE / 2 },
      { x: 2 * TILE + TILE / 2, y: 1 * TILE + TILE / 2 },
      2,
    );

    expect(assessment.standingInCover).toBe(false);
    expect(assessment.breaksGuardSight).toBe(true);
    expect(assessment.hidden).toBe(false);
  });

  it("reports the nearest cover cell and its distance", () => {
    const assessment = assessCover(
      WALLS,
      VISION,
      TILE,
      { x: 3 * TILE + TILE / 2, y: 1 * TILE + TILE / 2 },
      { x: 2 * TILE + TILE / 2, y: 2 * TILE + TILE / 2 },
      4,
    );

    expect(assessment.nearestCover).toEqual({ x: 1, y: 1 });
    expect(assessment.distanceToNearestCover).toBeGreaterThan(0);
    expect(assessment.available.length).toBeGreaterThanOrEqual(1);
  });

  it("reports infinite distance when no cover exists around", () => {
    const assessment = assessCover(
      WALLS,
      VISION,
      TILE,
      { x: 3 * TILE + TILE / 2, y: 1 * TILE + TILE / 2 },
      { x: 5 * TILE + TILE / 2, y: 4 * TILE + TILE / 2 },
      1,
    );

    expect(assessment.nearestCover).toBeNull();
    expect(assessment.distanceToNearestCover).toBe(Number.POSITIVE_INFINITY);
  });
});