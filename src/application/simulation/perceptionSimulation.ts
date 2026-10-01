import type { GridMap } from "../../domain/model/grid";
import type { Vector2 } from "../../domain/model/vector";
import {
  emptyPerceptionMemory,
  rememberObservation,
  type PerceptionMemory,
} from "../../domain/perception/memory";
import {
  evaluateSound,
  evaluateVision,
  type SoundEvent,
  type VisionResult,
} from "../../domain/perception/perception";

/**
 * Upgrade 7 - La percepcion admite varios sonidos simultaneos porque el
 * jugador puede lanzar varios distractores. El log queda acotado a los
 * eventos mas recientes y la memoria prioriza vision, como en H3.
 */

export const MAX_SOUND_EVENTS = 4;

export interface PerceptionSimulationState {
  readonly memory: PerceptionMemory;
  readonly soundEvents: readonly SoundEvent[];
}

export interface HeardSound {
  readonly event: SoundEvent;
  readonly distance: number;
}

export interface PerceptionFrame {
  readonly state: PerceptionSimulationState;
  readonly vision: VisionResult;
  readonly soundHeard: boolean;
  readonly heardSounds: readonly HeardSound[];
  /** Sonido audible mas cercano: el mas informativo para investigar. */
  readonly closestSound: SoundEvent | null;
}

export interface PerceptionFrameInput {
  readonly map: GridMap;
  readonly tileSize: number;
  readonly observer: Vector2;
  readonly facing: Vector2;
  readonly target: Vector2;
  readonly visionRange: number;
  readonly fieldOfViewRadians: number;
  readonly timeMs: number;
}

export function initialPerceptionState(): PerceptionSimulationState {
  return { memory: emptyPerceptionMemory(), soundEvents: [] };
}

export function withSoundEvent(
  state: PerceptionSimulationState,
  soundEvent: SoundEvent,
): PerceptionSimulationState {
  const events = [...state.soundEvents, soundEvent]
    .sort((left, right) => left.emittedAtMs - right.emittedAtMs)
    .slice(-MAX_SOUND_EVENTS);
  return { ...state, soundEvents: events };
}

export function updatePerceptionSimulation(
  state: PerceptionSimulationState,
  input: PerceptionFrameInput,
): PerceptionFrame {
  let memory = state.memory;
  const active: SoundEvent[] = [];
  const heard: HeardSound[] = [];

  for (const soundEvent of state.soundEvents) {
    const result = evaluateSound(input.observer, soundEvent, input.timeMs);
    if (result.heard) {
      heard.push({ event: soundEvent, distance: result.distance });
      memory = rememberObservation(memory, {
        source: "sound",
        position: soundEvent.position,
        observedAtMs: input.timeMs,
      });
    }
    if (input.timeMs <= soundEvent.emittedAtMs + soundEvent.durationMs) {
      active.push(soundEvent);
    }
  }

  const vision = evaluateVision({
    map: input.map,
    tileSize: input.tileSize,
    observer: input.observer,
    facing: input.facing,
    target: input.target,
    range: input.visionRange,
    fieldOfViewRadians: input.fieldOfViewRadians,
  });
  if (vision.visible) {
    memory = rememberObservation(memory, {
      source: "vision",
      position: input.target,
      observedAtMs: input.timeMs,
    });
  }

  const closestSound = heard.reduce<HeardSound | null>((best, candidate) => {
    if (best === null || candidate.distance < best.distance) {
      return candidate;
    }
    return best;
  }, null)?.event ?? null;

  return {
    state: { memory, soundEvents: active },
    vision,
    soundHeard: heard.length > 0,
    heardSounds: heard,
    closestSound,
  };
}
