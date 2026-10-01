import type { GuardState } from "../behavior/stateMachine";

/**
 * RF-08 - Telemetría.
 *
 * Cada transición de conducta produce un evento estructurado con tiempo,
 * estado anterior, evento, estado nuevo y causa. El log es acotado para que
 * la escena no crezca sin limite y expone la cantidad descartada.
 */

export type TelemetryKind =
  | "transition"
  | "perception"
  | "navigation"
  | "impact"
  | "level"
  | "distractor"
  | "manual";

export interface TelemetryEvent {
  readonly atMs: number;
  readonly kind: TelemetryKind;
  readonly from: GuardState | null;
  readonly to: GuardState | null;
  readonly event: string;
  readonly cause: string;
  readonly detail?: string;
}

export interface TelemetryLog {
  readonly events: readonly TelemetryEvent[];
  readonly capacity: number;
  readonly dropped: number;
}

export const DEFAULT_TELEMETRY_CAPACITY = 40;

export function emptyTelemetryLog(capacity = DEFAULT_TELEMETRY_CAPACITY): TelemetryLog {
  if (!Number.isInteger(capacity) || capacity <= 0) {
    throw new Error("Telemetry capacity must be a positive integer.");
  }
  return { events: [], capacity, dropped: 0 };
}

export function pushTelemetry(log: TelemetryLog, event: TelemetryEvent): TelemetryLog {
  const events = [...log.events, event];
  const overflow = Math.max(0, events.length - log.capacity);
  return {
    capacity: log.capacity,
    dropped: log.dropped + overflow,
    events: events.slice(overflow),
  };
}

export function recentTelemetry(log: TelemetryLog, count: number): readonly TelemetryEvent[] {
  if (count <= 0) {
    return [];
  }
  return log.events.slice(Math.max(0, log.events.length - count));
}

export function lastTransition(log: TelemetryLog): TelemetryEvent | null {
  for (let index = log.events.length - 1; index >= 0; index -= 1) {
    const event = log.events[index];
    if (event && event.kind === "transition") {
      return event;
    }
  }
  return null;
}
