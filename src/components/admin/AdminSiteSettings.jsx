import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Check } from "lucide-react";

export default function AdminSiteSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [uploading, setUploading] = useState({});
  const [saved, setSaved] = useState(false);

  const { data: settingsList = [], isLoading } = useQuery({
    queryKey: ["site_settings"],
    queryFn: () => base44.entities.SiteSettings.list()
  });

  useEffect(() => {
    if (settingsList.length > 0 && !form) {
      setForm({ ...settingsList[0] });
    } else if (settingsList.length === 0 && !form) {
      setForm({ site_name: "ClimaClaro", tagline: "", phone: "", whatsapp: "", email: "", address: "", schedule: "L-V 9:00–19:00 | S 10:00–14:00", service_area: "", service_areas_list: ["Madrid y alrededores"], logo_url: "", favicon_url: "", footer_text: "" });
    }
  }, [settingsList]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, updated_at: new Date().toISOString() };
      return data.id
        ? base44.entities.SiteSettings.update(data.id, payload)
        : base44.entities.SiteSettings.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  });

  const handleUpload = async (field, file) => {
    setUploading(u => ({ ...u, [field]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, [field]: file_url }));
    setUploading(u => ({ ...u, [field]: false }));
  };

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  if (isLoading || !form) return <div className="text-gray-400 p-6">Cargando...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
      <h2 className="font-bold text-[#003366] text-lg mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Ajustes del sitio</h2>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Nombre del sitio</Label>
            <Input value={form.site_name || ""} onChange={e => set("site_name", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Tagline (texto bajo el logo)</Label>
            <Input value={form.tagline || ""} onChange={e => set("tagline", e.target.value)} placeholder="Climatizacion e instalacion profesional. Sin lios, sin sorpresas." />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={form.phone || ""} onChange={e => set("phone", e.target.value)} placeholder="900 000 000" />
          </div>
          <div>
            <Label>WhatsApp (solo número)</Label>
            <Input value={form.whatsapp || ""} onChange={e => set("whatsapp", e.target.value)} placeholder="34600000000" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email || ""} onChange={e => set("email", e.target.value)} placeholder="info@..." />
          </div>
          <div>
            <Label>Horario de atención</Label>
            <Input value={form.schedule || ""} onChange={e => set("schedule", e.target.value)} placeholder="L-V 9:00–19:00 | S 10:00–14:00" />
          </div>
          <div className="col-span-2">
            <Label>Zona de servicio (top bar, texto corto)</Label>
            <Input value={form.service_area || ""} onChange={e => set("service_area", e.target.value)} placeholder="Madrid y área metropolitana" />
          </div>
          <div className="col-span-2">
            <Label>Zonas de servicio en footer (una por línea)</Label>
            <Textarea
              value={(form.service_areas_list || []).join("\n")}
              onChange={e => set("service_areas_list", e.target.value.split("\n").filter(Boolean))}
              rows={4}
              placeholder={"Madrid y alrededores\nBarcelona y alrededores\nValencia y alrededores"}
            />
          </div>
          <div className="col-span-2">
            <Label>Dirección</Label>
            <Input value={form.address || ""} onChange={e => set("address", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Texto del footer (copyright)</Label>
            <Textarea value={form.footer_text || ""} onChange={e => set("footer_text", e.target.value)} rows={2} placeholder={`© ${new Date().getFullYear()} ${form.site_name || "ClimaClaro"}. Todos los derechos reservados.`} />
          </div>
        </div>

        {/* Funcionalidades */}
        <div className="border rounded-xl p-4 bg-gray-50">
          <p className="text-sm font-semibold text-[#003366] mb-3">Funcionalidades</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Calculadora de ahorro energético</p>
              <p className="text-xs text-gray-400">Aparece en la página de Productos</p>
            </div>
            <button
              type="button"
              onClick={() => set("show_energy_calculator", !form.show_energy_calculator)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.show_energy_calculator !== false ? "bg-emerald-500" : "bg-gray-300"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.show_energy_calculator !== false ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>

        {/* Logo */}
        <div>
          <Label>Logo</Label>
          <div className="flex items-center gap-4 mt-2">
            {form.logo_url && <img src={form.logo_url} className="h-12 w-auto object-contain border rounded" alt="Logo" />}
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4" />
              {uploading.logo_url ? "Subiendo..." : "Subir logo"}
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleUpload("logo_url", e.target.files[0])} />
            </label>
            <div className="flex-1">
              <Input value={form.logo_url || ""} onChange={e => set("logo_url", e.target.value)} placeholder="O pega una URL..." />
            </div>
          </div>
        </div>

        {/* Favicon */}
        <div>
          <Label>Favicon</Label>
          <div className="flex items-center gap-4 mt-2">
            {form.favicon_url && <img src={form.favicon_url} className="h-8 w-8 object-contain border rounded" alt="Favicon" />}
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4" />
              {uploading.favicon_url ? "Subiendo..." : "Subir favicon"}
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleUpload("favicon_url", e.target.files[0])} />
            </label>
            <div className="flex-1">
              <Input value={form.favicon_url || ""} onChange={e => set("favicon_url", e.target.value)} placeholder="O pega una URL..." />
            </div>
          </div>
        </div>

        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}
          className="w-full bg-[#00509E] hover:bg-[#003366] text-white gap-2">
          {saved ? <><Check className="w-4 h-4" /> Guardado</> : saveMutation.isPending ? "Guardando..." : "Guardar ajustes"}
        </Button>
      </div>
    </div>
  );
}
