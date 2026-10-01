---
id: laboratorio-evidencia-validacion-h4
titulo: Evidencia de validacion H4 y upgrades
tipo: referencia
audiencia: estudiante
acceso: publico
version: 1
---

# Evidencia de validación H4 y upgrades

- Fecha: 30 de septiembre de 2026.
- Entorno: Windows 11, Node.js 25.2.1, npm 11.6.2.
- Versión evaluada: rama `main`, commit base `ae98e1a`.
- Alcance: máquina de estados del guardia (H4) y los diez upgrades de
  comportamiento.

## Resultado

| Criterio | Método | Resultado |
|---|---|---|
| Tipos estrictos | `npm run typecheck` | Sin errores |
| Dominio y aplicación | `npm run test:run` | 219 pruebas aprobadas en 17 archivos |
| Producto web | `npm run build` | Compilación correcta en `dist/` |
| Integración completa | `npm run validate` | Tipos, pruebas y build aprobados |

Salida del comando de validación:

```
Test Files  17 passed (17)
Tests       219 passed (219)
built in 5.21s
```

Advertencia conocida del build: el paquete principal supera el umbral de
tamaño de Vite (1 548,48 kB minificado, 360,81 kB comprimido). No rompe la
ejecución y no se tapa con un ajuste de `chunkSizeWarningLimit` porque
ocultaría el dato.

## Cobertura por archivo

| Archivo | Casos | Qué cubre |
|---|---|---|
| `tests/application/guardSimulation.test.ts` | 38 | Ronda completa: FSM, alerta, rutas, puertas, distractores, cobertura, escape, captura y extracción |
| `tests/behavior/stateMachine.test.ts` | 33 | Transiciones, guardas, prioridades e invariantes |
| `tests/environment/doors.test.ts` | 16 | Ciclo de puertas, `holdShutter`, apertura forzada y mapa navegable |
| `tests/behavior/patrol.test.ts` | 15 | Ruta cíclica, pausas y barrido direccional |
| `tests/behavior/cover.test.ts` | 14 | Calidad de cobertura, colección alcanzable y condición de ocultamiento |
| `tests/world/distractors.test.ts` | 13 | Trayectoria de la piedra, impacto y límites |
| `tests/behavior/search.test.ts` | 12 | Búsqueda acotada y plan de puntos |
| `tests/perception/perception.test.ts` | 12 | Cono angular, distancia y oclusión |
| `tests/behavior/alertMeter.test.ts` | 11 | Pesos, decaimiento, saturación, bandas y umbral |
| `tests/behavior/lastMoment.test.ts` | 11 | Radio de escape, ventana de gracia y caso de orden |
| `tests/perception/occlusion.test.ts` | 8 | Traza compartida entre percepción y feedback |
| `tests/telemetry/telemetry.test.ts` | 7 | Registro de eventos con causa legible |
| `tests/navigation/pathFollower.test.ts` | 6 | Seguimiento de waypoints |
| `tests/navigation/search.test.ts` | 5 | BFS y A* con métricas |
| `tests/model/grid.test.ts` | 5 | Cuadrícula e índices |
| `tests/perception/memory.test.ts` | 5 | Última posición conocida y memoria |
| `tests/application/perceptionSimulation.test.ts` | 4 | Varios sonidos simultáneos y log acotado |

## Defectos reales encontrados y corregidos

| Defecto | Causa | Corrección | Prueba que lo cubre |
|---|---|---|---|
| La persiana se cerraba mientras se mantenía la orden | `holdShutter` compartía el ciclo de puertas | Función propia que fija el estado mientras dura la orden | `tests/environment/doors.test.ts` |
| La pausa de patrulla terminaba antes de tiempo | La pausa se recomputaba en vez de acumularse | La pausa persiste hasta consumir su duración | `tests/behavior/patrol.test.ts` |
| El escape de último momento nunca se emitía | `armed` se leía en el tick posterior, cuando ya valía `false` | `updateLastMoment` devuelve `escaped` en el mismo frame | `tests/behavior/lastMoment.test.ts` |
| La captura posterior a locomoción no emitía impacto | El evento se decidía antes de mover al guardia | Orden de etapas: locomoción antes que percepción | `tests/application/guardSimulation.test.ts` |
| El clic en una puerta creaba además un destino | El clic se resolvía solo como destino | La celda de puerta se resuelve primero como puerta | `tests/application/guardSimulation.test.ts` |
| Espacio no alternaba el algoritmo | El atajo se había perdido al añadir la escena | `toggleAlgorithm` reenviado a la simulación | `tests/application/guardSimulation.test.ts` |

## Comprobación manual pendiente

Los upgrades con componente de presentación (cono, animaciones, encuadre,
realce de cobertura, puertas y distractores) **no se han comprobado en la
ventana de juego**. El proyecto no tiene automatización de navegador y esta
sesión no abrió el juego, de modo que las tablas "Manual" de
`docs/upgrades/*/evidencia.md` describen pasos pendientes, no resultados
obtenidos. Lo único verificado de forma automatizada son los 219 casos de
prueba y la compilación.

Para cerrarlo hacen falta estas tres comprobaciones en un navegador:

| Comprobación | Qué demuestra | Método |
|---|---|---|
| Ronda completa jugable | BFS/A*, FSM, captura y extracción funcionan de extremo a extremo | `npm run dev` y jugar una ronda |
| Interruptores de la escena | Clic en puerta, 1/2/3 piedra, Q ruido, Espacio algoritmo, R reinicio | Pulsar cada tecla una vez |
| Tensión perceptible | Cono, barra de alerta, cámara y destellos se leen sin HUD | Mirar una persecución completa |

## Riesgo residual

- El balance de dificultad (umbral de alerta, decaimiento, radios de ruido y
  ventana de gracia) no está validado con estudiantes.
- El aviso de tamaño del paquete no se ha registrado como deuda técnica en
  un hito; conviene tratarlo en H6.
- Sin commit: los cambios están sin versionar y no se ha publicado nada.

## Documentos relacionados

- [GDD](../GDD.md)
- [Cómo funciona](../como-funciona.md)
- [H4: máquina de estados](../h4-maquina-estados.md)
- [Upgrades 01 a 10](../upgrades/README.md)
- [H3: validación](h3-validacion.md)