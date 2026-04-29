import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ListOrdered, Download } from "lucide-react";

const TABS = [
  { key: "config", label: "Configuración general" },
  { key: "steps", label: "Preguntas (pasos)" },
  { key: "options", label: "Opciones por paso" },
];

async function exportWizardData() {
  const leads = await base44.entities.Lead.filter({ source: "wizard" }, "-created_date", 1000);
  if (!leads.length) { alert("No hay datos de leads del wizard aún."); return; }

  const headers = ["Fecha", "Nombre", "Teléfono", "Email", "Ciudad", "Estado", "Fecha visita", "Franja", "Habitaciones", "Superficie", "Exposición solar", "Provincia", "Preferencias"];
  const rows = leads.map(l => [
    new Date(l.created_date).toLocaleDateString("es-ES"),
    l.name || "",
    l.phone || "",
    l.email || "",
    l.city || "",
    l.status || "",
    l.scheduled_date || "",
    l.scheduled_slot || "",
    l.wizard_data?.rooms || "",
    l.wizard_data?.area_m2 || "",
    l.wizard_data?.sun_exposure || "",
    l.wizard_data?.province || "",
    (l.wizard_data?.preferences || []).join("; "),
  ]);

  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-wizard-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportWizard(wizardKey) {
  const [configs, steps, options] = await Promise.all([
    base44.entities.Wizard.filter({ key: wizardKey }),
    base44.entities.WizardStep.filter({ wizard_key: wizardKey }, "order", 200),
    base44.entities.WizardOption.filter({ wizard_key: wizardKey }, "order", 500),
  ]);
  const data = { config: configs[0] || null, steps, options };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wizard-${wizardKey}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminWizard({ wizardKey = "home_wizard" }) {
  const [tab, setTab] = useState("config");
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    await exportWizard(wizardKey);
    setExporting(false);
  };

  const handleExportData = async () => {
    setExportingData(true);
    await exportWizardData();
    setExportingData(false);
  };

  return (
    <div>
      <div className="flex justify-end gap-2 mb-2">
        <Button variant="outline" onClick={handleExportData} disabled={exportingData} className="gap-2 text-sm">
          <Download className="w-4 h-4" /> {exportingData ? "Exportando..." : "Exportar leads (CSV)"}
        </Button>
        <Button variant="outline" onClick={handleExport} disabled={exporting} className="gap-2 text-sm">
          <Download className="w-4 h-4" /> {exporting ? "Exportando..." : "Exportar configuración (JSON)"}
        </Button>
      </div>
      <div className="flex gap-2 mb-6 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-[#00509E] text-[#00509E]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "config" && <WizardConfig wizardKey={wizardKey} />}
      {tab === "steps" && (
        <WizardSteps
          wizardKey={wizardKey}
          selectedStepId={selectedStepId}
          onSelectStep={(id) => {
            setSelectedStepId(id);
            setTab("options");
          }}
        />
      )}
      {tab === "options" && (
        <WizardOptions
          wizardKey={wizardKey}
          selectedStepId={selectedStepId}
          onChangeStep={setSelectedStepId}
        />
      )}
    </div>
  );
}

/* ── Configuración general ── */
function WizardConfig({ wizardKey }) {
  const qc = useQueryClient();
  const { data: wizards = [] } = useQuery({
    queryKey: ["wizard_config", wizardKey],
    queryFn: () => base44.entities.Wizard.filter({ key: wizardKey }),
  });
  const wizard = wizards[0];

  const [form, setForm] = useState(null);
  React.useEffect(() => {
    if (wizard && !form) setForm(wizard);
  }, [wizard]);

  const set = (f, v) => setForm((s) => ({ ...s, [f]: v }));

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const { id, ...rest } = data;
      return id
        ? base44.entities.Wizard.update(id, rest)
        : base44.entities.Wizard.create({ ...rest, key: wizardKey });
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["wizard_config", wizardKey] });
      if (saved) setForm(saved);
    },
  });

  if (!form)
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">No hay configuración de wizard aún.</p>
        <Button
          onClick={() =>
            setForm({
              key: wizardKey,
              title: "Reserva tu instalación",
              subtitle: "Completa los pasos para reservar tu servicio.",
              active: true,
            })
          }
          className="bg-[#00509E] hover:bg-[#003366] text-white"
        >
          Crear configuración inicial
        </Button>
      </div>
    );

  return (
    <div className="max-w-xl space-y-4 bg-white rounded-xl p-6 shadow-sm">
      <div>
        <Label>Título</Label>
        <Input value={form.title || ""} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <Label>Subtítulo</Label>
        <Textarea
          value={form.subtitle || ""}
          onChange={(e) => set("subtitle", e.target.value)}
          rows={2}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="wiz-active"
          checked={form.active !== false}
          onChange={(e) => set("active", e.target.checked)}
        />
        <Label htmlFor="wiz-active">Wizard activo</Label>
      </div>
      <Button
        onClick={() => saveMutation.mutate(form)}
        disabled={saveMutation.isPending}
        className="bg-[#00509E] hover:bg-[#003366] text-white w-full"
      >
        {saveMutation.isPending ? "Guardando..." : "Guardar configuración"}
      </Button>
    </div>
  );
}

/* ── Pasos ── */
function WizardSteps({ wizardKey, selectedStepId, onSelectStep }) {
  const qc = useQueryClient();
  const [editStep, setEditStep] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data: steps = [], isLoading } = useQuery({
    queryKey: ["wizard_steps", wizardKey],
    queryFn: () =>
      base44.entities.WizardStep.filter({ wizard_key: wizardKey }, "order", 100),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const { id, ...rest } = data;
      const p = { ...rest, order: parseInt(rest.order) || 100 };
      return id
        ? base44.entities.WizardStep.update(id, p)
        : base44.entities.WizardStep.create(p);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wizard_steps", wizardKey] });
      setShowForm(false);
      setEditStep(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WizardStep.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wizard_steps", wizardKey] }),
  });

  const toggleActive = (s) => {
    const { id, ...rest } = s;
    base44.entities.WizardStep.update(id, { ...rest, active: !s.active })
      .then(() => qc.invalidateQueries({ queryKey: ["wizard_steps", wizardKey] }));
  };
  const set = (f, v) => setEditStep((s) => ({ ...s, [f]: v }));

  const EMPTY_STEP = {
    wizard_key: wizardKey,
    step_id: "",
    question: "",
    icon: "Settings",
    multi: false,
    required: true,
    order: (steps.length + 1) * 10,
    active: true,
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            setEditStep({ ...EMPTY_STEP });
            setShowForm(true);
          }}
          className="bg-[#00509E] hover:bg-[#003366] text-white gap-2"
        >
          <Plus className="w-4 h-4" /> Nuevo paso
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-600 font-semibold w-12">Orden</th>
              <th className="px-4 py-3 text-gray-600 font-semibold">ID paso</th>
              <th className="px-4 py-3 text-gray-600 font-semibold">Pregunta</th>
              <th className="px-4 py-3 text-gray-600 font-semibold w-16">Icono</th>
              <th className="px-4 py-3 text-gray-600 font-semibold w-16">Multi</th>
              <th className="px-4 py-3 text-gray-600 font-semibold w-20">Estado</th>
              <th className="px-4 py-3 text-gray-600 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  Cargando...
                </td>
              </tr>
            ) : steps.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  Sin pasos. Crea el primero.
                </td>
              </tr>
            ) : (
              steps.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b hover:bg-gray-50 ${!s.active ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-2 text-gray-500 font-mono">{s.order}</td>
                  <td className="px-4 py-2 font-mono text-xs text-[#003366]">{s.step_id}</td>
                  <td className="px-4 py-2 text-gray-800">{s.question}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{s.icon}</td>
                  <td className="px-4 py-2">
                    {s.multi ? (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">Multi</Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => toggleActive(s)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditStep({ ...s });
                          setShowForm(true);
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-500 hover:bg-blue-50"
                        onClick={() => onSelectStep(s.step_id)}
                        title="Ver opciones"
                      >
                        <ListOrdered className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() =>
                          confirm("¿Eliminar paso?") && deleteMutation.mutate(s.id)
                        }
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditStep(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editStep?.id ? "Editar paso" : "Nuevo paso"}</DialogTitle>
          </DialogHeader>
          {editStep && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>ID paso * (ej: servicio)</Label>
                  <Input
                    value={editStep.step_id}
                    onChange={(e) => set("step_id", e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <Label>Orden *</Label>
                  <Input
                    type="number"
                    value={editStep.order}
                    onChange={(e) => set("order", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Pregunta *</Label>
                  <Input
                    value={editStep.question}
                    onChange={(e) => set("question", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Icono (lucide)</Label>
                  <Input
                    value={editStep.icon || ""}
                    onChange={(e) => set("icon", e.target.value)}
                    placeholder="Wrench, Settings..."
                  />
                </div>
                <div className="flex flex-col gap-2 pt-5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="step-multi"
                      checked={editStep.multi}
                      onChange={(e) => set("multi", e.target.checked)}
                    />
                    <Label htmlFor="step-multi">Selección múltiple</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="step-req"
                      checked={editStep.required !== false}
                      onChange={(e) => set("required", e.target.checked)}
                    />
                    <Label htmlFor="step-req">Requerido</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="step-active"
                      checked={editStep.active !== false}
                      onChange={(e) => set("active", e.target.checked)}
                    />
                    <Label htmlFor="step-active">Activo</Label>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => saveMutation.mutate(editStep)}
                disabled={
                  saveMutation.isPending || !editStep.step_id || !editStep.question
                }
                className="w-full bg-[#00509E] hover:bg-[#003366] text-white"
              >
                {saveMutation.isPending ? "Guardando..." : "Guardar paso"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Opciones por paso ── */
function WizardOptions({ wizardKey, selectedStepId, onChangeStep }) {
  const qc = useQueryClient();
  const [editOpt, setEditOpt] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStep, setFilterStep] = useState(selectedStepId || "");

  const { data: steps = [] } = useQuery({
    queryKey: ["wizard_steps", wizardKey],
    queryFn: () =>
      base44.entities.WizardStep.filter({ wizard_key: wizardKey }, "order", 100),
  });

  const activeStepId = filterStep || steps[0]?.step_id || "";

  const { data: options = [], isLoading } = useQuery({
    queryKey: ["wizard_options", wizardKey, activeStepId],
    queryFn: () =>
      base44.entities.WizardOption.filter(
        { wizard_key: wizardKey, step_id: activeStepId },
        "order",
        100
      ),
    enabled: !!activeStepId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const { id, ...rest } = data;
      const p = { ...rest, order: parseInt(rest.order) || 100 };
      return id
        ? base44.entities.WizardOption.update(id, p)
        : base44.entities.WizardOption.create(p);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wizard_options", wizardKey, activeStepId] });
      setShowForm(false);
      setEditOpt(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WizardOption.delete(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["wizard_options", wizardKey, activeStepId] }),
  });

  const set = (f, v) => setEditOpt((s) => ({ ...s, [f]: v }));
  const EMPTY_OPT = {
    wizard_key: wizardKey,
    step_id: activeStepId,
    value: "",
    label: "",
    desc: "",
    order: (options.length + 1) * 10,
    active: true,
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-gray-600 font-medium self-center">Paso:</span>
          {steps.map((s) => (
            <button
              key={s.step_id}
              onClick={() => {
                setFilterStep(s.step_id);
                onChangeStep && onChangeStep(s.step_id);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeStepId === s.step_id
                  ? "bg-[#00509E] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s.step_id}
            </button>
          ))}
        </div>
        <Button
          onClick={() => {
            setEditOpt({ ...EMPTY_OPT, step_id: activeStepId });
            setShowForm(true);
          }}
          className="bg-[#00509E] hover:bg-[#003366] text-white gap-2"
        >
          <Plus className="w-4 h-4" /> Nueva opción
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-600 font-semibold w-16">Orden</th>
              <th className="px-4 py-3 text-gray-600 font-semibold">Label</th>
              <th className="px-4 py-3 text-gray-600 font-semibold">Value</th>
              <th className="px-4 py-3 text-gray-600 font-semibold">Descripción</th>
              <th className="px-4 py-3 text-gray-600 font-semibold w-20">Estado</th>
              <th className="px-4 py-3 text-gray-600 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  Cargando...
                </td>
              </tr>
            ) : options.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  Sin opciones para este paso.
                </td>
              </tr>
            ) : (
              options.map((opt) => (
                <tr
                  key={opt.id}
                  className={`border-b hover:bg-gray-50 ${!opt.active ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-2 text-gray-500 font-mono">{opt.order}</td>
                  <td className="px-4 py-2 font-medium text-[#003366]">{opt.label}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">{opt.value}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{opt.desc || "—"}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => {
                        const { id, ...rest } = opt;
                        base44.entities.WizardOption.update(id, { ...rest, active: !opt.active })
                          .then(() => qc.invalidateQueries({ queryKey: ["wizard_options", wizardKey, activeStepId] }));
                      }}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        opt.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {opt.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditOpt({ ...opt });
                          setShowForm(true);
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() =>
                          confirm("¿Eliminar opción?") && deleteMutation.mutate(opt.id)
                        }
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditOpt(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editOpt?.id ? "Editar opción" : "Nueva opción"}</DialogTitle>
          </DialogHeader>
          {editOpt && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Label *</Label>
                  <Input
                    value={editOpt.label}
                    onChange={(e) => set("label", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Value * (string)</Label>
                  <Input
                    value={editOpt.value}
                    onChange={(e) => set("value", e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Descripción (opcional)</Label>
                  <Input
                    value={editOpt.desc || ""}
                    onChange={(e) => set("desc", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Orden</Label>
                  <Input
                    type="number"
                    value={editOpt.order}
                    onChange={(e) => set("order", e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="opt-active"
                    checked={editOpt.active !== false}
                    onChange={(e) => set("active", e.target.checked)}
                  />
                  <Label htmlFor="opt-active">Activo</Label>
                </div>
              </div>
              <Button
                onClick={() => saveMutation.mutate(editOpt)}
                disabled={saveMutation.isPending || !editOpt.label || !editOpt.value}
                className="w-full bg-[#00509E] hover:bg-[#003366] text-white"
              >
                {saveMutation.isPending ? "Guardando..." : "Guardar opción"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}