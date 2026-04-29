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
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { invalidateCmsCache } from "@/components/cms/cmsHelpers";

const PAGES = ["about","legal","install","warranty","returns"];

const EMPTY = {
  page: "about", key: "", title: "", content: "", content_format: "markdown",
  image_url: "", active: true, sort_order: 100
};

export default function AdminWebContent() {
  const qc = useQueryClient();
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["webcontent_admin"],
    queryFn: () => base44.entities.WebContent.list("sort_order", 100)
  });

  const saveMutation = useMutation({
    mutationFn: d => {
      const payload = { ...d, updated_at: new Date().toISOString() };
      return d.id ? base44.entities.WebContent.update(d.id, payload) : base44.entities.WebContent.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["webcontent_admin"] }); invalidateCmsCache(qc); closeForm(); }
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.WebContent.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["webcontent_admin"] }); invalidateCmsCache(qc); }
  });

  const closeForm = () => { setShowForm(false); setEditItem(null); setPreview(false); };
  const set = (f, v) => setEditItem(s => ({ ...s, [f]: v }));
  const openNew = () => { setEditItem({ ...EMPTY }); setShowForm(true); };
  const openEdit = item => { setEditItem({ ...item }); setShowForm(true); };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{items.length} páginas de contenido</p>
        <Button onClick={openNew} className="bg-[#00509E] hover:bg-[#003366] text-white gap-2 h-9 text-sm">
          <Plus className="w-4 h-4" /> Nueva página
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 text-center py-10 text-gray-400">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="col-span-2 text-center py-10 text-gray-400">Sin contenidos. Crea el primero.</div>
        ) : items.map(item => (
          <div key={item.id} className={`bg-white rounded-xl border p-5 shadow-sm ${!item.active ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex gap-2 mb-1">
                  <Badge className="bg-blue-100 text-blue-700 text-xs">{item.page}</Badge>
                  <Badge className="bg-gray-100 text-gray-600 text-xs font-mono">{item.key}</Badge>
                </div>
                <h3 className="font-semibold text-[#003366]">{item.title || "(sin título)"}</h3>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openEdit(item)}><Pencil className="w-3 h-3" /></Button>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => confirm("¿Eliminar?") && deleteMutation.mutate(item.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">{(item.content || "").substring(0, 120)}...</p>
            {item.updated_at && (
              <p className="text-xs text-gray-400 mt-2">Actualizado: {new Date(item.updated_at).toLocaleDateString("es-ES")}</p>
            )}
          </div>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) closeForm(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {editItem?.id ? "Editar contenido" : "Nuevo contenido"}
              <Button variant="outline" size="sm" onClick={() => setPreview(p => !p)} className="ml-auto gap-1 text-xs">
                {preview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {preview ? "Editor" : "Preview"}
              </Button>
            </DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Página</Label>
                  <Select value={editItem.page} onValueChange={v => set("page", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAGES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Clave * <span className="text-gray-400 font-normal text-xs">(ej: about.nosotros)</span></Label>
                  <Input value={editItem.key} onChange={e => set("key", e.target.value)} className="font-mono text-sm" />
                </div>
                <div>
                  <Label>Formato</Label>
                  <Select value={editItem.content_format} onValueChange={v => set("content_format", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markdown">Markdown</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Título de la página</Label>
                <Input value={editItem.title || ""} onChange={e => set("title", e.target.value)} />
              </div>
              <div>
                <Label>Imagen destacada (URL, opcional)</Label>
                <Input value={editItem.image_url || ""} onChange={e => set("image_url", e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label>Contenido {editItem.content_format === "markdown" ? "(Markdown)" : "(HTML)"} *</Label>
                {preview ? (
                  <div className="min-h-[300px] border rounded-lg p-4 prose prose-sm prose-blue max-w-none bg-gray-50">
                    <ReactMarkdown>{editItem.content || ""}</ReactMarkdown>
                  </div>
                ) : (
                  <Textarea
                    value={editItem.content || ""}
                    onChange={e => set("content", e.target.value)}
                    rows={14}
                    className="font-mono text-sm"
                    placeholder={editItem.content_format === "markdown" ? "# Título\n\nContenido en **Markdown**..." : "<h1>Título</h1>"}
                  />
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="wc-active" checked={editItem.active !== false} onChange={e => set("active", e.target.checked)} />
                  <Label htmlFor="wc-active">Activo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Orden</Label>
                  <Input type="number" value={editItem.sort_order} onChange={e => set("sort_order", parseInt(e.target.value) || 100)} className="w-20 h-8 text-sm" />
                </div>
              </div>
              <Button onClick={() => saveMutation.mutate(editItem)} disabled={saveMutation.isPending || !editItem.key}
                className="w-full bg-[#00509E] hover:bg-[#003366] text-white">
                {saveMutation.isPending ? "Guardando..." : "Guardar contenido"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}