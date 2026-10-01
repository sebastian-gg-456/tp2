---
id: upgrade-07-distractores-plan
titulo: Upgrade 07 - Plan de trabajo
tipo: plan
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 07 - Plan de trabajo

## Orden de implementación

1. **Trayectoria pura** — `createDistraction` y `advanceDistraction` viven en
   `domain/world/distractors.ts` porque su forma no depende de la ronda:
   posición, dirección normalizada, arco senoidal y gravedad lineal.
   `defaultDistractionSpec()` da los valores afinados del nivel.
2. **Máquina de tres estados** — `flying` → `exploding` → `done`. Al explotar
   se congela la posición en el punto de impacto y se emite el evento sonoro.
3. **Depósito de distractores** — `application/simulation/distractors.ts` con
   `throwDistraction`, `updateDistractors` y `impactWorldPoint`, más un límite
   de activos simultáneos.
4. **Predicción de impacto** — `predictImpact` calcula la celda de llegada con
   el mismo modelo de la trayectoria y la pasa por `isInside`. Si la celda es
   de un muro se usa su centro, y si está fuera del mapa se rechaza.
5. **Percepción con varios sonidos** — `perceptionSimulation.ts` sustituye el
   `soundEvent` único de H3 por `soundEvents` con tope `MAX_SOUND_EVENTS = 4`,
   `heardSounds` (todo lo audible en este tick) y `closestSound` (el más
   cercano, que es el destino de investigación más informativo).
6. **Integración** — etapas 2 y 3 de `guardSimulation.ts`: la ruido del jugador
   se inyecta como evento de sonido, y cada aterrizaje genera otro.
7. **Presentación** — marca de carga con barra de tiempo, punto de impacto y
   anillo de radio de ruido que se desvanece.

## Decisiones

- **El sonido no se atenúa con distancia dentro de la aplicación**: cada
  evento trae su propio radio. Así una piedra cerca suena más fuerte que una
  lejos, sin una fórmula global de atenuación.
- **El log se ordena por `emittedAtMs` y se recorta por antigüedad**, no por
  cantidad de muestreos. Un solo `slice(-MAX)` da comportamiento determinista
  y barato.
- **La predicción vive en la aplicación, no en la escena.** La escena solo
  envía la dirección apuntada; la simulación decide si el tiro es legal.
- **`stone-rejected` es telemetría explícita.** El jugador tiene que poder
  entender por qué su lanzamiento no ocurrió.

## Alternativas descartadas

- **Rebote con colisión por celda**: multiplica los casos de prueba sin aportar
  una decisión nueva; la dirección ya se decide en la ruta.
- **Reemplazar el ruido del jugador por piedras**: quitaría la opción de
  cubrirse con ruido y volvería el ruido un recurso único. Mantener ambas
  fuentes es lo que permite combinar señuelo y distracción.