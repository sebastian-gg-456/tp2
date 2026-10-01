---
id: upgrade-04-trazabilidad-plan
titulo: Upgrade 04 - Plan de trabajo
tipo: plan
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 04 - Plan de trabajo

## Orden de implementación

1. **Jerarquía de capas** — el `levelView` separa su dibujo en cuatro capas
   (`pathLayer`, `doorLayer`, `overlayLayer`, `walls`) para que la ruta nunca
   compita visualmente con las puertas o la cobertura.
2. **Polilínea de ruta** — se dibuja desde `waypoints` a partir del punto
   actual del guardia hasta el último punto, con grosor constante y extremos
   redondeados por construcción.
3. **Explorados** — relleno tenue por celda, dibujado antes de la polilínea
   para que la ruta quede por encima. Solo se pintan las celdas que el
   algoritmo realmente expandió, así que el coste visual es acotado incluso
   con A*.
4. **Marcador de destino** — círculo ámbar para el destino manual y círculo
   de estado para el objetivo de la conducta; si coinciden, solo se dibuja el
   de la conducta.
5. **Conmutación de algoritmo** — `toggleAlgorithm` llega al frame de
   simulación, que cambia `state.algorithm` entre `astar` y `bfs`, recalcula y
   registra `algorithm-toggle`. La escena solo reenvía la tecla.
6. **Señal de fallo** — si `pathStatus` no es `success`, la capa de ruta dibuja
   el grafo explored completo y el HUD muestra el motivo.

## Decisiones

- **La conmutación vive en la aplicación, no en la vista.** Si la vista
  eligiera el algoritmo, la simulación dejaría de ser reproducible.
- **`explored` se dibuja siempre.** Con un mapa de 30x20 son 600 celdas como
  máximo y solo se pintan las realmente Expanded por A*; el coste es bajo y la
  información es alta.
- **La ruta se dibuja desde la posición actual**, no desde el waypoint 0, para
  que no "salte" hacia atrás al recalcular.

## Alternativas descartadas

- **Mostrar el grafo entero siempre**: satura el mapa y esconde la ruta, que
  es lo que el jugador necesita.
- **Elegir el algoritmo en el HUD con un menú**: introduce foco de teclado y
  estados de UI en un proyecto que no tiene sistema de menús. La tecla es más
  reproducible.