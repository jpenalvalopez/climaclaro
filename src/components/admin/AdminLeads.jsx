import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, Mail, Trash2, RefreshCw, Upload } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_COLORS = {
  new: "bg-orange-100 text-orange-800",
  contacted: "bg-blue-100 text-blue-800",
  qualified: "bg-purple-100 text-purple-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-gray-100 text-gray-600"
};
const STATUS_LABELS = {
  new: "Nuevo", contacted: "Contactado", qualified: "Cualificado",
  converted: "Convertido", lost: "Perdido"
};

function buildComentariosFromLead(lead) {
  const parts = [];
  if (lead.message) parts.push(lead.message);
  if (lead.wizard_data) {
    const w = lead.wizard_data;
    const wizardStr = [
      w.rooms ? `rooms=${w.rooms}` : null,
      w.area_m2 ? `area_m2=${w.area_m2}` : null,
      w.sun_exposure ? `sun_exposure=${w.sun_exposure}` : null,
      w.province ? `province=${w.province}` : null,
      w.exterior_unit_space ? `exterior_unit_space=${w.exterior_unit_space}` : null,
      w.preferences?.length ? `preferences=${w.preferences.join(",")}` : null,
    ].filter(Boolean).join(", ");
    if (wizardStr) parts.push(`Wizard: ${wizardStr}`);
  }
  return parts.join(" | ");
}

const EMPTY_CONVERSION = {
  tipoServicio: "", fecha: "", franja: "", nombre: "", telefono: "", email: "",
  direccion: "", codigoPostal: "", ciudad: "", tipoVivienda: "", ascensor: "",
  accesoExterior: "", equipoComprado: "", aceptaCondiciones: false,
  plantaAltura: "", marcaModelo: "", unidadesInteriores: "", distanciaAprox: "",
  preinstalacion: "", comentarios: "", fotos: []
};

export default function AdminLeads() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [selectedLead, setSelectedLead] = useState(null);
  const [convertLead, setConvertLead] = useState(null);
  const [convForm, setConvForm] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [convSuccess, setConvSuccess] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 200)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] })
  });

  const convertMutation = useMutation({
    mutationFn: async ({ lead, form }) => {
      const reserva = await base44.entities.ReservaInstalacion.create({
        tipoServicio: form.tipoServicio,
        fecha: form.fecha,
        franja: form.franja,
        nombre: form.nombre,
        telefono: form.telefono,
        email: form.email,
        direccion: form.direccion,
        codigoPostal: form.codigoPostal,
        ciudad: form.ciudad,
        tipoVivienda: form.tipoVivienda,
        ascensor: form.ascensor,
        accesoExterior: form.accesoExterior,
        equipoComprado: form.equipoComprado,
        aceptaCondiciones: form.aceptaCondiciones,
        plantaAltura: form.plantaAltura || undefined,
        marcaModelo: form.marcaModelo || undefined,
        unidadesInteriores: form.unidadesInteriores ? parseInt(form.unidadesInteriores) : undefined,
        distanciaAprox: form.distanciaAprox || undefined,
        preinstalacion: form.preinstalacion || undefined,
        comentarios: form.comentarios || undefined,
        fotos: form.fotos || [],
        estado: "pendiente",
      });
      await base44.entities.Lead.update(lead.id, { status: "converted" });
      return reserva;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      setConvSuccess(true);
    }
  });

  const openConvert = (lead) => {
    setConvForm({
      ...EMPTY_CONVERSION,
      nombre: lead.name || "",
      telefono: lead.phone || "",
      email: lead.email || "",
      ciudad: lead.city || "",
      comentarios: buildComentariosFromLead(lead),
    });
    setConvertLead(lead);
    setConvSuccess(false);
  };

  const handlePhotoUpload = async (files) => {
    setUploading(true);
    const urls = await Promise.all(
      Array.from(files).map(f => base44.integrations.Core.UploadFile({ file: f }).then(r => r.file_url))
    );
    setConvForm(f => ({ ...f, fotos: [...(f.fotos || []), ...urls] }));
    setUploading(false);
  };

  const setConv = (field, val) => setConvForm(f => ({ ...f, [field]: val }));

  let filtered = leads;
  if (filterStatus !== "all") filtered = filtered.filter(l => l.status === filterStatus);
  if (filterSource !== "all") filtered = filtered.filter(l => l.source === filterSource);

  const sources = [...new Set(leads.map(l => l.source).filter(Boolean))];

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fuentes</SelectItem>
            {sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">Cliente</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Contacto</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Ciudad</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Fuente</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Fecha</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No hay leads</td></tr>
              ) : filtered.map(lead => (
                <tr key={lead.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#003366]">{lead.name}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-[#00509E] hover:underline text-xs">
                        <Phone className="w-3 h-3" /> {lead.phone}
                      </a>
                      {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-gray-500 hover:underline text-xs">
                        <Mail className="w-3 h-3" /> {lead.email}
                      </a>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{lead.city || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">{lead.source}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={lead.status} onValueChange={v => updateMutation.mutate({ id: lead.id, data: { status: v } })}>
                      <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {format(new Date(lead.created_date), "d MMM yy", { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedLead(lead)}>Ver</Button>
                      {lead.status !== "converted" && (
                        <Button size="sm" className="bg-[#00509E] hover:bg-[#003366] text-white gap-1 text-xs px-2" onClick={() => openConvert(lead)}>
                          <RefreshCw className="w-3 h-3" /> Reserva
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50"
                        onClick={() => confirm("¿Eliminar lead?") && deleteMutation.mutate(lead.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      <Dialog open={!!selectedLead} onOpenChange={open => !open && setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Lead: {selectedLead?.name}</DialogTitle></DialogHeader>
          {selectedLead && (
            <div className="space-y-3 text-sm">
              <p><strong>Teléfono:</strong> <a href={`tel:${selectedLead.phone}`} className="text-[#00509E]">{selectedLead.phone}</a>{" | "}
                <a href={`https://wa.me/34${selectedLead.phone?.replace(/\s/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-green-600">WhatsApp</a></p>
              {selectedLead.email && <p><strong>Email:</strong> {selectedLead.email}</p>}
              {selectedLead.city && <p><strong>Ciudad:</strong> {selectedLead.city}</p>}
              {selectedLead.message && <p><strong>Mensaje:</strong> {selectedLead.message}</p>}
              {selectedLead.wizard_data && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <strong className="block mb-2">Datos del wizard:</strong>
                  <pre className="text-xs">{JSON.stringify(selectedLead.wizard_data, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert modal */}
      <Dialog open={!!convertLead} onOpenChange={open => { if (!open) { setConvertLead(null); setConvForm(null); setConvSuccess(false); }}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Convertir Lead a Reserva</DialogTitle></DialogHeader>
          {convSuccess ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="font-bold text-lg text-[#003366]">¡Reserva creada!</h3>
              <p className="text-gray-500 text-sm">El lead ha sido marcado como convertido.</p>
              <Button onClick={() => { setConvertLead(null); setConvForm(null); setConvSuccess(false); }}
                className="bg-[#00509E] text-white">Cerrar</Button>
            </div>
          ) : convForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de servicio *</Label>
                  <Select value={convForm.tipoServicio} onValueChange={v => setConv("tipoServicio", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>
                      {["Instalación Split 1x1", "Instalación Multisplit", "Mantenimiento/Limpieza", "Visita técnica"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha *</Label>
                  <Input type="date" value={convForm.fecha} onChange={e => setConv("fecha", e.target.value)} />
                </div>
                <div>
                  <Label>Franja *</Label>
                  <Select value={convForm.franja} onValueChange={v => setConv("franja", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>
                      {["Mañana (9–14)", "Tarde (15–19)"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nombre *</Label>
                  <Input value={convForm.nombre} onChange={e => setConv("nombre", e.target.value)} />
                </div>
                <div>
                  <Label>Teléfono *</Label>
                  <Input value={convForm.telefono} onChange={e => setConv("telefono", e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={convForm.email} onChange={e => setConv("email", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Dirección *</Label>
                  <Input value={convForm.direccion} onChange={e => setConv("direccion", e.target.value)} />
                </div>
                <div>
                  <Label>Código postal *</Label>
                  <Input value={convForm.codigoPostal} onChange={e => setConv("codigoPostal", e.target.value)} />
                </div>
                <div>
                  <Label>Ciudad *</Label>
                  <Input value={convForm.ciudad} onChange={e => setConv("ciudad", e.target.value)} />
                </div>
                <div>
                  <Label>Tipo de vivienda *</Label>
                  <Select value={convForm.tipoVivienda} onValueChange={v => setConv("tipoVivienda", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>
                      {["Piso", "Chalet", "Local", "Oficina"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ascensor *</Label>
                  <Select value={convForm.ascensor} onValueChange={v => setConv("ascensor", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{["Sí", "No", "No aplica"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Acceso exterior *</Label>
                  <Select value={convForm.accesoExterior} onValueChange={v => setConv("accesoExterior", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{["Balcón", "Patio interior", "Fachada", "Azotea", "No lo sé"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Equipo comprado *</Label>
                  <Select value={convForm.equipoComprado} onValueChange={v => setConv("equipoComprado", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{["Sí", "No"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Planta / altura</Label>
                  <Input value={convForm.plantaAltura} onChange={e => setConv("plantaAltura", e.target.value)} />
                </div>
                <div>
                  <Label>Marca y modelo</Label>
                  <Input value={convForm.marcaModelo} onChange={e => setConv("marcaModelo", e.target.value)} />
                </div>
                <div>
                  <Label>Unidades interiores</Label>
                  <Input type="number" value={convForm.unidadesInteriores} onChange={e => setConv("unidadesInteriores", e.target.value)} />
                </div>
                <div>
                  <Label>Distancia aprox.</Label>
                  <Select value={convForm.distanciaAprox} onValueChange={v => setConv("distanciaAprox", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{["<3m", "3–5m", "5–10m", ">10m", "No lo sé"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Preinstalación</Label>
                  <Select value={convForm.preinstalacion} onValueChange={v => setConv("preinstalacion", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{["Sí", "No", "No lo sé"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Comentarios</Label>
                  <Textarea value={convForm.comentarios} onChange={e => setConv("comentarios", e.target.value)} rows={3} />
                </div>
                <div className="col-span-2">
                  <Label>Fotos</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(convForm.fotos || []).map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} className="h-16 w-16 object-cover rounded border" alt="" />
                        <button className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setConvForm(f => ({ ...f, fotos: f.fotos.filter((_, j) => j !== i) }))}>✕</button>
                      </div>
                    ))}
                    <label className="h-16 w-16 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-gray-50">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files?.length && handlePhotoUpload(e.target.files)} />
                    </label>
                  </div>
                  {uploading && <p className="text-xs text-gray-400 mt-1">Subiendo fotos...</p>}
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <Checkbox id="conv-terms" checked={convForm.aceptaCondiciones} onCheckedChange={v => setConv("aceptaCondiciones", v)} />
                  <Label htmlFor="conv-terms">Acepta términos y condiciones *</Label>
                </div>
              </div>
              <Button
                onClick={() => convertMutation.mutate({ lead: convertLead, form: convForm })}
                disabled={convertMutation.isPending || !convForm.tipoServicio || !convForm.fecha || !convForm.franja || !convForm.nombre || !convForm.telefono || !convForm.direccion || !convForm.codigoPostal || !convForm.ciudad || !convForm.tipoVivienda || !convForm.ascensor || !convForm.accesoExterior || !convForm.equipoComprado || !convForm.aceptaCondiciones}
                className="w-full bg-[#00509E] hover:bg-[#003366] text-white">
                {convertMutation.isPending ? "Creando reserva..." : "Convertir a Reserva"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}