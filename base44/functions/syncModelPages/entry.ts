import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { data, event } = body;

    // Solo actuar si el producto tiene model_code
    const modelCode = data?.model_code;
    if (!modelCode) {
      return Response.json({ skipped: true, reason: "no model_code" });
    }

    // Si el producto fue eliminado, no hacemos nada (la ModelPage se conserva)
    if (event?.type === "delete") {
      return Response.json({ skipped: true, reason: "delete event ignored" });
    }

    const slug = modelCode.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Buscar si ya existe ModelPage para este model_code
    const existing = await base44.asServiceRole.entities.ModelPage.filter({ model_code: modelCode }, "sort_order", 1);

    if (existing.length > 0) {
      // Ya existe — no sobreescribir cambios manuales, solo actualizar slug si falta
      const page = existing[0];
      if (!page.slug) {
        await base44.asServiceRole.entities.ModelPage.update(page.id, { slug });
      }
      return Response.json({ action: "existing", id: page.id });
    }

    // Obtener todos los productos del mismo model_code para construir la página
    const products = await base44.asServiceRole.entities.Product.filter(
      { model_code: modelCode, active: true },
      "power_kw",
      50
    );

    const first = products[0] || data;
    const brand = first.brand || data.brand || "";

    const newPage = {
      brand_name: brand,
      model_code: modelCode,
      slug,
      hero_image_url: first.image_url || data.image_url || "",
      hero_title: modelCode,
      hero_subtitle: first.description
        ? first.description.substring(0, 120)
        : `Descubre la gama ${modelCode}${brand ? " de " + brand : ""}`,
      intro_title: `Serie ${modelCode}`,
      intro_text: first.description || data.description || "",
      features: [],
      cta_title: "¿Necesitas ayuda para elegir?",
      cta_text: "Nuestros expertos te asesoran sin compromiso y te hacen un presupuesto personalizado.",
      seo_title: `${modelCode}${brand ? " - " + brand : ""} | Aire acondicionado`,
      seo_description: `Descubre la serie ${modelCode}${brand ? " de " + brand : ""}. ${products.length} potencias disponibles.`,
      active: true,
      sort_order: 100,
    };

    const created = await base44.asServiceRole.entities.ModelPage.create(newPage);
    return Response.json({ action: "created", id: created.id });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});