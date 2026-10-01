---
id: upgrade-03-animaciones-evidencia
titulo: Upgrade 03 - Evidencia
tipo: evidencia
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 03 - Evidencia

- Criterio validado: `docs/upgrades/03-animaciones/spec.md`.
- Versión: rama `main`, commit base `ae98e1a`.

## Automatizado

| Caso | Método | Comando | Resultado | Evidencia |
|---|---|---|---|---|
| Cada estado produce una transición observable | automatizado | `npm run validate` | aprobado | `tests/behavior/stateMachine.test.ts` |
| La velocidad reportada distingue quieto de en marcha | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |
| La captura congela el cuerpo | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |
| La emisión de impactos viene de la simulación | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |

## Manual

Estas comprobaciones **no se han ejecutado**. El proyecto no tiene automatizacion de navegador y esta sesion no abrio la ventana de juego, asi que la columna Resultado queda como pendiente en lugar de afirmar una verificacion que nadie realizo.

| Caso | Pasos | Resultado | Evidencia |
|---|---|---|---|
| Diferencia entre marchar y estar quieto | Quedarse quieto en una pausa de patrulla | La animación se congela, no sigue en el sitio | Pendiente |
| Destello de confirmación | Provocar visión confirmada | Destello breve y cambio de color a rojo de persecución | Pendiente |
| Postura de capturado | Ser capturado | El cuerpo se detiene y cambia de escala | Pendiente |
| Interpolación visible | Correr en diagonal | No hay saltos entre celdas | Pendiente |

## Resultado de validación

```
Test Files  17 passed (17)
Tests  219 passed (219)
built in 5.21s
```

## Límites

- No validado: valoración estética de las primitivas. Es una escena de
  laboratorio, no un producto de arte.
- No automatizado: la interpolación visual requiere un navegador.