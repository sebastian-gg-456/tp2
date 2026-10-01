---
id: laboratorio-guardia-de-sigilo-h4-maquina-estados
titulo: H4 - Maquina de estados del guardia
tipo: referencia
audiencia: estudiante
acceso: publico
version: 1
---

# H4 - Máquina de estados del guardia

Implementación: `src/domain/behavior/stateMachine.ts`. La función `decide` es
**pura**: recibe todo lo que el guardia sabe y devuelve la próxima conducta, el
evento que la provoca y la causa observable. No conoce Phaser, ni rutas, ni
reloj de cuadro.

## 1. Estados

| Estado | Qué hace | Sale cuando |
|---|---|---|
| `patrol` | Recorre la ruta cíclica con pausas y barrido de mirada | Ve al jugador, oye algo, o su destino es inaccesible |
| `investigate` | Va al origen de un sonido o a la última posición conocida | Llega y no ve nada, aparece otro sonido más importante, o no puede llegar |
| `chase` | Persigue la última posición conocida con visión confirmada | Pierde la visión o queda a distancia de captura |
| `search` | Revisa un plan acotado alrededor de la última posición conocida | Agota el plan, vence la ventana o un punto es inalcanzable |
| `return` | Vuelve a un punto de patrulla válido | Llega y retoma la patrulla |
| `captured` | Terminal: el guardia deja de navegar | No hay salida |

## 2. Prioridades

El orden de `decide` es la especificación de la máquina:

1. **Captura.** Solo desde `chase`, con visión activa y distancia ≤ radio
   (20 px). Si el estado ya es `captured`, no hay salida: la captura es
   terminal y el resto de la simulación se congela.
2. **Visión confirmada.** `visionVisible` en forma continua durante
   `confirmMs` (180 ms).
   Entra a `chase`, usa la última posición conocida como objetivo y **pide
   abrir la persiana** (consecuencia de la persecución confirmada).
3. **Rotura de visión durante la persecución.** Pasa a `search` conservando la
   última posición conocida, con el evento `sight-lost` o, si se rompió dentro
   de la ventana de último momento, `last-moment-escape`.
4. **Sonido audible.** Pasa a `investigate` apuntando al origen. Si ya
   investigaba ese mismo origen, mantiene destino y no repite el evento.
5. **Ciclo de la conducta en curso.** Cada estado tiene su regla de salida.

## 3. Tabla de eventos

| Evento | Cuándo | Destino |
|---|---|---|
| `patrol-arrived` | Llegó a un punto de ruta | `patrol` (dispara pausa) |
| `sound-heard` | Sonido audible con celda de origen | `investigate` |
| `sight-confirmed` | Visión confirmada 180 ms | `chase` |
| `sight-lost` | Pérdida de visión en persecución | `search` |
| `last-moment-escape` | Rotura dentro de la ventana de 78 px | `search` |
| `search-started` | Llegó al origen del sonido y no ve nada | `search` |
| `search-point-reached` | Alcanzó un punto y quedan más | `search` |
| `search-expired` | Ventana vencida o plan agotado | `return` |
| `return-started` | Regresó al punto de patrulla | `patrol` |
| `destination-unreachable` | Destino inalcanzable | según estado |
| `captured` | Distancia de captura durante `chase` | `captured` |

## 4. Invariantes

- Un guardia `captured` no navega, no percibe y no cambia de estado.
- La última posición conocida solo cambia ante una percepción válida.
- Una ruta nunca contiene celdas bloqueadas (incluidas puertas cerradas).
- Regresar a patrulla conduce a un punto válido; si el punto es inalcanzable
  se salta al siguiente y se registra el motivo.
- El estado informado coincide con el comportamiento ejecutado.

## 5. Relación con los upgrades

| Upgrade | Cómo apoya a la FSM |
|---|---|
| 1 Patrulla con pausas | `patrol-arrived` dispara pausa y barrido |
| 4 Trazabilidad | La ruta y los nodos explorados hacen visible el `goalReason` |
| 8 Medidor de alerta | La banda `alert` acelera la persecución y habilita atajos |
| 9 Último momento | `last-moment-escape` distingue una huida de un escape real |
| 10 Puertas | `destination-unreachable` y `blocked-route` reconducen ante rutas cerradas |

## 6. Pruebas

`tests/behavior/stateMachine.test.ts` cubre los seis estados, las diez
transiciones y los tres casos límite (captura sin visión, captura fuera de
radio, origen de sonido ausente). `tests/application/guardSimulation.test.ts`
verifica la ronda completa: confirma visión, busca tras perderla, construye el
plan, regresa a patrulla, captura y extrae.