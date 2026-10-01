---
id: upgrade-01-patrulla-pausas
titulo: Upgrade 01 - Patrulla con pausas y mirada direccional
tipo: especificacion
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 01 - Patrulla con pausas y mirada direccional

## Problema

La patrulla de H3 era un ciclo de waypoints sin ritmo: el guardia parecía un
bloque que se desliza de un punto al siguiente a la misma velocidad. Eso lo hace
predecible y, sobre todo, **injusto**: el jugador no puede leer la intención
del guardia ni aprender a aprovechar sus ventanas.

## Objetivo

Que la patrulla tenga ritmo propio y que la mirada del guardia durante la pausa sea legible, para que "el guardia está mirando por ahí" sea información de juego.

## Alcance

- Cada punto de ruta declara `pauseMs` y, opcionalmente, un barrido de mirada.
- La pausa es un estado de la máquina (`pausing`), no un temporizador suelto.
- Mientras camina, la mirada sigue la dirección de movimiento.
- Mientras pausa, la mirada barre en torno a la dirección de llegada.
- Los eventos de llegada, pausa y reanudación quedan en telemetría.
- Un punto con `pauseMs: 0` no genera pausa: es un punto de paso rápido.

## Fuera de alcance

- Pausas aleatorias o no deterministas.
- Mirada independiente del comportamiento (el guardia no mira al vacío si no está pausado).

## Criterios de aceptación

1. `advancePatrol` devuelve la fase, el tiempo restante y los bordes `arrived` y `resumed`.
2. La ruta cicla y cuenta vueltas completas al envolver.
3. Un punto con pausa cero reanuda en el mismo tick.
4. La mirada en pausa recorre los grados declarados y vuelve al extremo con el período declarado.
5. La simulación registra `patrol-arrived`, `patrol-paused` y `patrol-resumed` con su causa.
6. El guardia no se mueve durante la pausa y el cono de visión barre.

## Parámetros

| Parámetro | Valor |
|---|---|
| Pausas por punto | 2400, 0, 1800, 2200, 1600, 2000 ms |
| Barridos | -75/0/75, —, -60/60, -90/0/90, -45/45, -70/0/70 grados |
| Período de barrido | 1800 a 2600 ms |

## Riesgos

- Una pausa larga en un punto ciego vuelve el nivel trivial. Se mitiga con seis
  puntos y una ventana de 0 ms que obliga a atravesar la exposición.
- El barrido puede hacer que el guardia vea más de lo que la ruta sugiere. Es
  intencional: el cono es la información pública del jugador.

## Trazabilidad

- Dominio: `src/domain/behavior/patrol.ts`.
- Aplicación: `src/application/simulation/labLevel.ts` (`PATROL_ROUTE`) y
  `guardSimulation.ts` (etapas 11 y 12).
- Presentación: `src/game/presentation/guardView.ts` (postura de pausa).