import { cellCenter, worldToCell, type GridPoint } from "../../domain/model/grid";
import type { Vector2 } from "../../domain/model/vector";
import {
  advanceDistraction,
  createDistraction,
  defaultDistractionSpec,
  type Distraction,
  type DistractionSpec,
} from "../../domain/world/distractors";
import { TILE_SIZE } from "./labLevel";

export const MAX_ACTIVE_DISTRACTIONS = 6;
export const DISTRACTION_RECHARGE_MS = 1400;
export const DISTRACTION_CAPACITY = 3;

export interface DistractorState {
  readonly active: readonly Distraction[];
  readonly charges: number;
  readonly nextId: number;
  readonly lastChargeAtMs: number;
}

export interface ThrowResult {
  readonly state: DistractorState;
  readonly distraction: Distraction | null;
}

export interface DistractorFrame {
  readonly state: DistractorState;
  /** Distracciones que impactaron en este tick y generan un evento sonoro. */
  readonly landed: readonly Distraction[];
}

export function initialDistractorState(timeMs = 0): DistractorState {
  return {
    active: [],
    charges: DISTRACTION_CAPACITY,
    nextId: 1,
    lastChargeAtMs: timeMs,
  };
}

export function canThrow(state: DistractorState): boolean {
  return state.charges > 0;
}

export function throwDistraction(
  state: DistractorState,
  origin: Vector2,
  direction: Vector2,
  timeMs: number,
  spec: DistractionSpec = defaultDistractionSpec(),
): ThrowResult {
  if (!canThrow(state)) {
    return { state, distraction: null };
  }
  const distraction = createDistraction(`piedra-${state.nextId}`, spec, {
    origin,
    direction,
    spawnAtMs: timeMs,
  });
  return {
    state: {
      active: [...state.active, distraction].slice(-MAX_ACTIVE_DISTRACTIONS),
      charges: state.charges - 1,
      nextId: state.nextId + 1,
      lastChargeAtMs: state.lastChargeAtMs,
    },
    distraction,
  };
}

export function updateDistractors(
  state: DistractorState,
  timeMs: number,
  rechargeMs = DISTRACTION_RECHARGE_MS,
): DistractorFrame {
  const advanced = state.active.map((distraction) => advanceDistraction(distraction, timeMs));
  const landed = advanced.filter(
    (distraction, index) => distraction.state === "exploding" && state.active[index]?.state === "flying",
  );

  let charges = state.charges;
  let lastChargeAtMs = state.lastChargeAtMs;
  if (charges < DISTRACTION_CAPACITY) {
    const elapsed = timeMs - lastChargeAtMs;
    if (elapsed >= rechargeMs) {
      const periods = Math.floor(elapsed / rechargeMs);
      charges = Math.min(DISTRACTION_CAPACITY, charges + periods);
      lastChargeAtMs += periods * rechargeMs;
    }
  }

  return {
    state: {
      active: advanced.filter((distraction) => distraction.state !== "done"),
      charges,
      nextId: state.nextId,
      lastChargeAtMs,
    },
    landed,
  };
}

export function impactCell(distraction: Distraction, tileSize = TILE_SIZE): GridPoint {
  return worldToCell(distraction.position, tileSize);
}

export function impactWorldPoint(distraction: Distraction, tileSize = TILE_SIZE): Vector2 {
  const center = cellCenter(impactCell(distraction, tileSize), tileSize);
  return { x: center.x, y: center.y };
}
