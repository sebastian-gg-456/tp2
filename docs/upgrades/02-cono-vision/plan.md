---
id: upgrade-02-cono-vision-plan
titulo: Upgrade 02 - Plan de trabajo
tipo: plan
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 02 - Plan de trabajo

## Orden de implementación

1. **Entrada plana** — `VisionConeInput` con la posición, la orientación, el
   alcance, el ángulo de visión, el nivel de alerta y si el objetivo está
   visible.
2. **Geometría** — el cono se construye como triángulo con vértice en el
   guardia y dos extremos a `range` distancia, separados por
   `fieldOfViewRadians`. Se dibuja con un `Graphics` a profundidad baja.
3. **Reacción al estado** — la opacidad del relleno y el grosor del borde crecen
   con `alertLevel`, y hay un extra fijo cuando `visible` es verdadero.
4. **Barrido de pausa** — como la mirada se interpola en el render, el cono
   del upgrade 01 se ve aunque el guardia esté quieto durante la pausa.
5. **Aislamiento** — la vista no guarda estado propio; `update` recibe el
   input y redibuja. Esto permite borrarla y reconstruirla sin cambiar la
   simulación.

## Decisiones

- **Triángulo, no arco con hueco.** Es más barato y coincide exactamente con
  la prueba de cono del dominio, que es angular.
- **Sin sombras parciales.** El dominio decide binario; dibujar más invita a
  que el jugador lea precisión que el sistema no tiene.
- **Un solo `Graphics` reutilizado.** Sin objetos por frame, sin fuga de
  memoria en una ronda larga.

## Alternativas descartadas

- **Sombra proyectada por muros**: leería la oclusión correctamente pero exige
  recalcular la geometría en el render y contradice "la presentación no
  calcula". Se sustituyó por el realce de cobertura del upgrade 06.
- **Cono pulsante con el tiempo**: introduce movimiento falso que el jugador
  puede leer como señal de percepción.