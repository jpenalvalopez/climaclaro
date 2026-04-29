import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead } = await req.json();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: "jpenalvalopez@gmail.com",
      subject: `Nuevo presupuesto de ${lead.nombre}`,
      body: `
<h2>Nuevo lead desde la landing de presupuesto</h2>
<table style="border-collapse:collapse;width:100%;font-family:sans-serif;">
  <tr><td style="padding:8px;font-weight:bold;background:#f0f4f8;">Nombre</td><td style="padding:8px;">${lead.nombre || "—"}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f0f4f8;">Teléfono</td><td style="padding:8px;">${lead.telefono || "—"}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f0f4f8;">Email</td><td style="padding:8px;">${lead.email || "—"}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f0f4f8;">Tipo de equipo</td><td style="padding:8px;">${lead.tipo_equipo || "—"}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f0f4f8;">Metros cuadrados</td><td style="padding:8px;">${lead.metros_cuadrados || "—"}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f0f4f8;">Disponibilidad</td><td style="padding:8px;">${lead.disponibilidad || "—"}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f0f4f8;">Mensaje</td><td style="padding:8px;">${lead.mensaje || "—"}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f0f4f8;">Origen</td><td style="padding:8px;">${lead.origen || "—"}</td></tr>
</table>
      `
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});