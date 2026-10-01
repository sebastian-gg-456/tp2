---
id: upgrade-indice
titulo: Upgrades de H4
tipo: indice
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrades de H4

Los diez upgrades son el trabajo de comportamiento que acompaña a la máquina
de estados del guardia. Cada uno tiene su propia carpeta con tres documentos:
qué se pidió, cómo se construyó y cómo se comprobó.

| # | Upgrade | Documentos | Pruebas principales |
|---|---|---|---|
| 01 | Patrulla con pausas y mirada direccional | [spec](01-patrulla-pausas-mirada/spec.md) · [plan](01-patrulla-pausas-mirada/plan.md) · [evidencia](01-patrulla-pausas-mirada/evidencia.md) | `tests/behavior/patrol.test.ts` |
| 02 | Cono de visión visible y reactivo | [spec](02-cono-vision/spec.md) · [plan](02-cono-vision/plan.md) · [evidencia](02-cono-vision/evidencia.md) | `tests/perception/perception.test.ts` |
| 03 | Animaciones por estado y transición | [spec](03-animaciones/spec.md) · [plan](03-animaciones/plan.md) · [evidencia](03-animaciones/evidencia.md) | `tests/behavior/stateMachine.test.ts` |
| 04 | Trazabilidad de navegación | [spec](04-trazabilidad/spec.md) · [plan](04-trazabilidad/plan.md) · [evidencia](04-trazabilidad/evidencia.md) | `tests/navigation/search.test.ts` |
| 05 | Encuadre útil y cámara de tensión | [spec](05-camara/spec.md) · [plan](05-camara/plan.md) · [evidencia](05-camara/evidencia.md) | `tests/behavior/alertMeter.test.ts` |
| 06 | Cobertura y ruptura de línea de visión | [spec](06-cobertura/spec.md) · [plan](06-cobertura/plan.md) · [evidencia](06-cobertura/evidencia.md) | `tests/behavior/cover.test.ts` |
| 07 | Distractores sonoros interactivos | [spec](07-distractores/spec.md) · [plan](07-distractores/plan.md) · [evidencia](07-distractores/evidencia.md) | `tests/world/distractors.test.ts` |
| 08 | Medidor de alerta | [spec](08-medidor-alerta/spec.md) · [plan](08-medidor-alerta/plan.md) · [evidencia](08-medidor-alerta/evidencia.md) | `tests/behavior/alertMeter.test.ts` |
| 09 | Escape de último momento | [spec](09-ultimo-momento/spec.md) · [plan](09-ultimo-momento/plan.md) · [evidencia](09-ultimo-momento/evidencia.md) | `tests/behavior/lastMoment.test.ts` |
| 10 | Puertas, persiana y atajos | [spec](10-puertas/spec.md) · [plan](10-puertas/plan.md) · [evidencia](10-puertas/evidencia.md) | `tests/environment/doors.test.ts` |

## Cómo está escrita cada carpeta

- **spec.md** — el problema, el objetivo, el alcance, lo que queda fuera y los
  criterios de aceptación. Es el contrato.
- **plan.md** — el orden de implementación, las decisiones tomadas y las
  alternativas descartadas. Incluye los defectos reales encontrados.
- **evidencia.md** — qué se comprobó con `npm run validate`, qué se comprobó a
  mano y qué sigue sin validarse.

## Nota sobre la evidencia

Los upgrades 02, 03, 04, 05 y parte del 06 tienen componente de presentación.
Las primitivas de Phaser no se cubren con pruebas unitarias: se documentan
como comprobación manual en la ventana de juego, y el dato que sí importa, la
geometría o la decisión, sí está probado en el dominio.

## Contexto

- [GDD](../GDD.md)
- [Cómo funciona](../como-funciona.md)
- [H4: máquina de estados](../h4-maquina-estados.md)
- [Validación H4 y upgrades](../evidencias/h4-validacion.md)