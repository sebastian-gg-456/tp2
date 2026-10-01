---
id: upgrade-01-patrulla-pausas-evidencia
titulo: Upgrade 01 - Evidencia
tipo: evidencia
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 01 - Evidencia

- Criterio validado: `docs/upgrades/01-patrulla-pausas-mirada/spec.md`.
- Versión: rama `main`, commit base `ae98e1a`.
- Entorno: Windows 11, Node 22 o superior, npm, Vitest 4, TypeScript estricto.

## Automatizado

| Caso | Método | Comando | Resultado | Evidencia |
|---|---|---|---|---|
| Ruta vacía se rechaza | automatizado | `npm run validate` | aprobado | `tests/behavior/patrol.test.ts` |
| Índice inicial fuera de rango se rechaza | automatizado | `npm run validate` | aprobado | `tests/behavior/patrol.test.ts` |
| Pausa arranca al llegar y se reanuda al vencer | automatizado | `npm run validate` | aprobado | `tests/behavior/patrol.test.ts` |
| Punto con pausa cero reanuda en el mismo tick | automatizado | `npm run validate` | aprobado | `tests/behavior/patrol.test.ts` |
| La ruta envuelve y cuenta vueltas | automatizado | `npm run validate` | aprobado | `tests/behavior/patrol.test.ts` |
| Mirada sigue la dirección de marcha | automatizado | `npm run validate` | aprobado | `tests/behavior/patrol.test.ts` |
| Barrido recorre los grados y vuelve al extremo | automatizado | `npm run validate` | aprobado | `tests/behavior/patrol.test.ts` |
| Punto sin barrido mantiene la dirección de llegada | automatizado | `npm run validate` | aprobado | `tests/behavior/patrol.test.ts` |
| La simulación registra llegada, pausa y reanudación | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |
| El guardia no se mueve durante la pausa | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |
| La mirada barre durante la pausa | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |

## Manual

Estas comprobaciones **no se han ejecutado**. El proyecto no tiene automatizacion de navegador y esta sesion no abrio la ventana de juego, asi que la columna Resultado queda como pendiente en lugar de afirmar una verificacion que nadie realizo.

| Caso | Pasos | Resultado | Evidencia |
|---|---|---|---|
| Lectura del ritmo | Iniciar la ronda y observar los seis puntos | Se perciben pausas largas en cuatro puntos y pasos rápidos en dos | Pendiente |
| Compuertas del barrido | Quedarse quieto frente a un punto con barrido | El cono recorre el arco y vuelve; la diferencia con el estado anterior es evidente | Pendiente |

## Resultado de validación

```
Test Files  17 passed (17)
Tests  219 passed (219)
built in 5.16s
```

## Límites

- No validado: la percepción subjetiva de justicia del ritmo. Requiere sesiones
  de juego con estudiantes, fuera del alcance de una corrida automatizada.
- No validado: comportamiento con pausas en móvil o con pérdida de foco, que
  depende del navegador y no del dominio.