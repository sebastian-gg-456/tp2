import type { GridPoint } from "../model/grid";
import type { Vector2 } from "../model/vector";

/**
 * H4 - Maquina de estados del guardia.
 *
 * La funcion `decide` es pura: recibe todo lo que el guardia sabe y devuelve
 * la proxima conducta, el evento que la provoca y la causa observable. No
 * conoce Phaser, ni rutas, ni reloj de cuadro. La capa de aplicacion se
 * encarga de resolver rutas, locomocion y puertas.
 *
 * Prioridades invariables:
 *  1. vision confirmada
 *  2. vision perdida durante persecucion
 *  3. sonido o ultima posicion conocida
 *  4. ciclo de la conducta en curso
 */

export type GuardState =
  | "patrol"
  | "investigate"
  | "chase"
  | "search"
  | "return"
  | "captured";

export type GuardEvent =
  | "patrol-arrived"
  | "sound-heard"
  | "sight-confirmed"
  | "sight-lost"
  | "last-moment-escape"
  | "search-started"
  | "search-point-reached"
  | "search-expired"
  | "return-started"
  | "destination-unreachable"
  | "captured";

export type GoalReason = "patrol" | "manual" | "sound" | "last-known" | "search" | "return";

export interface GuardContext {
  readonly timeMs: number;
  readonly state: GuardState;
  readonly enteredStateAtMs: number;
  /** Vision geometrica de este tick, ya filtrada por oclusion y cono. */
  readonly visionVisible: boolean;
  /** Instante en que empezo la vision continua, o null si no ve. */
  readonly visibleSinceMs: number | null;
  readonly confirmMs: number;
  readonly soundHeard: boolean;
  readonly soundCell: GridPoint | null;
  readonly lastKnownCell: GridPoint | null;
  readonly goalCell: GridPoint | null;
  readonly atGoal: boolean;
  readonly goalReachable: boolean;
  readonly searchPointsRemaining: boolean;
  readonly searchExpired: boolean;
  /** Distancia actual al jugador en pixeles del mundo. */
  readonly distanceToPlayer: number;
  readonly captureRadius: number;
  /** Armado cuando la vision se rompio dentro del radio de ultimo momento. */
  readonly lastMomentBroken: boolean;
  /** Hay una orden manual de destino impuesta por el operador. */
  readonly manualOverride: boolean;
}

export interface GuardDecision {
  readonly state: GuardState;
  readonly event: GuardEvent | null;
  readonly cause: string;
  readonly goalCell: GridPoint | null;
  readonly goalReason: GoalReason | null;
  /** Hay que crear un plan de busqueda nuevo. */
  readonly startSearch: boolean;
  /** Hay que avanzar al siguiente punto del plan de busqueda vigente. */
  readonly advanceSearch: boolean;
  /** Libera el override manual porque ya se cumplio. */
  readonly clearManual: boolean;
  readonly captured: boolean;
  readonly lastMomentEscape: boolean;
  /** Pide abrir la persiana: consecuencia de confirmar una persecucion. */
  readonly requestShutter: boolean;
  /** Justificacion de por que la vision cuenta como confirmada. */
  readonly sightConfirmed: boolean;
}

const KEEP: GuardDecision = {
  state: "patrol",
  event: null,
  cause: "sin evento",
  goalCell: null,
  goalReason: null,
  startSearch: false,
  advanceSearch: false,
  clearManual: false,
  captured: false,
  lastMomentEscape: false,
  requestShutter: false,
  sightConfirmed: false,
};

export function decide(context: GuardContext): GuardDecision {
  if (context.state === "captured") {
    return { ...KEEP, state: "captured", cause: "captura consumada" };
  }

  const distance = context.distanceToPlayer;
  const canCapture = context.state === "chase"
    && context.visionVisible
    && distance <= context.captureRadius;
  if (canCapture) {
    return {
      ...KEEP,
      state: "captured",
      event: "captured",
      cause: `distancia ${distance.toFixed(1)} <= radio ${context.captureRadius}`,
      goalCell: null,
      goalReason: null,
      captured: true,
    };
  }

  const sightConfirmed = context.visionVisible
    && context.visibleSinceMs !== null
    && context.timeMs - context.visibleSinceMs >= context.confirmMs;

  if (sightConfirmed) {
    const firstEntry = context.state !== "chase";
    return {
      ...KEEP,
      state: "chase",
      event: firstEntry ? "sight-confirmed" : null,
      cause: firstEntry
        ? `vision confirmada tras ${context.confirmMs} ms continua`
        : "vision sostenida",
      goalCell: context.lastKnownCell,
      goalReason: "last-known",
      requestShutter: firstEntry,
      sightConfirmed: true,
    };
  }

  if (context.state === "chase") {
    const escape = context.lastMomentBroken;
    return {
      ...KEEP,
      state: "search",
      event: escape ? "last-moment-escape" : "sight-lost",
      cause: escape
        ? `linea de vision rota a ${distance.toFixed(1)} px, dentro del radio de ultimo momento`
        : "vision perdida, conserva ultima posicion conocida",
      goalCell: context.lastKnownCell,
      goalReason: "last-known",
      startSearch: true,
      lastMomentEscape: escape,
    };
  }

  if (context.soundHeard && context.soundCell) {
    const alreadyThere = context.state === "investigate"
      && sameCell(context.goalCell, context.soundCell);
    return {
      ...KEEP,
      state: "investigate",
      event: alreadyThere ? null : "sound-heard",
      cause: alreadyThere
        ? "sonido repetido en el mismo origen, mantiene destino"
        : `sonido en ${context.soundCell.x},${context.soundCell.y}`,
      goalCell: context.soundCell,
      goalReason: "sound",
    };
  }

  switch (context.state) {
    case "investigate": {
      if (!context.goalReachable) {
        return unreachable("return", "destino de investigacion inaccesible");
      }
      if (context.atGoal) {
        return {
          ...KEEP,
          state: "search",
          event: "search-started",
          cause: "llego al origen del sonido y no ve nada",
          goalCell: context.lastKnownCell ?? context.goalCell,
          goalReason: "last-known",
          startSearch: true,
        };
      }
      return { ...KEEP, state: "investigate", goalCell: context.goalCell, goalReason: "sound" };
    }

    case "search": {
      if (context.searchExpired) {
        return {
          ...KEEP,
          state: "return",
          event: "search-expired",
          cause: "la busqueda agoto su ventana de tiempo",
          goalCell: context.goalCell,
          goalReason: "return",
        };
      }
      if (!context.goalReachable) {
        return unreachable("return", "punto de busqueda inaccesible");
      }
      if (context.atGoal && context.searchPointsRemaining) {
        return {
          ...KEEP,
          state: "search",
          event: "search-point-reached",
          cause: "punto de busqueda alcanzado, avanza al siguiente",
          goalCell: context.goalCell,
          goalReason: "search",
          advanceSearch: true,
        };
      }
      if (context.atGoal) {
        return {
          ...KEEP,
          state: "return",
          event: "search-expired",
          cause: "plan de busqueda agotado",
          goalCell: context.goalCell,
          goalReason: "return",
        };
      }
      return { ...KEEP, state: "search", goalCell: context.goalCell, goalReason: "search" };
    }

    case "return": {
      if (!context.goalReachable) {
        return unreachable("patrol", "punto de patrulla inaccesible");
      }
      if (context.atGoal) {
        return {
          ...KEEP,
          state: "patrol",
          event: "return-started",
          cause: "regreso completado, retoma la patrulla",
          goalCell: context.goalCell,
          goalReason: "patrol",
          clearManual: true,
        };
      }
      return { ...KEEP, state: "return", goalCell: context.goalCell, goalReason: "return" };
    }

    case "patrol": {
      if (!context.goalReachable) {
        if (context.manualOverride) {
          return {
            ...KEEP,
            state: "patrol",
            event: "destination-unreachable",
            cause: "destino manual inaccesible, vuelve a la ruta",
            goalCell: context.goalCell,
            goalReason: "patrol",
            clearManual: true,
          };
        }
        return {
          ...KEEP,
          state: "patrol",
          event: "destination-unreachable",
          cause: "punto de patrulla inaccesible con las puertas actuales, salta al siguiente",
          goalCell: null,
          goalReason: "patrol",
        };
      }
      if (context.atGoal) {
        return {
          ...KEEP,
          state: "patrol",
          event: "patrol-arrived",
          cause: "llegada al punto de patrulla, ejecuta pausa y barrido",
          goalCell: context.goalCell,
          goalReason: "patrol",
          clearManual: context.manualOverride,
        };
      }
      const reason: GoalReason = context.manualOverride ? "manual" : "patrol";
      return { ...KEEP, state: "patrol", goalCell: context.goalCell, goalReason: reason };
    }

    default:
      return { ...KEEP, state: "patrol", goalCell: null, goalReason: "patrol" };
  }
}

function unreachable(
  next: GuardState,
  cause: string,
): GuardDecision {
  return {
    ...KEEP,
    state: next,
    event: "destination-unreachable",
    cause,
    goalCell: null,
    goalReason: next === "patrol" ? "patrol" : "return",
  };
}

export function sameCell(left: GridPoint | null, right: GridPoint | null): boolean {
  if (left === null || right === null) {
    return left === right;
  }
  return left.x === right.x && left.y === right.y;
}

export function guardStateLabel(state: GuardState): string {
  switch (state) {
    case "patrol":
      return "PATRULLA";
    case "investigate":
      return "INVESTIGA";
    case "chase":
      return "PERSIGUE";
    case "search":
      return "BUSCA";
    case "return":
      return "REGRESA";
    case "captured":
      return "CAPTURADO";
    default:
      return "PATRULLA";
  }
}

export function distanceToCell(point: Vector2, cell: GridPoint, tileSize: number): number {
  const centerX = cell.x * tileSize + tileSize / 2;
  const centerY = cell.y * tileSize + tileSize / 2;
  return Math.hypot(centerX - point.x, centerY - point.y);
}
