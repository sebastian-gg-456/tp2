---
id: upgrade-07-distractores-evidencia
titulo: Upgrade 07 - Evidencia
tipo: evidencia
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 07 - Evidencia

- Criterio validado: `docs/upgrades/07-distractores/spec.md`.
- Versión: rama `main`, commit base `ae98e1a`.

## Automatizado

| Caso | Método | Comando | Resultado | Evidencia |
|---|---|---|---|---|
| La piedra vuela a velocidad constante | automatizado | `npm run validate` | aprobado | `tests/world/distractors.test.ts` |
| Explota exactamente en el tiempo de vuelo | automatizado | `npm run validate` | aprobado | `tests/world/distractors.test.ts` |
| Aterriza en el punto predicho | automatizado | `npm run validate` | aprobado | `tests/world/distractors.test.ts` |
| El arco desaparece al impactar | automatizado | `npm run validate` | aprobado | `tests/world/distractors.test.ts` |
| Nunca se extrapola más allá del impacto | automatizado | `npm run validate` | aprobado | `tests/world/distractors.test.ts` |
| Dirección normalizada y caso nulo | automatizado | `npm run validate` | aprobado | `tests/world/distractors.test.ts` |
| Sonido expirado con memoria preservada | automatizado | `npm run validate` | aprobado | `tests/application/perceptionSimulation.test.ts` |
| Varios sonidos simultáneos y más cercano | automatizado | `npm run validate` | aprobado | `tests/application/perceptionSimulation.test.ts` |
| El log de sonidos está acotado | automatizado | `npm run validate` | aprobado | `tests/application/perceptionSimulation.test.ts` |
| El impacto genera sonido en la simulación | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |
| Un tiro fuera del mapa se rechaza | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |
| El guardia investiga un ruido cercano | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |

## Manual

Estas comprobaciones **no se han ejecutado**. El proyecto no tiene automatizacion de navegador y esta sesion no abrio la ventana de juego, asi que la columna Resultado queda como pendiente en lugar de afirmar una verificacion que nadie realizo.

| Caso | Pasos | Resultado | Evidencia |
|---|---|---|---|
| Lanzar piedra hacia el mouse | Pulsar 1 apuntando lejos del guardia | La piedra vuela, el anillo marca el ruido y el guardia se desvía | Pendiente |
| Dos piedras seguidas | Lanzar dos piedras con poca diferencia | Ambos anillos se ven y el guardia va al más cercano | Pendiente |
| Rechazo de tiro | Apuntar hacia el borde exterior del mapa | No hay piedra y el panel explica el rechazo | Pendiente |

## Resultado de validación

```
Test Files  17 passed (17)
Tests  219 passed (219)
built in 5.21s
```

## Límites

- No automatizado: la marca de carga, el arco y el anillo de ruido.
- No validado: el balance del radio de ruido (160 px para la piedra, 190 px
  para el ruido del jugador). Requiere ajuste con estudiantes.