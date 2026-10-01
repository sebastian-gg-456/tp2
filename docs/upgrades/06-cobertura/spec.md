---
id: upgrade-06-cobertura
titulo: Upgrade 06 - Cobertura y ruptura de linea de vision
tipo: especificacion
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 06 - Cobertura y ruptura de línea de visión

## Problema

El nivel tenía muros, pero no una noción de cobertura. El jugador no tenía
forma de razonar sobre "dónde me escondo": la oclusión era un sí o no
binario, sin la noción de calidad ni de distancia a la siguiente opción.

## Objetivo

Derivar la cobertura de la geometría del mapa —sin estado oculto— y
comunicar tanto las opciones disponibles como cuál está realmente cortando la
línea de visión del guardia ahora mismo.

## Alcance

- Función pura `coverQuality` que mide la fracción de lados cardenales bloqueados.
- Umbral de cobertura en `COVER_THRESHOLD` (0.75, es decir tres de cuatro lados).
- `collectCover` lista las celdas de cobertura alcanzables en un radio, ordenadas
  por cercanía.
- `assessCover` combina tres preguntas: ¿el jugador está en cobertura?, ¿la
  línea de visión está rota?, y por lo tanto ¿está oculto?
- Realce en la escena de las celdas de cobertura alcanzables y de la celda que
  efectivamente corta la visión.
- Reutilización de la **misma** traza de oclusión que usa la percepción.

## Fuera de alcance

- Cobertura direccional (media cobertura izquierda, media derecha). Requiere
  modelar siluetas y no aporta a la decisión de "me muevo o no".
- Balanceo de daño. No hay combate.

## Criterios de aceptación

1. La calidad es una fracción medible y no un booleano inventado.
2. El conjunto de cobertura no contiene muros ni la celda de origen.
3. Oculto exige las dos condiciones: estar en cobertura **y** romper la visión.
4. La traza de oclusión coincide con la que usa la percepción (misma función).
5. La escena resalta la cobertura alcanzable y la celda que corta la visión.

## Trazabilidad

- Dominio: `src/domain/behavior/cover.ts` y `src/domain/perception/occlusion.ts`.
- Aplicación: etapa 13 de `guardSimulation.ts` y `frame.cover`.
- Presentación: `drawCover` en `src/game/presentation/levelView.ts`.