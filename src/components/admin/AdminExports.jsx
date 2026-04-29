import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, FileJson, FileText, Users } from "lucide-react";

function downloadCSV(rows, headers, filename) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadWizardStepsCSV(wizardKey, filename) {
  const steps = await base44.entities.WizardStep.filter({ wizard_key: wizardKey }, "order", 200);
  if (!steps.length) { alert("No hay pasos configurados."); return; }
  const headers = ["Orden", "ID del paso", "Pregunta", "Icono", "Multi-selección", "Requerido", "Activo"];
  const rows = steps.map(s => [s.order, s.step_id, s.question, s.icon || "", s.multi ? "Sí" : "No", s.required !== false ? "Sí" : "No", s.active !== false ? "Sí" : "No"]);
  downloadCSV(rows, headers, filename);
}

async function downloadWizardOptionsCSV(wizardKey, filename) {
  const [steps, options] = await Promise.all([
    base44.entities.WizardStep.filter({ wizard_key: wizardKey }, "order", 200),
    base44.entities.WizardOption.filter({ wizard_key: wizardKey }, "order", 500),
  ]);
  if (!options.length) { alert("No hay opciones configuradas."); return; }
  const stepOrder = {};
  steps.forEach(s => { stepOrder[s.step_id] = s.order; });
  const headers = ["Paso (orden)", "ID del paso", "Orden opción", "Valor", "Etiqueta", "Descripción", "Activo"];
  const rows = options.map(o => [stepOrder[o.step_id] ?? "", o.step_id, o.order, o.value, o.label, o.desc || "", o.active !== false ? "Sí" : "No"]);
  downloadCSV(rows, headers, filename);
}

async function downloadWizardJSON(wizardKey, filename) {
  const [configs, steps, options] = await Promise.all([
    base44.entities.Wizard.filter({ key: wizardKey }),
    base44.entities.WizardStep.filter({ wizard_key: wizardKey }, "order", 200),
    base44.entities.WizardOption.filter({ wizard_key: wizardKey }, "order", 500),
  ]);
  const stepsWithOptions = steps.map(step => ({
    ...step,
    options: options.filter(o => o.step_id === step.step_id),
  }));
  const data = { config: configs[0] || null, steps: stepsWithOptions };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadLeadsCSV() {
  const leads = await base44.entities.Lead.list("-created_date", 2000);
  if (!leads.length) { alert("No hay leads aún."); return; }
  const headers = ["Fecha", "Nombre", "Teléfono", "Email", "Ciudad", "Fuente", "Estado", "Fecha visita", "Franja", "Habitaciones", "Superficie", "Exposición solar", "Provincia", "Preferencias", "Mensaje"];
  const rows = leads.map(l => [
    new Date(l.created_date).toLocaleDateString("es-ES"),
    l.name || "",
    l.phone || "",
    l.email || "",
    l.city || "",
    l.source || "",
    l.status || "",
    l.scheduled_date || "",
    l.scheduled_slot || "",
    l.wizard_data?.rooms || "",
    l.wizard_data?.area_m2 || "",
    l.wizard_data?.sun_exposure || "",
    l.wizard_data?.province || "",
    (l.wizard_data?.preferences || []).join("; "),
    l.message || "",
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadReservasCSV() {
  const reservas = await base44.entities.ReservaInstalacion.list("-created_date", 2000);
  if (!reservas.length) { alert("No hay reservas aún."); return; }
  const headers = ["Fecha creación", "Estado", "Tipo servicio", "Fecha", "Franja", "Nombre", "Teléfono", "Email", "Dirección", "CP", "Ciudad", "Tipo vivienda", "Planta", "Ascensor", "Acceso exterior", "Equipo comprado", "Marca/Modelo", "Preinstalación", "Comentarios"];
  const rows = reservas.map(r => [
    new Date(r.created_date).toLocaleDateString("es-ES"),
    r.estado || "",
    r.tipoServicio || "",
    r.fecha || "",
    r.franja || "",
    r.nombre || "",
    r.telefono || "",
    r.email || "",
    r.direccion || "",
    r.codigoPostal || "",
    r.ciudad || "",
    r.tipoVivienda || "",
    r.plantaAltura || "",
    r.ascensor || "",
    r.accesoExterior || "",
    r.equipoComprado || "",
    r.marcaModelo || "",
    r.preinstalacion || "",
    r.comentarios || "",
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reservas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ExportCard({ title, description, icon: Icon, color, actions }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-1 border-t">
        {actions.map((a, i) => (
          <ExportButton key={i} label={a.label} icon={a.icon} onClick={a.onClick} />
        ))}
      </div>
    </div>
  );
}

function ExportButton({ label, icon: Icon, onClick }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    await onClick();
    setLoading(false);
  };
  return (
    <Button variant="outline" onClick={handle} disabled={loading} className="gap-2 text-sm">
      <Icon className="w-4 h-4" />
      {loading ? "Exportando..." : label}
    </Button>
  );
}

export default function AdminExports() {
  return (
    <div className="space-y-6 max-w-3xl">
      <p className="text-sm text-gray-500">Descarga los datos de tu aplicación en formato JSON o CSV.</p>

      <ExportCard
        title="Wizard: Te ayudamos a elegir"
        description="Exporta la configuración completa del wizard recomendador, incluyendo todos los pasos y sus opciones."
        icon={FileJson}
        color="bg-[#00509E]"
        actions={[
          {
            label: "Exportar configuración completa (JSON)",
            icon: Download,
            onClick: () => downloadWizardJSON("home_wizard", "wizard-recomendador.json"),
          },
          {
            label: "Exportar preguntas (CSV)",
            icon: Download,
            onClick: () => downloadWizardStepsCSV("home_wizard", "wizard-recomendador-preguntas.csv"),
          },
          {
            label: "Exportar opciones (CSV)",
            icon: Download,
            onClick: () => downloadWizardOptionsCSV("home_wizard", "wizard-recomendador-opciones.csv"),
          },
        ]}
      />

      <ExportCard
        title="Wizard: Reserva de instalación"
        description="Exporta la configuración completa del wizard de reservas, incluyendo todos los pasos y sus opciones."
        icon={FileJson}
        color="bg-purple-600"
        actions={[
          {
            label: "Exportar configuración completa (JSON)",
            icon: Download,
            onClick: () => downloadWizardJSON("booking_wizard", "wizard-reservas.json"),
          },
          {
            label: "Exportar preguntas (CSV)",
            icon: Download,
            onClick: () => downloadWizardStepsCSV("booking_wizard", "wizard-reservas-preguntas.csv"),
          },
          {
            label: "Exportar opciones (CSV)",
            icon: Download,
            onClick: () => downloadWizardOptionsCSV("booking_wizard", "wizard-reservas-opciones.csv"),
          },
        ]}
      />

      <ExportCard
        title="Leads"
        description="Exporta todos los leads capturados por los wizards y formularios de contacto."
        icon={Users}
        color="bg-orange-500"
        actions={[
          {
            label: "Exportar todos los leads (CSV)",
            icon: Download,
            onClick: downloadLeadsCSV,
          },
        ]}
      />

      <ExportCard
        title="Reservas de instalación"
        description="Exporta todas las reservas de instalación con sus datos completos."
        icon={FileText}
        color="bg-green-600"
        actions={[
          {
            label: "Exportar todas las reservas (CSV)",
            icon: Download,
            onClick: downloadReservasCSV,
          },
        ]}
      />
    </div>
  );
}