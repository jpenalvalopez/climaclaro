# Reglas de negocio de ClimaClaro

## Objetivo comercial

ClimaClaro debe convertir visitas en clientes de forma clara y sencilla.

Debe facilitar:
- Solicitud de presupuesto.
- Reserva de instalación.
- Elección de equipo.

## Productos

- Los productos deben mostrarse de forma clara.
- No deben requerir conocimientos técnicos del cliente.
- El cliente debe poder:
  - Solicitar presupuesto.
  - Reservar instalación.
- Las imágenes deben cargarse rápido.
- Las fichas técnicas deben ser opcionales.

## Wizard

- El wizard es una ayuda, no un diagnóstico técnico definitivo.
- Debe ser rápido y fácil de usar.
- Debe recoger:
  - Datos básicos del cliente.
  - Necesidades.
  - Preferencias.
- Debe generar una recomendación orientativa.
- Debe permitir continuar hacia presupuesto.

## Presupuestos

- Todo presupuesto debe ser claro.
- Debe incluir:
  - Productos.
  - Servicios.
  - Precio.
  - IVA.
  - Total.
- Debe poder:
  - Generarse.
  - Verse.
  - Descargarse.
  - Enviarse por WhatsApp.

## Aceptación de presupuesto

Cuando el cliente acepta:

1. Marcar presupuesto como aceptado.
2. Preparar creación de pedido.
3. Preparar creación de reserva.
4. Evitar duplicados.
5. Permitir elegir fecha de instalación.

## Instalaciones

Reglas visibles para el cliente:

- Zona principal: Madrid.
- No se instala en sábado.
- No se instala en domingo.
- No se instala el mismo día de recepción de la máquina.
- Primera fecha posible: siguiente día laborable.
- Margen máximo recomendado: 10 días desde recepción.

## Desinstalación

- Equipo 1x1: 50 €.
- Multisplit: 50 € + 20 € por unidad interior adicional.

## UX

- El cliente siempre debe saber el siguiente paso.
- Los botones principales deben ser visibles.
- Evitar formularios largos al inicio.
- Priorizar claridad sobre complejidad.

## Base de datos

ClimaClaro tiene su propia base de datos.

No debe:
- Compartir tablas con ClimaPlan.
- Leer directamente ClimaPlan.
- Escribir directamente en ClimaPlan.
