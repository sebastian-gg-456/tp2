---
id: upgrade-09-ultimo-momento-plan
titulo: Upgrade 09 - Plan de trabajo
tipo: plan
audiencia: estudiante
acceso: publico
version: 2
---

# Upgrade 09 - Plan de trabajo

## Orden de implementación

1. **Estado explícito** — `LastMomentState` con `armed`, `armedAtMs`,
   `armedDistancePx`, `escapes` y `lastEscape`. Se hace explícito en vez de
   derivarlo, porque "armado" y "dentro de la ventana" son cosas distintas y una
   de ellas debe sobrevivir al frame en que se consume.
2. **Función pura de tick** — `updateLastMoment(state, input)` devuelve el estado
   siguiente. El escape se detecta por el incremento de `escapes` y por
   `lastEscape`, de modo que el llamador no tiene que comparar objetos ni
   mantener un booleano aparte.
3. **Radio de la ventana** — `lastMomentRadius` (78 px) debe ser mayor que
   `captureRadius` (20 px) y la función lo rechaza si no. Sin esa guarda, una
   ventana más pequeña que la captura sería una ventana que nunca se abre.
4. **Geometría, no reloj** — la ventana se abre por distancia y se cierra por
   distancia. No hay `graceMs`: un temporizador haría que el resultado dependiera
   de la tasa de frames, y "se me vio y salí corriendo" es una decisión
   espacial.
5. **Desarme sin castigo** — si el jugador sale del radio o termina la
   persecución, la ventana se cierra con `escapes` intacto. Castigar la huida
   haría que la única forma de jugar fuese quedarse quieto.
6. **Consumo en el mismo frame** — el escape se consume y se desarma en el mismo
   tick, y el guardián lo lee del resultado de ese tick. Leer `armed` en el
   frame siguiente era la causa del defecto original.
7. **Intensidad de presentación** — `relief` viaja al impacto para que el
   destello sea proporcional a lo cerca que estuvo la captura.

## Defecto encontrado y corregido

La primera versión llevaba la decisión al frame siguiente: `armed` se ponía
`true` al romperse la visión y la FSM leía `armed` en el tick posterior, cuando
ya valía `false`. El escape nunca se emitía y la mecánica quedaba muda sin que
ninguna prueba lo delatara, porque las pruebas del módulo eran correctas: el
fallo estaba en el orden de las etapas de la ronda, no en el módulo. Se corrigió
leyendo el resultado del tick y se añadió
`tests/behavior/lastMoment.test.ts`, que incluye el caso de varios frames a
ciegas seguidos para impedir la regresión.

## Alternativas descartadas

- **Ventana de gracia en milisegundos**: ataría el resultado a la tasa de
  frames y daría escapes distintos en un monitor de 60 Hz y en uno de 144 Hz.
- **Contar como escape salir del radio con visión intacta**: premia correr, no
  esconderse, y contradice el nombre de la mecánica.
- **Rebajar la alerta a `calm` al escapar**: premia la huida sin coste. La
  sospecha se mantiene; lo que cambia es que el guardia deja de perseguir.