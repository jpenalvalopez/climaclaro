# Arquitectura de ClimaClaro

ClimaClaro es una web/app pública orientada a conversión.

## Principios

- No romper la web en producción.
- Priorizar UX y conversión.
- No añadir complejidad innecesaria.
- Mantener tiempos de carga rápidos.
- No mezclar con ClimaPlan.
- No compartir base de datos.

## Capas principales

### Frontend

Responsable de:

- Home.
- Productos.
- Detalle de producto.
- Servicios.
- Wizard.
- Formularios.
- Presupuesto.
- Reserva.

Debe ser:
- Rápido.
- Claro.
- Responsive.
- Fácil de usar.

### Backend

Responsable de:

- Crear leads.
- Crear presupuestos.
- Calcular importes.
- Validar datos.
- Gestionar estados.
- Preparar integración futura con ClimaPlan.

### Base de datos

Debe guardar:

- Productos.
- Servicios.
- Leads.
- Clientes.
- Presupuestos.
- Solicitudes de reserva.
- Textos editables.

No debe compartir datos con ClimaPlan.

### Storage

Los archivos deben guardarse fuera de la base de datos:

- Imágenes.
- PDFs.
- Fichas técnicas.

La base de datos solo guarda URLs.

## Flujo principal

1. Usuario entra en web.
2. Ve productos o usa wizard.
3. Solicita presupuesto.
4. Se crea lead.
5. Se genera presupuesto.
6. Usuario acepta.
7. Solicita reserva.
8. Futuro: integración con ClimaPlan.

## Integración futura

ClimaClaro no debe conectar directamente con la base de datos de ClimaPlan.

La integración debe hacerse mediante:

- API.
- Webhook.
- Job programado.
