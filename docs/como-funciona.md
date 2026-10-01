---
id: laboratorio-guardia-de-sigilo-como-funciona
titulo: Como funciona - del tick a la pantalla
tipo: referencia
audiencia: estudiante
acceso: publico
version: 1
---

# Cómo funciona: del tick a la pantalla

## 1. Capas

```
src/domain/      reglas puras. Sin Phaser, sin DOM, sin reloj.
src/application/  coordinación: Nivel + FSM + percepción + locomoción.
src/game/        presentación Phaser. Dibuja, no decide.
```

La regla que sostiene todo el laboratorio: `domain` no sabe que existe un
motor de juego. Por eso `npm test` corre en Node sin navegador y por eso las
pruebas pueden reproducir exactamente una ronda.

## 2. El tick

`GameScene.update(time, delta)` hace tres cosas, en este orden:

1. **Lee intención** — teclado, puntero, posición del jugador.
2. **Llama a la simulación** — `stepGuardSimulation(state, input)` devuelve un
   frame nuevo con todo el estado derivado.
3. **Pinta** — interpola el cuerpo del guardia hacia la posición de la
   simulación y actualiza cono, HUD, ruta, puertas y feedback.

La simulación no muta el estado recibido: devuelve uno nuevo. Eso permite
comparar frames, reproducir una secuencia y probar sin mocks.

## 3. Orden interno de `stepGuardSimulation`

El orden importa y está comentado en el código. Un resumen:

| # | Etapa | Upgrade / hito |
|---|---|---|
| 1 | Puertas: ciclo, persiana y composición del mapa navegable | 10 |
| 2 | Intención del jugador: ruido, piedra, destino manual | 7, H3 |
| 3 | Percepción: visión con oclusión + sonidos concurrentes | H3, 7 |
| 4 | Medidor de alerta y banda | 8 |
| 5 | Ventana de escape de último momento | 9 |
| 6 | Decisión de la máquina de estados | H4 |
| 7 | Plan de búsqueda acotada | H4.4 |
| 8 | Objetivo, replanificación y ruta (BFS/A*) | H4.3, 4 |
| 9 | Locomoción: el único lugar que mueve al guardia | H3 |
| 10 | Antipatrulla ante rutas bloqueadas por puertas | 10 |
| 11 | Ciclo de patrulla con pausas | 1 |
| 12 | Mirada direccional | 1, 2 |
| 13 | Resultado de la ronda: capturado o extracción | H4.5 |

Dos detalles que aprendimos escribiendo las pruebas:

- El paso 5 debe leer el flag `armed` **antes** de actualizar el módulo de
  último momento, porque ese update lo desarma en el mismo tick en que la
  visión se rompe. Leerlo después hacía imposible detectar un escape.
- El paso 13 tiene su propia comprobación de captura además de la de la FSM,
  porque la distancia final se conoce recién después de mover al guardia.
  Esa segunda vía emite impacto y telemetría también; si no, la captura por
  proximidad no producía feedback visible.

## 4. Estado inmutable y memoria

`GuardSimulationState` es un objeto plano con todo lo observable: posición,
mirada, estado de la FSM, objetivo y su motivo, ruta, celdas exploradas, plan
de búsqueda, puertas, alerta, último momento, percepción, distractores,
telemetría, fase de nivel y resultado de la ronda.

Eso permite que el HUD, la vista del nivel y el director de feedback sean
funciones puras del estado. No guardan nada propio que pueda desincronizarse.

## 5. Interpolación en la pantalla

La simulación avanza en pasos fijos de tiempo lógico; el render corre a la
frecuencia del monitor. El cuerpo del guardia se interpola hacia
`state.position`, de modo que el movimiento se ve continuo sin que la lógica
dependa de la tasa de cuadros.

Si el paso lógico se agranda (por ejemplo al volver de una pestaña en
segundo plano), la simulación sigue siendo correcta: sólo se ve más a saltos.

## 6. Observabilidad

`TelemetryLog` es un buffer acotado (40 eventos por defecto) que registra
transiciones, navegación, percepción, impactos, nivel, distractores y órdenes
manuales. Cada evento lleva `atMs`, estado anterior, evento, estado nuevo y una
**causa legible en español**.

El buffer descarta los más viejos y cuenta cuántos descartó (`dropped`), así
que el log no crece sin límite y aun así se puede saber que hubo más actividad.

## 7. Puertas y mapa navegable

El mapa estático nunca cambia. Lo que cambia es `composeNavigationMap(base,
doors)`: parte de los muros del mapa y vuelve a bloquear las celdas de puerta
que están cerradas. Cada frame de navegación usa el mapa vigente, así que una
puerta que se abre durante una persecución es una ruta nueva sin tocar la
simulación de rutas.

Cuando el guardia no puede avanzar (`movedDistance < 0.05` con ruta activa), se
registra `blocked-route`, se recalcula y, si estaba en patrulla, salta al
siguiente punto. Esa es la única "trampa" que el nivel le plantea al jugador.

## 8. Qué se puede reproducir sin navegador

Todo lo que importa está en `domain` y `application`:

- La máquina de estados se prueba con contextos construidos a mano.
- La ronda completa se prueba con pasos de 16 ms y reubicando al jugador.
- Puertas, alerta, escape, búsqueda y distracciones se prueban sin Phaser.

La evidencia de cada upgrade apunta a esos archivos.