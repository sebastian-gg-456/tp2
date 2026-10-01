import { isWalkable, worldToCell, type GridMap, type GridPoint } from "../model/grid";
import type { Vector2 } from "../model/vector";

/**
 * Traza la linea entre dos puntos del mundo y devuelve true si una celda
 * bloqueada la interrumpe. El criterio es conservador: al tocar una esquina
 * se consideran bloqueantes las dos celdas diagonales que se rozan.
 *
 * Se expone por separado porque vision, cobertura y exposicion de stealth
 * necesitan exactamente la misma regla de oclusion.
 */
export function lineIsOccluded(
  map: GridMap,
  tileSize: number,
  from: Vector2,
  to: Vector2,
): boolean {
  const start = worldToCell(from, tileSize);
  const end = worldToCell(to, tileSize);
  if (!isWalkable(map, start) || !isWalkable(map, end)) {
    return true;
  }
  let x = start.x;
  let y = start.y;
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const stepX = Math.sign(deltaX);
  const stepY = Math.sign(deltaY);
  const absoluteDeltaX = Math.abs(deltaX);
  const absoluteDeltaY = Math.abs(deltaY);

  while (x !== end.x || y !== end.y) {
    const boundaryX = stepX > 0 ? (x + 1) * tileSize : x * tileSize;
    const boundaryY = stepY > 0 ? (y + 1) * tileSize : y * tileSize;
    const distanceX = stepX === 0 ? Number.POSITIVE_INFINITY : Math.abs(boundaryX - from.x);
    const distanceY = stepY === 0 ? Number.POSITIVE_INFINITY : Math.abs(boundaryY - from.y);
    const crossingX = distanceX * absoluteDeltaY;
    const crossingY = distanceY * absoluteDeltaX;

    if (crossingX === crossingY) {
      if (
        !isWalkable(map, { x: x + stepX, y })
        || !isWalkable(map, { x, y: y + stepY })
      ) {
        return true;
      }
      x += stepX;
      y += stepY;
    } else if (crossingX < crossingY) {
      x += stepX;
    } else {
      y += stepY;
    }

    if (!isWalkable(map, { x, y })) {
      return true;
    }
  }

  return false;
}

/**
 * Devuelve las celdas bloqueadas que corta la linea entre dos puntos. Permite
 * dibujar en la escena que muro esta ocultando al jugador, sin recalcular la
 * traza con una segundaimplementacion.
 */
export function occludingCells(
  map: GridMap,
  tileSize: number,
  from: Vector2,
  to: Vector2,
): readonly GridPoint[] {
  const start = worldToCell(from, tileSize);
  const end = worldToCell(to, tileSize);
  const blockedCells: GridPoint[] = [];
  if (!isWalkable(map, start)) {
    blockedCells.push(start);
    return blockedCells;
  }
  if (!isWalkable(map, end)) {
    blockedCells.push(end);
    return blockedCells;
  }

  let x = start.x;
  let y = start.y;
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const stepX = Math.sign(deltaX);
  const stepY = Math.sign(deltaY);
  const absoluteDeltaX = Math.abs(deltaX);
  const absoluteDeltaY = Math.abs(deltaY);

  while (x !== end.x || y !== end.y) {
    const boundaryX = stepX > 0 ? (x + 1) * tileSize : x * tileSize;
    const boundaryY = stepY > 0 ? (y + 1) * tileSize : y * tileSize;
    const distanceX = stepX === 0 ? Number.POSITIVE_INFINITY : Math.abs(boundaryX - from.x);
    const distanceY = stepY === 0 ? Number.POSITIVE_INFINITY : Math.abs(boundaryY - from.y);
    const crossingX = distanceX * absoluteDeltaY;
    const crossingY = distanceY * absoluteDeltaX;

    if (crossingX === crossingY) {
      if (!isWalkable(map, { x: x + stepX, y })) {
        blockedCells.push({ x: x + stepX, y });
        return blockedCells;
      }
      if (!isWalkable(map, { x, y: y + stepY })) {
        blockedCells.push({ x, y: y + stepY });
        return blockedCells;
      }
      x += stepX;
      y += stepY;
    } else if (crossingX < crossingY) {
      x += stepX;
    } else {
      y += stepY;
    }

    if (!isWalkable(map, { x, y })) {
      blockedCells.push({ x, y });
      return blockedCells;
    }
  }

  return blockedCells;
}
