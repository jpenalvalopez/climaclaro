/**
 * Página genérica para mostrar un WebContent por clave.
 * Usada para: /nosotros, /condiciones-instalacion, /garantia, /devoluciones
 * Recibe: ?key=about.nosotros  o  prop contentKey
 */
import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getContent } from "@/components/cms/cmsHelpers";
import { useQuery } from "@tanstack/react-query";

const PAGE_CONFIGS = {
  "about.nosotros": {
    fallbackTitle: "Nosotros",
    fallbackContent: `# Nosotros — ClimaClaro

Nacimos con una idea clara: que comprar e instalar un aire acondicionado no tiene por qué ser un dolor de cabeza.

Demasiadas veces, los clientes se encuentran con presupuestos opacos, instaladores que no aparecen y equipos que no son los adecuados para su espacio.

En **ClimaClaro** hemos simplificado todo el proceso. Te asesoramos para que elijas el equipo correcto, te damos un precio cerrado (sin letra pequeña) y nuestros instaladores certificados se encargan de que todo quede perfecto.

Trabajamos con las mejores marcas del mercado y nuestro equipo técnico cuenta con más de 12 años de experiencia en climatización residencial y comercial.

## Cómo trabajamos

- Presupuesto cerrado y detallado antes de empezar
- Instaladores propios certificados (no subcontratas)
- Material de primera calidad (cobre, canaletas, soportes)
- Protección de suelos y muebles durante la instalación
- Limpieza total al terminar
- Puesta en marcha y explicación del equipo
- Soporte post-venta real (no un contestador)
`
  },
  "install.condiciones": {
    fallbackTitle: "Condiciones de instalación",
    fallbackContent: `# Condiciones de instalación

## ¿Qué incluye la instalación estándar?

La instalación estándar incluye:

- Montaje de unidad interior y exterior
- Tubería de cobre de calidad con aislamiento térmico (hasta 3 metros)
- Cableado eléctrico independiente (hasta 5 metros)
- Desagüe correctamente canalizado (hasta 2 metros)
- Soporte antivibraciones para la unidad exterior
- Vaciado y carga de gas refrigerante
- Test de rendimiento y estanqueidad
- Puesta en marcha y explicación del equipo

## Condiciones adicionales

La instalación se realizará siempre que el acceso al inmueble sea seguro y viable. Para instalaciones que requieran materiales adicionales (tuberías largas, trabajos en fachada, etc.) se realizará un presupuesto adicional.

## Zonas de servicio

Realizamos instalaciones en Madrid, Barcelona, Valencia y Sevilla y sus áreas metropolitanas.

## Garantía de la instalación

Todas nuestras instalaciones tienen **2 años de garantía** en mano de obra.
`
  },
  "warranty.garantia": {
    fallbackTitle: "Garantía",
    fallbackContent: `# Política de garantía

## Garantía del equipo

Todos los equipos que vendemos incluyen la **garantía oficial del fabricante**, que varía según la marca:

- **LG, Daikin, Mitsubishi**: 2 años de garantía oficial + extensible hasta 5 años registrando el producto.
- **Samsung**: 2 años de garantía oficial.
- **Otras marcas**: consultar en cada ficha de producto.

## Garantía de la instalación

Todas nuestras instalaciones tienen **2 años de garantía** en mano de obra, cubriendo defectos de ejecución o materiales utilizados por nuestro equipo.

## ¿Qué cubre la garantía?

- Defectos de fabricación del equipo
- Fallos en la instalación atribuibles a nuestro equipo
- Piezas cubiertas por el fabricante

## ¿Qué NO cubre la garantía?

- Daños por mal uso o negligencia
- Golpes o daños físicos
- Modificaciones realizadas por terceros no autorizados
- Falta de mantenimiento recomendado

## Cómo ejercer la garantía

Contacta con nosotros en **info@climaclaro.es** o llama al **900 000 000** con tu número de pedido y descripción del problema.
`
  },
  "returns.devoluciones": {
    fallbackTitle: "Política de devoluciones",
    fallbackContent: `# Política de devoluciones y desistimiento

## Derecho de desistimiento

De acuerdo con la normativa europea, tienes **14 días naturales** desde la recepción del producto para ejercer tu derecho de desistimiento sin necesidad de justificación.

## Condiciones para la devolución

Para aceptar una devolución, el producto debe:

- Estar en perfecto estado, sin signos de uso
- Incluir todos los accesorios, manuales y embalaje original
- No haber sido instalado

## Productos no admitidos a devolución

- Equipos ya instalados
- Productos personalizados o fabricados a medida
- Equipos con daños causados por el usuario

## Proceso de devolución

1. Envía un email a **devoluciones@climaclaro.es** indicando tu número de pedido y motivo.
2. Te enviaremos las instrucciones para el envío o recogida.
3. Una vez recibido e inspeccionado el producto, procesaremos el reembolso en un plazo máximo de **14 días**.

## Gastos de devolución

Los gastos de envío de la devolución corren a cargo del cliente, excepto si el producto tiene un defecto o fue enviado por error nuestro.

## Contacto

**devoluciones@climaclaro.es** | Tel: 900 000 000
`
  },
  "legal.aviso": {
    fallbackTitle: "Aviso legal",
    fallbackContent: `# Aviso legal

## Titular del sitio web

En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico, se informa que el presente sitio web es titularidad de la empresa responsable del servicio.

## Objeto

El presente aviso legal regula el uso del sitio web. La utilización del sitio web atribuye la condición de usuario e implica la aceptación plena de todas las condiciones incluidas en este aviso legal.

## Propiedad intelectual e industrial

Todos los contenidos del sitio web, incluyendo textos, fotografías, gráficos, imágenes, iconos, tecnología, software, así como su diseño gráfico y códigos fuente, constituyen una obra cuya propiedad pertenece al titular, sin que puedan entenderse cedidos al usuario ninguno de los derechos de explotación reconocidos por la normativa vigente en materia de propiedad intelectual.

## Responsabilidad

El titular del sitio web no se hace responsable del uso que los usuarios hagan del sitio web ni de los daños que pudieran derivarse de dicho uso.
`
  },
  "privacy.rgpd": {
    fallbackTitle: "Política de privacidad",
    fallbackContent: `# Política de privacidad

## Responsable del tratamiento

El responsable del tratamiento de sus datos personales es el titular de este sitio web.

## Finalidad del tratamiento

Los datos personales recabados a través de los formularios del sitio web serán utilizados para:

- Gestionar su solicitud de presupuesto o consulta
- Coordinar la instalación o servicio técnico solicitado
- Enviar comunicaciones relacionadas con el servicio contratado

## Base jurídica

El tratamiento de sus datos se basa en el consentimiento del interesado y en la ejecución del contrato de prestación de servicios.

## Conservación de datos

Sus datos se conservarán durante el tiempo necesario para la prestación del servicio y el cumplimiento de las obligaciones legales aplicables.

## Derechos

Puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad enviando un correo a **info@climaclaro.es**.

## Seguridad

Aplicamos las medidas técnicas y organizativas adecuadas para garantizar la seguridad de sus datos personales.
`
  },
  "cookies.policy": {
    fallbackTitle: "Política de cookies",
    fallbackContent: `# Política de cookies

## ¿Qué son las cookies?

Las cookies son pequeños archivos de texto que los sitios web almacenan en su dispositivo cuando los visita. Se utilizan ampliamente para hacer que los sitios web funcionen de manera más eficiente.

## Tipos de cookies que utilizamos

### Cookies técnicas (necesarias)
Son imprescindibles para el funcionamiento del sitio web. Permiten la navegación y el uso de las funciones básicas.

### Cookies analíticas
Nos permiten conocer cómo los usuarios interactúan con el sitio web, qué páginas visitan y cuánto tiempo permanecen en ellas. Esta información se utiliza de forma agregada y anónima.

### Cookies de preferencias
Permiten recordar información para personalizar su experiencia (por ejemplo, el idioma o la región).

## Cómo gestionar las cookies

Puede configurar su navegador para rechazar todas las cookies o para que le avise cuando se envíe una cookie. Tenga en cuenta que algunas funciones del sitio web pueden no funcionar correctamente si deshabilita las cookies.

## Más información

Para más información, contacte con nosotros en **info@climaclaro.es**.
`
  },
  "terms.general": {
    fallbackTitle: "Condiciones de contratación",
    fallbackContent: `# Condiciones generales de contratación

## Objeto

Las presentes condiciones generales regulan la relación contractual entre el prestador del servicio y el cliente derivada de la contratación de productos y servicios a través del sitio web.

## Proceso de contratación

1. El cliente selecciona el producto o servicio y lo añade al carrito.
2. Completa el formulario con sus datos de contacto y dirección de instalación.
3. Confirma el pedido y recibe un email de confirmación.
4. Nos ponemos en contacto para coordinar la fecha de instalación.

## Precios

Todos los precios incluyen IVA. El precio final es el indicado en el momento de la confirmación del pedido.

## Forma de pago

Aceptamos pago con tarjeta de crédito/débito, PayPal y Bizum.

## Plazo de entrega e instalación

Los plazos de instalación se acordarán con el cliente en el momento de confirmar el pedido, en función de la disponibilidad del equipo técnico en su zona.

## Cancelación

El cliente puede cancelar su pedido antes de que se haya iniciado la instalación, recibiendo el reembolso íntegro del importe pagado.

## Legislación aplicable

Las presentes condiciones se rigen por la legislación española vigente.

## Contacto

Para cualquier consulta relacionada con su contrato, contacte con nosotros en **info@climaclaro.es**.
`
  }
};

export default function ContentPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const contentKey = params.get("key") || "about.nosotros";
  const config = PAGE_CONFIGS[contentKey] || { fallbackTitle: "Contenido", fallbackContent: "Página en construcción." };

  const { data: contentData, isLoading } = useQuery({
    queryKey: ["webcontent", contentKey],
    queryFn: () => getContent(contentKey, config.fallbackTitle, config.fallbackContent)
  });

  const data = contentData || { title: config.fallbackTitle, content: config.fallbackContent, content_format: "markdown" };
  const pageTitle = data.title || config.fallbackTitle;

  // SEO dinámico
  useEffect(() => {
    if (!pageTitle) return;
    document.title = `${pageTitle} — ClimaClaro`;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    const descText = (data.content || config.fallbackContent || "").replace(/[#*_\n]/g, " ").slice(0, 160).trim();
    metaDesc.content = descText;

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) { ogTitle = document.createElement("meta"); ogTitle.setAttribute("property", "og:title"); document.head.appendChild(ogTitle); }
    ogTitle.content = `${pageTitle} — ClimaClaro`;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = window.location.href;
  }, [pageTitle, data.content]);

  const mdComponents = {
    h1: ({ children }) => (
      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.75rem", fontWeight: 700, color: "#003366", marginBottom: "1rem", marginTop: "2rem", paddingBottom: "0.75rem", borderBottom: "2px solid rgba(0,80,158,0.15)" }}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.35rem", fontWeight: 600, color: "#003366", marginBottom: "0.75rem", marginTop: "2rem", paddingBottom: "0.5rem", borderBottom: "1px solid #e5e7eb" }}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.1rem", fontWeight: 600, color: "#00509E", marginBottom: "0.5rem", marginTop: "1.5rem" }}>
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p style={{ color: "#374151", lineHeight: "1.8", marginBottom: "1rem", fontSize: "1rem" }}>{children}</p>
    ),
    ul: ({ children }) => (
      <ul style={{ marginBottom: "1.25rem", paddingLeft: "0", listStyle: "none" }}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol style={{ marginBottom: "1.25rem", paddingLeft: "1.5rem", listStyleType: "decimal" }}>{children}</ol>
    ),
    li: ({ children, ordered }) => (
      <li style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", color: "#374151", marginBottom: "0.5rem" }}>
        <span style={{ marginTop: "0.5rem", width: "0.5rem", height: "0.5rem", borderRadius: "50%", backgroundColor: "#00509E", flexShrink: 0, display: "inline-block" }} />
        <span>{children}</span>
      </li>
    ),
    strong: ({ children }) => (
      <strong style={{ fontWeight: 600, color: "#003366" }}>{children}</strong>
    ),
    a: ({ href, children }) => (
      <a href={href} style={{ color: "#00509E", textDecoration: "underline" }}>{children}</a>
    ),
    blockquote: ({ children }) => (
      <blockquote style={{ borderLeft: "4px solid #00509E", paddingLeft: "1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", backgroundColor: "#EFF6FF", borderRadius: "0 0.5rem 0.5rem 0", color: "#374151", fontStyle: "italic", margin: "1rem 0" }}>{children}</blockquote>
    ),
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#003366] to-[#00509E] text-white py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <Link to={createPageUrl("Home")} className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
          {isLoading ? (
            <div className="h-10 w-64 bg-white/20 rounded animate-pulse" />
          ) : (
            <h1 className="text-2xl md:text-4xl font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {pageTitle}
            </h1>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
          {data.image_url && (
            <img src={data.image_url} alt={pageTitle} className="w-full rounded-xl mb-8 object-cover max-h-80" />
          )}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => <div key={i} className={`h-4 bg-gray-100 rounded animate-pulse ${i % 3 === 2 ? "w-3/4" : "w-full"}`} />)}
            </div>
          ) : (
            <div>
              {data.content_format === "html" ? (
                // Si el HTML no tiene etiquetas reales, lo tratamos como texto con saltos de línea
                (data.content || "").includes("<") ? (
                  <div
                    style={{ color: "#374151", lineHeight: "1.8", fontSize: "1rem" }}
                    dangerouslySetInnerHTML={{ __html: (data.content || "").replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "") }}
                  />
                ) : (
                  <ReactMarkdown components={mdComponents}>
                    {(data.content || "").replace(/\n\n/g, "\n\n").trim() || config.fallbackContent}
                  </ReactMarkdown>
                )
              ) : (
                <ReactMarkdown components={mdComponents}>
                  {data.content || config.fallbackContent}
                </ReactMarkdown>
              )}
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link to={createPageUrl("Home")} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#00509E] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
