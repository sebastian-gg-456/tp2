import { cellKey, isWalkable, worldToCell, type GridMap, type GridPoint } from "../model/grid";
import { distanceBetween, type Vector2 } from "../model/vector";
import { lineIsOccluded } from "../perception/occlusion";

/**
 * Upgrade 6 - Cobertura y ruptura de linea de vision.
 *
 * La cobertura no es un estado oculto: se deriva de la geometria de la
 * cuadricula. Una celda es cobertura cuando al menos tres de sus cuatro
 * lados cardenales son muro, es decir un nicho, un angulo cerrado o un
 * fondo de pasillo. Desde ahi el jugador puede romper la linea de vision
 * del guardia, que es la decision de sigilo central del nivel.
 */

const CARDINALS: readonly GridPoint[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

/** Minima fraccion de lados bloqueados para considerar una celda cobertura. */
export const COVER_THRESHOLD = 0.75;

export interface CoverCell {
  readonly cell: GridPoint;
  readonly quality: number;
}

export interface CoverAssessment {
  /** La celda actual del jugador cumple el umbral de cobertura. */
  readonly standingInCover: boolean;
  /** El guardia no tiene linea de vision sobre la celda actual del jugador. */
  readonly breaksGuardSight: boolean;
  /** Cobertura y ruptura de vision a la vez: el jugador esta oculto de verdad. */
  readonly hidden: boolean;
  readonly quality: number;
  readonly nearestCover: GridPoint | null;
  readonly distanceToNearestCover: number;
  /** Coberturas alcanzables alrededor del jugador, ordenadas por cercania. */
  readonly available: readonly CoverCell[];
}

export function coverQuality(walls: GridMap, cell: GridPoint): number {
  if (!isWalkable(walls, cell)) {
    return 0;
  }
  let blocked = 0;
  for (const offset of CARDINALS) {
    if (!isWalkable(walls, { x: cell.x + offset.x, y: cell.y + offset.y })) {
      blocked += 1;
    }
  }
  return blocked / CARDINALS.length;
}

export function isCoverCell(walls: GridMap, cell: GridPoint): boolean {
  return coverQuality(walls, cell) >= COVER_THRESHOLD;
}

/** Lista las celdas de cobertura alcanzables dentro de un radio en celdas. */
export function collectCover(
  walls: GridMap,
  origin: GridPoint,
  radiusCells: number,
): readonly CoverCell[] {
  if (!Number.isFinite(radiusCells) || radiusCells < 0) {
    throw new Error("Cover radius must be finite and non-negative.");
  }
  const found: CoverCell[] = [];
  const seen = new Set<string>([cellKey(origin)]);

  for (let ring = 1; ring <= Math.floor(radiusCells); ring += 1) {
    for (let dx = -ring; dx <= ring; dx += 1) {
      for (let dy = -ring; dy <= ring; dy += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) {
          continue;
        }
        const cell = { x: origin.x + dx, y: origin.y + dy };
        const key = cellKey(cell);
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        const quality = coverQuality(walls, cell);
        if (quality >= COVER_THRESHOLD) {
          found.push({ cell, quality });
        }
      }
    }
  }

  return found.sort((left, right) => {
    const leftDistance = Math.abs(left.cell.x - origin.x) + Math.abs(left.cell.y - origin.y);
    const rightDistance = Math.abs(right.cell.x - origin.x) + Math.abs(right.cell.y - origin.y);
    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }
    if (left.quality !== right.quality) {
      return right.quality - left.quality;
    }
    return keyOrder(left.cell) - keyOrder(right.cell);
  });
}

function keyOrder(cell: GridPoint): number {
  return cell.y * 1000 + cell.x;
}

export function assessCover(
  walls: GridMap,
  visionMap: GridMap,
  tileSize: number,
  guardPosition: Vector2,
  playerPosition: Vector2,
  radiusCells: number,
): CoverAssessment {
  const playerCell = worldToCell(playerPosition, tileSize);
  const quality = coverQuality(walls, playerCell);
  const standingInCover = quality >= COVER_THRESHOLD;
  const breaksGuardSight = lineIsOccluded(visionMap, tileSize, guardPosition, playerPosition);
  const available = collectCover(walls, playerCell, radiusCells);
  const nearest = available[0] ?? null;

  return {
    standingInCover,
    breaksGuardSight,
    hidden: standingInCover && breaksGuardSight,
    quality,
    nearestCover: nearest ? nearest.cell : null,
    distanceToNearestCover: nearest ? distanceBetween(playerPosition, cellCenter(nearest.cell, tileSize)) : Number.POSITIVE_INFINITY,
    available,
  };
}

function cellCenter(cell: GridPoint, tileSize: number): Vector2 {
  return { x: cell.x * tileSize + tileSize / 2, y: cell.y * tileSize + tileSize / 2 };
}
