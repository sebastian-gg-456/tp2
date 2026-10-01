---
id: laboratorio-guardia-sigilo
titulo: Laboratorio Guardia de Sigilo
tipo: indice
audiencia: estudiante
acceso: publico
version: 4
---

# Laboratorio Guardia de Sigilo

Proyecto canónico de PIAPC 2026 para aplicar desarrollo agéntico e inteligencia artificial de videojuegos.

## Estado

H0 a H4 implementados, más los diez upgrades de comportamiento: máquina de
estados del guardia, medidor de alerta, cobertura, distractores, escape de
último momento y puertas. 219 pruebas automatizadas en verde.

## Ejecución

Requiere Node.js 22 o superior.

```bash
npm ci
npm run dev
```

Validación completa:

```bash
npm run validate
```

En la escena:

- WASD o flechas: mover al jugador.
- Clic en una celda: elegir destino para el guardia.
- Clic en una puerta: abrirla o cerrarla.
- 1, 2 o 3: lanzar una piedra hacia el cursor (3 cargas, se recargan).
- Q: emitir un ruido desde el jugador.
- Espacio: alternar BFS y A*.
- R: reiniciar el escenario.

La persiana no es un control: se abre sola cuando el guardia entra en
persecución y se mantiene abierta mientras busca.

## Propósito

Construir un juego 2D cenital mínimo donde un guardia:

- patrulla puntos definidos;
- percibe al jugador mediante visión y sonido;
- conserva una última posición conocida;
- navega mediante A*;
- sigue caminos sin mezclar búsqueda y locomoción;
- decide mediante una máquina de estados;
- expone telemetría suficiente para comprender y probar su conducta.

El proyecto no busca producir un videojuego comercial. Es un entorno de experimentación controlado, reproducible y apto para personas y agentes de desarrollo.

## Documentos

- [Especificación del producto](specs/01-producto.md)
- [Especificación pedagógica](specs/02-pedagogica.md)
- [Arquitectura](docs/arquitectura.md)
- [Hitos](docs/hitos.md)
- [Contrato para proyectos alternativos](docs/contrato-proyecto-alternativo.md)
- [Decisiones técnicas](docs/decisiones-tecnicas.md)
- [Auditoría H1](docs/auditoria-h1.md)
- [Permisos recomendados](docs/permisos-recomendados.md)
- [Registro de intervención](docs/plantillas/registro-intervencion.md)
- [Evidencia de pruebas](docs/plantillas/evidencia-pruebas.md)
- [H3: percepción y movimiento](docs/h3-percepcion-movimiento.md)
- [Intervención H3](docs/evidencias/h3-intervencion.md)
- [Validación H3](docs/evidencias/h3-validacion.md)
- [GDD](docs/GDD.md)
- [Cómo funciona](docs/como-funciona.md)
- [H4: máquina de estados](docs/h4-maquina-estados.md)
- [Validación H4 y upgrades](docs/evidencias/h4-validacion.md)
- [Upgrades 01 a 10](docs/upgrades/README.md)

## Tecnología de referencia

- Phaser con TypeScript.
- Vite para desarrollo y compilación.
- Vitest para pruebas de dominio.
- Node.js 22 o superior.
- npm y archivo de bloqueo para instalaciones reproducibles.

El estudiante puede adoptar Unity u otro entorno si cumple el contrato de equivalencia.

## Restricción principal

La lógica de navegación, percepción y decisión no dependerá de Phaser. El motor será un adaptador de entrada, tiempo, colisiones y representación visual.
