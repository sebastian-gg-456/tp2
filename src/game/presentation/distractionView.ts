import Phaser from "phaser";
import type { Vector2 } from "../../domain/model/vector";
import type { Distraction } from "../../domain/world/distractors";

/**
 * Upgrade 7 - Distractores sonoros interactivos.
 *
 * La vista dibuja la piedra en vuelo con su arco, la marca del impacto
 * previsto mientras se apunta y el pulso sonoro cuando aterriza. La
 * previsualizacion usa la misma velocidad y duracion que la simulacion, asi
 * que no puede mentir sobre donde va a sonar.
 */

export interface DistractionViewInput {
  readonly active: readonly Distraction[];
  readonly origin: Vector2;
  readonly aim: Vector2 | null;
  readonly predictedImpact: Vector2 | null;
  readonly charges: number;
  readonly capacity: number;
  readonly tileSize: number;
  readonly timeMs: number;
  readonly canThrow: boolean;
}

export class DistractionView {
  private readonly flightLayer: Phaser.GameObjects.Graphics;
  private readonly aimLayer: Phaser.GameObjects.Graphics;
  private readonly chargeMarks: Phaser.GameObjects.Arc[] = [];
  private readonly chargeMarksFar: Phaser.GameObjects.Arc[] = [];

  public constructor(scene: Phaser.Scene) {
    this.aimLayer = scene.add.graphics().setDepth(6);
    this.flightLayer = scene.add.graphics().setDepth(7);
    for (let index = 0; index < 3; index += 1) {
      this.chargeMarks.push(scene.add.circle(30 + index * 20, 30, 5, 0xe5b454, 0).setDepth(22));
      this.chargeMarksFar.push(scene.add.circle(30 + index * 20, 30, 3, 0x5d7382, 0).setDepth(22));
    }
  }

  public update(input: DistractionViewInput): void {
    this.drawAim(input);
    this.drawFlight(input);
    this.drawCharges(input);
  }

  private drawAim(input: DistractionViewInput): void {
    this.aimLayer.clear();
    if (!input.aim || !input.canThrow) {
      return;
    }
    const length = Math.hypot(input.aim.x, input.aim.y);
    if (length === 0) {
      return;
    }
    const dir = { x: input.aim.x / length, y: input.aim.y / length };
    const reach = 300;
    this.aimLayer.lineStyle(2, 0xe5b454, 0.42);
    this.aimLayer.beginPath();
    this.aimLayer.moveTo(input.origin.x, input.origin.y);
    const segments = 10;
    for (let index = 1; index <= segments; index += 1) {
      const step = (reach * index) / segments;
      this.aimLayer.lineTo(input.origin.x + dir.x * step, input.origin.y + dir.y * step);
    }
    this.aimLayer.strokePath();

    if (input.predictedImpact) {
      const pulse = 0.5 + 0.5 * Math.sin(input.timeMs / 200);
      this.aimLayer.lineStyle(2, 0xffd98a, 0.5 + pulse * 0.4);
      this.aimLayer.strokeCircle(
        input.predictedImpact.x,
        input.predictedImpact.y,
        input.tileSize * 0.5 + pulse * 3,
      );
      this.aimLayer.lineStyle(1, 0xffd98a, 0.5);
      this.aimLayer.strokeCircle(input.predictedImpact.x, input.predictedImpact.y, input.tileSize * 0.8);
    }
  }

  private drawFlight(input: DistractionViewInput): void {
    this.flightLayer.clear();
    for (const distraction of input.active) {
      const { position, spec } = distraction;
      if (distraction.state === "flying") {
        this.flightLayer.fillStyle(0xd9e4ea, 0.95);
        this.flightLayer.fillCircle(position.x, position.y, 4);
        this.flightLayer.lineStyle(1, 0x8fa6b3, 0.5);
        this.flightLayer.lineBetween(distraction.origin.x, distraction.origin.y, position.x, position.y);
        this.flightLayer.lineStyle(1, 0x5d7382, 0.35);
        this.flightLayer.strokeCircle(
          position.x,
          position.y,
          spec.radiusPx * 0.12,
        );
      } else {
        const started = distraction.explodedAtMs ?? input.timeMs;
        const t = clamp01((input.timeMs - started) / spec.durationMs);
        const radius = spec.radiusPx * (0.25 + t * 0.75);
        const alpha = 0.55 * (1 - t);
        this.flightLayer.lineStyle(3, 0xffd98a, alpha);
        this.flightLayer.strokeCircle(position.x, position.y, radius);
        this.flightLayer.fillStyle(0xe5b454, alpha * 0.5);
        this.flightLayer.fillCircle(position.x, position.y, 5);
      }
    }
  }

  private drawCharges(input: DistractionViewInput): void {
    for (let index = 0; index < this.chargeMarks.length; index += 1) {
      const ready = this.chargeMarks[index];
      const spent = this.chargeMarksFar[index];
      if (!ready || !spent) {
        continue;
      }
      if (index < input.charges) {
        ready.setFillStyle(0xe5b454, 1);
        ready.setRadius(5);
      } else {
        ready.setFillStyle(0xe5b454, 0.12);
        ready.setRadius(4);
      }
      if (index >= input.capacity) {
        spent.setFillStyle(0x5d7382, 0);
      } else {
        spent.setFillStyle(0x5d7382, 0.5);
      }
    }
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

