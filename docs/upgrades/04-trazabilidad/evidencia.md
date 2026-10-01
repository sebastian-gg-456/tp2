---
id: upgrade-04-trazabilidad-evidencia
titulo: Upgrade 04 - Evidencia
tipo: evidencia
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 04 - Evidencia

- Criterio validado: `docs/upgrades/04-trazabilidad/spec.md`.
- Versión: rama `main`, commit base `ae98e1a`.

## Automatizado

| Caso | Método | Comando | Resultado | Evidencia |
|---|---|---|---|---|
| Estado, coste y métricas de la ruta | automatizado | `npm run validate` | aprobado | `tests/navigation/search.test.ts` |
| A* encuentra ruta y BFS también | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |
| El algoritmo alterna con la orden del operador | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |
| El cambio queda en telemetría | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |
| Destino inalcanzible falla de forma explícita | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |
| Una ruta nunca contiene celdas bloqueadas | automatizado | `npm run validate` | aprobado | `tests/navigation/search.test.ts` |

## Manual

Estas comprobaciones **no se han ejecutado**. El proyecto no tiene automatizacion de navegador y esta sesion no abrio la ventana de juego, asi que la columna Resultado queda como pendiente en lugar de afirmar una verificacion que nadie realizo.

| Caso | Pasos | Resultado | Evidencia |
|---|---|---|---|
| Comparar BFS y A* | Pulsar Espacio mientras el guardia investiga | Se ve la ruta y las celdas exploradas de cada algoritmo | Pendiente |
| Jerarquía visual | Provocar una persecución con puertas cerradas | La ruta se lee por encima de las puertas y la cobertura | Pendiente |
| Destino manual | Clic en una celda lejana | La ruta gira y el destino se marca en ámbar | Pendiente |

## Resultado de validación

```
Test Files  17 passed (17)
Tests  219 passed (219)
built in 5.21s
```

## Límites

- No automatizado: el orden de las capas en pantalla. Requiere navegador.
- No validado: lectura de las métricas con mapa saturado en una ronda larga.