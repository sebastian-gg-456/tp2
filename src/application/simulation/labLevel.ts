import { createGridMap, type GridPoint } from "../../domain/model/grid";
import { createPatrolRoute, type PatrolRoute } from "../../domain/behavior/patrol";
import { type DoorSpec } from "../../domain/environment/doors";

export const TILE_SIZE = 32;
export const GRID_WIDTH = 30;
export const GRID_HEIGHT = 20;
export const PLAYER_START: GridPoint = { x: 2, y: 2 };
export const GUARD_START: GridPoint = { x: 27, y: 17 };

/** Salida del nivel: cruzarla sin ser visto completa la infiltracion. */
export const EXTRACTION_CELL: GridPoint = { x: 1, y: 1 };
export const EXTRACTION_RADIUS = 20;

interface BlockedRectangle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const BLOCKED_AREAS: readonly BlockedRectangle[] = [
  { x: 0, y: 0, width: GRID_WIDTH, height: 1 },
  { x: 0, y: GRID_HEIGHT - 1, width: GRID_WIDTH, height: 1 },
  { x: 0, y: 0, width: 1, height: GRID_HEIGHT },
  { x: GRID_WIDTH - 1, y: 0, width: 1, height: GRID_HEIGHT },
  { x: 4, y: 3, width: 1, height: 8 },
  { x: 4, y: 3, width: 7, height: 1 },
  { x: 10, y: 3, width: 1, height: 5 },
  { x: 8, y: 10, width: 8, height: 1 },
  { x: 15, y: 6, width: 1, height: 5 },
  { x: 19, y: 3, width: 1, height: 8 },
  { x: 19, y: 10, width: 7, height: 1 },
  { x: 24, y: 10, width: 1, height: 6 },
  { x: 8, y: 15, width: 17, height: 1 },
];

function expandAreas(areas: readonly BlockedRectangle[]): GridPoint[] {
  const cells: GridPoint[] = [];

  for (const area of areas) {
    for (let y = area.y; y < area.y + area.height; y += 1) {
      for (let x = area.x; x < area.x + area.width; x += 1) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}

export const LAB_MAP = createGridMap(GRID_WIDTH, GRID_HEIGHT, expandAreas(BLOCKED_AREAS));

/**
 * Upgrade 10 - Puertas, atajos y rutas bloqueables.
 *
 * Tres huecos de muro se convierten en compuertas navegables. Dos ciclan
 * solas, generando rutas alternativas que obligan a recalcular. La tercera
 * es la persiana del atajo: solo se abre cuando el guardia confirma una
 * persecucion, asi que usarla tiene costo.
 */
export const DOOR_SPECS: readonly DoorSpec[] = [
  {
    id: "puerta-norte",
    kind: "auto",
    cells: [{ x: 4, y: 6 }],
    openMs: 5200,
    closedMs: 3400,
    startOpen: true,
  },
  {
    id: "puerta-este",
    kind: "auto",
    cells: [{ x: 24, y: 12 }],
    openMs: 4600,
    closedMs: 3800,
    startOpen: false,
  },
  {
    id: "persiana",
    kind: "shutter",
    cells: [{ x: 19, y: 5 }, { x: 19, y: 6 }],
    openMs: 1,
    closedMs: 5000,
    startOpen: false,
  },
];

/**
 * Upgrade 1 - Patrulla con pausas y mirada direccional.
 *
 * Cinco puntos que recorren el nivel en sentido antihorario. Las pausas
 * alternan entre puntos "vivos" con barrido de mirada y puntos de paso
 * rapido, para que el ritmo no sea uniforme ni predecible.
 */
export const PATROL_ROUTE: PatrolRoute = createPatrolRoute([
  { cell: { x: 7, y: 13 }, pauseMs: 2400, sweepDegrees: [-75, 0, 75], sweepPeriodMs: 2400 },
  { cell: { x: 13, y: 17 }, pauseMs: 0, sweepDegrees: [], sweepPeriodMs: 1800 },
  { cell: { x: 21, y: 17 }, pauseMs: 1800, sweepDegrees: [-60, 60], sweepPeriodMs: 2000 },
  { cell: { x: 27, y: 12 }, pauseMs: 2200, sweepDegrees: [-90, 0, 90], sweepPeriodMs: 2600 },
  { cell: { x: 22, y: 7 }, pauseMs: 1600, sweepDegrees: [-45, 45], sweepPeriodMs: 1800 },
  { cell: { x: 13, y: 8 }, pauseMs: 2000, sweepDegrees: [-70, 0, 70], sweepPeriodMs: 2200 },
]);

/** Puntos de patrulla tambien usados como objetivos de retorno (H4.5). */
export const RETURN_POINT: GridPoint = { x: 7, y: 13 };
