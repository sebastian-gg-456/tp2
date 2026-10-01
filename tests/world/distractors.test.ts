import { describe, expect, it } from "vitest";
import {
  advanceDistraction,
  createDistraction,
  defaultDistractionSpec,
  type DistractionSpec,
} from "../../src/domain/world/distractors";

const SPEC: DistractionSpec = {
  id: "stone",
  speedPxPerSecond: 100,
  timeToImpactMs: 1000,
  radiusPx: 160,
  durationMs: 600,
  gravityPxPerSecondSquared: 0,
  elevationPx: 0,
};

const THROW = { origin: { x: 0, y: 0 }, direction: { x: 1, y: 0 }, spawnAtMs: 0 };

describe("upgrade 7: distraction projectile", () => {
  it("starts flying from the throw origin", () => {
    const distraction = createDistraction("d1", SPEC, THROW);

    expect(distraction.state).toBe("flying");
    expect(distraction.position).toEqual({ x: 0, y: 0 });
    expect(distraction.impactAtMs).toBe(1000);
    expect(distraction.explodedAtMs).toBeNull();
  });

  it("travels at constant speed while flying", () => {
    const flying = createDistraction("d1", SPEC, THROW);

    expect(advanceDistraction(flying, 500).position).toEqual({ x: 50, y: 0 });
    expect(advanceDistraction(flying, 900).position).toEqual({ x: 90, y: 0 });
  });

  it("normalises the throw direction", () => {
    const distraction = createDistraction("d1", SPEC, {
      origin: { x: 0, y: 0 },
      direction: { x: 0, y: 5 },
      spawnAtMs: 0,
    });

    expect(distraction.direction).toEqual({ x: 0, y: 1 });
  });

  it("falls back to a facing direction when the aim is zero", () => {
    const distraction = createDistraction("d1", SPEC, {
      origin: { x: 0, y: 0 },
      direction: { x: 0, y: 0 },
      spawnAtMs: 0,
    });

    expect(distraction.direction).toEqual({ x: 1, y: 0 });
  });

  it("explodes exactly at the impact time", () => {
    const flying = createDistraction("d1", SPEC, THROW);

    expect(advanceDistraction(flying, 999).state).toBe("flying");
    const exploded = advanceDistraction(flying, 1000);
    expect(exploded.state).toBe("exploding");
    expect(exploded.explodedAtMs).toBe(1000);
  });

  it("lands at the predicted impact point", () => {
    const exploded = advanceDistraction(createDistraction("d1", SPEC, THROW), 1000);
    expect(exploded.position).toEqual({ x: 100, y: 0 });
  });

  it("finishes after the sound window", () => {
    const exploding = advanceDistraction(createDistraction("d1", SPEC, THROW), 1000);

    expect(advanceDistraction(exploding, 1500).state).toBe("exploding");
    const done = advanceDistraction(exploding, 1600);
    expect(done.state).toBe("done");
    expect(done.doneAtMs).toBe(1600);
  });

  it("is idempotent once finished", () => {
    const done = advanceDistraction(
      advanceDistraction(createDistraction("d1", SPEC, THROW), 1000),
      1600,
    );

    expect(advanceDistraction(done, 9999)).toEqual(done);
  });

  it("adds an arc while flying and removes it at the impact", () => {
    const arced = { ...SPEC, elevationPx: 20 };

    const mid = advanceDistraction(createDistraction("d1", arced, THROW), 500);
    expect(mid.position.y).toBeGreaterThan(0);

    const landed = advanceDistraction(createDistraction("d1", arced, THROW), 1000);
    expect(landed.position.y).toBe(0);
  });

  it("never extrapolates beyond the impact point", () => {
    const flying = createDistraction("d1", SPEC, THROW);
    const late = advanceDistraction(flying, 5000);

    expect(late.state).toBe("exploding");
    expect(late.position.x).toBe(100);
  });

  it("rejects a spec without flight time", () => {
    expect(() => createDistraction("d1", { ...SPEC, timeToImpactMs: 0 }, THROW))
      .toThrow("positive timeToImpactMs");
  });

  it("rejects a non finite advance", () => {
    expect(() => advanceDistraction(createDistraction("d1", SPEC, THROW), Number.NaN))
      .toThrow("finite time");
  });

  it("ships a tuned default spec", () => {
    const spec = defaultDistractionSpec();

    expect(spec.id).toBe("stone");
    expect(spec.radiusPx).toBeGreaterThan(0);
    expect(spec.timeToImpactMs).toBeGreaterThan(0);
  });
});