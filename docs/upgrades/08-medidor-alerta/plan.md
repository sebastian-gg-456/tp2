---
id: upgrade-08-medidor-alerta-plan
titulo: Upgrade 08 - Plan de trabajo
tipo: plan
audiencia: estudiante
acceso: publico
version: 2
---

# Upgrade 08 - Plan de trabajo

## Orden de implementación

1. **Configuración antes que constantes** — `AlertConfig` con
   `createAlertConfig(overrides)` y un `DEFAULT_ALERT_CONFIG` explícito. Todos
   los números de ajuste quedan en un objeto visible y sobrescribible, en lugar
   de números mágicos repartidos por el código.
2. **Tipo de banda** — `AlertBand = calm | suspicious | alert` y
   `alertBandOf(config, level)`. La banda se **deriva** del nivel y luego se
   guarda en el estado junto al valor, para que el HUD no tenga que recalcularla
   en cada frame y para que la telemetría registre la banda que se tomó.
3. **Función pura** — `updateAlert(config, state, input)` devuelve un
   `AlertState` nuevo. Se eligió una función pura sobre mutar el estado porque
   el decaimiento depende del tiempo y probarlo por ticks es más barato si
   cada llamada es independiente.
4. **Ganancia por distancia** — `closeness` se calcula como
   `1 - distancia / rango` y se eleva al cuadrado antes de aplicarse. Así la
   diferencia entre "al borde del cono" y "encima" se nota, sin que el primer
   frame de visión ya dispare la persecución.
5. **Sonido con piso** — en lugar de acumular una cantidad arbitraria, un
   sonido fija `level = max(level, soundFloor)` y suma su ganancia. El piso
   expresa "ha oído algo" sin depender del tiempo de exposición.
6. **Gracia y decaimiento** — `lastStimulusAtMs` guarda el último estímulo. Pasada
   `decayGraceMs` desde entonces, el nivel baja `decayPerSecond * segundos`, y
   ese decaimiento se multiplica por `searchDecayMultiplier` cuando el guardia
   está buscando: la tensión se mantiene porque la sospecha también.
7. **Saturación** — el recorte a `[0, 1]` ocurre al final de la función, nunca
   en el HUD. Si estuviera en la vista, el dominio admitiría valores imposibles.
8. **Presentación** — la barra se rellena con `input.alertLevel` recortado y la
   etiqueta sale de `alertLabel(band)`, de modo que texto y color nunca
   discrepen.

## Decisiones

- **La banda es consecuencia, no entrada.** El resto de la simulación lee
  `band`; nadie la escribe a mano.
- **`peak` se conserva aunque el nivel baje.** Una ronda en la que casi te
  capturan y te escapas tiene un pico que el nivel actual ya no enseña, y esa
  información es la que interesa al jugador.
- **El decaimiento no depende de la tasa de frames.** Todo entra por
  `deltaMs`, y el estado guarda el tiempo absoluto.
- **La función de dominio no conoce telemetría ni eventos.** Solo devuelve
  estado; si el nivel cruza un umbral, quien decide la consecuencia es la
  aplicación.

## Alternativas descartadas

- **Contador entero de sospechas**: era el diseño de H3 y se descartó por no
  admitir gradientes ni decaimiento.
- **Tiempo de exposición acumulado**: obliga a llevar un segundo reloj y hace
  que el medidor dependa de la tasa de frames.
- **Decaimiento inmediato al perder visión**: hace que cubrirse un segundo no
  sirva para nada. La ventana de gracia es lo que permite Cover→Wait→Move.
- **Umbral en la vista**: el HUD decidiría cuándo empieza una persecución.