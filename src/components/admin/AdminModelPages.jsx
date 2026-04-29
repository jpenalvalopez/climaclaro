import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const EMPTY = {
  brand_name: "", model_code: "", slug: "",
  hero_image_url: "", hero_title: "", hero_subtitle: "",
  intro_title: "", intro_text: "",
  features: [],
  cta_title: "", cta_text: "",
  seo_title: "", seo_description: "",
  active: true, sort_order: 100,
};

export default function AdminModelPages() {
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data: modelPages = [], isLoading } = useQuery({
    queryKey: ["model_pages_admin"],
    queryFn: () => base44.entities.ModelPage.list("sort_order", 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      data.id ? base44.entities.ModelPage.update(data.id, data) : base44.entities.ModelPage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model_pages_admin"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ModelPage.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["model_pages_admin"] }),
  });

  const toggle = (item) => saveMutation.mutate({ ...item, active: !item.active });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#003366]">Páginas de modelo</h2>
          <p className="text-sm text-gray-500 mt-0.5">{modelPages.length} modelos configurados</p>
        </div>
        <Button
          onClick={() => { setEditItem({ ...EMPTY }); setShowForm(true); }}
          className="bg-[#00509E] hover:bg-[#003366] text-white gap-2"
        >
          <Plus className="w-4 h-4" /> Nuevo modelo
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 font-semibold text-gray-600">Marca</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Modelo</th>
              <th className="px-4 py-3 font-semibold text-gray-600">URL</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Hero</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Estado</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>
            ) : modelPages.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay páginas de modelo configuradas</td></tr>
            ) : modelPages.map((item) => (
              <tr key={item.id} className={`border-b hover:bg-gray-50 ${!item.active ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 font-medium text-[#003366]">{item.brand_name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{item.model_code}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">/modelo/{item.slug}</td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{item.hero_title || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {item.active ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link to={`/modelo/${item.slug}`} target="_blank">
                      <Button size="sm" variant="outline" title="Ver página"><ExternalLink className="w-3 h-3" /></Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => toggle(item)} title={item.active ? "Desactivar" : "Activar"}>
                      {item.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditItem({ ...item }); setShowForm(true); }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm" variant="outline" className="text-red-500 hover:bg-red-50"
                      onClick={() => confirm("¿Eliminar esta página de modelo?") && deleteMutation.mutate(item.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem?.id ? "Editar página de modelo" : "Nueva página de modelo"}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <ModelPageForm
              item={editItem}
              onChange={setEditItem}
              onSave={() => saveMutation.mutate(editItem)}
              saving={saveMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModelPageForm({ item, onChange, onSave, saving }) {
  const [uploadingHero, setUploadingHero] = useState(false);
  const set = (field, value) => onChange({ ...item, [field]: value });

  const uploadHero = async (file) => {
    setUploadingHero(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("hero_image_url", file_url);
    setUploadingHero(false);
  };

  const addFeature = () => set("features", [...(item.features || []), { title: "", text: "" }]);
  const updateFeature = (i, field, value) => {
    const updated = [...(item.features || [])];
    updated[i] = { ...updated[i], [field]: value };
    set("features", updated);
  };
  const removeFeature = (i) => set("features", item.features.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {/* Identificación */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Marca *</Label>
          <Input value={item.brand_name} onChange={e => set("brand_name", e.target.value)} placeholder="Mitsubishi" />
        </div>
        <div>
          <Label>Código de modelo *</Label>
          <Input value={item.model_code} onChange={e => set("model_code", e.target.value)} placeholder="MSZ-AP" />
        </div>
        <div className="col-span-2">
          <Label>Slug * (URL: /modelo/slug)</Label>
          <Input
            value={item.slug}
            onChange={e => set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            placeholder="mitsubishi-msz-ap"
          />
        </div>
      </div>

      {/* Hero */}
      <div className="border-t pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hero</p>
        <div>
          <Label>Imagen de fondo</Label>
          <div className="flex items-center gap-3 mt-1">
            {item.hero_image_url && <img src={item.hero_image_url} alt="" className="h-10 w-16 object-cover rounded border shrink-0" />}
            <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 shrink-0">
              <Upload className="w-4 h-4" /> {uploadingHero ? "Subiendo..." : "Subir"}
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadHero(e.target.files[0])} />
            </label>
            <Input value={item.hero_image_url || ""} onChange={e => set("hero_image_url", e.target.value)} placeholder="O pega URL..." className="flex-1" />
          </div>
        </div>
        <div>
          <Label>Título</Label>
          <Input value={item.hero_title || ""} onChange={e => set("hero_title", e.target.value)} />
        </div>
        <div>
          <Label>Subtítulo</Label>
          <Input value={item.hero_subtitle || ""} onChange={e => set("hero_subtitle", e.target.value)} />
        </div>
      </div>

      {/* Intro */}
      <div className="border-t pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Intro</p>
        <div>
          <Label>Título</Label>
          <Input value={item.intro_title || ""} onChange={e => set("intro_title", e.target.value)} />
        </div>
        <div>
          <Label>Texto</Label>
          <Textarea value={item.intro_text || ""} onChange={e => set("intro_text", e.target.value)} rows={3} />
        </div>
      </div>

      {/* Features */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Características destacadas</p>
          <Button type="button" size="sm" variant="outline" onClick={addFeature} className="gap-1">
            <Plus className="w-3 h-3" /> Añadir
          </Button>
        </div>
        {(item.features || []).map((f, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Característica {i + 1}</span>
              <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
            </div>
            <Input placeholder="Título" value={f.title} onChange={e => updateFeature(i, "title", e.target.value)} />
            <Textarea placeholder="Descripción" value={f.text} onChange={e => updateFeature(i, "text", e.target.value)} rows={2} />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="border-t pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">CTA Final</p>
        <div>
          <Label>Título</Label>
          <Input value={item.cta_title || ""} onChange={e => set("cta_title", e.target.value)} />
        </div>
        <div>
          <Label>Texto</Label>
          <Textarea value={item.cta_text || ""} onChange={e => set("cta_text", e.target.value)} rows={2} />
        </div>
      </div>

      {/* SEO */}
      <div className="border-t pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SEO</p>
        <div>
          <Label>Meta title</Label>
          <Input value={item.seo_title || ""} onChange={e => set("seo_title", e.target.value)} />
        </div>
        <div>
          <Label>Meta descripción</Label>
          <Textarea value={item.seo_description || ""} onChange={e => set("seo_description", e.target.value)} rows={2} />
        </div>
      </div>

      <div className="flex items-center gap-6 border-t pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={item.active !== false} onChange={e => set("active", e.target.checked)} />
          <span className="text-sm">Activa</span>
        </label>
        <div className="flex items-center gap-2">
          <Label className="shrink-0">Orden</Label>
          <Input type="number" value={item.sort_order ?? 100} onChange={e => set("sort_order", parseInt(e.target.value) || 100)} className="w-20" />
        </div>
      </div>

      <Button
        onClick={onSave}
        disabled={saving || !item.brand_name || !item.model_code || !item.slug}
        className="w-full bg-[#00509E] hover:bg-[#003366] text-white"
      >
        {saving ? "Guardando..." : "Guardar página de modelo"}
      </Button>
    </div>
  );
}