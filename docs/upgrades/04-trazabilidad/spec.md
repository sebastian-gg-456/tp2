---
id: upgrade-04-trazabilidad
titulo: Upgrade 04 - Trazabilidad de navegacion
tipo: especificacion
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 04 - Trazabilidad de navegación

## Problema

H2 entregó BFS, A* y sus métricas, y H3 las mostró en pantalla, pero al
sumar la máquina de estados el mapa quedó saturado de información: rutas,
cobertura, puertas, búsqueda y cono compiten por la atención del jugador. No
había jerarquía, y tampoco había forma de comparar los dos algoritmos en la
misma ronda.

## Objetivo

Que la navegación sea la capa más fácil de leer: qué algoritmo corre, qué ruta
eligió, qué celdas exploró y cuál es su objetivo, con jerarquía visual clara y
conmutable en caliente.

## Alcance

- Dibujo de la ruta activa como polilínea desde el guardia hasta el objetivo.
- Celdas exploradas por el algoritmo, con relleno tenue.
- Marcador del destino manual, distinguible del objetivo de la conducta.
- Conmutación BFS/A* con telemetría `algorithm-toggle`.
- Métricas visibles: estado de la ruta, coste, nodos expandidos y frontera
  máxima.

## Fuera de alcance

- Grafo completo siempre visible. El grafo se dibuja solo cuando la búsqueda
  falla, que es cuando importa.
- Rejilla de depuración permanente.

## Criterios de aceptación

1. La polilínea de la ruta coincide con los waypoints que consume la
   locomoción.
2. Las celdas exploradas provienen de `explored` del último cálculo.
3. El destino manual se marca con un color distinto al objetivo automático.
4. El cambio de algoritmo queda registrado con su causa.
5. Un fallo de ruta produce una señal visible, no silencio.

## Trazabilidad

- Dominio: `src/domain/navigation/search.ts` (`SearchResult` con estado, ruta,
  coste, nodos expandidos, frontera máxima y explorados).
- Aplicación: `state.algorithm`, `state.pathStatus`, `state.explored`.
- Presentación: `src/game/presentation/levelView.ts` (`drawPath`).