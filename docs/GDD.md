---
id: laboratorio-guardia-de-sigilo-gdd
titulo: GDD - Guardia de Sigilo
tipo: referencia
audiencia: estudiante
acceso: publico
version: 1
---

# GDD - Guardia de Sigilo

## 1. Concepto

Una escena 2D cenital de sigilo, dibujada por código, donde una persona
provoca y comprende transiciones de comportamiento de un guardia. El guardia
no es un enemigo: es un **instrumento de demostración**. Cada decisión que
toma deja una traza visible (ruta, cono, memoria, estado, causa) para que el
equipo pueda discutirla sin abrir el editor de código.

El laboratorio cumple el producto de `specs/01-producto.md` y llega hasta
H4 (máquina de estados) más diez upgrades de legibilidad y de presión de
juego.

## 2. Bucle de juego

1. El jugador aparece en la zona de infiltración, al otro extremo del laboratorio.
2. El guardia patrulla una ruta de seis puntos con pausas y barridos de mirada.
3. El jugador debe llegar a la **salida** sin ser capturado.
4. El ruido es un recurso: se puede generar ruido propio (Q) o lanzar piedras
   (1-3) hacia donde apunta el mouse para que el guardia investigue otro lado.
5. Si el guardia confirma visión, persigue; si el jugador rompe la línea de
   visión, busca alrededor de la última posición conocida; si no encuentra
   nada, regresa a la ruta.
6. La ronda termina con **capturado** o **extracción**. `R` reinicia.

## 3. Verbos del jugador

| Verbo | Tecla | Efecto de diseño |
|---|---|---|
| Moverse | WASD / flechas | Exponerse o cubrirse; la velocidad es fija y legible |
| Hacer ruido | Q | Crea un sonido en la posición del jugador con radio 190 px |
| Tirar piedra | 1, 2, 3 | Piedra parabólica hacia el mouse; el impacto genera ruido de 160 px |
| Fijar destino | clic | Orden manual para el guardia, como en H3 |
| Alternar puerta | clic en la compuerta | Cambia el estado de esa puerta (H3) |
| Ver ruta | Espacio | Conmuta BFS/A* para comparar algoritmos |
| Reiniciar | R | Vuelve al estado inicial reproducible (RF-09) |

El ratón cumple una sola función: apuntar. Nada de lo que hace el jugador
depende de la puntería fina, para que el nivel se gane con criterio y no con
reflejos.

## 4. El guardia

### 4.1 Máquina de estados

Seis conductas: `patrol`, `investigate`, `chase`, `search`, `return` y
`captured`. Las prioridades son explícitas y están documentadas en
`docs/h4-maquina-estados.md`:

1. Captura (solo en persecución, con visión y dentro del radio).
2. Visión confirmada (180 ms de visión continua).
3. Rotura de visión durante la persecución.
4. Sonido audible.
5. Ciclo de la conducta en curso.

### 4.2 Percepción

- **Visión**: 220 px, cono de 90°, con oclusión por muros. El cono se dibuja
  en el suelo y cambia de color según la banda de alerta.
- **Oído**: radio por evento, sin oclusión (un ruido se propaga por el aire).
  Admite **varios sonidos simultáneos** porque el jugador puede lanzar varias
  piedras; el guardián mantiene los cuatro eventos más recientes.
- **Memoria**: última posición conocida con su origen (visión o sonido) y
  antigüedad. Solo cambia ante una percepción válida.
- **Alerta**: valor continuo 0..1 con bandas `calm`, `suspicious`, `alert`.
  Sube con visión (más rápido si está cerca) y con sonidos, y baja con
  retardo de gracia. La banda modifica la velocidad del guardia.

### 4.3 Locomoción

El guardia nunca se teletransporta: sigue waypoints de celda en celda
(`advanceGuard`). Los archivos de colisión de la escena se alinean con la
cuadrícula para que lo que se ve sea lo que la simulación calcula.

## 5. El nivel

Mapa de 30x20 celdas de 32 px, generado a partir de rectángulos bloqueados.

- **Salida**: celda (1,1). Llegar ahí sin captura termina la ronda.
- **Ruta de patrulla**: seis puntos, con pausas de 0 a 2400 ms y barridos de
  mirada que van de -90° a +90°.
- **Cobertura**: derivada de la geometría. Una celda es cobertura cuando al menos
  tres de sus cuatro lados cardenales son muro; la escena las resalta y marca
  cuál corta de verdad la línea de visión del guardia.
- **Puertas**: dos compuertas automáticas que ciclan solas (`puerta-norte`,
  `puerta-este`) y una **persiana** que solo se abre cuando el guardia
  confirma una persecución. Usarla como atajo cuesta; por eso es una decisión.

## 6. Legibilidad (el objetivo pedagógico)

| Señal | Qué comunica |
|---|---|
| Color y postura del guardia | Estado actual y transición reciente |
| Cono de visión | Qué ve, con tinte por banda de alerta |
| Ruta y nodos explorados | Cómo piensa el guardia (BFS o A*) |
| Marcadores de cobertura | Dónde puede cortar la visión |
| Plan de búsqueda | Puntos que va a revisar y cuál está activo |
| Barra de alerta | Cuánto sabe el guardia, no solo qué estado tiene |
| Panel de telemetría | Últimos eventos con su causa legible |
| Feedback de escape | Cuánto se salvó el jugador por poco (upgrade 9) |

## 7. Dirección de arte

Cero recursos externos. Todo son rectángulos, círculos y líneas de Phaser con
paleta fría de laboratorio y acentos ámbar/rojo para el riesgo. Las primitivas
están aisladas en `src/game/presentation/` para que un cambio de arte no toque
la simulación.

## 8. Métricas

- 30x20 celdas, tile 32 px.
- Visión 220 px / 90°, captura 20 px, escape de último momento 78 px.
- Confirmación de visión 180 ms, búsqueda 6000 ms en 4 puntos a 4 celdas.
- Velocidades: patrulla 105, investigación 128, persecución 168, búsqueda 116,
  regreso 118 px/s, multiplicadas por 1 / 1.06 / 1.14 según la banda.

## 9. Fuera de alcance

Sin combate, sin inventario, sin narrativa ramificada, sin multijugador, sin
generación procedural de niveles, sin backend y sin comportamiento obligatorio
de árbol de utilidad o GOAP. La comparación con otras técnicas es el hito H5.

## 10. Criterio de éxito

Una persona que no leyó el código puede responder, mirando la pantalla: qué
estado tiene el guardia, por qué cambió, qué sabe del jugador, cuál es su
próxima ruta y cuánto le falta para ser capturado.