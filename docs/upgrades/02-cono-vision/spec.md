---
id: upgrade-02-cono-vision
titulo: Upgrade 02 - Cono de vision visible y reactivo
tipo: especificacion
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 02 - Cono de visión visible y reactivo

## Problema

La percepción de H3 era correcta pero invisible. El jugador no podía saber si
el guardia lo estaba viendo, ni por qué había empezado una persecución. Eso
convierte el cono en información secreta del sistema y obliga a leer el HUD
para adivinar.

## Objetivo

Que el cono de visión sea la representación honesta del estado de percepción:
alcance y ángulo exactos, tintado por banda de alerta y denser cuando el
guardia ve al jugador.

## Alcance

- Dibujo del cono en el suelo, entre la cuadrícula y los personajes.
- Alcance y ángulo tomados de la simulación, nunca duplicados en la vista.
- Opacidad y grosor del borde derivados del **nivel** de alerta (`alertLevel`).
- Realce adicional cuando el objetivo está visible en este tick.
- Orientación por la mirada **interpolada**, para que el barrido de la pausa
  (upgrade 01) se vea aunque el cuerpo del guardia se mueva poco.

## Fuera de alcance

- Sombreado por oclusión celda por celda dentro del cono. Se evalúa en el
  dominio y se comunica como binario (visible o no), que es lo que decide.
- Animación de "escaneo" propia de la vista. La animación viene de la mirada
  de la simulación.

## Criterios de aceptación

1. El cono dibujado usa el mismo `visionRange` y `fieldOfViewRadians` que la
   simulación.
2. La geometría se recalcula cuando cambia la mirada interpolada.
3. La opacidad del relleno y el grosor del borde crecen con el nivel de alerta.
4. Ver al jugador añade un extra fijo de opacidad.
5. La vista no lee el estado del juego: recibe un `VisionConeInput` plano.

## Trazabilidad

- Dominio: `src/domain/perception/perception.ts` (geometría y oclusión).
- Aplicación: `src/application/simulation/guardSimulation.ts` (etapa 3).
- Presentación: `src/game/presentation/visionConeView.ts`.