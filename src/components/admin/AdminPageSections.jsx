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
import { Plus, Pencil, Trash2, Upload } from "lucide-react";

const PAGES = ["home", "about", "services", "products", "contact", "wizard"];
const EMPTY = { page: "home", key: "", title: "", subtitle: "", body: "", image_url: "", active: true, sort_order: 100 };

export default function AdminPageSections() {
  const queryClient = useQueryClient();
  const [filterPage, setFilterPage] = useState("all");
  const [editSection, setEditSection] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["page_sections"],
    queryFn: () => base44.entities.PageSection.list("sort_order", 300)
  });

  const saveMutation = useMutation({
    mutationFn: (data) => data.id
      ? base44.entities.PageSection.update(data.id, data)
      : base44.entities.PageSection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page_sections"] });
      setShowForm(false);
      setEditSection(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PageSection.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["page_sections"] })
  });

  const toggleActive = (section) => {
    saveMutation.mutate({ ...section, active: !section.active });
  };

  const filtered = filterPage === "all" ? sections : sections.filter(s => s.page === filterPage);

  const openNew = () => { setEditSection({ ...EMPTY }); setShowForm(true); };
  const openEdit = (s) => { setEditSection({ ...s }); setShowForm(true); };

  const handleUpload = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({
      file,
      type: "public_web_asset",
      kind: editSection?.page || "home",
      entityId: editSection?.id,
    });
    setEditSection(s => ({ ...s, image_url: file_url }));
    setUploading(false);
  };

  const set = (field, val) => setEditSection(s => ({ ...s, [field]: val }));

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5 items-center justify-between">
        <Select value={filterPage} onValueChange={setFilterPage}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las páginas</SelectItem>
            {PAGES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="bg-[#00509E] hover:bg-[#003366] text-white gap-2">
          <Plus className="w-4 h-4" /> Nueva sección
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">Página</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Key</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Título</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Orden</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay secciones</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3"><Badge variant="outline">{s.page}</Badge></td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.key}</td>
                  <td className="px-4 py-3 font-medium text-[#003366]">{s.title}</td>
                  <td className="px-4 py-3 text-gray-500">{s.sort_order}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(s)} className={`px-2 py-1 rounded-full text-xs font-medium ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.active ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(s)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50"
                        onClick={() => confirm("¿Eliminar sección?") && deleteMutation.mutate(s.id)}>
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

      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setEditSection(null); }}}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editSection?.id ? "Editar sección" : "Nueva sección"}</DialogTitle></DialogHeader>
          {editSection && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Página *</Label>
                  <Select value={editSection.page} onValueChange={v => set("page", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAGES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Key * (ej: home.hero)</Label>
                  <Input value={editSection.key} onChange={e => set("key", e.target.value)} placeholder="page.section" />
                </div>
                <div className="col-span-2">
                  <Label>Título *</Label>
                  <Input value={editSection.title} onChange={e => set("title", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Subtítulo</Label>
                  <Input value={editSection.subtitle || ""} onChange={e => set("subtitle", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Cuerpo (texto largo)</Label>
                  <Textarea value={editSection.body || ""} onChange={e => set("body", e.target.value)} rows={4} />
                </div>
                <div>
                  <Label>Orden</Label>
                  <Input type="number" value={editSection.sort_order} onChange={e => set("sort_order", parseInt(e.target.value))} />
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <input type="checkbox" id="sec-active" checked={editSection.active} onChange={e => set("active", e.target.checked)} />
                  <Label htmlFor="sec-active">Activa</Label>
                </div>
                <div className="col-span-2">
                  <Label>Imagen</Label>
                  <div className="flex items-center gap-3 mt-2">
                    {editSection.image_url && <img src={editSection.image_url} className="h-14 w-20 object-cover rounded border" alt="" />}
                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
                      <Upload className="w-4 h-4" />
                      {uploading ? "Subiendo..." : "Subir"}
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleUpload(e.target.files[0])} />
                    </label>
                    <Input className="flex-1" value={editSection.image_url || ""} onChange={e => set("image_url", e.target.value)} placeholder="O pega URL..." />
                  </div>
                </div>
              </div>
              <Button onClick={() => saveMutation.mutate(editSection)}
                disabled={saveMutation.isPending || !editSection.page || !editSection.key || !editSection.title}
                className="w-full bg-[#00509E] hover:bg-[#003366] text-white">
                {saveMutation.isPending ? "Guardando..." : "Guardar sección"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
