---
id: laboratorio-guardia-sigilo-hitos
titulo: Hitos del laboratorio Guardia de Sigilo
tipo: referencia
audiencia: estudiante
acceso: publico
version: 4
---

# Hitos del laboratorio

| Hito | Estado |
|---|---|
| H0. Base reproducible | Completado |
| H1. Repositorio preparado para agentes | Completado |
| H2. Navegación | Completado |
| H3. Percepción y movimiento | Completado |
| H4. Máquina de estados | Completado |
| H5. Comparación | Pendiente |
| H6. Integración final | Pendiente |

## H0. Base reproducible

- Proyecto Phaser/TypeScript ejecutable.
- Mapa, jugador y obstáculos.
- Formas generadas por código.
- Comandos documentados.
- Validación inicial.

## H1. Repositorio preparado para agentes

- AGENTS.md conciso.
- Especificaciones y arquitectura.
- Permisos recomendados.
- Plantillas de evidencia.
- Estado limpio y reproducible.

## H2. Navegación

- Grafo de cuadrícula.
- BFS como referencia comparativa.
- A* con métricas.
- Casos de éxito y fracaso.
- Visualización de ruta y nodos explorados.

## H3. Percepción y movimiento

- Visión con oclusión.
- Sonido.
- Última posición conocida.
- Seguimiento de caminos.
- Pruebas de geometría y memoria.

## H4. Máquina de estados

- Patrullar, Investigar, Perseguir, Buscar y Regresar.
- Guardas e invariantes.
- Prioridades explícitas.
- Registro de transiciones.
- Pruebas de secuencias.

Estado: completado el 30 de septiembre de 2026. Contrato de estados y
prioridades en [H4: máquina de estados](h4-maquina-estados.md); comportamiento
previsto en el [GDD](GDD.md); orden del tick en [cómo funciona](como-funciona.md).

### H4.1. Patrullar

- Recorrer puntos de patrulla cíclicos mediante rutas válidas.
- Registrar llegada y selección del siguiente punto.
- Pausa con barrido direccional de la mirada (upgrade 01).

### H4.2. Investigar

- Responder a un sonido o última posición conocida sin usar información no percibida.
- Registrar origen, destino y resultado de navegación.

### H4.3. Perseguir

- Priorizar una percepción visual válida y actualizar memoria.
- Replanificar sólo cuando cambia el objetivo de forma relevante o vence el intervalo definido.

### H4.4. Buscar

- Al perder visión, recorrer una búsqueda limitada alrededor de la última posición conocida.
- Conservar memoria y registrar inicio, vencimiento o recuperación de percepción.

### H4.5. Regresar

- Tras agotar la búsqueda, volver a un punto de patrulla válido.
- Recuperarse explícitamente ante un destino inaccesible y registrar la transición.

## Upgrades asociados a H4

Los diez upgrades se construyeron durante H4 y están documentados en
[docs/upgrades](upgrades/README.md), cada uno con especificación, plan y
evidencia: patrulla con pausas y mirada, cono de visión, animaciones por
estado, trazabilidad de navegación, cámara de tensión, cobertura,
distractores, medidor de alerta, escape de último momento y puertas.

## H5. Comparación

- Representación equivalente mediante árbol de comportamiento, utilidad y GOAP en diagramas o trazas.
- Decisión justificada sobre la técnica implementada.
- Prueba de juego centrada en legibilidad y justicia.

## H6. Integración final

- Validación completa.
- Métricas.
- Trazabilidad del uso de agentes.
- Revisión de seguridad y licencias.
- Producto ejecutable e informe.

Cada hito debe poder validarse de forma independiente. No se avanza ocultando fallos del anterior.
