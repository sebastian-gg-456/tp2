import { describe, expect, it } from "vitest";
import {
  advancePatrol,
  createPatrolRoute,
  currentPatrolCell,
  initialPatrolCursor,
  patrolGazeRadians,
  type PatrolPoint,
} from "../../src/domain/behavior/patrol";

const ROUTE = createPatrolRoute([
  { cell: { x: 1, y: 1 }, pauseMs: 1000, sweepDegrees: [-60, 60], sweepPeriodMs: 1000 },
  { cell: { x: 5, y: 1 }, pauseMs: 0, sweepDegrees: [], sweepPeriodMs: 800 },
  { cell: { x: 5, y: 5 }, pauseMs: 500, sweepDegrees: [0], sweepPeriodMs: 600 },
]);

describe("patrol route", () => {
  it("rejects an empty route", () => {
    expect(() => createPatrolRoute([])).toThrow("at least one point");
  });

  it("starts moving toward the first point", () => {
    const cursor = initialPatrolCursor(ROUTE);

    expect(cursor.phase).toBe("moving");
    expect(currentPatrolCell(ROUTE, cursor)).toEqual({ x: 1, y: 1 });
  });

  it("rejects a start index outside the route", () => {
    expect(() => initialPatrolCursor(ROUTE, 3)).toThrow("outside the route");
  });
});

describe("upgrade 1: pauses", () => {
  it("pauses on arrival and resumes when the pause expires", () => {
    const start = initialPatrolCursor(ROUTE);
    const arrived = advancePatrol(ROUTE, start, true, 0);

    expect(arrived.arrived).toBe(true);
    expect(arrived.cursor.phase).toBe("pausing");
    expect(arrived.cursor.remainingMs).toBe(1000);

    const half = advancePatrol(ROUTE, arrived.cursor, false, 400);
    expect(half.cursor.phase).toBe("pausing");
    expect(half.resumed).toBe(false);

    const done = advancePatrol(ROUTE, half.cursor, false, 700);
    expect(done.resumed).toBe(true);
    expect(done.cursor.phase).toBe("moving");
    expect(done.cursor.pointIndex).toBe(1);
  });

  it("skips the pause entirely when the point declares zero", () => {
    const atSecond = initialPatrolCursor(ROUTE, 1);
    const step = advancePatrol(ROUTE, atSecond, true, 0);

    expect(step.arrived).toBe(false);
    expect(step.resumed).toBe(true);
    expect(step.cursor.pointIndex).toBe(2);
  });

  it("counts completed loops when the route wraps", () => {
    const atLast = initialPatrolCursor(ROUTE, 2);
    const arrived = advancePatrol(ROUTE, atLast, true, 0);
    const resumed = advancePatrol(ROUTE, arrived.cursor, false, 500);

    expect(resumed.cursor.pointIndex).toBe(0);
    expect(resumed.cursor.completedLoops).toBe(1);
  });

  it("keeps waiting while the guard has not reached the point", () => {
    const cursor = initialPatrolCursor(ROUTE);
    const step = advancePatrol(ROUTE, cursor, false, 16);

    expect(step.arrived).toBe(false);
    expect(step.resumed).toBe(false);
    expect(step.cursor.phase).toBe("moving");
  });
});

describe("upgrade 1: directional gaze", () => {
  it("follows the movement direction while walking", () => {
    const cursor = initialPatrolCursor(ROUTE);
    const radians = patrolGazeRadians(ROUTE, cursor, Math.PI / 2);

    expect(radians).toBeCloseTo(Math.PI / 2, 6);
  });

  it("sweeps around the arrival direction while paused", () => {
    const arrived = advancePatrol(ROUTE, initialPatrolCursor(ROUTE), true, 0);
    const base = 0;
    const start = patrolGazeRadians(ROUTE, arrived.cursor, base);
    const middle = patrolGazeRadians(
      ROUTE,
      { ...arrived.cursor, phaseElapsedMs: 500 },
      base,
    );
    const end = patrolGazeRadians(
      ROUTE,
      { ...arrived.cursor, phaseElapsedMs: 1000 },
      base,
    );

    expect(start).toBeCloseTo(base - Math.PI / 3, 4);
    expect(middle).toBeCloseTo(base, 4);
    expect(end).toBeCloseTo(base + Math.PI / 3, 4);
  });

  it("returns to the extremes periodically", () => {
    const arrived = advancePatrol(ROUTE, initialPatrolCursor(ROUTE), true, 0);
    const cycle = patrolGazeRadians(
      ROUTE,
      { ...arrived.cursor, phaseElapsedMs: 2000 },
      0,
    );

    expect(cycle).toBeCloseTo(patrolGazeRadians(ROUTE, arrived.cursor, 0), 4);
  });

  it("keeps the arrival direction when the point declares no sweep", () => {
    const atSecond = initialPatrolCursor(ROUTE, 1);
    const paused = { ...atSecond, phase: "pausing" as const, phaseElapsedMs: 120 };
    const radians = patrolGazeRadians(ROUTE, paused, 0.75);

    expect(radians).toBeCloseTo(0.75, 6);
  });

  it("applies a fixed offset for a single declared direction", () => {
    const atThird = initialPatrolCursor(ROUTE, 2);
    const paused = { ...atThird, phase: "pausing" as const, phaseElapsedMs: 120 };
    const radians = patrolGazeRadians(ROUTE, paused, 0);

    expect(radians).toBeCloseTo(0, 6);
  });
});

describe("patrol configuration", () => {
  it("rejects negative pauses", () => {
    const point: PatrolPoint = { cell: { x: 0, y: 0 }, pauseMs: -1, sweepDegrees: [], sweepPeriodMs: 500 };
    expect(() => createPatrolRoute([point])).toThrow("non-negative pauseMs");
  });

  it("rejects non integer cells", () => {
    const point: PatrolPoint = { cell: { x: 0.5, y: 0 }, pauseMs: 0, sweepDegrees: [], sweepPeriodMs: 500 };
    expect(() => createPatrolRoute([point])).toThrow("integer cell coordinates");
  });

  it("rejects a non positive sweep period", () => {
    const point: PatrolPoint = { cell: { x: 1, y: 1 }, pauseMs: 0, sweepDegrees: [1], sweepPeriodMs: 0 };
    expect(() => createPatrolRoute([point])).toThrow("positive sweepPeriodMs");
  });
});
