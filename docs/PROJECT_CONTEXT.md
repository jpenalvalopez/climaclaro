# Contexto general de ClimaClaro

ClimaClaro es una web/app pública para venta e instalación de aire acondicionado en Madrid.

## Objetivo principal

Que el cliente pueda comprar o solicitar instalación de aire acondicionado de forma clara, sencilla y sin líos.

El flujo ideal es:

1. El cliente entra en la web.
2. Puede consultar productos o usar el wizard.
3. Elige o recibe recomendación.
4. Solicita presupuesto.
5. Recibe presupuesto claro.
6. Acepta presupuesto.
7. Reserva instalación.
8. La operación puede pasar a ClimaPlan mediante integración futura.

## Relación con ClimaPlan

ClimaClaro está relacionado con ClimaPlan, pero no comparte base de datos.

ClimaPlan es la herramienta interna para gestionar reservas, pedidos, calendario e instalaciones.

Cualquier comunicación futura entre ClimaClaro y ClimaPlan debe hacerse mediante:
- API.
- Webhook.
- Job documentado.
- Importación controlada.

Nunca mediante base de datos compartida.

## Estado actual

- ClimaClaro ya está desplegado.
- Funciona en producción.
- Tiene base de datos propia.
- Tiene wizard.
- Tiene calendario.
- Falta reforzar presupuestos PDF y flujo de aceptación.

## Prioridades

1. Mantener estable la web pública.
2. Mejorar conversión.
3. Mejorar claridad de productos y servicios.
4. Implementar presupuestos PDF profesionales.
5. Mejorar reserva de instalación.
6. Preparar integración futura con ClimaPlan.
