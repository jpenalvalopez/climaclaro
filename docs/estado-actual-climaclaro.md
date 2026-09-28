# Estado actual de Clima Claro

Fecha de revision: 2 de mayo de 2026
Proyecto local: `E:\climaclaro`
URL local habitual: `http://localhost:5173`

Nota de alcance: este repositorio corresponde solo a Clima Claro. ClimaPlan es un proyecto relacionado, pero tiene su propio repositorio y su propia base de datos. No se deben compartir tablas, migraciones ni logica de base de datos entre ambos proyectos. Cualquier comunicacion debe hacerse por API, webhooks o jobs documentados.

## 1. Resumen ejecutivo

Clima Claro esta montado como una aplicacion web React con Vite, conectada a Base44 como backend principal. La web combina catalogo de productos, ficha de producto, carrito, solicitud de presupuesto, reserva de instalacion, wizard recomendador, contenido editable y panel de administracion.

La arquitectura actual esta pensada para que Javier pueda gestionar productos, servicios, leads, reservas, textos, carruseles, paginas de marca/modelo y ajustes generales desde `/admin`, mientras la parte publica convierte visitas en solicitudes, compras o reservas.

El proyecto no es una web estatica simple. Es una SPA con datos dinamicos, cache en cliente, formularios, entidades remotas en Base44, carrito local en navegador y un panel administrativo.

## 2. Stack tecnico

Frontend:

- React 18.
- Vite 6.
- React Router DOM para rutas.
- Tailwind CSS para estilos.
- Radix UI y componentes locales en `src/components/ui`.
- Lucide React para iconos.
- TanStack Query para cargar/cachear datos de Base44.
- Framer Motion para animaciones.

Backend/datos:

- Base44 SDK mediante `@base44/sdk`.
- Plugin de Base44 en Vite mediante `@base44/vite-plugin`.
- Entidades Base44 para productos, servicios, leads, reservas, pedidos, textos y configuracion.
- Funciones Base44 invocadas desde frontend en algunos flujos, por ejemplo notificaciones de leads o envio de reservas.

Servidor de produccion/local build:

- `server.js` usa Express para servir la carpeta `dist`.
- Cualquier ruta no encontrada en servidor devuelve `dist/index.html`, necesario para que funcione React Router.

## 3. Scripts disponibles

Definidos en `package.json`:

- `npm run dev`: levanta Vite en desarrollo.
- `npm run build`: genera la build en `dist`.
- `npm run start`: sirve `dist` con Express en el puerto `8080` por defecto.
- `npm run lint`: ejecuta ESLint en modo silencioso.
- `npm run lint:fix`: corrige lint automaticamente cuando es posible.
- `npm run preview`: preview de Vite.
- `npm run typecheck`: intenta ejecutar TypeScript usando `jsconfig.json`.

## 4. Variables de entorno

El proyecto usa `.env.local` para conectar con Base44.

Variables relevantes:

- `VITE_BASE44_APP_ID`: identificador de la app en Base44.
- `VITE_BASE44_APP_BASE_URL`: URL base del backend/app de Base44.
- `VITE_BASE44_FUNCTIONS_VERSION`: version de funciones, si aplica.
- `VITE_ENABLE_LOCAL_ADMIN_LOGIN`: permite desactivar el login admin local si se define como `false`.
- `VITE_LOCAL_ADMIN_PASSWORD`: password para el acceso admin local en desarrollo.

La lectura de parametros se centraliza en `src/lib/app-params.js`. Tambien puede recoger parametros desde la URL, como `app_id`, `access_token`, `functions_version` o `app_base_url`, y guardarlos en `localStorage`.

## 5. Estructura principal

Carpetas clave:

- `src/pages`: pantallas/rutas principales.
- `src/components`: componentes reutilizables, separados por area.
- `src/components/admin`: pantallas internas del panel de administracion.
- `src/components/home`: secciones de la home.
- `src/components/products`: componentes de catalogo/producto.
- `src/components/reservar`: pasos del wizard de reserva.
- `src/components/services`: modales y piezas de servicios/presupuesto.
- `src/components/wizard`: recomendador y scoring.
- `src/components/shared`: piezas compartidas, como asistente IA y tarjetas.
- `src/components/ui`: componentes base de UI.
- `src/lib`: autenticacion, parametros, query client, utilidades de navegacion.
- `src/api`: cliente Base44.
- `src/utils`: utilidades de rutas.
- `dist`: build generada.
- `base44`: carpeta propia de Base44.

## 6. Entrada de la aplicacion

El arranque empieza en:

- `src/main.jsx`: monta React en `#root`.
- `src/App.jsx`: configura providers, router y rutas.

Providers principales:

- `AuthProvider`: estado de autenticacion y ajustes publicos de Base44.
- `QueryClientProvider`: cache de datos con TanStack Query.
- `BrowserRouter`: rutas del frontend.
- `Toaster`: notificaciones UI.

## 7. Rutas y pantallas

Las rutas se definen con una mezcla de configuracion auto-generada y rutas manuales.

Archivo clave:

- `src/pages.config.js`

Pantalla principal:

- `Home`

Rutas registradas desde `pages.config.js`:

- `/About`
- `/Admin` y `/admin`
- `/BookingWizard`
- `/Cart`
- `/Contact`
- `/ContentPage`
- `/Home`
- `/MisReservas`
- `/PanelReservas`
- `/ProductDetail`
- `/Products`
- `/Reservar`
- `/ServiceDetail`
- `/Services`
- `/Wizard`

Rutas manuales adicionales en `App.jsx`:

- `/MiPerfil`
- `/marca/:slug`
- `/marca/modelo/:slug`
- `/modelo/:slug`
- `/ModelDetail`
- `/presupuesto`

La mayoria de rutas publicas se envuelven con `Layout.jsx`, que incluye header, footer, asistente IA y modal de presupuesto.

## 8. Layout, header y footer

Archivo principal:

- `src/Layout.jsx`

Responsabilidades:

- Header sticky.
- Barra superior en desktop con telefono, email, horario y zona.
- Logo dinamico desde `SiteSettings`.
- Navegacion principal: Productos, Servicios, Te ayudamos a elegir, Reservar instalacion.
- Busqueda en header.
- Acceso a presupuesto.
- Carrito.
- Perfil.
- Menu lateral movil.
- Footer con enlaces a productos, servicios, zonas y paginas legales.
- Asistente IA flotante.

El header esta pensado como punto de conversion: lleva al catalogo, wizard, reserva, presupuesto y carrito.

## 9. Cliente Base44 y entidades

Cliente:

- `src/api/base44Client.js`

Se crea con:

- `createClient` de `@base44/sdk`.
- `appId`, `token`, `functionsVersion` y `appBaseUrl` desde `app-params`.
- `requiresAuth: false`, por lo que la parte publica puede cargar datos sin obligar login general.

Entidades Base44 detectadas en el proyecto:

- `BrandPage`: paginas de marca.
- `Lead`: leads generales.
- `LeadLanding`: leads de landing/presupuesto.
- `ModelPage`: paginas de modelo.
- `Order`: pedidos desde carrito.
- `PageSection`: secciones CMS.
- `Presupuesto`: presupuestos.
- `Product`: productos.
- `PromoSlide`: carrusel promocional.
- `ReservaInstalacion`: reservas de instalacion.
- `Review`: resenas/opiniones.
- `Service`: servicios.
- `SiteSettings`: ajustes generales de marca/web.
- `WebContent`: contenido web.
- `WebText`: textos editables.
- `Wizard`: configuracion de wizards.
- `WizardOption`: opciones de wizard.
- `WizardStep`: pasos de wizard.

## 10. Autenticacion y admin

Archivos clave:

- `src/lib/AuthContext.jsx`
- `src/lib/local-admin-auth.js`
- `src/pages/Admin.jsx`

El proyecto combina:

- Comprobacion de estado publico de la app en Base44.
- Token de Base44 si existe.
- Login local de administrador para desarrollo.

El login local guarda `climaclaro_local_admin` en `localStorage`. Si `VITE_ENABLE_LOCAL_ADMIN_LOGIN` no es `false`, puede usarse para acceder como:

- `role: "admin"`
- `isLocalAdmin: true`

Importante: en `Admin.jsx`, algunas consultas de datos se activan solo si el usuario es admin real y no admin local:

- `canLoadAdminData = user?.role === "admin" && !user?.isLocalAdmin`

Esto significa que el admin local puede entrar en el panel, pero algunas cargas globales del dashboard pueden no traer datos reales segun esa condicion.

## 11. Panel de administracion

Ruta:

- `/admin`

Archivo:

- `src/pages/Admin.jsx`

Secciones actuales:

- Dashboard.
- Productos.
- Servicios.
- Wizard recomendador.
- Wizard reservas.
- Wizard marca.
- Wizard presupuesto.
- Reservas.
- Pedidos.
- Leads.
- Resenas.
- Ajustes.
- Contenido web.
- Exportaciones.
- Paginas de marca.
- Carrusel promos.
- Paginas de modelo.

Componentes admin:

- `AdminDashboard.jsx`
- `AdminProducts.jsx`
- `AdminServices.jsx`
- `AdminWizard.jsx`
- `AdminBookingWizard.jsx`
- `AdminQuoteWizard.jsx`
- `AdminReservas.jsx`
- `AdminOrders.jsx`
- `AdminLeads.jsx`
- `AdminReviews.jsx`
- `AdminSiteSettings.jsx`
- `AdminCmsContent.jsx`
- `AdminExports.jsx`
- `AdminBrandPages.jsx`
- `AdminPromoSlides.jsx`
- `AdminModelPages.jsx`

El panel es el centro operativo de Clima Claro. Permite gestionar catalogo, contenido, reservas, leads y configuracion sin tocar codigo.

## 12. Catalogo de productos

Pantalla:

- `src/pages/Products.jsx`

Datos:

- Carga productos activos con `base44.entities.Product.filter({ active: true }, "sort_order", 200)`.

Funciones principales:

- Busqueda por texto.
- Filtros por familia, marca y categoria.
- Agrupacion de variantes por modelo.
- Navegacion a ficha de producto o pagina de modelo.
- Carrusel promocional mediante `PromoCarousel`.

La pantalla de productos funciona como catalogo comercial y punto de entrada hacia la compra con instalacion.

## 13. Ficha de producto

Pantalla:

- `src/pages/ProductDetail.jsx`

Datos:

- Producto por `id`.
- Servicios activos para encontrar instalacion compatible.
- Resenas del producto.

Funciones principales:

- Galeria de imagenes.
- Precio y caracteristicas clave.
- Instalacion asociada si corresponde.
- Extras de instalacion.
- Anadir producto al carrito.
- Anadir producto + instalacion al carrito.
- Formulario de dudas que crea un `Lead`.

Carrito:

- Se guarda en `localStorage` con clave `cart`.
- Se emite evento `cart-updated` para actualizar contadores.

## 14. Carrito y pedidos

Pantalla:

- `src/pages/Cart.jsx`

Funcionamiento:

- Lee el carrito desde `localStorage`.
- Permite modificar cantidades o eliminar items.
- Tiene pasos: carrito, datos, confirmacion.
- Calcula total en frontend.
- Crea un pedido en `base44.entities.Order`.
- Genera numero de pedido tipo `AC-...`.
- Al confirmar, vacia `localStorage`.

Observacion importante:

- Stripe esta instalado como dependencia, pero el flujo actual observado crea pedidos directamente. Si se quiere pago real online, conviene revisar/terminar integracion de checkout, estados de pago, webhooks y confirmacion segura.

## 15. Presupuesto

Ruta:

- `/presupuesto`

Pantalla:

- `src/pages/Presupuesto.jsx`

Objetivo:

- Captar leads con datos suficientes para que Javier pueda responder o llamar.

Campos/flujo actual:

- Paso 1: nombre, telefono, email, tipo de equipo y metros cuadrados.
- Paso 2: disponibilidad horaria, mensaje adicional y aceptacion de privacidad.

Al enviar:

- Crea un registro en `LeadLanding`.
- Invoca la funcion Base44 `notifyLeadLanding`.
- Muestra pantalla de exito con CTA a productos o inicio.

## 16. Wizard recomendador

Ruta:

- `/Wizard`

Pantalla:

- `src/pages/Wizard.jsx`

Datos:

- `Wizard`
- `WizardStep`
- `WizardOption`
- `Product`
- `ReservaInstalacion` si se reserva una franja desde el wizard.

Logica:

- Usa `scoreProducts` y `getWizardSummary` en `src/components/wizard/wizardScoring.jsx`.
- Guarda respuestas para usarlas en recomendaciones.
- Recomienda productos.
- Permite anadir productos al carrito.
- Captura lead con nombre, telefono y email.
- Crea `Lead`.
- Tambien crea `LeadLanding`.
- Puede bloquear una franja creando `ReservaInstalacion`.

Es una pieza clave de conversion porque transforma la duda tecnica del cliente en una recomendacion accionable.

## 17. Reserva de instalacion

Ruta:

- `/Reservar`

Pantallas/componentes:

- `src/pages/Reservar.jsx`
- `src/pages/BookingWizard.jsx`
- `src/components/reservar/UbicacionStep.jsx`
- `src/components/reservar/FechaStep.jsx`
- `src/components/reservar/ContactoStep.jsx`
- `src/components/reservar/ProductSelector.jsx`

Flujo:

1. Ubicacion y datos tecnicos.
2. Fecha y franja.
3. Contacto.
4. Confirmacion.

Datos:

- Carga configuracion desde `Wizard`, `WizardStep` y `WizardOption` con key de reservas.
- Carga reservas existentes desde `ReservaInstalacion`.
- Crea una nueva `ReservaInstalacion`.
- Invoca `enviarReservaAClimaplan` como integracion saliente hacia la API de ClimaPlan.

Separacion con ClimaPlan:

- La funcion `enviarReservaAClimaplan` no significa que Clima Claro y ClimaPlan compartan repositorio.
- La funcion `enviarReservaAClimaplan` no significa que compartan base de datos, tablas, migraciones ni logica interna de datos.
- Clima Claro conserva sus reservas en su propia entidad `ReservaInstalacion`.
- La comunicacion con ClimaPlan debe mantenerse como API, webhook o job documentado.

Reglas detectadas en fecha:

- Minimo 2 dias desde hoy.
- Domingo deshabilitado.
- Si manana y tarde estan ocupadas, el dia completo queda deshabilitado.
- Franjas disponibles:
  - Manana: 9:00 - 14:00.
  - Tarde: 15:00 - 19:00.

Observacion importante:

- La regla de "no fines de semana" parece aplicada solo a domingo en `FechaStep.jsx`. Si tambien se quiere bloquear sabados, hay que ajustarlo.
- La regla de "solo Madrid" depende de validacion de ubicacion/codigo postal. Conviene verificar si cubre todos los casos reales.
- La regla de "margen maximo recomendado de 10 dias desde recepcion" no se aprecia claramente en `FechaStep.jsx`; conviene revisarla si es requisito operativo firme.

## 18. Servicios

Pantallas:

- `src/pages/Services.jsx`
- `src/pages/ServiceDetail.jsx`

Componentes relacionados:

- `src/components/services/QuoteRequestModal.jsx`
- `src/components/services/QuoteWizardModal.jsx`
- `src/components/services/ServiceProductSelector.jsx`

Funcion:

- Mostrar servicios de instalacion, mantenimiento, reparacion o asesoramiento.
- Llevar a presupuesto, reserva o seleccion de producto/servicio.

Datos:

- Usa `Service` como entidad principal.

## 19. Contenido editable y textos

Entidades:

- `WebText`: textos concretos de UI.
- `WebContent`: contenido mas largo o paginas.
- `PageSection`: secciones dinamicas.
- `SiteSettings`: logo, telefono, email, horario, zona, tagline, footer, etc.

Uso:

- Muchos textos se recuperan mediante helpers tipo `t(...)`, con fallback en codigo.
- El admin incluye modulos para editar textos/contenido.

Esto permite ajustar copy comercial sin recompilar, siempre que el texto este conectado a `WebText` o al CMS.

## 20. Home

Pantalla:

- `src/pages/Home.jsx`

Componentes principales detectados:

- Hero.
- Productos destacados.
- Secciones "como funciona".
- Posible carrusel movil justo debajo del header.

Objetivo:

- Comunicar rapido "aire acondicionado + instalacion en Madrid" y mover al usuario hacia productos, wizard, reserva o presupuesto.

## 21. Busqueda

Componente:

- `src/components/layout/HeaderSearch.jsx`

Funcionamiento:

- Carga hasta 300 productos activos.
- Busca por nombre, marca, modelo o categoria.
- Deduplica por `model_code`.
- Si hay varias variantes de un modelo, navega a pagina de modelo.
- Si es una variante unica, navega a ficha de producto.

## 22. Estado visual y UX

Estilo general:

- Blanco, azul y grises claros.
- Layout limpio y comercial.
- Header sticky.
- CTAs hacia productos, wizard, reserva y presupuesto.
- Componentes con bordes redondeados, sombras suaves y enfoque moderno.

Ultimo ajuste realizado:

- Se amplio la superficie clicable de iconos del header en movil/tablet para mejorar usabilidad tactil.
- Busqueda, carrito, perfil y menu tienen ahora area tactil consistente.

## 23. Build y despliegue

Desarrollo local:

- `npm run dev`
- URL habitual: `http://localhost:5173`

Build:

- `npm run build`
- Salida: `dist`

Servidor:

- `npm run start`
- Express sirve `dist` en puerto `8080` salvo que `PORT` indique otro.

Publicacion Base44:

- Segun README, los cambios enviados al repositorio pueden reflejarse en Base44 Builder.
- La publicacion final se hace desde Base44 con "Publish".

## 24. Riesgos y puntos a revisar

1. Encoding/textos con caracteres raros

   En varios archivos se observan textos con caracteres mal codificados, por ejemplo `instalaciA?n`, `PortA?tiles`, `MaA?ana`. Visualmente puede depender de como se rendericen los datos, pero conviene normalizar archivos a UTF-8 y revisar textos visibles.

2. Pago real

   Hay dependencias de Stripe, pero el pedido actual observado se crea directamente desde carrito. Antes de vender online con pago real, hay que cerrar checkout, estados de pago, confirmacion, errores y webhooks.

3. Reglas de reserva

   La reserva bloquea domingos y fechas con ambas franjas ocupadas. Si el negocio exige no trabajar sabados, bloquear maximo 10 dias desde recepcion o validar solo Madrid por CP, conviene auditar esas reglas.

4. Admin local

   El login local es util en desarrollo, pero no debe quedar abierto sin password en entornos sensibles. Revisar `VITE_LOCAL_ADMIN_PASSWORD` y `VITE_ENABLE_LOCAL_ADMIN_LOGIN` antes de produccion.

5. Carrito en localStorage

   Es simple y rapido, pero no persistente entre dispositivos ni seguro para precios finales. El backend debe recalcular precios si se implementa pago real.

6. Rutas duplicadas o mixtas

   Hay rutas auto-generadas y rutas manuales. Funciona, pero conviene mantener documentado cuando se crea una pagina nueva para evitar duplicados.

7. SEO

   Al ser SPA, conviene revisar metadatos por pagina, indexacion, sitemap, datos estructurados y rendimiento si el objetivo es captar trafico organico en Madrid.

## 25. Prioridades recomendadas

Prioridad alta:

- Revisar reglas de reserva: sabados, Madrid, plazo maximo y relacion con recepcion del equipo.
- Revisar flujo de pago/pedido antes de aceptar compras reales.
- Normalizar textos con acentos y caracteres especiales.
- Confirmar seguridad del acceso admin en produccion.

Prioridad media:

- Mejorar SEO tecnico por pagina: titles, descriptions, sitemap, schema local business/product/service.
- Documentar campos exactos de cada entidad Base44.
- Revisar formularios para validar telefono, email, codigo postal y consentimiento legal.
- Crear pruebas basicas de los flujos criticos: presupuesto, reserva, carrito, lead de producto.

Prioridad comercial:

- Asegurar que cada pagina publica tenga CTA claro.
- Reforzar prueba de confianza: Javier, instalador real, Madrid, garantia, precio claro.
- Medir conversion de home -> wizard/presupuesto/reserva.
- Simplificar cualquier formulario que pida mas datos de los necesarios antes del contacto.

## 26. Mapa rapido de decisiones

Si quieres cambiar el logo, telefono, horario o zona:

- Revisar `SiteSettings` desde admin.
- Fallback en `Layout.jsx`.

Si quieres cambiar productos:

- Admin > Productos.
- Entidad `Product`.

Si quieres cambiar servicios/precios de instalacion:

- Admin > Servicios.
- Entidad `Service`.

Si quieres cambiar textos comerciales:

- Admin > Contenido web o textos web.
- Entidades `WebText`, `WebContent`, `PageSection`.

Si quieres cambiar recomendaciones:

- Admin > Wizard recomendador.
- Entidades `Wizard`, `WizardStep`, `WizardOption`.
- Logica de scoring en `src/components/wizard/wizardScoring.jsx`.

Si quieres cambiar reservas:

- Admin > Wizard reservas y Admin > Reservas.
- Entidad `ReservaInstalacion`.
- Logica de fecha/franja en `BookingWizard.jsx` y `FechaStep.jsx`.

Si quieres cambiar el header/footer:

- `src/Layout.jsx`.

Si quieres cambiar presupuesto:

- `src/pages/Presupuesto.jsx`.
- Funcion Base44 `notifyLeadLanding`.

## 27. Conclusion

Clima Claro esta ya montado como una plataforma comercial bastante completa: catalogo, producto, carrito, presupuesto, reservas, wizard recomendador, contenido administrable y panel interno.

La base es buena para seguir iterando. El siguiente salto no deberia ser "anadir mas cosas", sino cerrar bien los flujos que venden: presupuesto, reserva, producto + instalacion, confianza local y reglas operativas. La promesa de la marca es clara: comprar e instalar aire acondicionado en Madrid sin complicaciones. La tecnologia actual ya apunta a eso; ahora toca pulir seguridad, reglas, pago, SEO y conversion.
