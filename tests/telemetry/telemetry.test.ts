import { describe, expect, it } from "vitest";
import {
  emptyTelemetryLog,
  lastTransition,
  pushTelemetry,
  recentTelemetry,
  type TelemetryEvent,
} from "../../src/domain/telemetry/telemetry";

function transition(atMs: number, event: string): TelemetryEvent {
  return {
    atMs,
    kind: "transition",
    from: "patrol",
    to: "investigate",
    event,
    cause: `causa de ${event}`,
  };
}

describe("telemetry log", () => {
  it("starts empty", () => {
    const log = emptyTelemetryLog();

    expect(log.events).toHaveLength(0);
    expect(log.dropped).toBe(0);
    expect(lastTransition(log)).toBeNull();
  });

  it("records the structured transition payload", () => {
    const log = pushTelemetry(emptyTelemetryLog(), transition(1200, "sound-heard"));

    expect(log.events).toHaveLength(1);
    expect(log.events[0]?.atMs).toBe(1200);
    expect(log.events[0]?.from).toBe("patrol");
    expect(log.events[0]?.to).toBe("investigate");
  });

  it("keeps the log bounded and counts what it dropped", () => {
    let log = emptyTelemetryLog(3);
    for (let index = 0; index < 5; index += 1) {
      log = pushTelemetry(log, transition(index, `event-${index}`));
    }

    expect(log.events).toHaveLength(3);
    expect(log.dropped).toBe(2);
    expect(log.events[0]?.event).toBe("event-2");
    expect(log.events[2]?.event).toBe("event-4");
  });

  it("accumulates the dropped count across pushes", () => {
    let log = emptyTelemetryLog(2);
    log = pushTelemetry(log, transition(0, "a"));
    log = pushTelemetry(log, transition(1, "b"));
    log = pushTelemetry(log, transition(2, "c"));
    log = pushTelemetry(log, transition(3, "d"));

    expect(log.dropped).toBe(2);
  });

  it("returns the most recent window", () => {
    let log = emptyTelemetryLog(10);
    for (let index = 0; index < 4; index += 1) {
      log = pushTelemetry(log, transition(index, `e${index}`));
    }

    expect(recentTelemetry(log, 2).map((event) => event.event)).toEqual(["e2", "e3"]);
    expect(recentTelemetry(log, 99)).toHaveLength(4);
    expect(recentTelemetry(log, 0)).toEqual([]);
  });

  it("finds the last transition ignoring other kinds", () => {
    let log = emptyTelemetryLog();
    log = pushTelemetry(log, transition(10, "sound-heard"));
    log = pushTelemetry(log, {
      atMs: 20,
      kind: "impact",
      from: null,
      to: null,
      event: "thud",
      cause: "piedra",
    });

    expect(lastTransition(log)?.event).toBe("sound-heard");
  });

  it("rejects a non positive capacity", () => {
    expect(() => emptyTelemetryLog(0)).toThrow("positive integer");
  });
});