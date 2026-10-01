---
id: upgrade-06-cobertura-evidencia
titulo: Upgrade 06 - Evidencia
tipo: evidencia
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 06 - Evidencia

- Criterio validado: `docs/upgrades/06-cobertura/spec.md`.
- Versión: rama `main`, commit base `ae98e1a`.

## Automatizado

| Caso | Método | Comando | Resultado | Evidencia |
|---|---|---|---|---|
| La calidad mide la fracción de lados bloqueados | automatizado | `npm run validate` | aprobado | `tests/behavior/cover.test.ts` |
| Un muro tiene calidad cero | automatizado | `npm run validate` | aprobado | `tests/behavior/cover.test.ts` |
| El umbral identifica la cobertura | automatizado | `npm run validate` | aprobado | `tests/behavior/cover.test.ts` |
| La colección excluye el origen y ordena por cercanía | automatizado | `npm run validate` | aprobado | `tests/behavior/cover.test.ts` |
| Oculto exige cobertura y rotura de visión | automatizado | `npm run validate` | aprobado | `tests/behavior/cover.test.ts` |
| Expuesto con visión no está oculto | automatizado | `npm run validate` | aprobado | `tests/behavior/cover.test.ts` |
| Sin cobertura la distancia es infinita | automatizado | `npm run validate` | aprobado | `tests/behavior/cover.test.ts` |
| La oclusión coincide entre perceción y feedback | automatizado | `npm run validate` | aprobado | `tests/perception/occlusion.test.ts` |
| Radio negativo se rechaza | automatizado | `npm run validate` | aprobado | `tests/behavior/cover.test.ts` |

## Manual

Estas comprobaciones **no se han ejecutado**. El proyecto no tiene automatizacion de navegador y esta sesion no abrio la ventana de juego, asi que la columna Resultado queda como pendiente en lugar de afirmar una verificacion que nadie realizo.

| Caso | Pasos | Resultado | Evidencia |
|---|---|---|---|
| Realce de cobertura | Ponerse en un nicho mientras el guardia mira de lejos | Las celdas cercanas se marcan y la propia se resalta | Pendiente |
| Cobertura que no oculta | Ponerse en una celda con línea de visión directa | No se resalta la celda aunque haya muro al lado | Pendiente |

## Resultado de validación

```
Test Files  17 passed (17)
Tests  219 passed (219)
built in 5.21s
```

## Límites

- No validado: si el umbral 0.75 produce decisiones de sigilo interesantes en
  el mapa concreto. Depende de sesiones de juego con estudiantes.
- No automatizado: el realce visual.