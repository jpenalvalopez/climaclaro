import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye, EyeOff, Home, ShoppingBag } from "lucide-react";

const EMPTY = {
  title: "",
  subtitle: "",
  badge: "",
  cta_label: "Ver más",
  cta_url: "/Products",
  image_url: "",
  gradient_from: "#003366",
  gradient_to: "#00509E",
  show_in_products: true,
  show_in_home: false,
  active: true,
  sort_order: 100,
};

export default function AdminPromoSlides() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null | "new" | slide object

  const { data: slides = [] } = useQuery({
    queryKey: ["promo_slides_admin"],
    queryFn: () => base44.entities.PromoSlide.list("sort_order", 50),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      data.id
        ? base44.entities.PromoSlide.update(data.id, data)
        : base44.entities.PromoSlide.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promo_slides_admin"] });
      qc.invalidateQueries({ queryKey: ["promo_slides"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PromoSlide.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promo_slides_admin"] });
      qc.invalidateQueries({ queryKey: ["promo_slides"] });
    },
  });

  const toggleActive = (slide) => {
    base44.entities.PromoSlide.update(slide.id, { active: !slide.active }).then(() => {
      qc.invalidateQueries({ queryKey: ["promo_slides_admin"] });
      qc.invalidateQueries({ queryKey: ["promo_slides"] });
    });
  };

  if (editing !== null) {
    return (
      <SlideForm
        initial={editing === "new" ? EMPTY : editing}
        onSave={(data) => saveMutation.mutate(data)}
        onCancel={() => setEditing(null)}
        saving={saveMutation.isPending}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#003366]">Carrusel de promociones</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona los slides del carrusel para Productos e Inicio</p>
        </div>
        <Button onClick={() => setEditing("new")} className="bg-[#00509E] text-white rounded-full gap-2">
          <Plus className="w-4 h-4" /> Nuevo slide
        </Button>
      </div>

      {slides.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
          <p>No hay slides todavía. Crea el primero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className={`bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm ${!slide.active ? "opacity-50" : ""}`}
            >
              {/* Color preview */}
              <div
                className="w-12 h-12 rounded-xl shrink-0"
                style={{ background: `linear-gradient(135deg, ${slide.gradient_from || "#003366"}, ${slide.gradient_to || "#00509E"})` }}
              />

              {/* Image thumb */}
              {slide.image_url && (
                <img src={slide.image_url} alt="" className="w-14 h-12 object-cover rounded-xl shrink-0" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#003366] truncate">{slide.title}</p>
                <p className="text-xs text-gray-400 truncate">{slide.subtitle}</p>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {slide.badge && <Badge variant="outline" className="text-[10px] py-0">{slide.badge}</Badge>}
                  {slide.show_in_products && (
                    <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      <ShoppingBag className="w-3 h-3" /> Productos
                    </span>
                  )}
                  {slide.show_in_home && (
                    <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <Home className="w-3 h-3" /> Inicio
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(slide)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title={slide.active ? "Desactivar" : "Activar"}>
                  {slide.active ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                </button>
                <button onClick={() => setEditing(slide)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => { if (confirm("¿Eliminar este slide?")) deleteMutation.mutate(slide.id); }}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SlideForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-[#003366] mb-5">{form.id ? "Editar slide" : "Nuevo slide"}</h3>

      {/* Preview */}
      <div
        className="rounded-xl h-28 mb-5 flex items-center px-8 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${form.gradient_from || "#003366"}, ${form.gradient_to || "#00509E"})` }}
      >
        {form.image_url && <img src={form.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
        <div className="z-10">
          {form.badge && <span className="bg-[#FF6F61] text-white text-xs font-bold px-2 py-0.5 rounded-full block w-fit mb-1">{form.badge}</span>}
          <p className="text-white font-bold text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>{form.title || "Título del slide"}</p>
          <p className="text-blue-200 text-xs">{form.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">Título *</label>
          <Input value={form.title} onChange={e => set("title", e.target.value)} className="rounded-xl" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">Subtítulo</label>
          <Input value={form.subtitle || ""} onChange={e => set("subtitle", e.target.value)} className="rounded-xl" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Etiqueta (badge)</label>
          <Input value={form.badge || ""} onChange={e => set("badge", e.target.value)} placeholder="Ej: Oferta" className="rounded-xl" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Texto del botón</label>
          <Input value={form.cta_label || ""} onChange={e => set("cta_label", e.target.value)} placeholder="Ver más" className="rounded-xl" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">URL de destino</label>
          <Input value={form.cta_url || ""} onChange={e => set("cta_url", e.target.value)} placeholder="/Products?category=monosplit" className="rounded-xl" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">URL de imagen</label>
          <Input value={form.image_url || ""} onChange={e => set("image_url", e.target.value)} placeholder="https://..." className="rounded-xl" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Color gradiente (inicio)</label>
          <div className="flex items-center gap-2">
            <input type="color" value={form.gradient_from || "#003366"} onChange={e => set("gradient_from", e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
            <Input value={form.gradient_from || "#003366"} onChange={e => set("gradient_from", e.target.value)} className="rounded-xl flex-1" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Color gradiente (fin)</label>
          <div className="flex items-center gap-2">
            <input type="color" value={form.gradient_to || "#00509E"} onChange={e => set("gradient_to", e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
            <Input value={form.gradient_to || "#00509E"} onChange={e => set("gradient_to", e.target.value)} className="rounded-xl flex-1" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Orden</label>
          <Input type="number" value={form.sort_order ?? 100} onChange={e => set("sort_order", Number(e.target.value))} className="rounded-xl" />
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-4 mt-5">
        {[
          { key: "active", label: "Activo", color: "green" },
          { key: "show_in_products", label: "Mostrar en Productos", color: "blue" },
          { key: "show_in_home", label: "Mostrar en Inicio", color: "purple" },
        ].map(({ key, label, color }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => set(key, !form[key])}
              className={`w-10 h-6 rounded-full transition-colors relative ${form[key] ? `bg-${color}-500` : "bg-gray-200"}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form[key] ? "translate-x-5" : "translate-x-1"}`} />
            </div>
            <span className="text-sm text-gray-600">{label}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={onCancel} className="rounded-full">Cancelar</Button>
        <Button
          onClick={() => onSave(form)}
          disabled={saving || !form.title}
          className="bg-[#00509E] text-white rounded-full"
        >
          {saving ? "Guardando..." : "Guardar slide"}
        </Button>
      </div>
    </div>
  );
}