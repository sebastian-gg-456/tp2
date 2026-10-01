import type { GridPoint } from "../model/grid";

/**
 * Upgrade 1 - Patrulla con pausas y mirada direccional.
 *
 * El recorrido es un ciclo explicito de puntos. Cada punto define cuanto
 * tiempo se detiene el guardia y que barrido de mirada ejecuta mientras
 * espera. La mirada direccional es parte de la informacion que el guardia
 * "entrega" al jugador: durante la pausa el cono de vision barre el area y
 * ese barrido es la ventana para cruzar.
 */

export interface PatrolPoint {
  readonly cell: GridPoint;
  /** Milisegundos de detencion al llegar. Cero significa paso directo. */
  readonly pauseMs: number;
  /** Barrido de mirada en grados relativos a la direccion de llegada. */
  readonly sweepDegrees: readonly number[];
  /** Periodo de un ciclo completo de barrido (ida y vuelta). */
  readonly sweepPeriodMs: number;
}

export interface PatrolRoute {
  readonly points: readonly PatrolPoint[];
}

export type PatrolPhase = "moving" | "pausing";

export interface PatrolCursor {
  readonly pointIndex: number;
  readonly phase: PatrolPhase;
  readonly remainingMs: number;
  readonly phaseElapsedMs: number;
  readonly completedLoops: number;
}

export interface PatrolTransition {
  readonly cursor: PatrolCursor;
  readonly arrived: boolean;
  readonly resumed: boolean;
}

export function createPatrolRoute(points: readonly PatrolPoint[]): PatrolRoute {
  if (points.length === 0) {
    throw new Error("A patrol route needs at least one point.");
  }
  points.forEach((point, index) => {
    if (!Number.isInteger(point.cell.x) || !Number.isInteger(point.cell.y)) {
      throw new Error(`Patrol point ${index} must use integer cell coordinates.`);
    }
    if (!Number.isFinite(point.pauseMs) || point.pauseMs < 0) {
      throw new Error(`Patrol point ${index} needs a non-negative pauseMs.`);
    }
    if (!Number.isFinite(point.sweepPeriodMs) || point.sweepPeriodMs <= 0) {
      throw new Error(`Patrol point ${index} needs a positive sweepPeriodMs.`);
    }
  });
  return { points: points.map((point) => ({ ...point })) };
}

export function initialPatrolCursor(route: PatrolRoute, startIndex = 0): PatrolCursor {
  if (!Number.isInteger(startIndex) || startIndex < 0 || startIndex >= route.points.length) {
    throw new Error("Patrol start index is outside the route.");
  }
  return {
    pointIndex: startIndex,
    phase: "moving",
    remainingMs: 0,
    phaseElapsedMs: 0,
    completedLoops: 0,
  };
}

export function currentPatrolCell(route: PatrolRoute, cursor: PatrolCursor): GridPoint {
  const point = route.points[cursor.pointIndex % route.points.length];
  if (!point) {
    throw new Error("Patrol cursor invariant failed.");
  }
  return point.cell;
}

export function currentPatrolPoint(route: PatrolRoute, cursor: PatrolCursor): PatrolPoint {
  const point = route.points[cursor.pointIndex % route.points.length];
  if (!point) {
    throw new Error("Patrol cursor invariant failed.");
  }
  return point;
}

export function nextPatrolIndex(route: PatrolRoute, cursor: PatrolCursor): number {
  return (cursor.pointIndex + 1) % route.points.length;
}

/**
 * Avanza el cursor. `reachedTarget` debe indicar que el guardia ya esta sobre
 * el punto actual. Devuelve ademas si en este tick se registro llegada o
 * reanudacion, para que la simulacion pueda emitir telemetria.
 */
export function advancePatrol(
  route: PatrolRoute,
  cursor: PatrolCursor,
  reachedTarget: boolean,
  deltaMs: number,
): PatrolTransition {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) {
    throw new Error("Patrol advance requires a finite non-negative delta.");
  }

  if (cursor.phase === "pausing") {
    const remainingMs = cursor.remainingMs - deltaMs;
    if (remainingMs > 0) {
      return {
        cursor: { ...cursor, remainingMs, phaseElapsedMs: cursor.phaseElapsedMs + deltaMs },
        arrived: false,
        resumed: false,
      };
    }
    const nextIndex = nextPatrolIndex(route, cursor);
    return {
      cursor: {
        pointIndex: nextIndex,
        phase: "moving",
        remainingMs: 0,
        phaseElapsedMs: 0,
        completedLoops: cursor.completedLoops + (nextIndex === 0 ? 1 : 0),
      },
      arrived: false,
      resumed: true,
    };
  }

  const point = currentPatrolPoint(route, cursor);
  if (reachedTarget) {
    if (point.pauseMs <= 0) {
      const nextIndex = nextPatrolIndex(route, cursor);
      return {
        cursor: {
          pointIndex: nextIndex,
          phase: "moving",
          remainingMs: 0,
          phaseElapsedMs: 0,
          completedLoops: cursor.completedLoops + (nextIndex === 0 ? 1 : 0),
        },
        arrived: false,
        resumed: true,
      };
    }
    return {
      cursor: {
        ...cursor,
        phase: "pausing",
        remainingMs: point.pauseMs,
        phaseElapsedMs: 0,
      },
      arrived: true,
      resumed: false,
    };
  }

  return { cursor, arrived: false, resumed: false };
}

/**
 * Angulo de mirada en radianes. Mientras camina mira hacia donde avanza;
 * durante la pausa ejecuta el barrido triangular declarado en el punto.
 */
export function patrolGazeRadians(
  route: PatrolRoute,
  cursor: PatrolCursor,
  movementRadians: number | null,
): number {
  if (cursor.phase === "moving" || movementRadians === null) {
    return movementRadians ?? 0;
  }

  const point = currentPatrolPoint(route, cursor);
  if (point.sweepDegrees.length === 0) {
    return movementRadians;
  }
  if (point.sweepDegrees.length === 1) {
    return movementRadians + degreesToRadians(point.sweepDegrees[0] ?? 0);
  }

  const span = point.sweepPeriodMs * (point.sweepDegrees.length - 1);
  const phase = span <= 0 ? 0 : (cursor.phaseElapsedMs % (span * 2)) / span;
  const triangle = phase <= 1 ? phase : 2 - phase;
  const scaled = triangle * (point.sweepDegrees.length - 1);
  const lowerIndex = Math.min(Math.floor(scaled), point.sweepDegrees.length - 1);
  const upperIndex = Math.min(lowerIndex + 1, point.sweepDegrees.length - 1);
  const lower = point.sweepDegrees[lowerIndex] ?? 0;
  const upper = point.sweepDegrees[upperIndex] ?? lower;
  const degrees = lower + (upper - lower) * (scaled - lowerIndex);
  return movementRadians + degreesToRadians(degrees);
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
