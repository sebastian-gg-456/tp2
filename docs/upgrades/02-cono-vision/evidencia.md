---
id: upgrade-02-cono-vision-evidencia
titulo: Upgrade 02 - Evidencia
tipo: evidencia
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 02 - Evidencia

- Criterio validado: `docs/upgrades/02-cono-vision/spec.md`.
- Versión: rama `main`, commit base `ae98e1a`.
- Entorno: Windows 11, Node 22 o superior, npm, Vitest 4.

## Automatizado

La geometría del cono vive en el dominio y ahí se prueba. La vista es
Phaser y no se cubre con pruebas unitarias: se valida a mano.

| Caso | Método | Comando | Resultado | Evidencia |
|---|---|---|---|---|
| Cono angular sin oclusión | automatizado | `npm run validate` | aprobado | `tests/perception/perception.test.ts` |
| Cono bloqueado por muro | automatizado | `npm run validate` | aprobado | `tests/perception/perception.test.ts` |
| Distancia máxima respetada | automatizado | `npm run validate` | aprobado | `tests/perception/perception.test.ts` |
| Oclusión coherente entre traceability y celdas | automatizado | `npm run validate` | aprobado | `tests/perception/occlusion.test.ts` |
| El cono se pinta con la mirada interpolada | manual | Iniciar la ronda y esperar a una pausa de patrulla | El cono barre aunque el guardia no se mueva | Pendiente |
| El cono se tiñe al subir la alerta | manual | Provocar sospecha cerca del guardia | El relleno vira de cian a ámbar | Pendiente |
| Realce al ver al jugador | manual | Entrar en el cono de visión | El relleno se densifica y el borde engorda | Pendiente |

## Resultado de validación

```
Test Files  17 passed (17)
Tests  219 passed (219)
built in 5.21s
```

## Límites

- No validado: la percepción del jugador sobre si el tinte es legible en un
  monitor de gama baja. Requiere prueba con estudiantes.
- No validado: el cono en dispositivos táctiles, fuera del alcance del
  laboratorio.