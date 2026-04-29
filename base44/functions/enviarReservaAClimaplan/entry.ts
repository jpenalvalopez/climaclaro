import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CLIMAPLAN_APP_URL = "https://clima-plan-go.base44.app/api";
const CLIMAPLAN_API_KEY = Deno.env.get("CLIMAPLAN_API_KEY");

async function enviarReservaAClimaplan(reserva) {
  const payload = {
    order_id: reserva.id || `WEB-${Date.now()}`,
    cliente_nombre: reserva.nombre,
    telefono: reserva.telefono,
    email: reserva.email || "",
    direccion: reserva.direccion || "",
    cp: reserva.codigoPostal || "",
    poblacion: reserva.ciudad || "",
    equipo_modelo: reserva.marcaModelo || "",
    fecha_preferida: reserva.fecha || null,
    franja_horaria: reserva.franja?.includes("Mañana") ? "Mañana" : reserva.franja?.includes("Tarde") ? "Tarde" : "Todo el día",
    estado: "Nueva",
    origen_importacion: "api",
    notas: [
      reserva.tipoServicio ? `Servicio: ${reserva.tipoServicio}` : "",
      reserva.tipoVivienda ? `Vivienda: ${reserva.tipoVivienda}` : "",
      reserva.plantaAltura ? `Planta: ${reserva.plantaAltura}` : "",
      reserva.ascensor ? `Ascensor: ${reserva.ascensor}` : "",
      reserva.accesoExterior ? `Acceso exterior: ${reserva.accesoExterior}` : "",
      reserva.preinstalacion ? `Preinstalación: ${reserva.preinstalacion}` : "",
      reserva.distanciaAprox ? `Distancia aprox: ${reserva.distanciaAprox}` : "",
      reserva.comentarios || "",
    ].filter(Boolean).join(" | ")
  };

  const response = await fetch(`${CLIMAPLAN_APP_URL}/entities/Reserva`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api_key": CLIMAPLAN_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Error ClimaPlan: ${JSON.stringify(data)}`);
  }
  return data;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  let body = {};
  try {
    body = await req.json();
  } catch (_) {
    // body vacío (llamada desde automatización programada)
  }

  const { reserva } = body;

  // Llamada directa con reserva específica (desde el formulario)
  if (reserva) {
    const data = await enviarReservaAClimaplan(reserva);
    return Response.json({ success: true, climaplan_id: data.id });
  }

  // Llamada desde automatización programada: procesar reservas pendientes
  const reservasPendientes = await base44.asServiceRole.entities.ReservaInstalacion.filter({ estado: "pendiente" });

  if (!reservasPendientes.length) {
    return Response.json({ success: true, message: "No hay reservas pendientes", enviadas: 0 });
  }

  const resultados = [];
  for (const r of reservasPendientes) {
    try {
      const data = await enviarReservaAClimaplan(r);
      await base44.asServiceRole.entities.ReservaInstalacion.update(r.id, { estado: "confirmada" });
      resultados.push({ id: r.id, climaplan_id: data.id, ok: true });
    } catch (err) {
      resultados.push({ id: r.id, error: err.message, ok: false });
    }
  }

  return Response.json({ success: true, enviadas: resultados.filter(r => r.ok).length, resultados });
});