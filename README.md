# ClimaClaro

ClimaClaro es la web/app pública para venta e instalación de aire acondicionado en Madrid.

Su objetivo es simplificar al cliente todo el proceso:

- Elegir equipo.
- Entender la instalación.
- Solicitar presupuesto.
- Reservar fecha.
- Tener una experiencia clara y profesional.

## Relación con ClimaPlan

ClimaClaro está relacionado con ClimaPlan, pero es un proyecto independiente.

- ClimaClaro: web pública comercial.
- ClimaPlan: app interna operativa.

Cada uno tiene:
- Su propio despliegue.
- Su propia base de datos.
- Su propia lógica de datos.

No se deben fusionar bases de datos ni compartir tablas.

Cualquier comunicación futura debe hacerse mediante:
- API.
- Webhooks.
- Jobs documentados.

## Estado actual

ClimaClaro ya está desplegado y funcionando.

Tiene:
- Web pública.
- Wizard.
- Calendario.
- Base de datos propia.

## Objetivo comercial

Convertir visitantes en clientes mediante:

- Mensaje claro.
- Diseño profesional.
- Wizard de ayuda.
- Productos bien presentados.
- Presupuestos claros.
- Reserva de instalación sencilla.

## Documentación importante

- docs/PROJECT_CONTEXT.md
- docs/CLIMACLARO.md
- docs/BUSINESS_RULES.md
- docs/DATABASE.md
- docs/DESIGN_SYSTEM.md
- docs/CODEX_WORKFLOW.md
