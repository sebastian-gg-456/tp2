import Phaser from "phaser";
import type { GuardState } from "../../domain/behavior/stateMachine";

/**
 * Upgrade 3 - Animaciones por estado y transicion.
 *
 * El guardia se representa con formas generadas por codigo. Cada conducta
 * tiene una silueta, un color y un ritmo propios; la transicion entre
 * conductas se marca con un latigazo de escala y un anillo de pulso para
 * que el cambio sea legible sin leer el HUD.
 */

interface StateStyle {
  readonly body: number;
  readonly outline: number;
  readonly radius: number;
  /** Amplitud de la respiracion en pixeles. */
  readonly breathe: number;
  /** Frecuencia de la respiracion en radianes por milisegundo. */
  readonly breatheSpeed: number;
  /** Estiramiento maximo a lo largo del movimiento. */
  readonly stretch: number;
  readonly ring: number;
  readonly ringAlpha: number;
  /** Muestreo de estela: cantidad de copias. */
  readonly trail: number;
}

const STYLES: Readonly<Record<GuardState, StateStyle>> = {
  patrol: {
    body: 0x6b8afd,
    outline: 0xb9c5ff,
    radius: 11,
    breathe: 1.4,
    breatheSpeed: 0.0022,
    stretch: 0.04,
    ring: 0x6b8afd,
    ringAlpha: 0.28,
    trail: 0,
  },
  investigate: {
    body: 0xe5b454,
    outline: 0xffe0a0,
    radius: 11.5,
    breathe: 2.1,
    breatheSpeed: 0.0052,
    stretch: 0.08,
    ring: 0xe5b454,
    ringAlpha: 0.42,
    trail: 2,
  },
  chase: {
    body: 0xe05563,
    outline: 0xffb0b6,
    radius: 12.5,
    breathe: 2.8,
    breatheSpeed: 0.011,
    stretch: 0.2,
    ring: 0xe05563,
    ringAlpha: 0.6,
    trail: 5,
  },
  search: {
    body: 0x7ad1b0,
    outline: 0xc4f4e6,
    radius: 11.5,
    breathe: 1.9,
    breatheSpeed: 0.0068,
    stretch: 0.1,
    ring: 0x7ad1b0,
    ringAlpha: 0.46,
    trail: 2,
  },
  return: {
    body: 0x5fb8c9,
    outline: 0xb6e8f1,
    radius: 11,
    breathe: 1.6,
    breatheSpeed: 0.0034,
    stretch: 0.06,
    ring: 0x5fb8c9,
    ringAlpha: 0.32,
    trail: 1,
  },
  captured: {
    body: 0x59636d,
    outline: 0x8b959d,
    radius: 11,
    breathe: 0.3,
    breatheSpeed: 0.001,
    stretch: 0,
    ring: 0x59636d,
    ringAlpha: 0.2,
    trail: 0,
  },
};

const MAX_TRAIL = 6;

export interface GuardViewInput {
  readonly state: GuardState;
  readonly position: { readonly x: number; readonly y: number };
  readonly facingRadians: number;
  readonly speed: number;
  readonly alertLevel: number;
  readonly timeMs: number;
  readonly deltaMs: number;
}

export class GuardView {
  private readonly body: Phaser.GameObjects.Arc;
  private readonly nose: Phaser.GameObjects.Triangle;
  private readonly ring: Phaser.GameObjects.Arc;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly trail: Phaser.GameObjects.Arc[] = [];
  private readonly trailSamples: { x: number; y: number }[] = [];
  private pulse = 0;
  private transitionScale = 1;
  private state: GuardState = "patrol";

  public constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
  ) {
    this.shadow = scene.add.ellipse(x, y + 9, 20, 8, 0x000000, 0.35).setDepth(3);
    for (let index = 0; index < MAX_TRAIL; index += 1) {
      const ghost = scene.add.circle(x, y, 9, 0x6b8afd, 0).setDepth(3);
      this.trail.push(ghost);
    }
    this.ring = scene.add.circle(x, y, 16, 0x6b8afd, 0).setStrokeStyle(2, 0x6b8afd, 0.3).setDepth(3);
    this.body = scene.add.circle(x, y, 11, 0x6b8afd).setStrokeStyle(2, 0xb9c5ff).setDepth(5);
    this.nose = scene.add.triangle(x + 12, y, 6, 9, 0, -4.5, 0, 4.5, 0xb9c5ff, 0.95).setDepth(5);
  }

  public get sprite(): Phaser.GameObjects.Arc {
    return this.body;
  }

  public update(input: GuardViewInput): void {
    const style = STYLES[input.state];
    if (input.state !== this.state) {
      this.onTransition(input.state);
      this.state = input.state;
    }

    this.pulse += input.deltaMs;
    const breathe = Math.sin(this.pulse * style.breatheSpeed) * style.breathe;
    const stretch = 1 + Math.min(0.34, (input.speed / 190) * style.stretch * 3);
    this.transitionScale += (1 - this.transitionScale) * Math.min(1, input.deltaMs / 90);

    this.body.setPosition(input.position.x, input.position.y);
    this.body.setFillStyle(style.body, 1);
    this.body.setStrokeStyle(2, style.outline, 1);
    this.body.setScale(stretch * this.transitionScale, (2 - stretch) * this.transitionScale);
    this.body.setRadius(style.radius);

    this.nose.setPosition(
      input.position.x + Math.cos(input.facingRadians) * (style.radius + 4),
      input.position.y + Math.sin(input.facingRadians) * (style.radius + 4),
    );
    this.nose.setRotation(input.facingRadians);
    this.nose.setFillStyle(style.outline, 0.95);

    this.shadow.setPosition(input.position.x, input.position.y + 9);
    this.shadow.setScale(1 + breathe * 0.03, 1);

    const ringScale = 1.5 + Math.sin(this.pulse * 0.004) * 0.12 + (1 - this.transitionScale) * 1.4;
    this.ring.setPosition(input.position.x, input.position.y);
    this.ring.setStrokeStyle(2, style.ring, style.ringAlpha);
    this.ring.setScale(ringScale);
    this.ring.setFillStyle(style.ring, 0);

    this.updateTrail(input, style);
  }

  private onTransition(next: GuardState): void {
    this.transitionScale = 1.55;
    const style = STYLES[next];
    this.ring.setStrokeStyle(3, style.ring, 0.9);
    this.trailSamples.length = 0;
  }

  private updateTrail(input: GuardViewInput, style: StateStyle): void {
    if (input.speed > 6) {
      this.trailSamples.unshift({ x: input.position.x, y: input.position.y });
      if (this.trailSamples.length > MAX_TRAIL) {
        this.trailSamples.length = MAX_TRAIL;
      }
    } else if (this.trailSamples.length > 0) {
      this.trailSamples.pop();
    }

    for (let index = 0; index < this.trail.length; index += 1) {
      const ghost = this.trail[index];
      if (!ghost) {
        continue;
      }
      const sample = this.trailSamples[index];
      const visible = index < style.trail && sample !== undefined;
      if (!visible) {
        ghost.setFillStyle(style.body, 0).setPosition(input.position.x, input.position.y);
        continue;
      }
      const fade = 0.3 * (1 - index / (style.trail + 1));
      ghost.setPosition(sample.x, sample.y);
      ghost.setFillStyle(style.body, fade);
      ghost.setRadius(Math.max(3, style.radius - index * 1.4));
      ghost.setScale(1 + (index + 1) * 0.05);
    }
  }

  public destroy(): void {
    this.body.destroy();
    this.nose.destroy();
    this.ring.destroy();
    this.shadow.destroy();
    for (const ghost of this.trail) {
      ghost.destroy();
    }
  }

  public get sceneRef(): Phaser.Scene {
    return this.scene;
  }
}
