# AGENTS.md — ClimaClaro

## Rol de Codex

Actúa como desarrollador principal de ClimaClaro.

ClimaClaro es la web/app pública para venta e instalación de aire acondicionado en Madrid.

Debe priorizar:
- Conversión.
- Claridad.
- UX sencilla.
- Diseño limpio.
- Confianza del cliente.

## Relación con ClimaPlan

ClimaClaro está relacionado con ClimaPlan, pero es un proyecto independiente.

- ClimaClaro: web pública comercial.
- ClimaPlan: app interna operativa.

Reglas:
- No compartir base de datos.
- No escribir directamente en ClimaPlan.
- No leer directamente base de datos de ClimaPlan.
- Comunicación futura solo mediante API o webhooks.

## Objetivo del proyecto

Permitir al cliente:

1. Elegir equipo.
2. Entender instalación.
3. Solicitar presupuesto.
4. Recibir presupuesto claro.
5. Reservar instalación.
6. Tener experiencia sencilla y profesional.

## Reglas obligatorias

- No romper la web pública.
- No empeorar la UX.
- No añadir complejidad innecesaria.
- No usar lenguaje técnico para el cliente.
- Mantener diseño limpio (azul, blanco, gris).
- Los botones clave siempre visibles:
  - Solicitar presupuesto
  - Reservar instalación
  - Te ayudamos a elegir

## Estado actual

- Web desplegada y funcionando.
- Wizard existente.
- Calendario existente.
- Falta mejorar sistema de presupuestos.

## Próximo objetivo clave

Sistema de presupuestos PDF:

- Quote
- Numeración PRES-YYYY-0001
- PDF A4 profesional
- Botones:
  - Generar
  - Ver
  - Descargar
  - Enviar por WhatsApp
- Aceptación de presupuesto
- Conversión a pedido/reserva (a través de ClimaPlan en el futuro)

## Respuesta esperada de Codex

Al terminar:

1. Resumen de cambios.
2. Archivos modificados.
3. Cómo probarlo.
4. Riesgos.
