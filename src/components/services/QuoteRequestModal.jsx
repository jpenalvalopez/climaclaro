import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { Check, Upload, X, Loader2, FileImage } from "lucide-react";

export default function QuoteRequestModal({ open, onOpenChange, service }) {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", ciudad: "", descripcion: "" });
  const [files, setFiles] = useState([]); // { file, url, uploading, error }
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef();

  const reset = () => {
    setForm({ nombre: "", email: "", telefono: "", ciudad: "", descripcion: "" });
    setFiles([]);
    setDone(false);
    setSubmitting(false);
  };

  const handleClose = (val) => {
    onOpenChange(val);
    if (!val) setTimeout(reset, 300);
  };

  const handleFileChange = async (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;
    e.target.value = "";

    const newEntries = selected.map(f => ({ file: f, url: null, uploading: true, error: false, preview: URL.createObjectURL(f) }));
    setFiles(prev => [...prev, ...newEntries]);

    const results = await Promise.all(
      newEntries.map(async (entry) => {
        try {
          const { file_id, file_asset } = await base44.integrations.Core.UploadFile({
            file: entry.file,
            type: "temp_upload",
          });
          return { ...entry, fileId: file_id, objectPath: file_asset?.object_path, uploading: false };
        } catch {
          return { ...entry, uploading: false, error: true };
        }
      })
    );

    setFiles(prev => {
      const kept = prev.filter(p => !newEntries.find(n => n.preview === p.preview));
      return [...kept, ...results];
    });
  };

  const removeFile = (preview) => {
    setFiles(prev => prev.filter(f => f.preview !== preview));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const uploadedFileIds = files.filter(f => f.fileId).map(f => f.fileId);
    await base44.entities.Presupuesto.create({
      ...form,
      service_id: service?.id || "",
      service_name: service?.title || "",
      foto_file_ids: uploadedFileIds,
      status: "nuevo",
    });
    setDone(true);
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#003366] text-xl" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Solicitar presupuesto
          </DialogTitle>
          {service && <p className="text-sm text-gray-500 mt-1">Servicio: <span className="font-medium text-[#00509E]">{service.title}</span></p>}
        </DialogHeader>

        {done ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-bold text-[#003366] text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>¡Solicitud enviada!</h3>
            <p className="text-gray-500 text-sm">Revisaremos tu solicitud y te enviaremos un presupuesto personalizado en menos de 24h.</p>
            <Button onClick={() => handleClose(false)} className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-8">Cerrar</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                placeholder="Nombre *"
                required
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="rounded-xl"
              />
              <Input
                placeholder="Teléfono *"
                required
                value={form.telefono}
                onChange={e => setForm({ ...form, telefono: e.target.value })}
                className="rounded-xl"
              />
              <Input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="rounded-xl"
              />
              <Input
                placeholder="Ciudad"
                value={form.ciudad}
                onChange={e => setForm({ ...form, ciudad: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <Textarea
              placeholder="Describe tu instalación: tipo de vivienda, superficie, si tienes preinstalación, dificultades de acceso... Cuanta más información, mejor valoración podremos hacerte."
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              className="rounded-xl"
              rows={4}
            />

            {/* File upload */}
            <div>
              <p className="text-sm font-medium text-[#003366] mb-2">Adjunta fotos o planos (opcional)</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-blue-200 rounded-xl p-5 flex flex-col items-center gap-2 hover:border-[#00509E] hover:bg-blue-50/50 transition-colors text-gray-400 hover:text-[#00509E]"
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm">Haz clic para subir imágenes o planos</span>
                <span className="text-xs">JPG, PNG, PDF — máx. 10 MB por archivo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              {files.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden border border-gray-200 aspect-square bg-gray-50 flex items-center justify-center">
                      {f.file.type.startsWith("image/") ? (
                        <img src={f.preview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FileImage className="w-8 h-8 text-gray-400" />
                      )}
                      {f.uploading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-[#00509E] animate-spin" />
                        </div>
                      )}
                      {f.error && (
                        <div className="absolute inset-0 bg-red-50/80 flex items-center justify-center">
                          <span className="text-xs text-red-500">Error</span>
                        </div>
                      )}
                      {!f.uploading && (
                        <button
                          type="button"
                          onClick={() => removeFile(f.preview)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitting || !form.nombre || !form.telefono || files.some(f => f.uploading)}
                className="w-full bg-[#FF6F61] hover:bg-[#e5574a] text-white rounded-full h-12 font-semibold shadow-lg shadow-[#FF6F61]/20"
              >
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : "Enviar solicitud de presupuesto"}
              </Button>
              <p className="text-xs text-gray-400 text-center mt-2">Sin compromiso. Te responderemos en menos de 24h.</p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
