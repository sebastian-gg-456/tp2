---
id: upgrade-06-cobertura-plan
titulo: Upgrade 06 - Plan de trabajo
tipo: plan
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 06 - Plan de trabajo

## Orden de implementación

1. **Medida de calidad** — `coverQuality(muros, celda)` cuenta los cuatro
  (cardinales) bloqueados y divide por cuatro. Las celdas fuera del mapa
   cuentan como bloqueadas, porque el borde de la sala es un muro real.
2. **Umbral y predicado** — `COVER_THRESHOLD` y `isCoverCell`, para que el
   número de ajuste esté en un solo lugar.
3. **Cobertura alcanzable** — `collectCover` recorre anillos alrededor de la
   celda del jugador, excluye el origen y ordena por distancia de Manhattan y
   luego por calidad.
4. **Oclusión compartida** — se extrae `lineIsOccluded` y `occludingCells` a
   `domain/perception/occlusion.ts` para que percepción, cobertura y feedback
   usen exactamente la misma traza. Esto se hizo explícito porque duplicar la
   traza en dos módulos habría producido discrepancias silenciosas.
5. **Evaluación compuesta** — `assessCover` mezcla lo estático (cobertura) y lo
   dinámico (línea de visión) y expone `hidden` como la conjunción.
6. **Presentación** — se dibujan las celdas de cobertura alcanzables con un
   marco verde fino y la celda del jugador con un marco más grueso cuando
   realmente corta la visión.
7. **Alcance del radio** — `COVER_RADIUS_CELLS = 5` en el nivel, suficiente
   para el tamaño del mapa.

## Decisiones

- **La cobertura es geométrica, no una lista de "puntos seguros".** Una lista
  tendría que mantenerla sincronizada con cada cambio del mapa; la geometría se
  adapta sola.
- **El borde de la sala cuenta como muro.** Evita tener que dibujar un anillo
  de muros externo y hace que los rincones del laboratorio sean cobertura,
  que es lo que un jugador espera.
- **Ocultar exige las dos condiciones.** Un jugador en cobertura con línea
  despejada no está oculto: está solo y a la vista, que es peor. La prueba lo
  cubre explícitamente.

## Alternativas descartadas

- **Cobertura direccional con ocho vecinos**: duplica la geometría y hace el
  realce visual ilegible con tan pocos píxeles por celda.
- **Oclusión propia dentro de cover.ts**: se descartó para garantizar una sola
  implementación de la traza.