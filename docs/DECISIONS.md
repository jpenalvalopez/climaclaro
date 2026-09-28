# Decisiones de ClimaClaro

## Decisión 001 — Proyecto separado de ClimaPlan

ClimaClaro es independiente de ClimaPlan.

Motivo:
- Diferente objetivo (comercial vs operativo)
- Diferente base de datos
- Diferente despliegue

## Decisión 002 — No compartir base de datos

ClimaClaro no debe compartir base de datos con ClimaPlan.

Motivo:
- Evitar errores
- Evitar dependencias
- Permitir escalar por separado

## Decisión 003 — Conversión como prioridad

ClimaClaro debe priorizar conversión sobre complejidad técnica.

Motivo:
- Es una web comercial
- El objetivo es generar clientes

## Decisión 004 — UX simple

La UX debe ser simple.

Motivo:
- Clientes no técnicos
- Evitar abandono

## Decisión 005 — Wizard como herramienta principal

El wizard es clave para captar clientes.

Motivo:
- Reduce dudas
- Aumenta conversión

## Decisión 006 — Presupuesto claro

El presupuesto debe ser claro y profesional.

Motivo:
- Genera confianza
- Facilita cierre

## Decisión 007 — Integración futura con ClimaPlan

La integración se hará por API o webhook.

Nunca por base de datos compartida.
