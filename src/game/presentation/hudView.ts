import Phaser from "phaser";
import { alertLabel, type AlertBand } from "../../domain/behavior/alertMeter";
import { guardStateLabel, type GuardState } from "../../domain/behavior/stateMachine";
import { recentTelemetry, type TelemetryLog } from "../../domain/telemetry/telemetry";
import type { LevelPhase } from "../../application/simulation/guardSimulation";
import type { VisionReason } from "../../domain/perception/perception";
import type { SearchStatus } from "../../domain/navigation/search";

/**
 * Upgrade 8 - Medidor de alerta y estados del nivel.
 *
 * El medidor es continuo y visible, las bandas son discretas y el estado del
 * nivel aparece con su consecuencia. El panel de telemetria responde a
 * RF-08: cualquier transicion se puede explicar sin leer el codigo.
 */

const BAND_COLORS: Readonly<Record<AlertBand, number>> = {
  calm: 0x73c991,
  suspicious: 0xe5b454,
  alert: 0xe05563,
};

const PHASE_LABELS: Readonly<Record<LevelPhase, string>> = {
  infiltration: "INFILTRACION",
  suspicion: "SOSPECHA",
  alerta: "ALERTA",
  persecucion: "PERSECUCION",
  busqueda: "BUSQUEDA",
  capturado: "CAPTURADO",
  extraccion: "EXTRACCION",
};

const VISION_LABELS: Readonly<Record<VisionReason, string>> = {
  visible: "VISIBLE",
  "out-of-range": "FUERA DE RANGO",
  "outside-cone": "FUERA DEL CONO",
  occluded: "OCLUIDO",
  "invalid-facing": "DIRECCION INVALIDA",
};

const STATUS_LABELS: Readonly<Record<SearchStatus, string>> = {
  success: "RUTA OK",
  unreachable: "INALCANZABLE",
  "invalid-start": "INICIO INVALIDO",
  "invalid-goal": "DESTINO INVALIDO",
};

export interface HudInput {
  readonly state: GuardState;
  readonly phase: LevelPhase;
  readonly band: AlertBand;
  readonly alertLevel: number;
  readonly visionReason: VisionReason;
  readonly soundHeard: boolean;
  readonly activeSounds: number;
  readonly memorySource: string;
  readonly memoryAgeMs: number | null;
  readonly pathStatus: SearchStatus;
  readonly totalCost: number | null;
  readonly expandedNodes: number;
  readonly goalLabel: string;
  readonly stones: number;
  readonly stoneCapacity: number;
  readonly escapes: number;
  readonly transitions: number;
  readonly covering: boolean;
  readonly coverDistance: number | null;
  readonly outcome: "running" | "captured" | "extracted";
  readonly outcomeDetail: string;
  readonly timeMs: number;
  readonly telemetry: TelemetryLog;
}

const BAR_WIDTH = 250;
const BAR_HEIGHT = 12;
const PANEL_WIDTH = 320;

export class HudView {
  private readonly bar: Phaser.GameObjects.Graphics;
  private readonly text: Phaser.GameObjects.Text;
  private readonly lines: Phaser.GameObjects.Text;
  private dimensions = { width: 960, height: 640 };

  public constructor(scene: Phaser.Scene) {
    const { width, height } = scene.scale;
    this.bar = scene.add.graphics().setDepth(20);
    this.text = scene.add
      .text(width - 16, 14, "", {
        color: "#d9e4ea",
        fontFamily: "monospace",
        fontSize: "13px",
        align: "right",
        lineSpacing: 2,
      })
      .setOrigin(1, 0)
      .setDepth(21);
    this.lines = scene.add
      .text(16, height - 108, "", {
        color: "#8fa6b3",
        fontFamily: "monospace",
        fontSize: "12px",
        lineSpacing: 3,
      })
      .setOrigin(0, 0)
      .setDepth(21);
  }

  public update(input: HudInput): void {
    const width = this.dimensions.width;
    this.drawPanel(input, width);
    this.drawBar(input, width);
    this.text.setText(this.compose(input));
    this.lines.setText(this.composeTelemetry(input));
  }


  public setDimensions(width: number, height: number): void {
    this.dimensions = { width, height };
    this.text.setPosition(width - 16, 14);
  }

  private drawPanel(input: HudInput, width: number): void {
    const x = width - 16 - PANEL_WIDTH;
    const y = 10;
    const height = 196;
    this.bar.clear();
    this.bar.fillStyle(0x10161c, 0.86);
    this.bar.fillRoundedRect(x, y, PANEL_WIDTH, height, 6);
    this.bar.lineStyle(1, 0x2b3943, 1);
    this.bar.strokeRoundedRect(x, y, PANEL_WIDTH, height, 6);
    this.bar.fillStyle(BAND_COLORS[input.band], 0.9);
    this.bar.fillRect(x, y, 3, height);
    if (input.outcome !== "running") {
      this.bar.fillStyle(input.outcome === "captured" ? 0x8b1f2b : 0x1f6b47, 0.24);
      this.bar.fillRoundedRect(x, y, PANEL_WIDTH, height, 6);
    }
  }

  private drawBar(input: HudInput, width: number): void {
    const x = width - 16 - BAR_WIDTH;
    const y = 196;
    this.bar.fillStyle(0x0b0f13, 0.9);
    this.bar.fillRoundedRect(x - 2, y - 2, BAR_WIDTH + 4, BAR_HEIGHT + 4, 4);
    this.bar.fillStyle(0x1b252d, 1);
    this.bar.fillRoundedRect(x, y, BAR_WIDTH, BAR_HEIGHT, 3);
    const fill = Math.max(0, Math.min(1, input.alertLevel));
    if (fill > 0) {
      this.bar.fillStyle(BAND_COLORS[input.band], 1);
      this.bar.fillRoundedRect(x, y, Math.max(3, BAR_WIDTH * fill), BAR_HEIGHT, 3);
    }
    this.bar.lineStyle(1, 0x3a4c58, 1);
    for (const threshold of [0.3, 0.72]) {
      const tx = x + BAR_WIDTH * threshold;
      this.bar.lineBetween(tx, y - 1, tx, y + BAR_HEIGHT + 1);
    }
  }

  private compose(input: HudInput): string {
    const stateColor = input.state === "chase"
      ? "#ff8f99"
      : input.state === "search" || input.state === "investigate"
        ? "#8ee0c4"
        : input.state === "captured"
          ? "#8b959d"
          : "#d9e4ea";
    const rows = [
      `<color=#9eb4c2>GUARDIA</color>  <color=${stateColor}><b>${guardStateLabel(input.state)}</b></color>`,
      `<color=#9eb4c2>NIVEL</color>    ${PHASE_LABELS[input.phase]}`,
      `<color=#9eb4c2>ALERTA</color>   ${alertLabel(input.band)} ${(input.alertLevel * 100).toFixed(0)}%`,
      `<color=#9eb4c2>VISION</color>   ${VISION_LABELS[input.visionReason]}`,
      `<color=#9eb4c2>SONIDO</color>   ${input.soundHeard ? "OIDO" : "-"} (${input.activeSounds} activos)`,
      `<color=#9eb4c2>MEMORIA</color>  ${input.memorySource}${input.memoryAgeMs === null ? "" : ` ${(input.memoryAgeMs / 1000).toFixed(1)}s`}`,
      `<color=#9eb4c2>RUTA</color>     ${STATUS_LABELS[input.pathStatus]} costo ${input.totalCost ?? "-"} exp ${input.expandedNodes}`,
      `<color=#9eb4c2>OBJETIVO</color> ${input.goalLabel}`,
      `<color=#9eb4c2>PIEDRAS</color>  ${input.stones}/${input.stoneCapacity}`,
      `<color=#9eb4c2>COBERTURA</color>${input.covering ? " SI" : " no"}${input.coverDistance === null ? "" : ` a ${input.coverDistance.toFixed(0)}px`}`,
      `<color=#9eb4c2>HUIR</color>     ${input.escapes} | transiciones ${input.transitions}`,
      `<color=#9eb4c2>TIEMPO</color>   ${(input.timeMs / 1000).toFixed(1)}s`,
    ];
    if (input.outcome !== "running") {
      rows.push(`<color=#ffb0b6><b>${input.outcome === "captured" ? "FALLO" : "EXITO"}</b> ${input.outcomeDetail}</color>`);
    }
    return rows.join("\n");
  }

  private composeTelemetry(input: HudInput): string {
    const events = recentTelemetry(input.telemetry, 4);
    if (events.length === 0) {
      return "<color=#5d7382>sin eventos: el guardia todavia no decidio nada</color>";
    }
    return events
      .map((event) => {
        const time = (event.atMs / 1000).toFixed(1).padStart(5, " ");
        const tag = event.kind === "transition" ? ">" : event.kind === "impact" ? "*" : ".";
        return `<color=#5d7382>${time}s</color> <color=#9eb4c2>${tag}${event.event}</color> ${event.cause}`;
      })
      .join("\n");
  }
}
