import { cellKey, isWalkable, type GridMap, type GridPoint } from "../model/grid";
import { walkableNeighbors } from "../navigation/gridGraph";

/**
 * H4.4 - Buscar tras perder vision.
 *
 * La busqueda es acotada: un plano de puntos alcanzables alrededor de la
 * ultima posicion conocida. Se construye con BFS limitado para garantizar
 * que todo punto elegido sea alcanzable desde el origen, y el orden es
 * determinista para que la misma memoria produzca siempre la misma ruta.
 */

export interface SearchOptions {
  readonly radiusCells: number;
  readonly pointCount: number;
  readonly durationMs: number;
  readonly timeMs: number;
}

export interface SearchPlan {
  readonly origin: GridPoint;
  readonly points: readonly GridPoint[];
  readonly startedAtMs: number;
  readonly durationMs: number;
  readonly radiusCells: number;
}

export function planSearch(
  map: GridMap,
  origin: GridPoint,
  options: SearchOptions,
): SearchPlan {
  if (!isWalkable(map, origin)) {
    return { origin, points: [], startedAtMs: options.timeMs, durationMs: options.durationMs, radiusCells: options.radiusCells };
  }
  if (!Number.isInteger(options.pointCount) || options.pointCount < 0) {
    throw new Error("Search point count must be a non-negative integer.");
  }
  if (!Number.isFinite(options.radiusCells) || options.radiusCells < 0) {
    throw new Error("Search radius must be finite and non-negative.");
  }

  const reached = reachableWithin(map, origin, Math.floor(options.radiusCells));
  const candidates = [...reached.values()]
    .filter((node) => node.depth >= 1)
    .map((node) => ({ cell: node.point, depth: node.depth }));

  candidates.sort((left, right) => {
    if (left.depth !== right.depth) {
      return left.depth - right.depth;
    }
    const leftAngle = Math.atan2(left.cell.y - origin.y, left.cell.x - origin.x);
    const rightAngle = Math.atan2(right.cell.y - origin.y, right.cell.x - origin.x);
    if (leftAngle !== rightAngle) {
      return leftAngle - rightAngle;
    }
    return cellKey(left.cell) < cellKey(right.cell) ? -1 : 1;
  });

  return {
    origin,
    points: candidates.slice(0, options.pointCount).map((candidate) => candidate.cell),
    startedAtMs: options.timeMs,
    durationMs: options.durationMs,
    radiusCells: options.radiusCells,
  };
}

export function searchPointAt(plan: SearchPlan, index: number): GridPoint | null {
  if (index < 0 || index >= plan.points.length) {
    return null;
  }
  return plan.points[index] ?? null;
}

export function searchExpired(plan: SearchPlan, timeMs: number): boolean {
  return timeMs - plan.startedAtMs >= plan.durationMs;
}

export function searchElapsedMs(plan: SearchPlan, timeMs: number): number {
  return Math.max(0, timeMs - plan.startedAtMs);
}

interface DepthNode {
  readonly point: GridPoint;
  readonly depth: number;
}

/** BFS acotado en radio de celdas alrededor de un origen. */
function reachableWithin(
  map: GridMap,
  origin: GridPoint,
  radiusCells: number,
): Map<string, DepthNode> {
  const visited = new Map<string, DepthNode>([[cellKey(origin), { point: origin, depth: 0 }]]);
  let frontier: GridPoint[] = [origin];

  for (let depth = 1; depth <= radiusCells && frontier.length > 0; depth += 1) {
    const next: GridPoint[] = [];
    for (const current of frontier) {
      for (const neighbor of walkableNeighbors(map, current)) {
        const key = cellKey(neighbor);
        if (visited.has(key)) {
          continue;
        }
        visited.set(key, { point: neighbor, depth });
        next.push(neighbor);
      }
    }
    frontier = next;
  }

  return visited;
}
