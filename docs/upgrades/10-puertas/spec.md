---
id: upgrade-10-puertas
titulo: Upgrade 10 - Puertas, persiana y atajos
tipo: especificacion
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 10 - Puertas, persiana y atajos

## Problema

El guardia investigaba ruido (H3) pero su ruta ignoraba el estado de las
puertas: calculaba caminos que no podía recorrer. El jugador tampoco podía
usar las puertas como herramienta, porque no había ninguna interactiva.

## Objetivo

Que las puertas importen en las dos direcciones: el guardia respeta su estado
al calcular rutas, y el jugador puede abrirlas y cerrarlas desde la escena.

## Alcance

- `DoorSpec` con identificador estable (`puerta-norte`, `puerta-este`,
  `persiana`) en lugar de índices de array, para que las referencias sean
  estables entre frames y legibles en telemetría.
- Puertas `auto` con ciclo propio: `openMs`, `closedMs` y `startOpen`.
- Persiana como caso especial: se abre cuando la FSM la pide en `chase` y se
  mantiene abierta mientras dura `search` o `return`.
- `composeNavigationMap` recompone el mapa navegable a partir del mapa
  estático y del estado de las puertas, de modo que abrir una puerta es una
  ruta nueva sin tocar la simulación de rutas.
- `toggleDoor` a petición del operador, estable: el mismo `id` alterna de
  estado sin reiniciar el ciclo de las demás puertas.
- `validateDoorSpecs` obliga a que cada puerta recorte un muro real.
- Presentación: marco, hoja y marca de cerrada o de persiana.

## Fuera de alcance

- Cerrado remoto de puertas por el guardia. Sería una decisión nueva y no una
  mejora de navegación.
- Cerraduras, llaves o puertas con reglas distintas. Deuda para H6.

## Criterios de aceptación

1. Cada puerta tiene identificador y estado propios, y `findDoor` los localiza.
2. Una puerta cerrada bloquea la navegación; abierta, la libera aunque el mapa
   estático la declarara muro.
3. `requestShutter` abre la persiana una vez y se anuncia con `shutterOpened`.
4. `holdShutter` la mantiene abierta durante toda la búsqueda.
5. El clic del jugador alterna la puerta de su celda.
6. Una puerta que no recorta un muro se rechaza al arrancar.

## Trazabilidad

- Dominio: `src/domain/environment/doors.ts` (`initialDoors`, `findDoor`,
  `toggleDoor`, `advanceDoors`, `composeNavigationMap`, `validateDoorSpecs`).
- Aplicación: `requestShutter: state === "chase"` y
  `holdShutter: state === "search" || "return"` en `guardSimulation.ts`, mapa
  navegable en `labLevel.ts`.
- Presentación: `drawDoors` en `levelView.ts` y el clic en `GameScene.ts`.