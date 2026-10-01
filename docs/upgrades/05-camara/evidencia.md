---
id: upgrade-05-camara-evidencia
titulo: Upgrade 05 - Evidencia
tipo: evidencia
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 05 - Evidencia

- Criterio validado: `docs/upgrades/05-camara/spec.md`.
- Versión: rama `main`, commit base `ae98e1a`.

## Automatizado

| Caso | Método | Comando | Resultado | Evidencia |
|---|---|---|---|---|
| Los impactos los decide la simulación | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |
| El nivel de alerta es continuo y observable | automatizado | `npm run validate` | aprobado | `tests/behavior/alertMeter.test.ts` |
| El umbral de alerta emite un único evento | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |
| La ronda congelada no vuelve a emitir impactos | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |

## Manual

Estas comprobaciones **no se han ejecutado**. El proyecto no tiene automatizacion de navegador y esta sesion no abrio la ventana de juego, asi que la columna Resultado queda como pendiente en lugar de afirmar una verificacion que nadie realizo.

| Caso | Pasos | Resultado | Evidencia |
|---|---|---|---|
| Acercamiento en persecución | Provocar visión confirmada | El guardia se enlarge y la cámara lo sigue | Pendiente |
| Retroceso al relajar | Romper la visión y esperar la búsqueda | El encuadre vuelve a la vista completa | Pendiente |
| Cada impacto se siente distinto | Provocar confirmación, captura y extracción | Cambian sacudida, color y rótulo | Pendiente |
| Tinte de alerta continuo | Acercarse al cono sin ser visto | El borde de pantalla vira antes de la persecución | Pendiente |

## Resultado de validación

```
Test Files  17 passed (17)
Tests  219 passed (219)
built in 5.21s
```

## Límites

- No automatizado: encuadre, sacudida y destello. Requieren navegador.
- No validado: accesibilidad del destello de pantalla para personas sensibles
  a contraste. Deuda conocida para H6.