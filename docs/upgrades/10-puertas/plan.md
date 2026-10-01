---
id: upgrade-10-puertas-plan
titulo: Upgrade 10 - Plan de trabajo
tipo: plan
audiencia: estudiante
acceso: publico
version: 2
---

# Upgrade 10 - Plan de trabajo

## Orden de implementación

1. **Identidad estable** — `DoorSpec.id` en lugar de `number`. Con índices, la
   segunda puerta del array no se distinguía de la primera en telemetría y
   cualquier reordenación del mapa rompía las referencias en silencio.
2. **Especificación validada al arrancar** — `validateDoorSpecs` rechaza
   identificadores vacíos o duplicados, puertas fuera de la cuadrícula, tiempos
   no positivos y, sobre todo, puertas que no recortan un muro real: una puerta
   que no cambia ninguna ruta es un error de diseño, no una puerta.
3. **Ciclo automático** — `advanceDoors` descuenta `remainingMs` y alterna
   `open` cuando llega a cero. Devuelve `changedIds` para que el llamador sepa
   qué cambió sin comparar arreglos.
4. **Persiana como caso especial** — `advanceDoors` recibe
   `{ requestShutter, holdShutter }`. La decisión de abrirla **no** vive en el
   dominio: la aplicación deduce `requestShutter` de `state === "chase"` y
   `holdShutter` de `search` o `return`. Así el atajo significa exactamente lo
   que significa la máquina de estados y el dominio no conoce la FSM.
5. **`holdShutter` repone el contador** — mientras dura la búsqueda, la
   persiana devuelve `remainingMs = closedMs` en cada tick. Sin esa reposición
   el temporizador vencería y cerraría la persiana en mitad de la búsqueda; fue
   el defecto real de la primera versión y es lo que cubre la prueba de 5000 ms.
6. **Alternancia del operador** — `toggleDoor(doors, id)` devuelve el mismo
   arreglo si el identificador no existe, de modo que un clic sobre una celda sin
   puerta es un no-op silencioso y no un error.
7. **Mapa navegable** — `composeNavigationMap(base, doors)` parte del mapa
   estático, libera siempre las celdas de puerta y vuelve a bloquear las que
   están cerradas. La navegación usa el mapa vigente en cada cálculo.
8. **Entrada del jugador** — el clic en `GameScene` se resuelve primero como
   puerta si la celda pertenece a una; si no, como destino manual. El orden
   importa: una celda de puerta adyacente es la opción más específica.

## Defecto encontrado y corregido

La persiana compartía temporizador con el resto del ciclo. Mantener
`holdShutter` no la mantenía abierta: el contador seguía corriendo y la
persiana se cerraba a mitad de la búsqueda, dejando al guardia encerrado. Se
corrigió repuyendo `closedMs` mientras dura la orden, y se añadió el caso de
`tests/environment/doors.test.ts` que mantiene la orden durante 5000 ms.

## Alternativas descartadas

- **Índices numéricos de puerta**: más simples de escribir, pero frágiles e
  ilegibles en telemetría.
- **Coste de paso en vez de bloqueo**: permite planificar por una puerta cerrada
  y produce rutas que el guardia no puede ejecutar. Bloquear es más honesto.
- **Abrir puertas con la misma tecla que el destino**: mezcla dos intenciones
  en una pulsación y hace el control menos legible.
- **Que la apertura de la persiana sea una orden del jugador**: el atajo es la
  consecuencia de una persecución, no una palanca. Si el jugador lo controlara,
  `holdShutter` no tendría sentido.