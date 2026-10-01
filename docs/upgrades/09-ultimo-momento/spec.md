---
id: upgrade-09-ultimo-momento
titulo: Upgrade 09 - Escape de ultimo momento
tipo: especificacion
audiencia: estudiante
acceso: publico
version: 2
---

# Upgrade 09 - Escape de último momento

## Problema

Cuando el guardia confirmaba visión, la persecución era irreversible. El
jugador no tenía ninguna lectura de "estaba a punto de ser capturado" ni de "se
me ha escapado por poco", de modo que la línea de visión era una frontera
binaria sin tensión.

## Objetivo

Modelar el instante en que la captura está a punto de ocurrir como una
decisión propia, medir con qué margen se salvó el jugador y comunicarlo con un
impacto de pantalla propio.

## Alcance

- Ventana de tensión: se arma cuando el guardia persigue, ve al jugador y la
  distancia está dentro de `lastMomentRadius` (78 px frente a 20 px de captura).
- Registro del escape con `atMs`, `distancePx`, `marginPx` (lo que le sobraba
  para ser capturado), `heldMs` (duración de la ventana) y `relief` (intensidad
  de alivio 0..1 según lo cerca que estaba la captura).
- Regla deliberada: salir corriendo del radio **sin** romper la visión no cuenta.
  Es una huida normal, no un aguijón.
- unarmed cuando el jugador sale de la ventana o termina la persecución, sin
  contar escape.
- `armedDistancePx` se actualiza mientras la ventana sigue abierta.
- Impacto visual `last-moment-escape` cuya intensidad usa `relief`.

## Fuera de alcance

- Estados intermedios de ocultamiento con conos estrechos.
- Una ventana basada en tiempo: la ventana es geométrica, no un temporizador.

## Criterios de aceptación

1. La ventana solo se arma en persecución, con visión y dentro del radio.
2. Romper la visión dentro de la ventana registra el escape una sola vez, aunque
   la visión siga rota varios frames.
3. Salir del radio con visión, o con visión rota fuera del radio, desarma sin
   contar escape.
4. Un escape cerca de la captura da más `relief` que uno lejos.
5. Un radio de ventana menor o igual al de captura se rechaza.

## Trazabilidad

- Dominio: `src/domain/behavior/lastMoment.ts` (`updateLastMoment`,
  `LastMomentEscape`).
- Aplicación: etapa de locomoción y percepción de `guardSimulation.ts`.
- Presentación: impacto `last-moment-escape` en `feedbackDirector.ts`.