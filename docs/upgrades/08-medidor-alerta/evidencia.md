---
id: upgrade-08-medidor-alerta-evidencia
titulo: Upgrade 08 - Evidencia
tipo: evidencia
audiencia: estudiante
acceso: publico
version: 2
---

# Upgrade 08 - Evidencia

- Criterio validado: `docs/upgrades/08-medidor-alerta/spec.md`.
- Versión: rama `main`, commit base `ae98e1a`.
- Archivo de pruebas: `tests/behavior/alertMeter.test.ts`, 11 casos.

## Automatizado

| Caso | Método | Comando | Resultado | Evidencia |
|---|---|---|---|---|
| Arranca en calma y a cero | automatizado | `npm run validate` | aprobado | `tests/behavior/alertMeter.test.ts` |
| Sube mientras el guardia ve al jugador | automatizado | `npm run validate` | aprobado | `tests/behavior/alertMeter.test.ts` |
| Sube más rápido si el jugador está cerca | automatizado | `npm run validate` | aprobado | `tests/behavior/alertMeter.test.ts` |
| Un ruido salta al piso de sospecha | automatizado | `npm run validate` | aprobado | `tests/behavior/alertMeter.test.ts` |
| Nunca supera uno | automatizado | `npm run validate` | aprobado | `tests/behavior/alertMeter.test.ts` |
| No decae durante la ventana de gracia | automatizado | `npm run validate` | aprobado | `tests/behavior/alertMeter.test.ts` |
| Decae pasada la ventana | automatizado | `npm run validate` | aprobado | `tests/behavior/alertMeter.test.ts` |
| Decae más lento mientras busca | automatizado | `npm run validate` | aprobado | `tests/behavior/alertMeter.test.ts` |
| Conserva el pico para telemetría | automatizado | `npm run validate` | aprobado | `tests/behavior/alertMeter.test.ts` |
| La banda se resuelve del nivel | automatizado | `npm run validate` | aprobado | `tests/behavior/alertMeter.test.ts` |
| Tiempo inválido se rechaza | automatizado | `npm run validate` | aprobado | `tests/behavior/alertMeter.test.ts` |
| El nivel y la banda viajan en el estado de la ronda | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |

## Manual

Estas comprobaciones **no se han ejecutado**. El proyecto no tiene automatizacion de navegador y esta sesion no abrio la ventana de juego, asi que la columna Resultado queda como pendiente en lugar de afirmar una verificacion que nadie realizo.

| Caso | Pasos | Resultado | Evidencia |
|---|---|---|---|
| Barra y bandas | Caminar frente al cono sin cubrirse | La barra sube, cambia de color y de etiqueta | Pendiente |
| Recuperación | Ponerse en cobertura y esperar | La barra baja hasta `CALMO` | Pendiente |
| Sonido sin visión | Lanzar una piedra lejos y quedarse quieto | La barra sube al piso y se mantiene en sospecha | Pendiente |

## Resultado de validación

```
Test Files  17 passed (17)
Tests  219 passed (219)
built in 5.23s
```

## Límites

- No validado: si los valores por defecto (0,78 de ganancia visual, 0,16 de
  decaimiento, 1400 ms de gracia, 0,72 de umbral) producen una ronda de
  duración razonable. Ajuste pendiente con estudiantes.
- No automatizado: la barra, su color y la etiqueta.