# Clima Claro: Neon Postgres + Cloud Run

Clima Claro queda preparado para usar una base de datos propia sin Cloud SQL.

El servidor usa:

- Neon Postgres cuando existe `DATABASE_URL`.
- `data/local-db.json` solo como fallback local o demo temporal.

## 1. Crear la base gratis en Neon

1. Entra en Neon.
2. Crea un proyecto llamado `climaclaro`.
3. Crea o usa la base `climaclaro`.
4. Copia la connection string de PostgreSQL.
5. Usa preferiblemente la conexion pooled para Cloud Run.

La URL debe tener un formato parecido a:

```text
postgresql://USER:PASSWORD@HOST.neon.tech/climaclaro?sslmode=require
```

No subas esta URL a Git. Es una credencial.

## 2. Probar la conexion local

En PowerShell:

```powershell
$env:DATABASE_URL="TU_DATABASE_URL_DE_NEON"
npm.cmd run db:check
```

Si responde `Database connection OK`, la conexion esta bien.

## 3. Crear tablas

```powershell
$env:DATABASE_URL="TU_DATABASE_URL_DE_NEON"
npm.cmd run db:migrate
```

Esto crea la tabla generica `entity_records`, preparada para entidades como
`Product`, `Service`, `Wizard`, `WebText`, `Lead`, `ReservaInstalacion` y otras.

## 4. Cargar datos iniciales

```powershell
$env:DATABASE_URL="TU_DATABASE_URL_DE_NEON"
npm.cmd run db:seed
```

Este seed carga los datos publicos actuales desde `data/local-db.json`.
No se han incluido leads, reservas, usuarios, pedidos ni presupuestos privados.

## 5. Desplegar en Cloud Run sin Cloud SQL

```powershell
gcloud.cmd run deploy climaclaro --source . --region europe-southwest1 --allow-unauthenticated --set-env-vars DATABASE_URL="TU_DATABASE_URL_DE_NEON"
```

Cloud Run recibira `DATABASE_URL` como variable de entorno y el servidor conectara
directamente con Neon Postgres.

## 6. Comprobar despues del despliegue

```powershell
gcloud.cmd run services describe climaclaro --region europe-southwest1
```

Despues abre:

```text
https://climaclaro-255815526470.europe-southwest1.run.app
```

## Pendiente importante

Los datos ya son tuyos, pero algunas imagenes importadas todavia apuntan a URLs
publicas antiguas de Base44. Para independencia total hay que migrarlas despues a:

- Cloud Storage,
- Supabase Storage,
- Neon no, porque no conviene guardar imagenes grandes en PostgreSQL,
- o assets propios dentro del proyecto si son pocas y estables.

Campos a revisar: `image_url`, `image_gallery`, `logo_url`, `hero_image_url` y
`favicon_url`.
