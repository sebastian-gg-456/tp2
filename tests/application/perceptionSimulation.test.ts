import { describe, expect, it } from "vitest";
import {
  initialPerceptionState,
  MAX_SOUND_EVENTS,
  updatePerceptionSimulation,
  withSoundEvent,
} from "../../src/application/simulation/perceptionSimulation";
import { createGridMap } from "../../src/domain/model/grid";

const INPUT = {
  map: createGridMap(5, 5, []),
  tileSize: 10,
  observer: { x: 15, y: 15 },
  facing: { x: 1, y: 0 },
  target: { x: 25, y: 15 },
  visionRange: 30,
  fieldOfViewRadians: Math.PI / 2,
  timeMs: 100,
};

describe("perception simulation", () => {
  it("prioritizes simultaneous vision over sound", () => {
    const state = withSoundEvent(initialPerceptionState(), {
      position: { x: 10, y: 15 },
      radius: 20,
      emittedAtMs: 100,
      durationMs: 100,
    });
    const frame = updatePerceptionSimulation(state, INPUT);

    expect(frame.soundHeard).toBe(true);
    expect(frame.vision.visible).toBe(true);
    expect(frame.state.memory.source).toBe("vision");
    expect(frame.state.memory.lastKnownPosition).toEqual(INPUT.target);
  });

  it("expires sound while preserving memory", () => {
    const state = withSoundEvent(initialPerceptionState(), {
      position: { x: 10, y: 15 },
      radius: 20,
      emittedAtMs: 0,
      durationMs: 50,
    });
    const heard = updatePerceptionSimulation(state, {
      ...INPUT,
      target: { x: 45, y: 45 },
      timeMs: 25,
    });
    expect(heard.soundHeard).toBe(true);
    expect(heard.state.memory.lastKnownPosition).toEqual({ x: 10, y: 15 });

    const frame = updatePerceptionSimulation(heard.state, {
      ...INPUT,
      target: { x: 45, y: 45 },
      timeMs: 51,
    });

    expect(frame.state.soundEvents).toHaveLength(0);
    expect(frame.soundHeard).toBe(false);
    expect(frame.state.memory.lastKnownPosition).toEqual({ x: 10, y: 15 });
  });

  it("keeps several concurrent sounds and reports the closest one", () => {
    let state = initialPerceptionState();
    state = withSoundEvent(state, {
      position: { x: 40, y: 15 },
      radius: 10,
      emittedAtMs: 90,
      durationMs: 200,
    });
    state = withSoundEvent(state, {
      position: { x: 22, y: 15 },
      radius: 20,
      emittedAtMs: 95,
      durationMs: 200,
    });

    const frame = updatePerceptionSimulation(state, INPUT);

    expect(frame.heardSounds).toHaveLength(1);
    expect(frame.closestSound?.position).toEqual({ x: 22, y: 15 });
    expect(frame.state.soundEvents).toHaveLength(2);
  });

  it("caps the sound log keeping the most recent events", () => {
    let state = initialPerceptionState();
    for (let index = 0; index < MAX_SOUND_EVENTS + 3; index += 1) {
      state = withSoundEvent(state, {
        position: { x: 15, y: 15 },
        radius: 40,
        emittedAtMs: index,
        durationMs: 5000,
      });
    }

    expect(state.soundEvents).toHaveLength(MAX_SOUND_EVENTS);
    expect(state.soundEvents[MAX_SOUND_EVENTS - 1]?.emittedAtMs).toBe(MAX_SOUND_EVENTS + 2);
  });
});
