import { describe, expect, it } from "vitest";
import {
  decide,
  distanceToCell,
  guardStateLabel,
  sameCell,
  type GuardContext,
  type GuardState,
} from "../../src/domain/behavior/stateMachine";

const BASE: GuardContext = {
  timeMs: 1000,
  state: "patrol",
  enteredStateAtMs: 0,
  visionVisible: false,
  visibleSinceMs: null,
  confirmMs: 420,
  soundHeard: false,
  soundCell: null,
  lastKnownCell: null,
  goalCell: { x: 4, y: 1 },
  atGoal: false,
  goalReachable: true,
  searchPointsRemaining: true,
  searchExpired: false,
  distanceToPlayer: 200,
  captureRadius: 20,
  lastMomentBroken: false,
  manualOverride: false,
};

function context(overrides: Partial<GuardContext>): GuardContext {
  return { ...BASE, ...overrides };
}

describe("H4.1: sight confirmation", () => {
  it("does not confirm before the dwell time", () => {
    const decision = decide(context({ visionVisible: true, visibleSinceMs: 900 }));

    expect(decision.state).toBe("patrol");
    expect(decision.sightConfirmed).toBe(false);
  });

  it("enters chase and asks for the shutter once confirmed", () => {
    const decision = decide(context({ visionVisible: true, visibleSinceMs: 500 }));

    expect(decision.state).toBe("chase");
    expect(decision.event).toBe("sight-confirmed");
    expect(decision.requestShutter).toBe(true);
    expect(decision.goalReason).toBe("last-known");
  });

  it("stays in chase without repeating the confirmation event", () => {
    const decision = decide(context({
      state: "chase",
      visionVisible: true,
      visibleSinceMs: 100,
      lastKnownCell: { x: 3, y: 3 },
    }));

    expect(decision.state).toBe("chase");
    expect(decision.event).toBeNull();
    expect(decision.requestShutter).toBe(false);
    expect(decision.goalCell).toEqual({ x: 3, y: 3 });
  });

  it("never confirms sight without a start time", () => {
    const decision = decide(context({ visionVisible: true, visibleSinceMs: null }));

    expect(decision.state).toBe("patrol");
    expect(decision.sightConfirmed).toBe(false);
  });
});

describe("H4.2: last known position", () => {
  it("moves to search keeping the last known cell", () => {
    const decision = decide(context({
      state: "chase",
      lastKnownCell: { x: 2, y: 4 },
      distanceToPlayer: 180,
    }));

    expect(decision.state).toBe("search");
    expect(decision.event).toBe("sight-lost");
    expect(decision.goalCell).toEqual({ x: 2, y: 4 });
    expect(decision.startSearch).toBe(true);
    expect(decision.lastMomentEscape).toBe(false);
  });

  it("flags a last moment escape with its own event", () => {
    const decision = decide(context({
      state: "chase",
      lastKnownCell: { x: 2, y: 4 },
      lastMomentBroken: true,
      distanceToPlayer: 34,
    }));

    expect(decision.state).toBe("search");
    expect(decision.event).toBe("last-moment-escape");
    expect(decision.lastMomentEscape).toBe(true);
    expect(decision.cause).toContain("34.0 px");
  });

  it("keeps investigating while the sight is not confirmed", () => {
    const decision = decide(context({
      state: "chase",
      visionVisible: true,
      visibleSinceMs: 990,
    }));

    expect(decision.state).toBe("search");
    expect(decision.event).toBe("sight-lost");
  });
});

describe("H4.3: search plan", () => {
  it("starts the plan when the sound origin is reached", () => {
    const decision = decide(context({
      state: "investigate",
      goalCell: { x: 2, y: 2 },
      atGoal: true,
      lastKnownCell: { x: 2, y: 2 },
    }));

    expect(decision.state).toBe("search");
    expect(decision.event).toBe("search-started");
    expect(decision.startSearch).toBe(true);
  });

  it("keeps walking to the next point of the plan", () => {
    const decision = decide(context({ state: "search", goalCell: { x: 2, y: 2 } }));

    expect(decision.state).toBe("search");
    expect(decision.advanceSearch).toBe(false);
    expect(decision.goalReason).toBe("search");
  });

  it("advances when a search point is reached", () => {
    const decision = decide(context({
      state: "search",
      atGoal: true,
      searchPointsRemaining: true,
    }));

    expect(decision.state).toBe("search");
    expect(decision.event).toBe("search-point-reached");
    expect(decision.advanceSearch).toBe(true);
  });

  it("returns when the plan runs out of points", () => {
    const decision = decide(context({
      state: "search",
      atGoal: true,
      searchPointsRemaining: false,
    }));

    expect(decision.state).toBe("return");
    expect(decision.event).toBe("search-expired");
  });

  it("returns when the search window expires while walking", () => {
    const decision = decide(context({ state: "search", searchExpired: true }));

    expect(decision.state).toBe("return");
    expect(decision.event).toBe("search-expired");
  });

  it("abandons the search when a point is unreachable", () => {
    const decision = decide(context({ state: "search", goalReachable: false }));

    expect(decision.state).toBe("return");
    expect(decision.event).toBe("destination-unreachable");
    expect(decision.cause).toContain("inaccesible");
  });
});

describe("H4.4: return and resume patrol", () => {
  it("walks back to the route", () => {
    const decision = decide(context({ state: "return", goalCell: { x: 4, y: 1 } }));

    expect(decision.state).toBe("return");
    expect(decision.goalReason).toBe("return");
  });

  it("resumes patrol on arrival and clears the manual override", () => {
    const decision = decide(context({
      state: "return",
      atGoal: true,
      manualOverride: true,
    }));

    expect(decision.state).toBe("patrol");
    expect(decision.event).toBe("return-started");
    expect(decision.clearManual).toBe(true);
    expect(decision.goalReason).toBe("patrol");
  });

  it("falls back to patrol when the route point is unreachable", () => {
    const decision = decide(context({ state: "return", goalReachable: false }));

    expect(decision.state).toBe("patrol");
    expect(decision.event).toBe("destination-unreachable");
  });
});

describe("H4.5: capture", () => {
  it("captures only during a chase, in sight and inside the radius", () => {
    const decision = decide(context({
      state: "chase",
      visionVisible: true,
      visibleSinceMs: 0,
      distanceToPlayer: 12,
      captureRadius: 20,
    }));

    expect(decision.state).toBe("captured");
    expect(decision.event).toBe("captured");
    expect(decision.captured).toBe(true);
  });

  it("does not capture outside the radius", () => {
    const decision = decide(context({
      state: "chase",
      visionVisible: true,
      visibleSinceMs: 0,
      distanceToPlayer: 40,
    }));

    expect(decision.state).toBe("chase");
    expect(decision.captured).toBe(false);
  });

  it("does not capture while investigating even in contact", () => {
    const decision = decide(context({
      state: "investigate",
      visionVisible: true,
      visibleSinceMs: 0,
      distanceToPlayer: 4,
    }));

    expect(decision.captured).toBe(false);
  });

  it("does not capture a player hidden behind a wall", () => {
    const decision = decide(context({
      state: "chase",
      visionVisible: false,
      visibleSinceMs: 0,
      distanceToPlayer: 2,
    }));

    expect(decision.captured).toBe(false);
  });

  it("is terminal: once captured nothing else changes", () => {
    const decision = decide(context({
      state: "captured",
      visionVisible: true,
      visibleSinceMs: 0,
      distanceToPlayer: 0,
      soundHeard: true,
      soundCell: { x: 1, y: 1 },
    }));

    expect(decision.state).toBe("captured");
    expect(decision.event).toBeNull();
    expect(decision.captured).toBe(false);
  });
});

describe("H4: sound handling", () => {
  it("interrupts patrol to investigate a sound", () => {
    const decision = decide(context({ soundHeard: true, soundCell: { x: 5, y: 5 } }));

    expect(decision.state).toBe("investigate");
    expect(decision.event).toBe("sound-heard");
    expect(decision.goalCell).toEqual({ x: 5, y: 5 });
  });

  it("does not repeat the event for the same sound origin", () => {
    const decision = decide(context({
      state: "investigate",
      goalCell: { x: 5, y: 5 },
      soundHeard: true,
      soundCell: { x: 5, y: 5 },
    }));

    expect(decision.state).toBe("investigate");
    expect(decision.event).toBeNull();
    expect(decision.cause).toContain("mantiene destino");
  });

  it("replans when the sound moves to another cell", () => {
    const decision = decide(context({
      state: "investigate",
      goalCell: { x: 5, y: 5 },
      soundHeard: true,
      soundCell: { x: 1, y: 1 },
    }));

    expect(decision.event).toBe("sound-heard");
    expect(decision.goalCell).toEqual({ x: 1, y: 1 });
  });

  it("abandons an unreachable sound origin", () => {
    const decision = decide(context({ state: "investigate", goalReachable: false }));

    expect(decision.state).toBe("return");
    expect(decision.event).toBe("destination-unreachable");
  });

  it("ignores a sound without a source cell", () => {
    const decision = decide(context({ soundHeard: true, soundCell: null }));

    expect(decision.state).toBe("patrol");
  });
});

describe("H4: patrol and manual destination", () => {
  it("reports the arrival to trigger the pause", () => {
    const decision = decide(context({ state: "patrol", atGoal: true }));

    expect(decision.event).toBe("patrol-arrived");
    expect(decision.goalReason).toBe("patrol");
  });

  it("marks the goal as manual when the operator ordered it", () => {
    const decision = decide(context({ manualOverride: true }));

    expect(decision.goalReason).toBe("manual");
  });

  it("keeps patrolling when a patrol point is unreachable", () => {
    const decision = decide(context({ goalReachable: false }));

    expect(decision.state).toBe("patrol");
    expect(decision.event).toBe("destination-unreachable");
    expect(decision.cause).toContain("salta al siguiente");
  });

  it("cancels the manual order when its destination is unreachable", () => {
    const decision = decide(context({ manualOverride: true, goalReachable: false }));

    expect(decision.state).toBe("patrol");
    expect(decision.clearManual).toBe(true);
    expect(decision.goalReason).toBe("patrol");
  });
});

describe("state machine helpers", () => {
  it("compares cells defensively", () => {
    expect(sameCell(null, null)).toBe(true);
    expect(sameCell({ x: 1, y: 1 }, null)).toBe(false);
    expect(sameCell({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(true);
    expect(sameCell({ x: 1, y: 1 }, { x: 1, y: 2 })).toBe(false);
  });

  it("labels every state for the HUD", () => {
    const labels: Record<GuardState, string> = {
      patrol: "PATRULLA",
      investigate: "INVESTIGA",
      chase: "PERSIGUE",
      search: "BUSCA",
      return: "REGRESA",
      captured: "CAPTURADO",
    };

    for (const [state, label] of Object.entries(labels) as [GuardState, string][]) {
      expect(guardStateLabel(state)).toBe(label);
    }
  });

  it("measures the distance to a cell centre", () => {
    expect(distanceToCell({ x: 0, y: 0 }, { x: 1, y: 1 }, 32)).toBeCloseTo(Math.hypot(48, 48), 4);
  });
});