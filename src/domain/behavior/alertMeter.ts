/**
 * Upgrade 8 - Medidor de alerta y estados del nivel.
 *
 * El medidor es un valor continuo 0..1. Sube mientras el guardia percibe al
 * jugador y baja cuando deja de percibirlo, con una gracia para que una
 * interrupcion breve no borre el progreso. De el se derivan dos bandas que
 * el resto de la simulacion usa como consecuencia: mas velocidad, camara mas
 * tensa y apertura de atajos.
 */

export type AlertBand = "calm" | "suspicious" | "alert";

export interface AlertConfig {
  readonly visionGainPerSecond: number;
  readonly soundGainPerSecond: number;
  /** Piso que impone un sonido: el guardia sospecha aunque no mire. */
  readonly soundFloor: number;
  readonly decayPerSecond: number;
  readonly decayGraceMs: number;
  readonly suspiciousThreshold: number;
  readonly alertThreshold: number;
  /** Bonus de ganancia por estar muy cerca, en el limite del rango visual. */
  readonly closenessBonus: number;
  /** Multiplicador de descenso mientras el guardia busca activamente. */
  readonly searchDecayMultiplier: number;
}

export interface AlertState {
  readonly level: number;
  readonly band: AlertBand;
  readonly peak: number;
  readonly lastStimulusAtMs: number | null;
}

export interface AlertInput {
  readonly timeMs: number;
  readonly deltaMs: number;
  readonly visionVisible: boolean;
  readonly visionDistance: number;
  readonly visionRange: number;
  readonly soundHeard: boolean;
  readonly searching: boolean;
}

export function createAlertConfig(overrides: Partial<AlertConfig> = {}): AlertConfig {
  return { ...DEFAULT_ALERT_CONFIG, ...overrides };
}

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  visionGainPerSecond: 0.78,
  soundGainPerSecond: 0.42,
  soundFloor: 0.3,
  decayPerSecond: 0.16,
  decayGraceMs: 1400,
  suspiciousThreshold: 0.3,
  alertThreshold: 0.72,
  closenessBonus: 0.85,
  searchDecayMultiplier: 0.55,
};

export function initialAlertState(): AlertState {
  return { level: 0, band: "calm", peak: 0, lastStimulusAtMs: null };
}

export function alertBandOf(config: AlertConfig, level: number): AlertBand {
  if (level >= config.alertThreshold) {
    return "alert";
  }
  if (level >= config.suspiciousThreshold) {
    return "suspicious";
  }
  return "calm";
}

export function updateAlert(
  config: AlertConfig,
  state: AlertState,
  input: AlertInput,
): AlertState {
  if (!Number.isFinite(input.timeMs) || !Number.isFinite(input.deltaMs) || input.deltaMs < 0) {
    throw new Error("Alert update requires a finite time and a non-negative delta.");
  }

  const seconds = input.deltaMs / 1000;
  let level = state.level;
  let lastStimulusAtMs = state.lastStimulusAtMs;

  if (input.visionVisible) {
    const range = Math.max(1, input.visionRange);
    const closeness = 1 - Math.min(1, Math.max(0, input.visionDistance) / range);
    const gain = config.visionGainPerSecond + config.closenessBonus * closeness * closeness;
    level += gain * seconds;
    lastStimulusAtMs = input.timeMs;
  } else if (input.soundHeard) {
    level = Math.max(level, config.soundFloor);
    level += config.soundGainPerSecond * seconds;
    lastStimulusAtMs = input.timeMs;
  } else if (
    lastStimulusAtMs !== null
    && input.timeMs - lastStimulusAtMs >= config.decayGraceMs
  ) {
    const decay = config.decayPerSecond * (input.searching ? config.searchDecayMultiplier : 1);
    level -= decay * seconds;
  }

  level = Math.min(1, Math.max(0, level));
  return {
    level,
    band: alertBandOf(config, level),
    peak: Math.max(state.peak, level),
    lastStimulusAtMs,
  };
}

export function alertLabel(band: AlertBand): string {
  switch (band) {
    case "calm":
      return "CALMO";
    case "suspicious":
      return "SOSPECHA";
    case "alert":
      return "ALERTA";
    default:
      return "CALMO";
  }
}
