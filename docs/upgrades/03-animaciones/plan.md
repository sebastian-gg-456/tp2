---
id: upgrade-03-animaciones-plan
titulo: Upgrade 03 - Plan de trabajo
tipo: plan
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 03 - Plan de trabajo

## Orden de implementación

1. **Primitivas del guardia** — cuerpo, visor, marcador de orientación y sombra,
   cada uno en su capa de profundidad para que el cono quede debajo.
2. **Paleta por estado** — tabla de colores y de ritmo de animación; el color
   de banda de alerta se mezcla sobre el color de estado.
3. **Interpolación** — el cuerpo persigue `state.position` con un factor por
   frame, de modo que el render es continuo aunque la simulación avance a
   pasos discretos.
4. **Marcha** — el desplazamiento del visor y de las "piernas" depende de la
   distancia recorrida por tick: si el guardia está quieto, la animación se
   congela en lugar de seguir un reloj.
5. **Destello de transición** — `feedbackDirector.fire(impacto)` con intensidades
   distintas: confirmación de visión, escape de último momento, captura,
   extracción y apertura de persiana.
6. **Posturas fijas** — `captured` detiene todo y aplica una escala de derrota.

## Decisiones

- **Animación por distancia, no por tiempo.** Es la única forma de que la
  animación sea honesta: si el guardia está bloqueado por una puerta, no
  "camina en el sitio".
- **El impacto visual lo emite la simulación, no la vista.** La lista de
  `ScreenImpact` viene del frame; la vista decide cómo se ve, no cuándo.
- **Sin tweening de Phaser para la postura.** Un tween por estado acumularía
  temporizadores y desincronizaría la animación de la simulación.

## Alternativas descartadas

- **Timer de animación independiente**: se desincroniza en cuanto el frame se
  atrasa y produce movimiento fantasma cuando el guardia está bloqueado.
- **Cambio de color solo**: no distingue caminar de investigar, y ambos estados
  parecen el mismo.