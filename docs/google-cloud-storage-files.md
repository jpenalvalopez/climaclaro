# Clima Claro: Google Cloud Storage

La aplicacion usa dos buckets:

```text
climaclaro-public-assets
climaclaro-private-documents
```

## Variables de entorno

```text
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_PUBLIC_BUCKET=climaclaro-public-assets
GOOGLE_CLOUD_PRIVATE_BUCKET=climaclaro-private-documents
SIGNED_URL_EXPIRES_MINUTES=10
FILE_ADMIN_TOKEN=
```

En Cloud Run se recomienda usar Service Account + IAM, sin JSON de credenciales.
En local puede usarse `gcloud auth application-default login` o
`GOOGLE_APPLICATION_CREDENTIALS` apuntando a un JSON fuera del repositorio.

## Buckets

Publico:

```text
web/
productos/
marcas/
servicios/
branding/
legal/
```

Privado:

```text
leads/
presupuestos/
pedidos/
instalaciones/
clientes/
temp/
```

Los objetos privados solo deben abrirse mediante:

```text
GET /api/files/:id/signed-url
```

## API

```text
POST /api/files/upload
GET /api/files/:id/metadata
GET /api/files/:id/signed-url
DELETE /api/files/:id
```

`POST /api/files/upload` acepta `multipart/form-data` con:

```text
file
type
entityId
brandSlug
productSlug
serviceSlug
quoteNumber
orderNumber
installationId
clientId
leadId
phase
kind
```

El frontend no envia rutas. El backend construye la ruta segura segun `type`.

Las rutas de metadatos, URL firmada y borrado requieren:

```text
Authorization: Bearer FILE_ADMIN_TOKEN
```

No pongas `FILE_ADMIN_TOKEN` en variables `VITE_` ni en codigo frontend.

## Metadatos

Cada subida crea un registro `FileAsset` en Neon mediante la tabla generica
`entity_records`. Los campos principales son:

```text
bucket
object_path
public_url
visibility
file_type
entity_type
entity_id
original_filename
stored_filename
mime_type
size_bytes
checksum
deleted_date
```

## Pendiente de migracion

Los datos antiguos pueden seguir teniendo URLs de Base44. Para localizarlas:

```powershell
npm.cmd run files:find-legacy
```

La migracion completa posterior debe descargar cada archivo antiguo, subirlo a
GCS, crear `FileAsset` y actualizar `image_url`, `image_gallery`, `logo_url`,
`hero_image_url` o el campo equivalente.
