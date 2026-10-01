import { describe, expect, it } from "vitest";
import {
  initialLastMomentState,
  updateLastMoment,
} from "../../src/domain/behavior/lastMoment";
import type { LastMomentInput } from "../../src/domain/behavior/lastMoment";

const BASE: Omit<LastMomentInput, "timeMs" | "distancePx" | "visionVisible"> = {
  chasing: true,
  lastMomentRadius: 78,
  captureRadius: 20,
};

describe("upgrade 9: last moment window", () => {
  it("starts disarmed", () => {
    expect(initialLastMomentState().armed).toBe(false);
    expect(initialLastMomentState().escapes).toBe(0);
  });

  it("arms when the player enters the window during a chase", () => {
    const state = updateLastMoment(initialLastMomentState(), {
      ...BASE,
      timeMs: 1000,
      distancePx: 60,
      visionVisible: true,
    });

    expect(state.armed).toBe(true);
    expect(state.armedAtMs).toBe(1000);
    expect(state.escapes).toBe(0);
  });

  it("does not arm outside the window", () => {
    const state = updateLastMoment(initialLastMomentState(), {
      ...BASE,
      timeMs: 1000,
      distancePx: 120,
      visionVisible: true,
    });

    expect(state.armed).toBe(false);
  });

  it("does not arm when the guard is not chasing", () => {
    const state = updateLastMoment(initialLastMomentState(), {
      ...BASE,
      chasing: false,
      timeMs: 1000,
      distancePx: 30,
      visionVisible: true,
    });

    expect(state.armed).toBe(false);
  });

  it("records an escape when sight breaks inside the window", () => {
    const armed = updateLastMoment(initialLastMomentState(), {
      ...BASE,
      timeMs: 1000,
      distancePx: 40,
      visionVisible: true,
    });
    const escaped = updateLastMoment(armed, {
      ...BASE,
      timeMs: 1340,
      distancePx: 34,
      visionVisible: false,
    });

    expect(escaped.armed).toBe(false);
    expect(escaped.escapes).toBe(1);
    expect(escaped.lastEscape?.marginPx).toBeCloseTo(14, 4);
    expect(escaped.lastEscape?.heldMs).toBe(340);
  });

  it("counts a single escape across several blind frames", () => {
    let state = updateLastMoment(initialLastMomentState(), {
      ...BASE,
      timeMs: 1000,
      distancePx: 40,
      visionVisible: true,
    });
    state = updateLastMoment(state, { ...BASE, timeMs: 1010, distancePx: 41, visionVisible: false });
    state = updateLastMoment(state, { ...BASE, timeMs: 1020, distancePx: 45, visionVisible: false });

    expect(state.escapes).toBe(1);
  });

  it("gives more relief the closer the escape was", () => {
    const nearArm = updateLastMoment(initialLastMomentState(), {
      ...BASE,
      timeMs: 0,
      distancePx: 25,
      visionVisible: true,
    });
    const nearEscape = updateLastMoment(nearArm, {
      ...BASE,
      timeMs: 300,
      distancePx: 26,
      visionVisible: false,
    });

    const farArm = updateLastMoment(initialLastMomentState(), {
      ...BASE,
      timeMs: 0,
      distancePx: 74,
      visionVisible: true,
    });
    const farEscape = updateLastMoment(farArm, {
      ...BASE,
      timeMs: 300,
      distancePx: 75,
      visionVisible: false,
    });

    expect(nearEscape.lastEscape?.relief).toBeGreaterThan(farEscape.lastEscape?.relief ?? 1);
  });

  it("disarms without counting an escape when the player leaves the window while still visible", () => {
    const armed = updateLastMoment(initialLastMomentState(), {
      ...BASE,
      timeMs: 0,
      distancePx: 40,
      visionVisible: true,
    });
    const escapedRange = updateLastMoment(armed, {
      ...BASE,
      timeMs: 200,
      distancePx: 200,
      visionVisible: true,
    });

    expect(escapedRange.armed).toBe(false);
    expect(escapedRange.escapes).toBe(0);
    expect(escapedRange.lastEscape).toBeNull();
  });

  it("disarms without counting an escape when the chase ends", () => {
    const armed = updateLastMoment(initialLastMomentState(), {
      ...BASE,
      timeMs: 0,
      distancePx: 40,
      visionVisible: true,
    });
    const ended = updateLastMoment(armed, {
      ...BASE,
      chasing: false,
      timeMs: 200,
      distancePx: 40,
      visionVisible: false,
    });

    expect(ended.armed).toBe(false);
    expect(ended.escapes).toBe(0);
  });

  it("tracks how close the player was while the window stayed open", () => {
    const armed = updateLastMoment(initialLastMomentState(), {
      ...BASE,
      timeMs: 0,
      distancePx: 70,
      visionVisible: true,
    });
    const closer = updateLastMoment(armed, {
      ...BASE,
      timeMs: 100,
      distancePx: 30,
      visionVisible: true,
    });

    expect(closer.armed).toBe(true);
    expect(closer.armedDistancePx).toBe(30);
  });

  it("rejects a window smaller than the capture radius", () => {
    expect(() => updateLastMoment(initialLastMomentState(), {
      ...BASE,
      lastMomentRadius: 10,
      captureRadius: 20,
      timeMs: 0,
      distancePx: 5,
      visionVisible: true,
    })).toThrow("greater than the capture radius");
  });
});
