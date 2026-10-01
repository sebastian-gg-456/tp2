---
id: upgrade-08-medidor-alerta
titulo: Upgrade 08 - Medidor de alerta
tipo: especificacion
audiencia: estudiante
acceso: publico
version: 2
---

# Upgrade 08 - Medidor de alerta

## Problema

H3 tenía un contador binario de sospecha. El guardia pasaba de tranquilo a
persecución en un instante, sin que el jugador pudiera entender por qué ni
cuánto tiempo tenía. Eso hace imposible la tensión gradual, que es el núcleo
del sigilo.

## Objetivo

Sustituir el contador por un medidor continuo, con ganancia, decaimiento,
pico y bandas, y dejar que esas bandas sean la **consecuencia** que consume el
resto de la simulación: más velocidad, cámara más tensa y apertura de atajos.

## Alcance

- `AlertState` con `level` continuo en `[0, 1]`, `band`, `peak` y
  `lastStimulusAtMs`.
- Bandas `calm`, `suspicious` y `alert` derivadas del nivel con
  `alertBandOf` y umbrales configurables (0,3 y 0,72 por defecto).
- Ganancia por visión confirmada **modulada por cercanía**: cuanto más cerca
  está el jugador, más rápido sube (`closenessBonus`).
- Ganancia por sonido con **piso**: un ruido deja la alerta al menos en
  `soundFloor`, así que el guardia sospecha aunque no esté mirando.
- Decaimiento con **ventana de gracia** (`decayGraceMs`) para que una
  interrupción breve no borre el progreso, y más lento mientras el guardia
  busca (`searchDecayMultiplier`).
- `peak` conservado para telemetría.
- Barra en el HUD teñida por banda.

## Fuera de alcance

- Alerta por zonas o por lectura de documentos: requeriría estados que no
  existen.
- Decaimiento por estar quieto: solo por ausencia de estímulo.

## Criterios de aceptación

1. El medidor nunca sale de `[0, 1]`.
2. Ver al jugador cerca sube más rápido que verlo lejos.
3. Un ruido sitúa la alerta al menos en el piso, aunque pase un solo frame.
4. Durante la ventana de gracia la alerta no baja.
5. Pasada la ventana, decae, y decae más lento si el guardia está buscando.
6. Las bandas se resuelven del nivel y `peak` no baja nunca.

## Trazabilidad

- Dominio: `src/domain/behavior/alertMeter.ts` (`AlertConfig`, `updateAlert`,
  `alertBandOf`, `alertLabel`).
- Aplicación: `state.alert` en `guardSimulation.ts`.
- Presentación: barra y etiqueta de banda en `src/game/presentation/hudView.ts`.