import Phaser from "phaser";
import { DISTRACTION_CAPACITY } from "../../application/simulation/distractors";
import {
  initialGuardSimulationState,
  stepGuardSimulation,
  STONE_FLIGHT_MS,
  STONE_SPEED,
  SOUND_DURATION_MS,
  SOUND_RADIUS,
  VISION_RANGE,
  type GuardSimulationFrame,
  type GuardSimulationState,
} from "../../application/simulation/guardSimulation";
import {
  DOOR_SPECS,
  EXTRACTION_CELL,
  GRID_HEIGHT,
  GRID_WIDTH,
  GUARD_START,
  LAB_MAP,
  PATROL_ROUTE,
  PLAYER_START,
  TILE_SIZE,
} from "../../application/simulation/labLevel";
import { currentPatrolCell } from "../../domain/behavior/patrol";
import { cellCenter, isWalkable, worldToCell, type GridPoint } from "../../domain/model/grid";
import type { Vector2 } from "../../domain/model/vector";
import { occludingCells } from "../../domain/perception/occlusion";
import { DistractionView } from "../presentation/distractionView";
import { FeedbackDirector } from "../presentation/feedbackDirector";
import { GuardView } from "../presentation/guardView";
import { HudView } from "../presentation/hudView";
import { LevelView } from "../presentation/levelView";
import { VisionConeView } from "../presentation/visionConeView";

const PLAYER_SPEED = 190;
const MAP_WIDTH = GRID_WIDTH * TILE_SIZE;
const MAP_HEIGHT = GRID_HEIGHT * TILE_SIZE;
const CONFIRM_MS = 180;
const HALF_FOV = Math.PI / 4;

/**
 * Escena adaptadora. Traduce entradas del operador, entrega la posicion del
 * jugador a la simulacion y representa lo que la simulacion devuelve. No
 * decide reglas de conducta: cada respuesta visible proviene de un valor
 * del dominio.
 */
export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private guardView!: GuardView;
  private coneView!: VisionConeView;
  private hud!: HudView;
  private level!: LevelView;
  private distractionView!: DistractionView;
  private feedback!: FeedbackDirector;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<
    "up" | "down" | "left" | "right" | "reset" | "noise"
    | "throwOne" | "throwTwo" | "throwThree" | "toggleAlgorithm",
    Phaser.Input.Keyboard.Key
  >;
  private doorBodies: { readonly id: string; readonly body: Phaser.Physics.Arcade.StaticBody }[] = [];
  private simulation: GuardSimulationState = initialGuardSimulationState();
  private frame!: GuardSimulationFrame;
  private aim: Vector2 | null = null;
  private renderedEscapes = 0;
  private noiseRequested = false;
  private throwRequested = false;
  private manualGoal: GridPoint | null = null;
  private toggleDoor: string | null = null;

  public constructor() {
    super("GameScene");
  }

  public create(): void {
    this.cameras.main.setBackgroundColor("#10161c");
    this.simulation = initialGuardSimulationState();
    this.aim = null;
    this.renderedEscapes = 0;
    this.noiseRequested = false;
    this.throwRequested = false;
    this.toggleDoor = null;

    this.level = new LevelView(this, DOOR_SPECS, TILE_SIZE);
    this.level.drawStatic(LAB_MAP, TILE_SIZE);
    this.drawExtractionLabel();

    const walls = this.physics.add.staticGroup();
    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        if (isWalkable(LAB_MAP, { x, y }) || this.isDoorCell({ x, y })) {
          continue;
        }
        const center = cellCenter({ x, y }, TILE_SIZE);
        walls.add(this.add.rectangle(center.x, center.y, TILE_SIZE, TILE_SIZE, 0x000000, 0));
      }
    }
    this.doorBodies = this.createDoorBodies();

    const spawn = cellCenter(PLAYER_START, TILE_SIZE);
    this.playerShadow = this.add.ellipse(spawn.x, spawn.y + 11, 22, 8, 0x000000, 0.35).setDepth(4);
    this.player = this.add
      .rectangle(spawn.x, spawn.y, 20, 20, 0xe5b454)
      .setStrokeStyle(2, 0xffd98a)
      .setDepth(6);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, walls);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is unavailable.");
    }
    this.cursors = keyboard.createCursorKeys();
    this.keys = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      reset: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      noise: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      throwOne: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      throwTwo: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      throwThree: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      toggleAlgorithm: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };

    const guardStart = cellCenter(GUARD_START, TILE_SIZE);
    this.guardView = new GuardView(this, guardStart.x, guardStart.y);
    this.coneView = new VisionConeView(this);
    this.distractionView = new DistractionView(this);
    this.hud = new HudView(this);
    this.hud.setDimensions(MAP_WIDTH, MAP_HEIGHT);
    this.feedback = new FeedbackDirector(this, MAP_WIDTH, MAP_HEIGHT, guardStart.x, guardStart.y);

    this.add
      .text(16, 14, "PIAPC 2026 / GUARDIA DE SIGILO", {
        color: "#9eb4c2",
        fontFamily: "monospace",
        fontSize: "14px",
      })
      .setDepth(22);
    this.add
      .text(16, 32, "WASD mover | Q ruido | 1-3 piedra hacia el mouse | clic destino | clic puerta alterna | Espacio BFS/A* | R reiniciar", {
        color: "#5d7382",
        fontFamily: "monospace",
        fontSize: "11px",
      })
      .setDepth(22);

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.aim = { x: pointer.worldX, y: pointer.worldY };
    });
    this.input.on("door-tap", (id: string) => {
      this.toggleDoor = id;
      this.manualGoal = null;
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const cell = worldToCell({ x: pointer.worldX, y: pointer.worldY }, TILE_SIZE);
      if (this.toggleDoor !== null || !isWalkable(this.frame.map, cell)) {
        return;
      }
      this.manualGoal = cell;
    });

    this.frame = stepGuardSimulation(this.simulation, { timeMs: 0, deltaMs: 0 });
    this.simulation = this.frame.state;
    this.syncDoorBodies();
  }

  public update(time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.reset)) {
      this.scene.restart();
      return;
    }

    const velocity = this.readPlayerVelocity();
    this.playerBody.setVelocity(velocity.x, velocity.y);
    this.noiseRequested = Phaser.Input.Keyboard.JustDown(this.keys.noise);
    this.throwRequested = [
      Phaser.Input.Keyboard.JustDown(this.keys.throwOne),
      Phaser.Input.Keyboard.JustDown(this.keys.throwTwo),
      Phaser.Input.Keyboard.JustDown(this.keys.throwThree),
    ].some(Boolean);
    const aimDirection = this.resolveAimDirection();
    const toggleAlgorithm = Phaser.Input.Keyboard.JustDown(this.keys.toggleAlgorithm);

    this.frame = stepGuardSimulation(this.simulation, {
      timeMs: time,
      deltaMs: delta,
      ...(toggleAlgorithm ? { toggleAlgorithm: true } : {}),
      ...(this.manualGoal === null ? {} : { manualGoal: this.manualGoal }),
      playerPosition: { x: this.player.x, y: this.player.y },
      playerVelocity: velocity,
      ...(this.noiseRequested
        ? {
            noiseRequest: {
              position: { x: this.player.x, y: this.player.y },
              radius: SOUND_RADIUS,
              durationMs: SOUND_DURATION_MS,
            },
          }
        : {}),
      ...(this.throwRequested && aimDirection ? { throwRequest: { direction: aimDirection } } : {}),
      ...(this.toggleDoor === null ? {} : { doorToggleRequest: this.toggleDoor }),
    });
    this.simulation = this.frame.state;
    if (this.manualGoal !== null && this.simulation.manualGoal === null) {
      this.manualGoal = null;
    }
    this.toggleDoor = null;
    this.noiseRequested = false;
    this.throwRequested = false;
    this.syncDoorBodies();

    for (const impact of this.frame.impacts) {
      this.feedback.fire(impact, { x: this.player.x, y: this.player.y });
    }
    if (this.simulation.escapes > this.renderedEscapes && this.simulation.lastEscape) {
      this.feedback.showEscape(this.simulation.lastEscape);
    }
    this.renderedEscapes = this.simulation.escapes;

    this.render(time, delta, velocity);
  }

  private createDoorBodies(): { readonly id: string; readonly body: Phaser.Physics.Arcade.StaticBody }[] {
    const bodies: { readonly id: string; readonly body: Phaser.Physics.Arcade.StaticBody }[] = [];
    for (const spec of DOOR_SPECS) {
      const first = spec.cells[0];
      if (!first) {
        continue;
      }
      const centerX = (first.x + (spec.cells.length - 1) / 2) * TILE_SIZE + TILE_SIZE / 2;
      const centerY = first.y * TILE_SIZE + TILE_SIZE / 2;
      const shape = this.add.rectangle(
        centerX,
        centerY,
        spec.cells.length * TILE_SIZE,
        TILE_SIZE,
        0x000000,
        0,
      );
      this.physics.add.existing(shape, true);
      const body = shape.body as Phaser.Physics.Arcade.StaticBody;
      body.enable = spec.startOpen ? false : true;
      bodies.push({ id: spec.id, body });
    }
    return bodies;
  }

  private syncDoorBodies(): void {
    for (const entry of this.doorBodies) {
      const door = this.simulation.doors.find((candidate) => candidate.id === entry.id);
      entry.body.enable = door ? !door.open : false;
    }
  }

  private readPlayerVelocity(): { x: number; y: number } {
    const horizontal = Number(this.cursors.right.isDown || this.keys.right.isDown)
      - Number(this.cursors.left.isDown || this.keys.left.isDown);
    const vertical = Number(this.cursors.down.isDown || this.keys.down.isDown)
      - Number(this.cursors.up.isDown || this.keys.up.isDown);
    if (horizontal === 0 && vertical === 0) {
      return { x: 0, y: 0 };
    }
    const length = Math.hypot(horizontal, vertical);
    return {
      x: (horizontal / length) * PLAYER_SPEED,
      y: (vertical / length) * PLAYER_SPEED,
    };
  }

  private resolveAimDirection(): Vector2 | null {
    if (!this.aim) {
      return null;
    }
    const dx = this.aim.x - this.player.x;
    const dy = this.aim.y - this.player.y;
    const length = Math.hypot(dx, dy);
    if (length < 8) {
      return null;
    }
    return { x: dx / length, y: dy / length };
  }

  private render(time: number, delta: number, velocity: { x: number; y: number }): void {
    const state = this.simulation;
    const playerPosition = { x: this.player.x, y: this.player.y };
    const speed = Math.hypot(velocity.x, velocity.y);

    this.guardView.update({
      state: state.state,
      position: state.position,
      facingRadians: state.facingRadians,
      speed: state.lastSpeedPxPerSecond,
      alertLevel: state.alert.level,
      timeMs: time,
      deltaMs: delta,
    });

    const inCone = this.isInsideCone(state.position, state.facingRadians, playerPosition);
    const confirmProgress = state.visibleSinceMs === null
      ? 0
      : Math.min(1, (time - state.visibleSinceMs) / CONFIRM_MS);
    this.coneView.update({
      origin: state.position,
      facingRadians: state.facingRadians,
      range: VISION_RANGE,
      fieldOfViewRadians: Math.PI / 2,
      visible: state.vision.visible,
      alertLevel: state.alert.level,
      inCone,
      confirmProgress,
      state: state.state,
      timeMs: time,
      occludedCells: inCone && !state.vision.visible
        ? occludingCells(this.frame.map, TILE_SIZE, state.position, playerPosition)
        : [],
      tileSize: TILE_SIZE,
    });

    this.level.update({
      map: this.frame.map,
      walls: LAB_MAP,
      doors: state.doors,
      cover: this.frame.cover,
      guardCell: worldToCell(state.position, TILE_SIZE),
      playerCell: worldToCell(playerPosition, TILE_SIZE),
      path: state.waypoints.slice(state.nextWaypoint),
      explored: state.explored,
      searchPlan: state.search?.points ?? null,
      searchIndex: state.searchIndex,
      manualGoal: state.manualGoal,
      extractionCell: EXTRACTION_CELL,
      tileSize: TILE_SIZE,
      timeMs: time,
      outcome: state.outcome,
    });

    this.distractionView.update({
      active: state.distractors.active,
      origin: playerPosition,
      aim: this.aim,
      predictedImpact: this.resolvePredictedImpact(),
      charges: state.distractors.charges,
      capacity: DISTRACTION_CAPACITY,
      tileSize: TILE_SIZE,
      timeMs: time,
      canThrow: state.distractors.charges > 0,
    });

    this.hud.update({
      state: state.state,
      phase: state.phase,
      band: state.alert.band,
      alertLevel: state.alert.level,
      visionReason: state.vision.reason,
      soundHeard: this.frame.soundHeard,
      activeSounds: state.perception.soundEvents.length,
      memorySource: state.memory.source ?? "-",
      memoryAgeMs: this.frame.memoryAgeMs,
      pathStatus: state.pathStatus,
      totalCost: state.totalCost,
      expandedNodes: state.expandedNodes,
      goalLabel: this.goalLabel(),
      stones: state.distractors.charges,
      stoneCapacity: DISTRACTION_CAPACITY,
      escapes: state.escapes,
      transitions: state.transitions,
      covering: this.frame.cover.standingInCover,
      coverDistance: this.frame.distanceToCover,
      outcome: state.outcome,
      outcomeDetail: state.outcomeDetail,
      timeMs: time,
      telemetry: state.telemetry,
    });

    this.feedback.update({
      playerPosition,
      guardPosition: state.position,
      alertLevel: state.alert.level,
      phase: state.phase,
      running: state.outcome === "running",
    }, delta);

    this.playerShadow.setPosition(playerPosition.x, playerPosition.y + 11);
    this.playerShadow.setScale(1 + Math.min(0.3, speed / 700));
  }

  private isInsideCone(origin: Vector2, radians: number, target: Vector2): boolean {
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const distance = Math.hypot(dx, dy);
    if (distance > VISION_RANGE) {
      return false;
    }
    if (distance < 0.001) {
      return true;
    }
    let delta = Math.atan2(dy, dx) - radians;
    while (delta > Math.PI) {
      delta -= Math.PI * 2;
    }
    while (delta < -Math.PI) {
      delta += Math.PI * 2;
    }
    return Math.abs(delta) <= HALF_FOV;
  }

  private resolvePredictedImpact(): Vector2 | null {
    if (this.simulation.distractors.charges <= 0) {
      return null;
    }
    const direction = this.resolveAimDirection();
    if (!direction) {
      return null;
    }
    const travel = STONE_SPEED * (STONE_FLIGHT_MS / 1000);
    const cell = worldToCell(
      { x: this.player.x + direction.x * travel, y: this.player.y + direction.y * travel },
      TILE_SIZE,
    );
    if (cell.x < 0 || cell.y < 0 || cell.x >= GRID_WIDTH || cell.y >= GRID_HEIGHT) {
      return null;
    }
    return cellCenter(cell, TILE_SIZE);
  }

  private goalLabel(): string {
    const state = this.simulation;
    if (state.goalCell === null) {
      return "-";
    }
    if (state.goalReason === "patrol" && state.manualGoal === null) {
      const point = currentPatrolCell(PATROL_ROUTE, state.patrol);
      return `patrulla ${state.patrol.pointIndex} (${point.x},${point.y})`;
    }
    return `${state.goalReason} (${state.goalCell.x},${state.goalCell.y})`;
  }

  private isDoorCell(cell: GridPoint): boolean {
    return DOOR_SPECS.some((spec) =>
      spec.cells.some((doorCell) => doorCell.x === cell.x && doorCell.y === cell.y));
  }

  private drawExtractionLabel(): void {
    const center = cellCenter(EXTRACTION_CELL, TILE_SIZE);
    this.add
      .text(center.x, center.y + 20, "SALIDA", {
        color: "#8ef0b4",
        fontFamily: "monospace",
        fontSize: "10px",
      })
      .setOrigin(0.5)
      .setDepth(9);
  }
}
