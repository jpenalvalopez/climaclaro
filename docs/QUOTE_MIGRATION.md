# Migracion de Quote fuera de Base44

El modulo nuevo de presupuestos profesionales `Quote` deja de depender de `base44.entities.Quote`.

Base44 queda como legado para lo que ya funciona en ClimaClaro:

- `Presupuesto` antiguo.
- `Lead`.
- `LeadLanding`.
- `Order`.
- `Product`.
- `ReservaInstalacion`.
- Contenido y configuracion existentes.

## Backend propio

ClimaClaro usa `server.js` con Express. La Fase 1 anade una API minima para Quotes:

- `GET /api/health`
- `GET /api/quotes`

La UI todavia no esta conectada a esta API. `AdminQuotes`, `QuotePublic` y `BookingWizard` siguen como estaban hasta fases posteriores.

## Base de datos

Quote usara Postgres propio mediante la variable de entorno `DATABASE_URL`.

Ejemplo:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

No uses prefijo `VITE_` para `DATABASE_URL`, porque las variables `VITE_` se exponen al frontend durante el build.

## Migracion SQL

Las migraciones estan en:

```text
server/migrations/
```

Ejecutala en tu proveedor Postgres antes de conectar la UI.

Desde el proyecto:

```bash
npm run db:migrate:quotes
```

Tambien puedes pegar el contenido del SQL en el editor SQL de tu proveedor Postgres, por ejemplo Neon.

## Probar health

Sin `DATABASE_URL`, la API debe responder con error claro:

```bash
curl http://localhost:8080/api/health
```

Con `DATABASE_URL` configurada y la DB accesible, debe responder:

```json
{
  "ok": true,
  "database": "connected",
  "service": "quotes"
}
```

## Seguridad

La API admin de Quotes usa una proteccion basica por secreto compartido.

En local necesitas configurar ambos valores con el mismo contenido:

```env
ADMIN_API_SECRET=dev-change-me
VITE_ADMIN_API_SECRET=dev-change-me
```

- `ADMIN_API_SECRET` lo lee Express en servidor.
- `VITE_ADMIN_API_SECRET` lo lee el panel admin para enviar el header `x-admin-api-secret`.

Si falta `ADMIN_API_SECRET`, Express bloquea toda la API admin `/api/quotes`.

Rutas admin protegidas:

- `GET /api/quotes`
- `POST /api/quotes`
- `PUT /api/quotes/:id`
- `DELETE /api/quotes/:id`

Esta proteccion es suficiente como barrera basica para desarrollo/admin local, pero no es una autenticacion completa de produccion. En produccion real no conviene exponer secretos duraderos en el frontend si hay usuarios externos; la siguiente mejora recomendada es usar sesion admin server-side, token de corta duracion o auth integrada antes de permitir escrituras.

Los endpoints publicos siguen protegidos por `public_token`:

- `GET /api/public/quotes/:id?token=...`
- `POST /api/public/quotes/:id/accept`
- `GET /api/public/quotes/:id/booking?token=...`
