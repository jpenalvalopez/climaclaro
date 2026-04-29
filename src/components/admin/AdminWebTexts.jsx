import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, X, Download } from "lucide-react";
import { invalidateCmsCache } from "@/components/cms/cmsHelpers";

// Todas las claves CMS usadas en la app con sus valores por defecto
const DEFAULT_TEXTS = [
  // Home - Hero
  { page: "home", key: "home.hero.badge",       value: "Campaña de verano — Instalación prioritaria", description: "Badge superior del hero (dejar vacío para ocultar)", type: "text" },
  { page: "home", key: "home.hero.title",        value: "Aire acondicionado e instalación, sin líos.", description: "Título principal del hero", type: "text" },
  { page: "home", key: "home.hero.subtitle",     value: "Te asesoramos, lo compras y lo instalamos. Rápido, limpio y con garantía.", description: "Subtítulo del hero", type: "text" },
  { page: "home", key: "home.hero.btn_products", value: "Ver productos", description: "Botón hero → productos", type: "button" },
  { page: "home", key: "home.hero.btn_wizard",   value: "Te ayudamos a elegir", description: "Botón hero → wizard", type: "button" },
  { page: "home", key: "home.hero.trust1",       value: "Instaladores certificados", description: "Trust badge 1", type: "text" },
  { page: "home", key: "home.hero.trust2",       value: "Garantía 3 años", description: "Trust badge 2", type: "text" },
  { page: "home", key: "home.hero.trust3",       value: "Precio sin sorpresas", description: "Trust badge 3", type: "text" },
  { page: "home", key: "home.hero.stat",         value: "+2.500 instalaciones", description: "Estadística flotante", type: "text" },
  { page: "home", key: "home.hero.stat_sub",     value: "en toda España", description: "Sub-texto estadística flotante", type: "text" },
  { page: "home", key: "home.hero.image_url",    value: "https://images.unsplash.com/photo-1631545806609-04e4c8a788df?w=700&h=500&fit=crop", description: "URL de la imagen del hero (puede subir una propia)", type: "text" },
  { page: "home", key: "home.hero.image_alt",    value: "Instalación de aire acondicionado", description: "Texto alternativo imagen hero (SEO)", type: "text" },
  // Home - How it works
  { page: "home", key: "home.howitworks.label",      value: "Así de fácil", description: "Etiqueta sección cómo funciona", type: "label" },
  { page: "home", key: "home.howitworks.title",      value: "Cómo funciona", description: "Título sección cómo funciona", type: "text" },
  { page: "home", key: "home.howitworks.step1_title",value: "Te ayudamos a elegir", description: "Paso 1 título", type: "text" },
  { page: "home", key: "home.howitworks.step1_desc", value: "Según los m², orientación y tipo de estancia, te recomendamos el equipo ideal. Sin tecnicismos.", description: "Paso 1 descripción", type: "text" },
  { page: "home", key: "home.howitworks.step2_title",value: "Compra fácil y segura", description: "Paso 2 título", type: "text" },
  { page: "home", key: "home.howitworks.step2_desc", value: "Añade al carrito, elige tus extras y paga de forma segura con tarjeta, PayPal o Bizum.", description: "Paso 2 descripción", type: "text" },
  { page: "home", key: "home.howitworks.step3_title",value: "Instalación profesional", description: "Paso 3 título", type: "text" },
  { page: "home", key: "home.howitworks.step3_desc", value: "Nuestros instaladores certificados lo montan, lo prueban y te lo dejan funcionando. Limpio y rápido.", description: "Paso 3 descripción", type: "text" },
  // Home - Featured Products
  { page: "home", key: "home.featured.label",      value: "Catálogo", description: "Etiqueta sección productos destacados", type: "label" },
  { page: "home", key: "home.featured.title",      value: "Productos destacados", description: "Título sección productos destacados", type: "text" },
  { page: "home", key: "home.featured.btn_catalog",value: "Ver todo el catálogo", description: "Enlace a todos los productos", type: "button" },
  // Home - Testimonials
  { page: "home", key: "home.testimonials.label", value: "Opiniones", description: "Etiqueta sección testimonios", type: "label" },
  { page: "home", key: "home.testimonials.title", value: "Lo que dicen nuestros clientes", description: "Título sección testimonios", type: "text" },
  // Home - Trust Badges
  { page: "home", key: "home.trust.label",       value: "Tranquilidad total", description: "Etiqueta sección por qué elegirnos", type: "label" },
  { page: "home", key: "home.trust.title",       value: "Por qué elegirnos", description: "Título sección por qué elegirnos", type: "text" },
  { page: "home", key: "home.trust.badge1_title",value: "Precio claro", type: "text", description: "Badge 1 título" },
  { page: "home", key: "home.trust.badge1_desc", value: "Sin sorpresas. El precio que ves es el precio que pagas.", type: "text", description: "Badge 1 descripción" },
  { page: "home", key: "home.trust.badge2_title",value: "Instaladores certificados", type: "text", description: "Badge 2 título" },
  { page: "home", key: "home.trust.badge2_desc", value: "Profesionales homologados con años de experiencia.", type: "text", description: "Badge 2 descripción" },
  { page: "home", key: "home.trust.badge3_title",value: "Soporte real", type: "text", description: "Badge 3 título" },
  { page: "home", key: "home.trust.badge3_desc", value: "Personas de verdad que te atienden por teléfono o WhatsApp.", type: "text", description: "Badge 3 descripción" },
  { page: "home", key: "home.trust.badge4_title",value: "Garantía y factura", type: "text", description: "Badge 4 título" },
  { page: "home", key: "home.trust.badge4_desc", value: "Garantía del fabricante + nuestra garantía de instalación.", type: "text", description: "Badge 4 descripción" },
  { page: "home", key: "home.trust.badge5_title",value: "Financiación", type: "text", description: "Badge 5 título" },
  { page: "home", key: "home.trust.badge5_desc", value: "Paga en cómodos plazos. Hasta 12 meses sin intereses.", type: "text", description: "Badge 5 descripción" },
  // Home - CTA
  { page: "home", key: "home.cta.title",         value: "¿Tienes dudas? Te asesoramos en 2 minutos.", description: "Título sección CTA final", type: "text" },
  { page: "home", key: "home.cta.subtitle",      value: "Llámanos, escríbenos por WhatsApp o rellena el formulario. Respondemos siempre.", description: "Subtítulo CTA", type: "text" },
  { page: "home", key: "home.cta.btn_call",      value: "Llamar ahora", description: "Botón llamar CTA", type: "button" },
  { page: "home", key: "home.cta.btn_whatsapp",  value: "WhatsApp", description: "Botón WhatsApp CTA", type: "button" },
  { page: "home", key: "home.cta.btn_form",      value: "Formulario", description: "Botón formulario CTA", type: "button" },
  // Services
  { page: "services", key: "services.header.label",   value: "Servicios", description: "Etiqueta cabecera página servicios", type: "label" },
  { page: "services", key: "services.header.title",   value: "Todo lo que necesitas, resuelto", description: "Título página servicios", type: "text" },
  { page: "services", key: "services.header.subtitle",value: "Desde la instalación hasta el mantenimiento. Profesionales certificados, precios claros y sin sorpresas.", description: "Subtítulo página servicios", type: "text" },
  // About
  { page: "about", key: "about.hero.title",    value: "Climatización profesional,\ntrato cercano", description: "Título hero nosotros (\\n = salto de línea)", type: "text" },
  { page: "about", key: "about.hero.subtitle", value: "Somos un equipo de profesionales apasionados por hacer que tu hogar o negocio esté siempre a la temperatura perfecta. Sin complicaciones.", description: "Subtítulo hero nosotros", type: "text" },
  { page: "about", key: "about.stat1_value",   value: "+2.500", description: "Estadística 1 valor", type: "text" },
  { page: "about", key: "about.stat1_label",   value: "Instalaciones", description: "Estadística 1 etiqueta", type: "label" },
  { page: "about", key: "about.stat2_value",   value: "+1.800", description: "Estadística 2 valor", type: "text" },
  { page: "about", key: "about.stat2_label",   value: "Clientes satisfechos", description: "Estadística 2 etiqueta", type: "label" },
  { page: "about", key: "about.stat3_value",   value: "12", description: "Estadística 3 valor", type: "text" },
  { page: "about", key: "about.stat3_label",   value: "Años de experiencia", description: "Estadística 3 etiqueta", type: "label" },
  { page: "about", key: "about.stat4_value",   value: "4.8/5", description: "Estadística 4 valor", type: "text" },
  { page: "about", key: "about.stat4_label",   value: "Valoración media", description: "Estadística 4 etiqueta", type: "label" },
  { page: "about", key: "about.whoweare.title",value: "Quiénes somos", description: "Título sección quiénes somos", type: "text" },
  { page: "about", key: "about.whoweare.body", value: "Nacimos con una idea clara: que comprar e instalar un aire acondicionado no tiene por qué ser un dolor de cabeza.\n\nEn ClimaClaro hemos simplificado todo el proceso. Te asesoramos para que elijas el equipo correcto, te damos un precio cerrado (sin letra pequeña) y nuestros instaladores certificados se encargan de que todo quede perfecto.\n\nTrabajamos con las mejores marcas del mercado y nuestro equipo técnico cuenta con más de 12 años de experiencia en climatización residencial y comercial.", description: "Texto quiénes somos (párrafos separados por \\n\\n)", type: "text" },
  { page: "about", key: "about.howwework.title",value: "Cómo trabajamos", description: "Título lista cómo trabajamos", type: "text" },
  { page: "about", key: "about.how_we_work_list",value: "Presupuesto cerrado y detallado antes de empezar\nInstaladores propios certificados (no subcontratas)\nMaterial de primera calidad (cobre, canaletas, soportes)\nProtección de suelos y muebles durante la instalación\nLimpieza total al terminar\nPuesta en marcha y explicación del equipo\nSoporte post-venta real (no un contestador)", description: "Lista cómo trabajamos (un item por línea)", type: "text" },
  { page: "about", key: "about.install.title",     value: "Qué incluye una buena instalación", description: "Título lista qué incluye instalación", type: "text" },
  { page: "about", key: "about.install_includes_list",value: "Estudio previo del espacio y necesidades\nTubería de cobre de calidad con aislamiento\nCableado eléctrico independiente\nDesagüe correctamente canalizado\nSoporte antivibraciones para exterior\nVaciado y carga de gas refrigerante\nTest de rendimiento y estanqueidad", description: "Lista qué incluye la instalación (un item por línea)", type: "text" },
  { page: "about", key: "about.reviews.title",     value: "Lo que dicen de nosotros", description: "Título sección reseñas en nosotros", type: "text" },
  // Contact
  { page: "contact", key: "contact.header.label",    value: "Contacto", description: "Etiqueta cabecera contacto", type: "label" },
  { page: "contact", key: "contact.header.title",    value: "Hablemos", description: "Título página contacto", type: "text" },
  { page: "contact", key: "contact.header.subtitle", value: "Cuéntanos qué necesitas. Respondemos en menos de 24 horas.", description: "Subtítulo página contacto", type: "text" },
  { page: "contact", key: "contact.info.direct_title",value: "Contacto directo", description: "Título bloque contacto directo", type: "text" },
  { page: "contact", key: "contact.info.phone_label", value: "Llamada gratuita", description: "Sub-texto teléfono", type: "label" },
  { page: "contact", key: "contact.info.wa_label",    value: "Respuesta inmediata", description: "Sub-texto WhatsApp", type: "label" },
  { page: "contact", key: "contact.info.schedule_title",value: "Horario", description: "Título horario", type: "text" },
  { page: "contact", key: "contact.info.schedule",    value: "Lunes a Viernes: 9:00 – 19:00\nSábados: 10:00 – 14:00\nDomingos y festivos: cerrado", description: "Texto horario (una línea por franja)", type: "text" },
  { page: "contact", key: "contact.info.zones_title", value: "Zonas de servicio", description: "Título zonas", type: "text" },
  { page: "contact", key: "contact.info.zones",       value: "Madrid y alrededores\nBarcelona y alrededores\nValencia y alrededores\nSevilla y alrededores\n¿Otra zona? Consúltanos.", description: "Zonas de servicio (una por línea)", type: "text" },
  { page: "contact", key: "contact.form.title",       value: "Cuéntanos qué necesitas", description: "Título formulario contacto", type: "text" },
  { page: "contact", key: "contact.form.name_placeholder",   value: "Tu nombre *", type: "placeholder", description: "Placeholder campo nombre" },
  { page: "contact", key: "contact.form.phone_placeholder",  value: "Teléfono *", type: "placeholder", description: "Placeholder campo teléfono" },
  { page: "contact", key: "contact.form.email_placeholder",  value: "Email", type: "placeholder", description: "Placeholder campo email" },
  { page: "contact", key: "contact.form.city_placeholder",   value: "Ciudad", type: "placeholder", description: "Placeholder campo ciudad" },
  { page: "contact", key: "contact.form.message_placeholder",value: "¿Qué necesitas? (instalación, mantenimiento, asesoramiento...)", type: "placeholder", description: "Placeholder campo mensaje" },
  { page: "contact", key: "contact.form.submit",       value: "Enviar mensaje", type: "button", description: "Botón enviar formulario" },
  { page: "contact", key: "contact.form.sending",      value: "Enviando...", type: "button", description: "Botón enviando" },
  { page: "contact", key: "contact.form.success_title",value: "¡Mensaje enviado!", type: "text", description: "Título éxito formulario" },
  { page: "contact", key: "contact.form.success_subtitle",value: "Te contactaremos lo antes posible.", type: "text", description: "Subtítulo éxito formulario" },
  // Product Detail - Installation Banner & Modal
  { page: "product_detail", key: "product_detail.install_banner.title",    value: "¿Quieres que lo instalemos nosotros?", description: "Banner instalación: título principal", type: "text" },
  { page: "product_detail", key: "product_detail.install_banner.subtitle", value: "Instalación profesional con garantía. Técnicos certificados en tu zona.", description: "Banner instalación: subtítulo", type: "text" },
  { page: "product_detail", key: "product_detail.install_banner.cta",      value: "Ver condiciones de instalación", description: "Banner instalación: texto del enlace", type: "button" },
  { page: "product_detail", key: "product_detail.install_modal.title",     value: "Condiciones de instalación", description: "Modal instalación: título", type: "text" },
  { page: "product_detail", key: "product_detail.install_modal.intro",     value: "Nuestro equipo de técnicos certificados se encarga de todo. Aquí tienes lo que necesitas saber:", description: "Modal instalación: texto introductorio", type: "text" },
  { page: "product_detail", key: "product_detail.install_modal.included",  value: "Desmontaje del equipo antiguo si es necesario\nMontaje de unidad interior y exterior\nConexión eléctrica y de refrigerante\nHasta 3 metros de tubería incluida\nPuesta en marcha y pruebas\nFormación básica de uso al cliente", description: "Modal instalación: qué incluye (una línea por item)", type: "text" },
  { page: "product_detail", key: "product_detail.install_modal.not_included", value: "Obra de albañilería\nTubería adicional más allá de 3 metros\nCableado eléctrico de nueva instalación", description: "Modal instalación: qué NO incluye (una línea por item)", type: "text" },
  { page: "product_detail", key: "product_detail.install_modal.conditions",value: "La instalación se coordina contigo por teléfono. El técnico visitará tu domicilio en la franja horaria acordada. Si el equipo requiere condiciones especiales, se te informará antes de confirmar la cita.", description: "Modal instalación: condiciones generales", type: "text" },
  { page: "product_detail", key: "product_detail.install_modal.cta_reserve", value: "Reservar instalación", description: "Modal instalación: botón reservar", type: "button" },
  { page: "product_detail", key: "product_detail.install_modal.cta_contact", value: "Tengo dudas, prefiero que me llamen", description: "Modal instalación: enlace secundario cerrar", type: "button" },
  // Wizard
  { page: "wizard", key: "wizard.title",           value: "Te ayudamos a elegir", type: "text", description: "Título página wizard" },
  { page: "wizard", key: "wizard.subtitle",        value: "Responde unas preguntas rápidas y te recomendamos el equipo ideal.", type: "text", description: "Subtítulo wizard" },
  { page: "wizard", key: "wizard.result.title",    value: "¡Tenemos tu recomendación!", type: "text", description: "Título resultado wizard" },
  { page: "wizard", key: "wizard.result.subtitle", value: "Déjanos tus datos y te asesoramos sin compromiso.", type: "text", description: "Subtítulo resultado wizard" },
  { page: "wizard", key: "wizard.lead.cta_submit", value: "Recibir mi recomendación", type: "button", description: "Botón enviar lead wizard" },
  { page: "wizard", key: "wizard.lead.success_message",value: "¡Gracias! Te contactaremos pronto.", type: "text", description: "Mensaje éxito lead wizard" },
  { page: "wizard", key: "wizard.catalog_link_label",value: "O explora el catálogo directamente →", type: "button", description: "Enlace al catálogo desde wizard" },
  // Presupuesto
  { page: "presupuesto", key: "presupuesto.success.title", value: "¡Lo tenemos!", type: "text", description: "Titulo del mensaje de exito" },
  { page: "presupuesto", key: "presupuesto.success.subtitle", value: "Te llamamos en menos de 24h. Mientras tanto puedes explorar nuestros equipos.", type: "text", description: "Subtitulo del mensaje de exito" },
  { page: "presupuesto", key: "presupuesto.success.btn_products", value: "Ver productos", type: "button", description: "Boton del mensaje de exito: ver productos" },
  { page: "presupuesto", key: "presupuesto.success.btn_home", value: "Volver al inicio", type: "button", description: "Boton del mensaje de exito: volver al inicio" },
  { page: "presupuesto", key: "presupuesto.hero.title", value: "Tu presupuesto gratis en 24h", type: "text", description: "Titulo principal de la pagina presupuesto" },
  { page: "presupuesto", key: "presupuesto.hero.subtitle", value: "Cuentanos que necesitas y te llamamos sin compromiso", type: "text", description: "Subtitulo del hero de presupuesto" },
  { page: "presupuesto", key: "presupuesto.hero.badge1", value: "Sin compromiso", type: "text", description: "Badge 1 del hero de presupuesto" },
  { page: "presupuesto", key: "presupuesto.hero.badge2", value: "Precio cerrado", type: "text", description: "Badge 2 del hero de presupuesto" },
  { page: "presupuesto", key: "presupuesto.hero.badge3", value: "Tecnicos certificados", type: "text", description: "Badge 3 del hero de presupuesto" },
  { page: "presupuesto", key: "presupuesto.step.counter", value: "Paso {step} de 2", type: "text", description: "Texto del contador de pasos. Usa {step} como placeholder." },
  { page: "presupuesto", key: "presupuesto.step1.title", value: "¿Que necesitas?", type: "text", description: "Titulo del paso 1" },
  { page: "presupuesto", key: "presupuesto.step1.name_label", value: "Nombre completo *", type: "label", description: "Etiqueta del campo nombre" },
  { page: "presupuesto", key: "presupuesto.step1.name_placeholder", value: "Tu nombre", type: "placeholder", description: "Placeholder del campo nombre" },
  { page: "presupuesto", key: "presupuesto.step1.phone_label", value: "Telefono *", type: "label", description: "Etiqueta del campo telefono" },
  { page: "presupuesto", key: "presupuesto.step1.phone_placeholder", value: "600 000 000", type: "placeholder", description: "Placeholder del campo telefono" },
  { page: "presupuesto", key: "presupuesto.step1.email_label", value: "Email", type: "label", description: "Etiqueta del campo email" },
  { page: "presupuesto", key: "presupuesto.step1.email_placeholder", value: "tucorreo@ejemplo.com", type: "placeholder", description: "Placeholder del campo email" },
  { page: "presupuesto", key: "presupuesto.step1.type_label", value: "Tipo de equipo *", type: "label", description: "Etiqueta selector tipo de equipo" },
  { page: "presupuesto", key: "presupuesto.step1.size_label", value: "Metros cuadrados *", type: "label", description: "Etiqueta selector metros cuadrados" },
  { page: "presupuesto", key: "presupuesto.step1.next", value: "Siguiente", type: "button", description: "Boton siguiente del paso 1" },
  { page: "presupuesto", key: "presupuesto.step2.title", value: "¿Cuando puedes?", type: "text", description: "Titulo del paso 2" },
  { page: "presupuesto", key: "presupuesto.step2.availability_label", value: "Disponibilidad horaria *", type: "label", description: "Etiqueta selector disponibilidad" },
  { page: "presupuesto", key: "presupuesto.step2.message_label", value: "Mensaje adicional", type: "label", description: "Etiqueta del textarea de mensaje" },
  { page: "presupuesto", key: "presupuesto.step2.message_placeholder", value: "Cuentanos algo mas si quieres...", type: "placeholder", description: "Placeholder del textarea de mensaje" },
  { page: "presupuesto", key: "presupuesto.step2.privacy_prefix", value: "Acepto la", type: "text", description: "Texto previo al enlace de privacidad" },
  { page: "presupuesto", key: "presupuesto.step2.privacy_link", value: "politica de privacidad", type: "text", description: "Texto del enlace de privacidad" },
  { page: "presupuesto", key: "presupuesto.step2.privacy_suffix", value: "y consiento el tratamiento de mis datos para recibir el presupuesto solicitado.", type: "text", description: "Texto posterior al enlace de privacidad" },
  { page: "presupuesto", key: "presupuesto.step2.back", value: "Atras", type: "button", description: "Boton atras del paso 2" },
  { page: "presupuesto", key: "presupuesto.step2.submit", value: "Quiero mi presupuesto gratis →", type: "button", description: "Boton enviar del paso 2" },
  { page: "presupuesto", key: "presupuesto.step2.submitting", value: "Enviando...", type: "button", description: "Texto del boton enviar al guardar" },
  { page: "presupuesto", key: "presupuesto.trust.card1_title", value: "Respuesta en menos de 24h", type: "text", description: "Titulo tarjeta confianza 1" },
  { page: "presupuesto", key: "presupuesto.trust.card1_desc", value: "Te contactamos rapido, sin esperas", type: "text", description: "Descripcion tarjeta confianza 1" },
  { page: "presupuesto", key: "presupuesto.trust.card2_title", value: "Garantia 3 anos", type: "text", description: "Titulo tarjeta confianza 2" },
  { page: "presupuesto", key: "presupuesto.trust.card2_desc", value: "En equipo e instalacion", type: "text", description: "Descripcion tarjeta confianza 2" },
  { page: "presupuesto", key: "presupuesto.trust.card3_title", value: "Instalamos en Madrid", type: "text", description: "Titulo tarjeta confianza 3" },
  { page: "presupuesto", key: "presupuesto.trust.card3_desc", value: "Toda la Comunidad de Madrid", type: "text", description: "Descripcion tarjeta confianza 3" },
  { page: "presupuesto", key: "presupuesto.option.type.split_pared", value: "Split Pared", type: "text", description: "Opcion tipo de equipo: split pared" },
  { page: "presupuesto", key: "presupuesto.option.type.multisplit", value: "Multisplit", type: "text", description: "Opcion tipo de equipo: multisplit" },
  { page: "presupuesto", key: "presupuesto.option.type.portatil", value: "Portatil", type: "text", description: "Opcion tipo de equipo: portatil" },
  { page: "presupuesto", key: "presupuesto.option.type.cassette", value: "Cassette", type: "text", description: "Opcion tipo de equipo: cassette" },
  { page: "presupuesto", key: "presupuesto.option.type.conductos", value: "Conductos", type: "text", description: "Opcion tipo de equipo: conductos" },
  { page: "presupuesto", key: "presupuesto.option.type.asesoramiento", value: "No lo se", type: "text", description: "Opcion tipo de equipo: no lo se" },
  { page: "presupuesto", key: "presupuesto.option.metros.rango1", value: "< 20 m2", type: "text", description: "Opcion metros: rango 1" },
  { page: "presupuesto", key: "presupuesto.option.metros.rango2", value: "20-35 m2", type: "text", description: "Opcion metros: rango 2" },
  { page: "presupuesto", key: "presupuesto.option.metros.rango3", value: "35-50 m2", type: "text", description: "Opcion metros: rango 3" },
  { page: "presupuesto", key: "presupuesto.option.metros.rango4", value: "50-70 m2", type: "text", description: "Opcion metros: rango 4" },
  { page: "presupuesto", key: "presupuesto.option.metros.rango5", value: "+ 70 m2", type: "text", description: "Opcion metros: rango 5" },
  { page: "presupuesto", key: "presupuesto.option.disponibilidad.mananas", value: "Mananas", type: "text", description: "Opcion disponibilidad: manana etiqueta" },
  { page: "presupuesto", key: "presupuesto.option.disponibilidad.mananas_sub", value: "9:00 - 14:00", type: "text", description: "Opcion disponibilidad: manana subtitulo" },
  { page: "presupuesto", key: "presupuesto.option.disponibilidad.tardes", value: "Tardes", type: "text", description: "Opcion disponibilidad: tardes etiqueta" },
  { page: "presupuesto", key: "presupuesto.option.disponibilidad.tardes_sub", value: "14:00 - 19:00", type: "text", description: "Opcion disponibilidad: tardes subtitulo" },
  { page: "presupuesto", key: "presupuesto.option.disponibilidad.cualquier", value: "Cualquier horario", type: "text", description: "Opcion disponibilidad: cualquier horario etiqueta" },
  { page: "presupuesto", key: "presupuesto.option.disponibilidad.cualquier_sub", value: "Me adapto", type: "text", description: "Opcion disponibilidad: cualquier horario subtitulo" },
];


const PAGES = ["global","home","products","product_detail","services","service_detail","booking","cart","checkout","about","contact","wizard","presupuesto","footer"];
const TYPES = ["text","button","label","placeholder","error","seo_title","seo_description"];

const TYPE_COLORS = {
  text: "bg-gray-100 text-gray-700",
  button: "bg-blue-100 text-blue-700",
  label: "bg-purple-100 text-purple-700",
  placeholder: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
  seo_title: "bg-green-100 text-green-700",
  seo_description: "bg-emerald-100 text-emerald-700",
};

const EMPTY = { page: "global", key: "", value: "", description: "", type: "text", active: true, sort_order: 100 };

export default function AdminWebTexts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterPage, setFilterPage] = useState("all");
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["webtexts_admin"],
    queryFn: () => base44.entities.WebText.list("sort_order", 500)
  });

  const saveMutation = useMutation({
    mutationFn: d => d.id ? base44.entities.WebText.update(d.id, d) : base44.entities.WebText.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["webtexts_admin"] }); invalidateCmsCache(qc); closeForm(); }
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.WebText.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["webtexts_admin"] }); invalidateCmsCache(qc); }
  });

  const [initializing, setInitializing] = useState(false);

  const closeForm = () => { setShowForm(false); setEditItem(null); };
  const set = (f, v) => setEditItem(s => ({ ...s, [f]: v }));
  const openNew = () => { setEditItem({ ...EMPTY }); setShowForm(true); };
  const openEdit = (item) => { setEditItem({ ...item }); setShowForm(true); };

  const handleInitDefaults = async () => {
    setInitializing(true);
    const existingKeys = new Set(items.map(i => i.key));
    const missing = DEFAULT_TEXTS.filter(d => !existingKeys.has(d.key));
    for (const text of missing) {
      await base44.entities.WebText.create({ ...text, active: true, sort_order: 100 });
    }
    qc.invalidateQueries({ queryKey: ["webtexts_admin"] });
    invalidateCmsCache(qc);
    setInitializing(false);
  };

  const filtered = items.filter(i => {
    const matchPage = filterPage === "all" || i.page === filterPage;
    const q = search.toLowerCase();
    const matchSearch = !q || i.key?.toLowerCase().includes(q) || i.value?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q);
    return matchPage && matchSearch;
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap flex-1">
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar clave o valor..." className="pl-8 text-sm h-9" />
            {search && <button onClick={() => setSearch("")} className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
          </div>
          <Select value={filterPage} onValueChange={setFilterPage}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="Página" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las páginas</SelectItem>
              {PAGES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-gray-400 self-center">{filtered.length} textos</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleInitDefaults} disabled={initializing} variant="outline" className="gap-2 h-9 text-sm border-[#00509E] text-[#00509E]">
            <Download className="w-4 h-4" /> {initializing ? "Cargando..." : "Inicializar textos por defecto"}
          </Button>
          <Button onClick={openNew} className="bg-[#00509E] hover:bg-[#003366] text-white gap-2 h-9 text-sm">
            <Plus className="w-4 h-4" /> Nuevo texto
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-600 font-semibold text-xs uppercase">Página</th>
                <th className="px-4 py-3 text-gray-600 font-semibold text-xs uppercase">Clave</th>
                <th className="px-4 py-3 text-gray-600 font-semibold text-xs uppercase">Valor</th>
                <th className="px-4 py-3 text-gray-600 font-semibold text-xs uppercase w-28">Tipo</th>
                <th className="px-4 py-3 text-gray-600 font-semibold text-xs uppercase w-20">Estado</th>
                <th className="px-4 py-3 text-gray-600 font-semibold text-xs uppercase w-20">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Sin resultados</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className={`border-b hover:bg-gray-50 ${!item.active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-2.5"><Badge className="bg-gray-100 text-gray-600 text-xs">{item.page}</Badge></td>
                  <td className="px-4 py-2.5 font-mono text-xs text-[#003366] max-w-[200px] truncate">{item.key}</td>
                  <td className="px-4 py-2.5 text-gray-700 max-w-[280px] truncate">{item.value}</td>
                  <td className="px-4 py-2.5"><Badge className={`text-xs ${TYPE_COLORS[item.type] || "bg-gray-100 text-gray-600"}`}>{item.type}</Badge></td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => { saveMutation.mutate({ ...item, active: !item.active }); }}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {item.active ? "Activo" : "Inact."}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openEdit(item)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => confirm("¿Eliminar?") && deleteMutation.mutate(item.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) closeForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem?.id ? "Editar texto" : "Nuevo texto"}</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Página</Label>
                  <Select value={editItem.page} onValueChange={v => set("page", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAGES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={editItem.type} onValueChange={v => set("type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Clave * <span className="text-gray-400 font-normal text-xs">(ej: wizard.button.next)</span></Label>
                <Input value={editItem.key} onChange={e => set("key", e.target.value)} className="font-mono text-sm" />
              </div>
              <div>
                <Label>Valor *</Label>
                <Textarea value={editItem.value} onChange={e => set("value", e.target.value)} rows={3} />
              </div>
              <div>
                <Label>Descripción interna <span className="text-gray-400 font-normal text-xs">(opcional)</span></Label>
                <Input value={editItem.description || ""} onChange={e => set("description", e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="wt-active" checked={editItem.active !== false} onChange={e => set("active", e.target.checked)} />
                  <Label htmlFor="wt-active">Activo</Label>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Label>Orden</Label>
                  <Input type="number" value={editItem.sort_order} onChange={e => set("sort_order", parseInt(e.target.value) || 100)} className="w-20 h-8 text-sm" />
                </div>
              </div>
              <Button onClick={() => saveMutation.mutate(editItem)} disabled={saveMutation.isPending || !editItem.key || !editItem.value}
                className="w-full bg-[#00509E] hover:bg-[#003366] text-white">
                {saveMutation.isPending ? "Guardando..." : "Guardar texto"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
