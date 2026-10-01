import type { Vector2 } from "../model/vector";

/**
 * Upgrade 7 - Distractores sonoros interactivos.
 *
 * Los distractores son lanzables con trayectoria parabólica minimalista en
 * 2D cenital: se inicia con una velocidad dada hacia la direccion apuntada y
 * cae en `timeToImpactMs`, emitiendo un evento sonoro en el punto de impacto.
 * Todo el calculo es puro para que las pruebas puedan reproducir el tiro.
 */

export type DistractionState = "flying" | "exploding" | "done";

export interface DistractionSpec {
  readonly id: string;
  readonly speedPxPerSecond: number;
  readonly timeToImpactMs: number;
  readonly radiusPx: number;
  readonly durationMs: number;
  readonly gravityPxPerSecondSquared: number;
  readonly elevationPx: number;
}

export interface Distraction {
  readonly id: string;
  readonly spec: DistractionSpec;
  readonly state: DistractionState;
  readonly spawnAtMs: number;
  readonly origin: Vector2;
  readonly direction: Vector2;
  readonly position: Vector2;
  readonly impactAtMs: number;
  readonly explodedAtMs: number | null;
  readonly doneAtMs: number | null;
}

export interface DistractionThrow {
  readonly origin: Vector2;
  readonly direction: Vector2;
  readonly spawnAtMs: number;
}

export function createDistraction(
  id: string,
  spec: DistractionSpec,
  throwData: DistractionThrow,
): Distraction {
  if (!Number.isFinite(spec.timeToImpactMs) || spec.timeToImpactMs <= 0) {
    throw new Error("A distraction spec needs a positive timeToImpactMs.");
  }
  const impactAtMs = throwData.spawnAtMs + spec.timeToImpactMs;
  return {
    id,
    spec,
    state: "flying",
    spawnAtMs: throwData.spawnAtMs,
    origin: { ...throwData.origin },
    direction: normalize(throwData.direction),
    position: { ...throwData.origin },
    impactAtMs,
    explodedAtMs: null,
    doneAtMs: null,
  };
}

export function advanceDistraction(distraction: Distraction, timeMs: number): Distraction {
  if (!Number.isFinite(timeMs)) {
    throw new Error("Distraction advance requires a finite time.");
  }

  if (distraction.state === "done") {
    return distraction;
  }

  if (distraction.state === "exploding") {
    const duration = distraction.spec.durationMs;
    const explodedAt = distraction.explodedAtMs ?? timeMs;
    if (timeMs >= explodedAt + duration) {
      return {
        ...distraction,
        state: "done",
        doneAtMs: timeMs,
      };
    }
    return distraction;
  }

  const elapsed = Math.max(0, timeMs - distraction.spawnAtMs);
  const t = Math.min(elapsed / Math.max(1, distraction.spec.timeToImpactMs), 1);
  const height = distraction.spec.elevationPx * Math.sin(Math.PI * t);
  const speed = distraction.spec.speedPxPerSecond;
  const gravity = distraction.spec.gravityPxPerSecondSquared;
  const distance = speed * (elapsed / 1000);
  const drop = 0.5 * gravity * (elapsed / 1000) * (elapsed / 1000);
  const dir = distraction.direction;

  const position = {
    x: distraction.origin.x + dir.x * distance,
    y: distraction.origin.y + dir.y * distance + height - drop,
  };

  if (timeMs >= distraction.impactAtMs - 1e-6) {
    const impactPoint = {
      x: distraction.origin.x + dir.x * (speed * (distraction.spec.timeToImpactMs / 1000)),
      y: distraction.origin.y + dir.y * (speed * (distraction.spec.timeToImpactMs / 1000)),
    };
    return {
      ...distraction,
      state: "exploding",
      explodedAtMs: timeMs,
      position: impactPoint,
    };
  }

  return { ...distraction, position };
}

export function defaultDistractionSpec(): DistractionSpec {
  return {
    id: "stone",
    speedPxPerSecond: 320,
    timeToImpactMs: 380,
    radiusPx: 160,
    durationMs: 600,
    gravityPxPerSecondSquared: 240,
    elevationPx: 10,
  };
}

function normalize(dir: Vector2): Vector2 {
  const len = Math.hypot(dir.x, dir.y);
  if (len === 0) {
    return { x: 1, y: 0 };
  }
  return { x: dir.x / len, y: dir.y / len };
}
