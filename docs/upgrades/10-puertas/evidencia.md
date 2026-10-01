---
id: upgrade-10-puertas-evidencia
titulo: Upgrade 10 - Evidencia
tipo: evidencia
audiencia: estudiante
acceso: publico
version: 2
---

# Upgrade 10 - Evidencia

- Criterio validado: `docs/upgrades/10-puertas/spec.md`.
- Versión: rama `main`, commit base `ae98e1a`.
- Archivo de pruebas: `tests/environment/doors.test.ts`, 16 casos.

## Automatizado

| Caso | Método | Comando | Resultado | Evidencia |
|---|---|---|---|---|
| Una puerta que recorta un muro se acepta | automatizado | `npm run validate` | aprobado | `tests/environment/doors.test.ts` |
| Una puerta que no recorta muro se rechaza | automatizado | `npm run validate` | aprobado | `tests/environment/doors.test.ts` |
| Identificadores duplicados se rechazan | automatizado | `npm run validate` | aprobado | `tests/environment/doors.test.ts` |
| Una puerta fuera de la cuadrícula se rechaza | automatizado | `npm run validate` | aprobado | `tests/environment/doors.test.ts` |
| Tiempos no positivos se rechazan | automatizado | `npm run validate` | aprobado | `tests/environment/doors.test.ts` |
| Cerrada bloquea la celda y abierta la libera | automatizado | `npm run validate` | aprobado | `tests/environment/doors.test.ts` |
| Una puerta abierta libera su celda aunque el mapa la declare muro | automatizado | `npm run validate` | aprobado | `tests/environment/doors.test.ts` |
| Una celda de puerta fuera de la cuadrícula se rechaza | automatizado | `npm run validate` | aprobado | `tests/environment/doors.test.ts` |
| Estado inicial y tiempo restante declarados | automatizado | `npm run validate` | aprobado | `tests/environment/doors.test.ts` |
| El ciclo automático cierra y reabre | automatizado | `npm run validate` | aprobado | `tests/environment/doors.test.ts` |
| Sin cambios mientras el temporizador corre | automatizado | `npm run validate` | aprobado | `tests/environment/doors.test.ts` |
| Delta negativo se rechaza | automatizado | `npm run validate` | aprobado | `tests/environment/doors.test.ts` |
| La persiana espera a una persecución | automatizado | `npm run validate` | aprobado | `tests/environment/doors.test.ts` |
| Abre con `requestShutter` y cierra al vencer | automatizado | `npm run validate` | aprobado | `tests/environment/doors.test.ts` |
| `holdShutter` la mantiene abierta 5000 ms | automatizado | `npm run validate` | aprobado | `tests/environment/doors.test.ts` |
| La alternancia del operador conserva el identificador y tolera ids desconocidos | automatizado | `npm run validate` | aprobado | `tests/environment/doors.test.ts` |
| Abrir una puerta cambia la ruta calculada | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |
| El clic en la celda de la puerta no crea destino | automatizado | `npm run validate` | aprobado | `tests/application/guardSimulation.test.ts` |

## Manual

Estas comprobaciones **no se han ejecutado**. El proyecto no tiene automatizacion de navegador y esta sesion no abrio la ventana de juego, asi que la columna Resultado queda como pendiente en lugar de afirmar una verificacion que nadie realizo.

| Caso | Pasos | Resultado | Evidencia |
|---|---|---|---|
| Abrir y cerrar con clic | Clic sobre la hoja de una puerta | La hoja cambia y la ruta se recalcula | Pendiente |
| Persiana como atajo | Provocar una persecución | La persiana se abre y se marca en la escena | Pendiente |
| Persiana retenida en búsqueda | Romper la visión y observar | La persiana sigue abierta mientras el guardia busca | Pendiente |
| Ruta cerrada | Colocarse de modo que la ruta corte una puerta cerrada | Se registra `blocked-route` y el guardia salta de punto | Pendiente |

## Resultado de validación

```
Test Files  17 passed (17)
Tests  219 passed (219)
built in 5.21s
```

## Límites

- No automatizado: la hoja de la puerta, su marco y la marca `cerrada` o
  `persiana` que dibuja `drawDoors`.
- No validado: el equilibrio entre puertas abiertas y cerradas para alargar
  la ronda. Ajuste pendiente con estudiantes.