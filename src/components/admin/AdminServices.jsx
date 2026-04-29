import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, X, Copy } from "lucide-react";

const TIPO_SERVICIO_OPTIONS = [
  "Instalación Split 1x1", "Instalación Multisplit", "Mantenimiento/Limpieza", "Visita técnica"
];

const EMPTY = {
  title: "", slug: "", short_description: "", description: "",
  price: "", includes: [], excludes: [], image_url: "",
  featured: false, active: true, sort_order: 100, tipoServicioEnum: ""
};

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
}

export default function AdminServices() {
  const queryClient = useQueryClient();
  const [editService, setEditService] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newInclude, setNewInclude] = useState("");
  const [newExclude, setNewExclude] = useState("");
  const [newExtra, setNewExtra] = useState({ name: "", description: "", price: "", unit: "", min_qty: "1", max_qty: "" });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services_admin"],
    queryFn: () => base44.entities.Service.list("sort_order", 200)
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, price: data.price ? parseFloat(data.price) : undefined, sort_order: parseInt(data.sort_order) || 100 };
      return data.id ? base44.entities.Service.update(data.id, payload) : base44.entities.Service.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services_admin"] });
      queryClient.invalidateQueries({ queryKey: ["services_active"] });
      setShowForm(false);
      setEditService(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Service.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services_admin"] })
  });

  const toggleActive = (s) => saveMutation.mutate({ ...s, active: !s.active });

  const EMPTY_EXTRA = { name: "", description: "", price: "", unit: "", min_qty: "1", max_qty: "" };
  const openNew = () => { setEditService({ ...EMPTY, includes: [], excludes: [], extras: [] }); setNewInclude(""); setNewExclude(""); setNewExtra(EMPTY_EXTRA); setShowForm(true); };
  const openEdit = (s) => { setEditService({ ...s, includes: s.includes || [], excludes: s.excludes || [], extras: s.extras || [] }); setNewInclude(""); setNewExclude(""); setNewExtra(EMPTY_EXTRA); setShowForm(true); };
  const duplicateService = (s) => {
    const copy = { ...s, includes: [...(s.includes || [])], excludes: [...(s.excludes || [])], extras: [...(s.extras || [])] };
    delete copy.id;
    copy.title = copy.title + " (copia)";
    copy.slug = copy.slug + "-copia";
    setEditService(copy);
    setNewInclude(""); setNewExclude(""); setNewExtra(EMPTY_EXTRA);
    setShowForm(true);
  };

  const set = (field, val) => setEditService(s => ({ ...s, [field]: val }));

  const handleUpload = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("image_url", file_url);
    setUploading(false);
  };

  const addInclude = () => { if (newInclude.trim()) { set("includes", [...(editService.includes || []), newInclude.trim()]); setNewInclude(""); }};
  const addExclude = () => { if (newExclude.trim()) { set("excludes", [...(editService.excludes || []), newExclude.trim()]); setNewExclude(""); }};
  const removeInclude = (i) => set("includes", editService.includes.filter((_, j) => j !== i));
  const removeExclude = (i) => set("excludes", editService.excludes.filter((_, j) => j !== i));
  const addExtra = () => {
    if (!newExtra.name.trim() || !newExtra.price) return;
    set("extras", [...(editService.extras || []), {
      name: newExtra.name.trim(),
      description: newExtra.description.trim(),
      price: parseFloat(newExtra.price),
      unit: newExtra.unit.trim() || "ud.",
      min_qty: parseFloat(newExtra.min_qty) || 1,
      max_qty: parseFloat(newExtra.max_qty) || 0,
    }]);
    setNewExtra({ name: "", description: "", price: "", unit: "", min_qty: "1", max_qty: "" });
  };
  const removeExtra = (i) => set("extras", editService.extras.filter((_, j) => j !== i));

  return (
    <div>
      <div className="flex justify-end mb-5">
        <Button onClick={openNew} className="bg-[#00509E] hover:bg-[#003366] text-white gap-2">
          <Plus className="w-4 h-4" /> Nuevo servicio
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">Servicio</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Tipo</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Precio</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Orden</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : services.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay servicios. Crea el primero.</td></tr>
              ) : services.map(s => (
                <tr key={s.id} className={`border-b hover:bg-gray-50 ${!s.active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {s.image_url && <img src={s.image_url} className="w-10 h-10 object-cover rounded-lg border" alt="" />}
                      <div>
                        <div className="font-medium text-[#003366]">{s.title}</div>
                        <div className="text-xs text-gray-400 font-mono">{s.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{s.tipoServicioEnum}</Badge></td>
                  <td className="px-4 py-3 font-semibold">{s.price ? `${s.price.toLocaleString("es-ES")} €` : "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{s.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => toggleActive(s)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {s.active ? "Activo" : "Inactivo"}
                      </button>
                      {s.featured && <Badge className="bg-amber-100 text-amber-700 text-xs">Destacado</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(s)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="outline" className="text-blue-500 hover:bg-blue-50" title="Duplicar servicio" onClick={() => duplicateService(s)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50"
                        onClick={() => confirm("¿Eliminar servicio?") && deleteMutation.mutate(s.id)}>
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

      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setEditService(null); }}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editService?.id ? "Editar servicio" : "Nuevo servicio"}</DialogTitle></DialogHeader>
          {editService && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Título *</Label>
                  <Input value={editService.title} onChange={e => { set("title", e.target.value); if (!editService.id) set("slug", slugify(e.target.value)); }} />
                </div>
                <div className="col-span-2">
                  <Label>Slug * (URL)</Label>
                  <Input value={editService.slug} onChange={e => set("slug", e.target.value)} placeholder="instalacion-split" className="font-mono text-sm" />
                </div>
                <div className="col-span-2">
                  <Label>Tipo de servicio (ReservaInstalacion) *</Label>
                  <Select value={editService.tipoServicioEnum} onValueChange={v => set("tipoServicioEnum", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{TIPO_SERVICIO_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Precio (€)</Label>
                  <Input type="number" value={editService.price} onChange={e => set("price", e.target.value)} placeholder="250" />
                </div>
                <div>
                  <Label>Orden</Label>
                  <Input type="number" value={editService.sort_order} onChange={e => set("sort_order", e.target.value)} />
                </div>
                <div>
                  <Label>Potencia mínima (kW)</Label>
                  <Input type="number" step="0.01" value={editService.power_kw_min ?? ""} onChange={e => set("power_kw_min", e.target.value === "" ? null : parseFloat(e.target.value))} placeholder="0 (sin límite)" />
                </div>
                <div>
                  <Label>Potencia máxima (kW)</Label>
                  <Input type="number" step="0.01" value={editService.power_kw_max ?? ""} onChange={e => set("power_kw_max", e.target.value === "" ? null : parseFloat(e.target.value))} placeholder="∞ (sin límite)" />
                </div>
                <div className="col-span-2">
                  <Label>Descripción corta</Label>
                  <Input value={editService.short_description || ""} onChange={e => set("short_description", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Descripción completa</Label>
                  <Textarea value={editService.description || ""} onChange={e => set("description", e.target.value)} rows={4} />
                </div>
              </div>

              {/* Imagen */}
              <div>
                <Label>Imagen</Label>
                <div className="flex items-center gap-3 mt-2">
                  {editService.image_url && <img src={editService.image_url} className="h-14 w-14 object-cover rounded-lg border" alt="" />}
                  <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
                    <Upload className="w-4 h-4" />
                    {uploading ? "Subiendo..." : "Subir imagen"}
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleUpload(e.target.files[0])} />
                  </label>
                  <Input className="flex-1" value={editService.image_url || ""} onChange={e => set("image_url", e.target.value)} placeholder="O pega una URL..." />
                </div>
              </div>

              {/* Includes */}
              <div>
                <Label>¿Qué incluye?</Label>
                <div className="space-y-2 mt-2">
                  {(editService.includes || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-1.5 text-sm">
                      <span className="flex-1">{item}</span>
                      <button onClick={() => removeInclude(i)}><X className="w-3 h-3 text-gray-400 hover:text-red-500" /></button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input value={newInclude} onChange={e => setNewInclude(e.target.value)} placeholder="Añadir elemento..." className="text-sm"
                      onKeyDown={e => e.key === "Enter" && addInclude()} />
                    <Button type="button" onClick={addInclude} size="sm" variant="outline"><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>

              {/* Excludes */}
              <div>
                <Label>¿Qué NO incluye?</Label>
                <div className="space-y-2 mt-2">
                  {(editService.excludes || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-1.5 text-sm">
                      <span className="flex-1">{item}</span>
                      <button onClick={() => removeExclude(i)}><X className="w-3 h-3 text-gray-400 hover:text-red-500" /></button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input value={newExclude} onChange={e => setNewExclude(e.target.value)} placeholder="Añadir elemento..." className="text-sm"
                      onKeyDown={e => e.key === "Enter" && addExclude()} />
                    <Button type="button" onClick={addExclude} size="sm" variant="outline"><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>

              {/* Extras */}
              <div>
                <Label>Extras opcionales (contratables)</Label>
                <div className="space-y-2 mt-2">
                  {(editService.extras || []).map((extra, i) => (
                    <div key={i} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-[#003366]">{extra.name}</span>
                        {extra.description && <span className="text-gray-500 ml-2 text-xs">{extra.description}</span>}
                        <span className="ml-2 font-bold text-[#00509E]">{extra.price} € / {extra.unit || "ud."}</span>
                        <span className="text-gray-400 ml-2 text-xs">mín {extra.min_qty || 1}{extra.max_qty ? ` · máx ${extra.max_qty}` : ""}</span>
                      </div>
                      <button onClick={() => removeExtra(i)}><X className="w-3 h-3 text-gray-400 hover:text-red-500" /></button>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={newExtra.name} onChange={e => setNewExtra(x => ({ ...x, name: e.target.value }))} placeholder="Nombre *" className="text-sm" />
                    <Input value={newExtra.description} onChange={e => setNewExtra(x => ({ ...x, description: e.target.value }))} placeholder="Descripción (opcional)" className="text-sm" />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <Input type="number" value={newExtra.price} onChange={e => setNewExtra(x => ({ ...x, price: e.target.value }))} placeholder="Precio €" className="text-sm" />
                    <Input value={newExtra.unit} onChange={e => setNewExtra(x => ({ ...x, unit: e.target.value }))} placeholder="Unidad (ud., m.l., m²...)" className="text-sm" />
                    <Input type="number" value={newExtra.min_qty} onChange={e => setNewExtra(x => ({ ...x, min_qty: e.target.value }))} placeholder="Mín" className="text-sm" />
                    <div className="flex gap-2">
                      <Input type="number" value={newExtra.max_qty} onChange={e => setNewExtra(x => ({ ...x, max_qty: e.target.value }))} placeholder="Máx (0=∞)" className="text-sm" />
                      <Button type="button" onClick={addExtra} size="sm" variant="outline"><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="svc-active" checked={editService.active !== false} onChange={e => set("active", e.target.checked)} />
                  <Label htmlFor="svc-active">Activo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="svc-featured" checked={editService.featured} onChange={e => set("featured", e.target.checked)} />
                  <Label htmlFor="svc-featured">Destacado</Label>
                </div>
              </div>

              <Button
                onClick={() => saveMutation.mutate(editService)}
                disabled={saveMutation.isPending || !editService.title || !editService.slug || !editService.tipoServicioEnum}
                className="w-full bg-[#00509E] hover:bg-[#003366] text-white"
              >
                {saveMutation.isPending ? "Guardando..." : "Guardar servicio"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}