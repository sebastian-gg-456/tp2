---
id: upgrade-03-animaciones
titulo: Upgrade 03 - Animaciones por estado y transicion
tipo: especificacion
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 03 - Animaciones por estado y transición

## Problema

El guardia se movía como un rectángulo uniforme. Sin diferencias entre estar
parado, caminar, investigar o perseguir, el jugador no puede anticipar la
conducta, y una transición de estado entre dos frames idénticos es invisible.

## Objetivo

Que la postura y el movimiento del guardia codifiquen su estado, y que una
transición sea un evento perceptible sin necesidad del HUD.

## Alcance

- Paleta y forma distintas por estado (`patrol`, `investigate`, `chase`,
  `search`, `return`, `captured`).
- Interpolación del cuerpo entre posiciones de simulación.
- Animación de marcha en función de la velocidad real, incluida la velocidad
  nula durante la pausa (upgrade 01).
- Destello breve en la transición, con intensidad distinta para
  `sight-confirmed` y `captured`.
- Marcador de orientación permanente para saber hacia dónde mira.

## Fuera de alcance

- Sprites, sheets de animación o arte externo.
- Interpolación por esqueleto. Todo son primitivas.

## Criterios de aceptación

1. Cada estado tiene color y ritmo propios.
2. La velocidad de la animación de marcha sigue `lastSpeedPxPerSecond`.
3. Durante una pausa de patrulla la animación se detiene.
4. Una transición emite un destello y la postura cambia en el mismo frame.
5. `captured` detiene el cuerpo y marca el resultado.

## Trazabilidad

- Aplicación: `state.state`, `state.facingRadians`, `state.lastSpeedPxPerSecond`.
- Presentación: `src/game/presentation/guardView.ts` y el director de impacto
  `src/game/presentation/feedbackDirector.ts`.