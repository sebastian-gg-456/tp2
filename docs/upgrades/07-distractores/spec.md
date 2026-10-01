---
id: upgrade-07-distractores
titulo: Upgrade 07 - Distractores sonoros interactivos
tipo: especificacion
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 07 - Distractores sonoros interactivos

## Problema

El ruido del jugador (H3, tecla Q) era un interruptor binario en la posición
del jugador. No había forma de **dirigir** el ruido lejos de la propia ruta,
y en consecuencia el guardia siempre investigaba hacia el jugador, lo que
hacía la mecánica trivial o inútil.

## Objetivo

Permitir generar ruido en un punto elegido por el jugador, con trayectoria
visible, y soportar **varios sonidos simultáneos** para que un lanzamiento no
sobrescriba a otro.

## Alcance

- Piedra lanzable con trayectoria parabólica en el plano cenital: velocidad,
  tiempo de vuelo, gravedad, elevación y radio de ruido configurables.
- Predicción del punto de impacto en el dominio; rechazo explícito si cae
  fuera del mapa.
- Ruido manual del jugador (Q) como fuente de sonido independiente.
- Percepción con **log acotado de eventos** (4 más recientes) y elección del
  sonido audible más cercano como destino de investigación.
- Capacidad limitada de distractores activos.
- Presentación: marca de carga, punto de impacto y anillo de ruido.

## Fuera de alcance

- Rebotes y física de proyectiles con colisión por celda.
- Inventario o munición: el lanzamiento es ilimitado y su costo es
  posicional, no material.

## Criterios de aceptación

1. La piedra vuela a velocidad constante y explota exactamente en
   `timeToImpactMs`.
2. El arco desaparece en el impacto y la posición final es la predicha.
3. Un lanzamiento cuyo impacto cae fuera del mapa se rechaza con telemetría
   `stone-rejected`.
4. Varias fuentes de sonido coexisten; el log no crece sin límite.
5. La investigación apunta al sonido audible más cercano.

## Trazabilidad

- Dominio: `src/domain/world/distractors.ts` (trayectoria) y
  `src/application/simulation/perceptionSimulation.ts` (log de sonidos).
- Aplicación: `src/application/simulation/distractors.ts` y etapas 2 y 3 de
  `guardSimulation.ts`.
- Presentación: `src/game/presentation/distractionView.ts`.