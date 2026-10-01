/**
 * Upgrade 9 - Escape de ultimo momento.
 *
 * Cuando el guardia persigue y el jugador entra en su radio de capturacion
 * todavia no capturo, se arma una ventana de tension. Si durante esa ventana
 * el jugador rompe la linea de vision, la captura se evita y se registra el
 * margen con el que se salvo. El modulo solo mide; no decide ni penaliza.
 *
 * Regla deliberada: salir corriendo del radio sin romper la vision NO cuenta
 * como escape de ultimo momento. Es una huida normal, no un aguijon. Solo se
 * cuenta cuando la linea de vision se rompe mientras el jugador sigue dentro
 * de la ventana, porque ahi la captura estaba a punto de ocurrir.
 */

export interface LastMomentEscape {
  readonly atMs: number;
  readonly distancePx: number;
  /** Distancia que le sobraba al jugador para ser capturado, en pixeles. */
  readonly marginPx: number;
  /** Milisegundos que duro la ventana antes de romperse. */
  readonly heldMs: number;
  /** Intensidad de alivio 0..1: mayor cuanto mas cerca estaba la captura. */
  readonly relief: number;
}

export interface LastMomentState {
  readonly armed: boolean;
  readonly armedAtMs: number | null;
  readonly armedDistancePx: number;
  readonly escapes: number;
  readonly lastEscape: LastMomentEscape | null;
}

export interface LastMomentInput {
  readonly timeMs: number;
  readonly chasing: boolean;
  readonly visionVisible: boolean;
  readonly distancePx: number;
  readonly lastMomentRadius: number;
  readonly captureRadius: number;
}

export function initialLastMomentState(): LastMomentState {
  return { armed: false, armedAtMs: null, armedDistancePx: 0, escapes: 0, lastEscape: null };
}

export function updateLastMoment(
  state: LastMomentState,
  input: LastMomentInput,
): LastMomentState {
  const { lastMomentRadius, captureRadius } = input;
  if (lastMomentRadius <= captureRadius) {
    throw new Error("The last moment radius must be greater than the capture radius.");
  }
  if (!Number.isFinite(input.timeMs) || !Number.isFinite(input.distancePx)) {
    throw new Error("Last moment input requires finite values.");
  }

  const withinRadius = input.distancePx <= lastMomentRadius;
  const inside = input.chasing && input.visionVisible && withinRadius;
  const brokeSightInsideWindow = input.chasing && !input.visionVisible && withinRadius;

  if (inside && !state.armed) {
    return {
      ...state,
      armed: true,
      armedAtMs: input.timeMs,
      armedDistancePx: input.distancePx,
    };
  }

  if (!state.armed) {
    return state;
  }

  if (brokeSightInsideWindow) {
    const armedAtMs = state.armedAtMs ?? input.timeMs;
    const marginPx = Math.max(0, input.distancePx - captureRadius);
    const span = Math.max(1, lastMomentRadius - captureRadius);
    const relief = clamp01(1 - (input.distancePx - captureRadius) / span);

    return {
      armed: false,
      armedAtMs: null,
      armedDistancePx: 0,
      escapes: state.escapes + 1,
      lastEscape: {
        atMs: input.timeMs,
        distancePx: input.distancePx,
        marginPx,
        heldMs: Math.max(0, input.timeMs - armedAtMs),
        relief,
      },
    };
  }

  if (inside) {
    return { ...state, armedDistancePx: input.distancePx };
  }

  return { ...state, armed: false, armedAtMs: null, armedDistancePx: 0 };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}