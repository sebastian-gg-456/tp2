import { distanceBetween, type Vector2 } from "../../domain/model/vector";
import { advanceAlongPath, type PathFollowerResult } from "../../domain/navigation/pathFollower";

/**
 * Locomocion del guardia. Es la unica capa que convierte una ruta en
 * movimiento real. No conoce el estado de conducta: recibe velocidad y ruta
 * y devuelve posicion, rumbo y si completo el trayecto.
 */

export interface LocomotionResult {
  readonly position: Vector2;
  readonly facing: Vector2;
  readonly nextWaypoint: number;
  readonly completed: boolean;
  readonly movedDistance: number;
  readonly result: PathFollowerResult;
}

export interface LocomotionInput {
  readonly position: Vector2;
  readonly waypoints: readonly Vector2[];
  readonly nextWaypoint: number;
  readonly speedPxPerSecond: number;
  readonly deltaMs: number;
  readonly facing: Vector2;
}

export function advanceGuard(
  input: LocomotionInput,
  goalTolerancePx: number,
): LocomotionResult {
  if (input.waypoints.length === 0) {
    return {
      position: input.position,
      facing: input.facing,
      nextWaypoint: 0,
      completed: true,
      movedDistance: 0,
      result: {
        position: input.position,
        nextWaypoint: 0,
        completed: true,
        direction: null,
      },
    };
  }

  const budget = input.speedPxPerSecond * (input.deltaMs / 1000);
  const result = advanceAlongPath(
    input.position,
    input.waypoints,
    input.nextWaypoint,
    budget,
  );
  const movedDistance = distanceBetween(input.position, result.position);
  const last = input.waypoints[result.nextWaypoint - 1];
  const finalWaypoint = last ?? input.waypoints[input.waypoints.length - 1];
  const remaining = input.waypoints.length - result.nextWaypoint;
  const tail = remaining > 0 ? input.waypoints[result.nextWaypoint] : finalWaypoint;
  const facing = result.direction
    ?? (tail ? unitTowards(result.position, tail) : input.facing);
  const nearGoal = tail ? distanceBetween(result.position, tail) <= goalTolerancePx : true;

  return {
    position: result.position,
    facing,
    nextWaypoint: result.nextWaypoint,
    completed: result.completed || nearGoal,
    movedDistance,
    result,
  };
}

function unitTowards(from: Vector2, to: Vector2): Vector2 {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) {
    return { x: 1, y: 0 };
  }
  return { x: dx / len, y: dy / len };
}
