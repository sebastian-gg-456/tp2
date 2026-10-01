import Phaser from "phaser";

/**
 * Upgrade 2 - Cono de vision visible y reactivo.
 *
 * El cono comunica cuatro cosas a la vez: alcance, angulo, si el jugador
 * esta dentro y que tan advanced esta la confirmacion. Cambia de color con
 * el estado del guardia, late mientras no hay contacto y muestra un arco de
 * progreso cuando el jugador esta dentro pero todavia no se confirmo la
 * vision.
 */

export interface VisionConeInput {
  readonly origin: { readonly x: number; readonly y: number };
  readonly facingRadians: number;
  readonly range: number;
  readonly fieldOfViewRadians: number;
  readonly visible: boolean;
  readonly alertLevel: number;
  readonly inCone: boolean;
  readonly confirmProgress: number;
  readonly state: string;
  readonly timeMs: number;
  readonly occludedCells: readonly { readonly x: number; readonly y: number }[];
  readonly tileSize: number;
}

const PALETTE = {
  calm: { fill: 0x6b8afd, edge: 0x9fb0ff, alpha: 0.13 },
  suspicious: { fill: 0xe5b454, edge: 0xffe0a0, alpha: 0.17 },
  chase: { fill: 0xe05563, edge: 0xffb0b6, alpha: 0.22 },
  search: { fill: 0x7ad1b0, edge: 0xc4f4e6, alpha: 0.18 },
  return: { fill: 0x5fb8c9, edge: 0xb6e8f1, alpha: 0.15 },
  captured: { fill: 0x59636d, edge: 0x8b959d, alpha: 0.1 },
} as const;

type PaletteKey = keyof typeof PALETTE;

export class VisionConeView {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly shade: Phaser.GameObjects.Graphics;

  public constructor(scene: Phaser.Scene) {
    this.shade = scene.add.graphics().setDepth(1);
    this.graphics = scene.add.graphics().setDepth(2);
  }

  public update(input: VisionConeInput): void {
    const key = paletteFor(input.state);
    const palette = PALETTE[key];
    const half = input.fieldOfViewRadians / 2;
    const start = input.facingRadians - half;
    const end = input.facingRadians + half;
    const pulse = 0.5 + 0.5 * Math.sin(input.timeMs / 260);
    const range = input.range * (input.visible ? 1 : 0.94 + pulse * 0.06);
    const alpha = palette.alpha + input.alertLevel * 0.12 + (input.visible ? 0.12 : 0);

    this.graphics.clear();
    this.graphics.fillStyle(palette.fill, alpha);
    this.graphics.beginPath();
    this.graphics.moveTo(input.origin.x, input.origin.y);
    this.graphics.arc(input.origin.x, input.origin.y, range, start, end);
    this.graphics.closePath();
    this.graphics.fillPath();

    this.graphics.lineStyle(1.5, palette.edge, 0.5 + input.alertLevel * 0.4);
    this.graphics.beginPath();
    this.graphics.arc(input.origin.x, input.origin.y, range, start, end);
    this.graphics.strokePath();

    this.graphics.lineStyle(1, palette.edge, 0.35);
    for (let index = 1; index <= 3; index += 1) {
      const fraction = index / 4;
      this.graphics.strokeCircle(
        input.origin.x,
        input.origin.y,
        range * fraction,
      );
    }

    this.graphics.lineStyle(2, palette.edge, 0.5);
    this.graphics.lineBetween(
      input.origin.x,
      input.origin.y,
      input.origin.x + Math.cos(input.facingRadians) * range,
      input.origin.y + Math.sin(input.facingRadians) * range,
    );

    if (input.inCone && !input.visible) {
      const r = 16 + pulse * 4;
      this.graphics.lineStyle(2, 0xffe0a0, 0.85);
      this.graphics.strokeCircle(input.origin.x, input.origin.y, r);
      this.graphics.lineStyle(1, 0xffe0a0, 0.5);
      this.graphics.beginPath();
      this.graphics.arc(
        input.origin.x,
        input.origin.y,
        22,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * input.confirmProgress,
      );
      this.graphics.strokePath();
    }

    if (input.visible) {
      this.graphics.lineStyle(3, 0xffd98a, 0.55 + pulse * 0.25);
      this.graphics.strokeCircle(input.origin.x, input.origin.y, range * 0.98);
    }

    this.shade.clear();
    this.shade.fillStyle(0x000000, 0.28);
    for (const cell of input.occludedCells) {
      this.shade.fillRect(
        cell.x * input.tileSize + 1,
        cell.y * input.tileSize + 1,
        input.tileSize - 2,
        input.tileSize - 2,
      );
    }
  }
}

function paletteFor(state: string): PaletteKey {
  switch (state) {
    case "chase":
      return "chase";
    case "search":
      return "search";
    case "investigate":
      return "suspicious";
    case "return":
      return "return";
    case "captured":
      return "captured";
    default:
      return "calm";
  }
}
