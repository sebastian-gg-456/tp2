import Phaser from "phaser";
import type { CoverAssessment } from "../../domain/behavior/cover";
import type { DoorRuntime } from "../../domain/environment/doors";
import { isWalkable, type GridMap, type GridPoint } from "../../domain/model/grid";
import type { Vector2 } from "../../domain/model/vector";

/**
 * Upgrades 4, 6 y 10 - Trazabilidad, cobertura, puertas y rutas.
 *
 * Upgrade 4: la ruta activa y los nodos que el algoritmo exploro se dibujan
 * sobre el mapa, para que cada decision de navegacion sea legible sin leer
 * el codigo. El destino manual se marca aparte del objetivo de la conducta.
 *
 * Las puertas se dibujan como compuertas con estado visible (abierta con
 * flechas de paso, cerrada con barras). La cobertura se marca sobre las
 * celdas alcanzables y se resalta la que efectivamente corta la linea de
 * vision del guardia.
 */

export interface LevelViewInput {
  readonly map: GridMap;
  readonly walls: GridMap;
  readonly doors: readonly DoorRuntime[];
  readonly cover: CoverAssessment;
  readonly guardCell: GridPoint;
  readonly playerCell: GridPoint;
  readonly path: readonly Vector2[];
  readonly explored: readonly GridPoint[];
  readonly searchPlan: readonly GridPoint[] | null;
  readonly searchIndex: number;
  readonly manualGoal: GridPoint | null;
  readonly extractionCell: GridPoint;
  readonly tileSize: number;
  readonly timeMs: number;
  readonly outcome: "running" | "captured" | "extracted";
}

export class LevelView {
  private readonly staticLayer: Phaser.GameObjects.Graphics;
  private readonly doorLayer: Phaser.GameObjects.Graphics;
  private readonly overlayLayer: Phaser.GameObjects.Graphics;
  private readonly pathLayer: Phaser.GameObjects.Graphics;
  private readonly doorZones: Phaser.GameObjects.Rectangle[] = [];
  private readonly doorLabels: Phaser.GameObjects.Text[] = [];

  public constructor(
    scene: Phaser.Scene,
    specs: readonly { readonly id: string; readonly cells: readonly GridPoint[] }[],
    tileSize: number,
  ) {
    this.staticLayer = scene.add.graphics().setDepth(1);
    this.doorLayer = scene.add.graphics().setDepth(3);
    this.overlayLayer = scene.add.graphics().setDepth(2);
    this.pathLayer = scene.add.graphics().setDepth(2);

    for (const spec of specs) {
      const first = spec.cells[0];
      if (!first) {
        continue;
      }
      const x = first.x * tileSize;
      const y = first.y * tileSize;
      const width = spec.cells.length * tileSize;
      const zone = scene.add
        .rectangle(x + width / 2, y + tileSize / 2, width - 2, tileSize - 2, 0xffffff, 0)
        .setStrokeStyle(1, 0x3a4c58)
        .setInteractive({ useHandCursor: true })
        .setDepth(8);
      const label = scene.add
        .text(x + width / 2, y + tileSize / 2, "", {
          color: "#8fa6b3",
          fontFamily: "monospace",
          fontSize: "9px",
        })
        .setOrigin(0.5)
        .setDepth(9);
      const handler = (): void => {
        scene.input.emit("door-tap", spec.id);
      };
      zone.on("pointerdown", handler);
      this.doorZones.push(zone);
      this.doorLabels.push(label);
    }
  }

  public drawStatic(map: GridMap, tileSize: number): void {
    this.staticLayer.clear();
    this.staticLayer.fillStyle(0x27333d, 1);
    for (let y = 0; y < map.height; y += 1) {
      for (let x = 0; x < map.width; x += 1) {
        if (!isWalkable(map, { x, y })) {
          this.staticLayer.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }
    this.staticLayer.lineStyle(1, 0x3a4c58, 1);
    for (let x = 0; x <= map.width; x += 1) {
      this.staticLayer.lineBetween(x * tileSize, 0, x * tileSize, map.height * tileSize);
    }
    for (let y = 0; y <= map.height; y += 1) {
      this.staticLayer.lineBetween(0, y * tileSize, map.width * tileSize, y * tileSize);
    }
  }

  public update(input: LevelViewInput): void {
    this.drawDoors(input);
    this.drawCover(input);
    this.drawPath(input);
    this.drawExtraction(input);
  }

  private drawDoors(input: LevelViewInput): void {
    const { tileSize } = input;
    this.doorLayer.clear();
    for (let index = 0; index < input.doors.length; index += 1) {
      const door = input.doors[index];
      const zone = this.doorZones[index];
      const label = this.doorLabels[index];
      if (!door || !zone || !label) {
        continue;
      }
      const first = door.cells[0];
      if (!first) {
        continue;
      }
      const open = door.open;
      const x = first.x * tileSize;
      const y = first.y * tileSize;
      const width = door.cells.length * tileSize;

      if (open) {
        this.doorLayer.fillStyle(0x1f6b47, 0.28);
        this.doorLayer.fillRect(x, y, width, tileSize);
        this.doorLayer.lineStyle(2, 0x73c991, 0.8);
        for (let arrow = 0; arrow < width / tileSize; arrow += 1) {
          const cx = x + arrow * tileSize + tileSize / 2;
          this.doorLayer.lineBetween(cx - 5, y + tileSize / 2, cx + 5, y + tileSize / 2);
          this.doorLayer.lineBetween(cx + 5, y + tileSize / 2, cx + 1, y + tileSize / 2 - 4);
          this.doorLayer.lineBetween(cx + 5, y + tileSize / 2, cx + 1, y + tileSize / 2 + 4);
        }
        zone.setStrokeStyle(1, 0x73c991, 0.7);
        label.setText("abierta").setColor("#73c991");
      } else {
        this.doorLayer.fillStyle(door.kind === "shutter" ? 0x8b5a1f : 0x59636d, 0.85);
        this.doorLayer.fillRect(x, y, width, tileSize);
        this.doorLayer.lineStyle(2, 0x0b0f13, 0.9);
        for (let bar = 0; bar < width; bar += 8) {
          this.doorLayer.lineBetween(x + bar, y, x + bar + 5, y + tileSize);
        }
        zone.setStrokeStyle(1, door.kind === "shutter" ? 0xe5b454 : 0x8b959d, 0.8);
        label.setText(door.kind === "shutter" ? "persiana" : "cerrada")
          .setColor(door.kind === "shutter" ? "#e5b454" : "#8b959d");
      }
      label.setPosition(x + width / 2, y - 7);
    }
  }

  private drawCover(input: LevelViewInput): void {
    const { tileSize } = input;
    this.overlayLayer.clear();
    for (const cell of input.cover.available) {
      this.overlayLayer.lineStyle(1, 0x2f6b57, 0.7);
      this.overlayLayer.strokeRect(
        cell.cell.x * tileSize + 4,
        cell.cell.y * tileSize + 4,
        tileSize - 8,
        tileSize - 8,
      );
    }
    if (input.cover.breaksGuardSight) {
      this.overlayLayer.lineStyle(2, 0x73c991, 0.9);
      this.overlayLayer.strokeRect(
        input.playerCell.x * tileSize + 2,
        input.playerCell.y * tileSize + 2,
        tileSize - 4,
        tileSize - 4,
      );
    }
    if (input.searchPlan) {
      input.searchPlan.forEach((cell, index) => {
        const active = index === input.searchIndex;
        this.overlayLayer.lineStyle(active ? 2 : 1, active ? 0x7ad1b0 : 0x3d6b60, active ? 0.95 : 0.5);
        this.overlayLayer.strokeCircle(
          cell.x * tileSize + tileSize / 2,
          cell.y * tileSize + tileSize / 2,
          tileSize * 0.28,
        );
      });
    }
  }

  private drawPath(input: LevelViewInput): void {
    this.pathLayer.clear();
    this.pathLayer.fillStyle(0x3b819c, 0.18);
    for (const cell of input.explored) {
      this.pathLayer.fillRect(
        cell.x * input.tileSize + 3,
        cell.y * input.tileSize + 3,
        input.tileSize - 6,
        input.tileSize - 6,
      );
    }
    if (input.path.length > 1) {
      this.pathLayer.lineStyle(4, 0x62d0e8, 0.85);
      this.pathLayer.beginPath();
      this.pathLayer.moveTo(input.path[0]?.x ?? 0, input.path[0]?.y ?? 0);
      for (const point of input.path.slice(1)) {
        this.pathLayer.lineTo(point.x, point.y);
      }
      this.pathLayer.strokePath();
    }
    if (input.manualGoal) {
      this.pathLayer.lineStyle(3, 0xe5b454, 0.9);
      this.pathLayer.strokeCircle(
        input.manualGoal.x * input.tileSize + input.tileSize / 2,
        input.manualGoal.y * input.tileSize + input.tileSize / 2,
        input.tileSize * 0.32,
      );
    }
  }

  private drawExtraction(input: LevelViewInput): void {
    const cx = input.extractionCell.x * input.tileSize + input.tileSize / 2;
    const cy = input.extractionCell.y * input.tileSize + input.tileSize / 2;
    const pulse = 0.5 + 0.5 * Math.sin(input.timeMs / 420);
    const done = input.outcome === "extracted";
    const color = done ? 0x73c991 : 0x8ef0b4;
    this.overlayLayer.fillStyle(color, done ? 0.4 : 0.16 + pulse * 0.1);
    this.overlayLayer.fillCircle(cx, cy, input.tileSize * (0.6 + pulse * 0.12));
    this.overlayLayer.lineStyle(2, color, 0.5 + pulse * 0.4);
    this.overlayLayer.strokeCircle(cx, cy, input.tileSize * 0.55);
    this.overlayLayer.lineStyle(1, 0x10161c, 0.8);
    this.overlayLayer.lineBetween(cx - 7, cy - 7, cx + 7, cy + 7);
    this.overlayLayer.lineBetween(cx - 7, cy + 7, cx + 7, cy - 7);
  }
}

