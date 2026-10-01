---
id: upgrade-01-patrulla-pausas-plan
titulo: Upgrade 01 - Plan de trabajo
tipo: plan
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 01 - Plan de trabajo

## Orden de implementación

1. **Cursor de patrulla** — `PatrolCursor` con `pointIndex`, `phase`
   (`moving` | `pausing`), `remainingMs`, `phaseElapsedMs` y `completedLoops`.
   `initialPatrolCursor` valida que el índice esté dentro de la ruta y que la
   ruta no esté vacía.
2. **`advancePatrol`** — función pura con tres salidas: `arrived` (llegó y
   empieza pausa), `resumed` (terminó la pausa y avanza índice) y el estado
   estable. Los puntos con `pauseMs: 0` devuelven `resumed: true` en el mismo
   tick para no perder un frame por punto.
3. **`patrolGazeRadians`** — durante `moving` devuelve la dirección de
   movimiento; durante `pausing` interpola los grados declarados con una
   sinusoidal y vuelve al primer extremo al completar el período.
4. **Ruta del nivel** — seis puntos en `labLevel.ts`, alternando puntos "vivos"
   con barrido y puntos de paso rápido.
5. **Integración** — etapas 11 y 12 de `guardSimulation.ts`. Se corrigió un
   defecto encontrado por las pruebas: `patrolPause` marcaba solo el frame de
   llegada, de modo que el barrido de mirada desaparecía mientras el guardia
   seguía pausado. Ahora se deriva de `cursor.phase === "pausing"`.
6. **Telemetría** — `patrol-arrived` lo emite la FSM; `patrol-paused` y
   `patrol-resumed` los emite la capa de aplicación.

## Decisiones

- **La pausa vive en el dominio**, no en la escena. La escena no decide nada.
- **`sweepDegrees` es una lista ordenada**, no un par min/max: `[-75, 0, 75]`
  describe un barrido que pasa por el centro, `[-60, 60]` uno que no. Un par
  min/max habría permitido escribir un barrido no simétrico.
- **`sweepPeriodMs` es obligatorio** aunque no haya barrido, para que el tipo
  no admita puntos incompletos.
- **La ruta envuelve y cuenta vueltas.** `completedLoops` alimenta la
  telemetría del nivel y permite detectar que un punto quedó inalcanzable.

## Pruebas

`tests/behavior/patrol.test.ts` (15 casos) y los casos de integracion
"pauses appear in the simulation" de `tests/application/guardSimulation.test.ts`.

## Alternativas descartadas

- **Pausas por aleatoriedad con semilla**: menos reproducibles y rompen RF-09.
- **Mirada durante la marcha con oscilación**: haría el cono imposible de leer;
  la búsqueda (upgrade 8) ya cubre la lectura de conos.