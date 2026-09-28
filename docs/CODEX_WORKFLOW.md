# Flujo de trabajo con Codex en ClimaClaro

## Objetivo

Usar Codex como desarrollador asistente sin perder control.

## Regla principal

Antes de cualquier cambio:

Leer:
- AGENTS.md
- docs/PROJECT_CONTEXT.md
- docs/BUSINESS_RULES.md
- docs/DATABASE.md

## Prompt base

Antes de tocar código:

"Este repositorio corresponde a ClimaClaro. Lee la documentación en /docs. No rompas la UX. Haz cambios mínimos y enfocados a mejorar conversión."

## Flujo recomendado

1. Definir tarea concreta.
2. Pedir a Codex análisis primero.
3. Revisar plan.
4. Ejecutar cambios.
5. Probar en local.
6. Revisar visualmente.
7. Publicar si está correcto.

## Si afecta a UX

Codex debe:

- Explicar qué cambia.
- Explicar por qué mejora conversión.
- No empeorar claridad.

## Si afecta a base de datos

Codex debe:

- Confirmar entidad.
- Confirmar que es ClimaClaro.
- Explicar impacto.

## Respuesta esperada

1. Resumen.
2. Archivos modificados.
3. Cómo probarlo.
4. Riesgos.
