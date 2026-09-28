# Separacion entre ClimaClaro y ClimaPlan

Fecha de revision: 2 de mayo de 2026

## Regla principal

Este repositorio `E:\climaclaro` corresponde solo a ClimaClaro.

ClimaClaro y ClimaPlan son proyectos relacionados, pero son sistemas separados. No deben documentarse ni tratarse como si vivieran en el mismo repositorio.

## Repositorios y bases de datos

- ClimaClaro tiene su propio repositorio.
- ClimaPlan tiene su propio repositorio.
- ClimaClaro tiene su propia base de datos.
- ClimaPlan tiene su propia base de datos.
- No se deben compartir tablas entre ambos proyectos.
- No se deben compartir migraciones entre ambos proyectos.
- No se debe compartir logica de base de datos entre ambos proyectos.

## Comunicacion permitida

Cualquier comunicacion entre ClimaClaro y ClimaPlan debe hacerse mediante integraciones explicitas y documentadas:

- API.
- Webhooks.
- Jobs programados.

Cada integracion debe documentar al menos:

- Origen.
- Destino.
- Payload enviado.
- Evento que dispara la comunicacion.
- Reintentos o comportamiento ante errores, si aplica.

## Caso actual: reservas hacia ClimaPlan

La funcion `enviarReservaAClimaplan` envia reservas desde ClimaClaro hacia la API de ClimaPlan.

Esta funcion debe entenderse como una integracion saliente desde ClimaClaro. No significa que ClimaClaro y ClimaPlan compartan repositorio, tablas, migraciones, base de datos ni logica interna.

ClimaClaro mantiene sus datos en sus propias entidades. ClimaPlan debe mantener los suyos en su propio sistema.

## Regla para futuras decisiones

Si una necesidad futura requiere que ClimaClaro y ClimaPlan intercambien informacion, se debe crear o actualizar una integracion documentada. No se deben copiar tablas, reutilizar migraciones ni acoplar la logica de base de datos entre proyectos.
