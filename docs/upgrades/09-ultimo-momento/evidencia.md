---
id: upgrade-09-ultimo-momento-evidencia
titulo: Upgrade 09 - Evidencia
tipo: evidencia
audiencia: estudiante
acceso: publico
version: 2
---

# Upgrade 09 - Evidencia

- Criterio validado: `docs/upgrades/09-ultimo-momento/spec.md`.
- Versión: rama `main`, commit base `ae98e1a`.
- Archivo de pruebas: `tests/behavior/lastMoment.test.ts`, 11 casos.

## Automatizado

| Caso | Método | Comando | Resultado | Evidencia |
|---|---|---|---|---|
| Arranca desarmado | automatizado | `npm run validate` | aprobado | `tests/behavior/lastMoment.test.ts` |
| Se arma si el jugador entra en la ventana persiguiendo | automatizado | `npm run validate` | aprobado | `tests/behavior/lastMoment.test.ts` |
| No se arma fuera de la ventana | automatizado | `npm run validate` | aprobado | `tests/behavior/lastMoment.test.ts` |
| No se arma si el guardia no persigue | automatizado | `npm run validate` | aprobado | `tests/behavior/lastMoment.test.ts` |
| Registra el escape al romperse la visión dentro | automatizado | `npm run validate` | aprobado | `tests/behavior/lastMoment.test.ts` |
| Cuenta un solo escape en varios frames a ciegas | automatizado | `npm run validate` | aprobado | `tests/behavior/lastMoment.test.ts` |
| Más alivio cuanto más cerca estaba la captura | automatizado | `npm run validate` | aprobado | `tests/behavior/lastMoment.test.ts` |
| Salir de la ventana con visión no cuenta escape | automatizado | `npm run validate` | aprobado | `tests/behavior/lastMoment.test.ts` |
| Terminar la persecución no cuenta escape | automatizado | `npm run validate` | aprobado | `tests/behavior/lastMoment.test.ts` |
| Sigue la distancia mientras la ventana está abierta | automatizado | `npm run validate` | aprobado | `tests/behavior/lastMoment.test.ts` |
| Rechaza una ventana menor que la captura | automatizado | `npm run validate` | aprobado | `tests/behavior/lastMoment.test.ts` |
| El escape del tick llega a la FSM y al impacto | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |

## Manual

Estas comprobaciones **no se han ejecutado**. El proyecto no tiene automatizacion de navegador y esta sesion no abrio la ventana de juego, asi que la columna Resultado queda como pendiente en lugar de afirmar una verificacion que nadie realizo.

| Caso | Pasos | Resultado | Evidencia |
|---|---|---|---|
| Escape real | Romper la visión cuando el guardia está encima | Destello corto y el guardia pasa a buscar, no a perseguir | Pendiente |
| Huida sin rotura de visión | Correr hacia fuera del cono sin ocultarse | No hay destello de escape | Pendiente |

## Resultado de validación

```
Test Files  17 passed (17)
Tests  219 passed (219)
built in 5.23s
```

## Límites

- No automatizado: el destello y su intensidad proporcional a `relief`.
- No validado: si 78 px es la ventana que produce tensión y no frustration.
  Ajuste pendiente con estudiantes.