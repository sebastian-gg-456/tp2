import { describe, expect, it } from "vitest";
import {
  alertBandOf,
  createAlertConfig,
  initialAlertState,
  updateAlert,
} from "../../src/domain/behavior/alertMeter";
import type { AlertInput } from "../../src/domain/behavior/alertMeter";

const CONFIG = createAlertConfig();

const NO_INPUT: Omit<AlertInput, "timeMs" | "deltaMs"> = {
  visionVisible: false,
  visionDistance: 0,
  visionRange: 220,
  soundHeard: false,
  searching: false,
};

describe("upgrade 8: alert meter", () => {
  it("starts at calm zero", () => {
    const state = initialAlertState();

    expect(state.level).toBe(0);
    expect(state.band).toBe("calm");
    expect(state.lastStimulusAtMs).toBeNull();
  });

  it("rises while the guard sees the player", () => {
    const first = updateAlert(CONFIG, initialAlertState(), {
      ...NO_INPUT,
      timeMs: 0,
      deltaMs: 500,
      visionVisible: true,
      visionDistance: 200,
    });

    expect(first.level).toBeGreaterThan(0.2);
    expect(first.band).toBe("suspicious");
    expect(first.lastStimulusAtMs).toBe(0);
  });

  it("rises faster when the player is close", () => {
    const far = updateAlert(CONFIG, initialAlertState(), {
      ...NO_INPUT,
      timeMs: 0,
      deltaMs: 400,
      visionVisible: true,
      visionDistance: 220,
    });
    const near = updateAlert(CONFIG, initialAlertState(), {
      ...NO_INPUT,
      timeMs: 0,
      deltaMs: 400,
      visionVisible: true,
      visionDistance: 8,
    });

    expect(near.level).toBeGreaterThan(far.level);
  });

  it("jumps to a floor when it hears a sound", () => {
    const state = updateAlert(CONFIG, initialAlertState(), {
      ...NO_INPUT,
      timeMs: 0,
      deltaMs: 16,
      soundHeard: true,
    });

    expect(state.level).toBeGreaterThanOrEqual(CONFIG.soundFloor);
  });

  it("never exceeds one", () => {
    let state = initialAlertState();
    for (let index = 0; index < 40; index += 1) {
      state = updateAlert(CONFIG, state, {
        ...NO_INPUT,
        timeMs: index * 100,
        deltaMs: 100,
        visionVisible: true,
        visionDistance: 10,
      });
    }

    expect(state.level).toBe(1);
    expect(state.band).toBe("alert");
  });

  it("does not decay during the grace window", () => {
    const seen = updateAlert(CONFIG, initialAlertState(), {
      ...NO_INPUT,
      timeMs: 0,
      deltaMs: 100,
      visionVisible: true,
      visionDistance: 100,
    });
    const held = updateAlert(CONFIG, seen, {
      ...NO_INPUT,
      timeMs: 100,
      deltaMs: 100,
    });

    expect(held.level).toBe(seen.level);
  });

  it("decays after the grace window", () => {
    const seen = updateAlert(CONFIG, initialAlertState(), {
      ...NO_INPUT,
      timeMs: 0,
      deltaMs: 100,
      visionVisible: true,
      visionDistance: 100,
    });
    const cooled = updateAlert(CONFIG, seen, {
      ...NO_INPUT,
      timeMs: 2000,
      deltaMs: 1000,
    });

    expect(cooled.level).toBeLessThan(seen.level);
  });

  it("decays more slowly while searching", () => {
    const seen = updateAlert(CONFIG, initialAlertState(), {
      ...NO_INPUT,
      timeMs: 0,
      deltaMs: 100,
      visionVisible: true,
      visionDistance: 100,
    });
    const plain = updateAlert(CONFIG, seen, { ...NO_INPUT, timeMs: 3000, deltaMs: 1000 });
    const searching = updateAlert(CONFIG, seen, {
      ...NO_INPUT,
      timeMs: 3000,
      deltaMs: 1000,
      searching: true,
    });

    expect(searching.level).toBeGreaterThan(plain.level);
  });

  it("keeps the peak value for telemetry", () => {
    const seen = updateAlert(CONFIG, initialAlertState(), {
      ...NO_INPUT,
      timeMs: 0,
      deltaMs: 1000,
      visionVisible: true,
      visionDistance: 10,
    });
    const cooled = updateAlert(CONFIG, seen, { ...NO_INPUT, timeMs: 9000, deltaMs: 5000 });

    expect(cooled.peak).toBe(seen.level);
  });

  it("resolves the band from the level", () => {
    expect(alertBandOf(CONFIG, 0)).toBe("calm");
    expect(alertBandOf(CONFIG, 0.5)).toBe("suspicious");
    expect(alertBandOf(CONFIG, 0.95)).toBe("alert");
  });

  it("rejects invalid time", () => {
    expect(() => updateAlert(CONFIG, initialAlertState(), {
      ...NO_INPUT,
      timeMs: Number.NaN,
      deltaMs: 16,
    })).toThrow("finite time");
  });
});
