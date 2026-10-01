---
id: upgrade-05-camara
titulo: Upgrade 05 - Camara de tension
tipo: especificacion
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 05 - Encuadre útil y cámara de tensión

## Problema

El mapa completo cabe en pantalla, así que la cámara no hacía falta. Cuando
el guardia confirmaba una persecución no había ninguna señal de que el
riesgo hubiera cambiado: el jugador seguía viendo exactamente lo mismo que un
segundo antes.

## Objetivo

Usar el encuadre y el color de pantalla como canal de tensión, sin quitar
información: la cámara acerca y sigue al guardia cuando el riesgo sube, y
vuelve a la vista completa cuando baja.

## Alcance

- Seguimiento suave del guardia con zoom en persecución.
- Retroceso a la vista completa al salir de la tensión.
- Sacudida proporcional a la intensidad del impacto.
- Destello de pantalla por evento de alto impacto (confirmación, escape,
  captura, extracción, apertura de persiana).
- Tinte de alerta continuo, no solo en eventos.
- Viñeta de búsqueda cuando el guardia está buscando.

## Fuera de alcance

- Sacudidas vestibulares fuertes. La intensidad máxima está acotada.
- Zoom que corte la información crítica: el mapa sigue siendo legible.

## Criterios de aceptación

1. Durante la persecución el zoom supera al de patrulla y el centro sigue al
   guardia.
2. Al volver a calma el encuadre vuelve a la vista completa.
3. Cada impacto tiene una intensidad y una duración propias.
4. El tinte de alerta es función continua del nivel, no de eventos sueltos.
5. El director de feedback no toca el estado de la simulación.

## Trazabilidad

- Aplicación: `state.state`, `state.alert.level`, `frame.impacts`.
- Presentación: `src/game/presentation/feedbackDirector.ts`.