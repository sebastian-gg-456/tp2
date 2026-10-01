---
id: upgrade-05-camara-plan
titulo: Upgrade 05 - Plan de trabajo
tipo: plan
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 05 - Plan de trabajo

## Orden de implementación

1. **Tabla de impactos** — cada `ScreenImpact` declara duración, intensidad de
   sacudida, color de destello y rótulo: `sight-confirmed`,
   `last-moment-escape`, `captured`, `extracted`, `shutter`,
   `alert-threshold`.
2. **Encuadre** — el director recibe el estado de la ronda y calcula un zoom
   objetivo por conducta: vista completa en infiltración, acercamiento en
   persecución y un punto intermedio en búsqueda e investigación. El
   movimiento de cámara es lerp, no salto, para no marear.
3. **Sacudida** — se aplica al zoom y al desplazamiento, con decaimiento
   exponencial; la suma de impactos simultáneos se acota para que no se
   desborde.
4. **Destello de color** — `camera.flash` con color por tipo de impacto.
5. **Tinte de alerta** — `setAlpha` de una capa a pantalla completa en función
   de `alert.level`, de modo que la tensión se percibe incluso sin eventos.
6. **Vigneta de búsqueda** — marca de búsqueda activa con bordes oscurecidos,
   que se desvanece al salir de `search`.

## Decisiones

- **Una tabla de impactos, no un `switch` disperso.** Permite leer de un golpe
  qué evento produce qué sensación, que es justamente el objetivo del
  laboratorio.
- **El tinte de alerta no dispara eventos.** Es una función continua del
  medidor (upgrade 08): el jugador percibe la tendencia antes del umbral.
- **La cámara no lee el frame.** Recibe un `input` con los datos de tensión,
  igual que el resto de vistas.

## Alternativas descartadas

- **Zoom siempre activo**: reduce el contexto y el jugador pierde de vista la
  salida y las puertas, que son decisiones de sigilo.
- **Sacudida proportional a la alerta continua**: hace la pantalla inservible
  durante una persecución larga. La alerta continua usa color, los eventos
  usan sacudida.