import Phaser from "phaser";
import type { ScreenImpact } from "../../application/simulation/guardSimulation";
import type { LastMomentEscape } from "../../domain/behavior/lastMoment";

/**
 * Upgrades 4, 5 y 9 - Impacto visual extremo, camara de tension y feedback
 * de escape de ultimo momento.
 *
 * Los tres comparten el mismo momento de riesgo, asi que viven juntos: la
 * camara impercusable decide el encuadre, los efectos puros dan el golpe y
 * el aviso de escape comunica alivio.
 */

const IMPULSE = 34;

interface ShakeSpec {
  readonly duration: number;
  readonly intensity: number;
}

const SHAKES: Readonly<Record<ScreenImpact, ShakeSpec>> = {
  "sight-confirmed": { duration: 260, intensity: 0.008 },
  "last-moment-escape": { duration: 180, intensity: 0.005 },
  captured: { duration: 520, intensity: 0.016 },
  extracted: { duration: 260, intensity: 0.004 },
  shutter: { duration: 120, intensity: 0.003 },
  "alert-threshold": { duration: 200, intensity: 0.004 },
};

const FLASHES: Readonly<Record<ScreenImpact, { readonly color: number; readonly duration: number; readonly alpha: number }>> = {
  "sight-confirmed": { color: 0xe05563, duration: 220, alpha: 0.32 },
  "last-moment-escape": { color: 0x73c991, duration: 180, alpha: 0.26 },
  captured: { color: 0x8b1f2b, duration: 620, alpha: 0.55 },
  extracted: { color: 0x73c991, duration: 320, alpha: 0.3 },
  shutter: { color: 0x5fb8c9, duration: 110, alpha: 0.12 },
  "alert-threshold": { color: 0xe5b454, duration: 200, alpha: 0.2 },
};

const PUNCHES: Readonly<Record<ScreenImpact, number>> = {
  "sight-confirmed": 0.1,
  "last-moment-escape": 0.05,
  captured: 0.16,
  extracted: 0.03,
  shutter: 0.015,
  "alert-threshold": 0.03,
};

const MAX_ZOOM = 1.55;
const MIN_ZOOM = 1;

export interface TensionInput {
  readonly playerPosition: { readonly x: number; readonly y: number };
  readonly guardPosition: { readonly x: number; readonly y: number };
  readonly alertLevel: number;
  readonly phase: string;
  readonly running: boolean;
}

export class FeedbackDirector {
  private readonly camera: Phaser.Cameras.Scene2D.Camera;
  private readonly overlay: Phaser.GameObjects.Graphics;
  private readonly particles: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly reliefText: Phaser.GameObjects.Text;
  private readonly shockwave: Phaser.GameObjects.Arc;
  private readonly warning: Phaser.GameObjects.Text;

  private focusX: number;
  private focusY: number;
  private zoom: number = 1;
  private targetZoom: number = 1;
  private punch: number = 0;
  private vignette: number = 0;
  private reliefTimer = 0;
  private shockTimer = 0;
  private warnTimer = 0;
  private elapsed = 0;

  public constructor(
    private readonly scene: Phaser.Scene,
    width: number,
    height: number,
    spawnX: number,
    spawnY: number,
  ) {
    this.camera = scene.cameras.main;
    this.camera.setBounds(0, 0, width, height);
    this.focusX = spawnX;
    this.focusY = spawnY;
    this.camera.centerOn(this.focusX, this.focusY);

    this.overlay = scene.add.graphics().setDepth(40);
    this.shockwave = scene.add.circle(spawnX, spawnY, 20, 0xffffff, 0).setDepth(30);
    this.warning = scene.add
      .text(width / 2, height * 0.3, "", {
        color: "#ffd98a",
        fontFamily: "monospace",
        fontSize: "20px",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(45)
      .setAlpha(0);

    if (!scene.textures.exists("fx-spark")) {
      const texture = scene.textures.createCanvas("fx-spark", 6, 6);
      texture?.getContext().fillRect(0, 0, 6, 6);
      texture?.refresh();
    }
    this.particles = scene.add
      .particles(0, 0, "fx-spark", {
        lifespan: 620,
        speed: { min: 60, max: 320 },
        scale: { start: 1.4, end: 0 },
        alpha: { start: 0.95, end: 0 },
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(35);

    this.reliefText = scene.add
      .text(width / 2, height * 0.42, "", {
        color: "#73c991",
        fontFamily: "monospace",
        fontSize: "26px",
        align: "center",
        backgroundColor: "#10161ccc",
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(46)
      .setAlpha(0)
      .setScale(0.7);
  }

  public fire(impact: ScreenImpact, at: { readonly x: number; readonly y: number }): void {
    const shake = SHAKES[impact];
    this.camera.shake(shake.duration, shake.intensity, true);
    const flash = FLASHES[impact];
    this.camera.flash(flash.duration, (flash.color >> 16) & 0xff, (flash.color >> 8) & 0xff, flash.color & 0xff, true);
    this.punch = Math.min(0.22, this.punch + PUNCHES[impact]);
    this.vignette = Math.min(0.75, this.vignette + (impact === "captured" ? 0.75 : 0.4));

    const burst = impact === "captured" ? 34 : impact === "sight-confirmed" ? 22 : 14;
    this.particles.setParticleTint(this.tint(impact));
    this.particles.explode(burst, at.x, at.y);

    this.shockwave.setPosition(at.x, at.y);
    this.shockwave.setFillStyle(this.tint(impact), 0.5);
    this.shockTimer = 0.42;
    this.shockStart = 12;

    if (impact === "captured" || impact === "extracted" || impact === "alert-threshold") {
      this.warnTimer = 1.8;
      this.warning.setText(labelFor(impact));
    }
  }

  private shockStart = 12;

  public showEscape(escape: LastMomentEscape): void {
    this.reliefTimer = 1.5;
    this.reliefText.setText(
      `ESCAPASTE  +${escape.marginPx.toFixed(0)} px\npresion ${escape.heldMs} ms`,
    );
    this.reliefText.setColor(escape.relief > 0.6 ? "#8ef0b4" : "#73c991");
  }

  public update(input: TensionInput, deltaMs: number): void {
    this.elapsed += deltaMs;

    // Upgrade 5: encuadre util durante el momento de riesgo.
    const tension = tensionOf(input);
    this.targetZoom = MIN_ZOOM + tension * (MAX_ZOOM - MIN_ZOOM);
    const midpointX = (input.playerPosition.x + input.guardPosition.x) / 2;
    const midpointY = (input.playerPosition.y + input.guardPosition.y) / 2;
    const targetX = lerp(this.focusX, midpointX, tension);
    const targetY = lerp(this.focusY, midpointY, tension);
    const smooth = Math.min(1, deltaMs / 260);
    this.focusX += (targetX - this.focusX) * smooth;
    this.focusY += (targetY - this.focusY) * smooth;
    this.zoom += (this.targetZoom - this.zoom) * smooth;
    this.punch *= Math.max(0, 1 - deltaMs / 160);
    this.vignette += ((input.running ? tension * 0.42 : 0.6) - this.vignette) * Math.min(1, deltaMs / 700);

    this.camera.setZoom(this.zoom + this.punch);
    this.camera.centerOn(this.focusX, this.focusY);

    this.drawOverlay(input);
    this.updateShockwave(deltaMs);
    this.updateRelief(deltaMs);
    this.updateWarning(deltaMs);
  }

  private drawOverlay(input: TensionInput): void {
    const { width, height } = this.scene.scale;
    this.overlay.clear();
    const alpha = this.vignette;
    if (alpha <= 0.01) {
      return;
    }
    const steps = 8;
    const maxInset = Math.min(width, height) * 0.34;
    for (let index = 0; index < steps; index += 1) {
      const inset = (index / steps) * maxInset;
      this.overlay.fillStyle(input.phase === "capturado" ? 0x8b1f2b : 0x0a0d10, alpha * (1 - index / steps) * 0.5);
      this.overlay.fillRect(0, 0, width, inset);
      this.overlay.fillRect(0, height - inset, width, inset);
      this.overlay.fillRect(0, 0, inset, height);
      this.overlay.fillRect(width - inset, 0, inset, height);
    }
  }

  private updateShockwave(deltaMs: number): void {
    if (this.shockTimer <= 0) {
      this.shockwave.setFillStyle(this.shockwave.fillColor, 0);
      return;
    }
    this.shockTimer -= deltaMs / 1000;
    const progress = 1 - Math.max(0, this.shockTimer) / 0.42;
    const radius = this.shockStart + progress * 90;
    const alpha = 0.55 * (1 - progress);
    this.shockwave.setRadius(radius);
    this.shockwave.setFillStyle(this.shockwave.fillColor, alpha);
    this.shockwave.setStrokeStyle(2, 0xffffff, alpha * 0.8);
  }

  private updateRelief(deltaMs: number): void {
    if (this.reliefTimer <= 0) {
      this.reliefText.setAlpha(0);
      return;
    }
    this.reliefTimer -= deltaMs / 1000;
    const progress = 1 - Math.max(0, this.reliefTimer) / 1.5;
    const alpha = progress < 0.12
      ? progress / 0.12
      : Math.max(0, 1 - (progress - 0.12) / 0.88);
    this.reliefText.setAlpha(alpha);
    this.reliefText.setScale(0.86 + Math.min(1, progress * 4) * 0.24);
    this.reliefText.y = this.scene.scale.height * 0.42 - progress * 18;
  }

  private updateWarning(deltaMs: number): void {
    if (this.warnTimer <= 0) {
      this.warning.setAlpha(0);
      return;
    }
    this.warnTimer -= deltaMs / 1000;
    const pulse = 0.6 + 0.4 * Math.sin(this.elapsed / 140);
    this.warning.setAlpha(Math.min(1, this.warnTimer) * pulse);
  }

  private tint(impact: ScreenImpact): number {
    switch (impact) {
      case "last-moment-escape":
        return 0x73c991;
      case "captured":
        return 0xff6b7a;
      case "extracted":
        return 0x8ef0b4;
      case "shutter":
        return 0x8ad7e8;
      case "alert-threshold":
        return 0xffc46b;
      default:
        return 0xffd98a;
    }
  }
}

function tensionOf(input: TensionInput): number {
  if (!input.running) {
    return 0.25;
  }
  const base = input.alertLevel * 0.55;
  const byPhase = input.phase === "persecucion" ? 0.45 : input.phase === "busqueda" ? 0.22 : 0;
  const byProximity = clamp01((IMPULSE * 2 - distance(input)) / (IMPULSE * 2)) * 0.2;
  return clamp01(base + byPhase + byProximity);
}

function distance(input: TensionInput): number {
  return Math.hypot(
    input.guardPosition.x - input.playerPosition.x,
    input.guardPosition.y - input.playerPosition.y,
  );
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function labelFor(impact: ScreenImpact): string {
  switch (impact) {
    case "captured":
      return "CAPTURADO";
    case "extracted":
      return "EXTRACCION COMPLETA";
    case "alert-threshold":
      return "ALERTA GENERAL";
    default:
      return "";
  }
}
