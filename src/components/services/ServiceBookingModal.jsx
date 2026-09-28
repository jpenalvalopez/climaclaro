import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, ChevronLeft, ChevronRight, Check, Calendar, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isWeekend, isPast, addDays
} from "date-fns";
import { es } from "date-fns/locale";

const MAX_PER_DAY = 2;

export default function ServiceBookingModal({ service, selectedProduct, onClose }) {
  const [step, setStep] = useState("calendar"); // calendar, form, success
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedFranja, setSelectedFranja] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nombre: "", telefono: "", email: "",
    direccion: "", codigoPostal: "", ciudad: "",
    tipoVivienda: "", ascensor: "", accesoExterior: "", equipoComprado: "No",
    plantaAltura: "", marcaModelo: selectedProduct ? `${selectedProduct.brand || ""} ${selectedProduct.name || ""}`.trim() : "",
    unidadesInteriores: "", distanciaAprox: "", preinstalacion: "",
    comentarios: selectedProduct ? `Servicio: ${service.title} | Producto: ${selectedProduct.name}` : `Servicio: ${service.title}`,
    fotos: [], foto_file_ids: [], aceptaCondiciones: false
  });

  // Load existing reservas to check availability
  const { data: reservas = [] } = useQuery({
    queryKey: ["reservas_calendar"],
    queryFn: () => base44.entities.ReservaInstalacion.list("-created_date", 500)
  });

  const getDayCount = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return reservas.filter(r => r.fecha === dateStr && r.estado !== "cancelada").length;
  };

  const isDayDisabled = (day) => {
    if (isWeekend(day)) return true;
    if (isPast(addDays(day, -1))) return true;
    if (getDayCount(day) >= MAX_PER_DAY) return true;
    return false;
  };

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOfWeek = (startOfMonth(currentMonth).getDay() + 6) % 7; // Mon=0

  const setF = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleUpload = async (files) => {
    setUploading(true);
    const uploaded = await Promise.all(
      Array.from(files).map(f => base44.integrations.Core.UploadFile({
        file: f,
        type: "temp_upload",
      }))
    );
    setForm(f => ({
      ...f,
      foto_file_ids: [...(f.foto_file_ids || []), ...uploaded.map(item => item.file_id).filter(Boolean)],
    }));
    setUploading(false);
  };

  const isFormValid = form.nombre && form.telefono && form.email &&
    form.direccion && /^\d{5}$/.test(form.codigoPostal) && form.ciudad &&
    form.tipoVivienda && form.ascensor && form.accesoExterior &&
    form.equipoComprado && form.aceptaCondiciones;

  const handleSubmit = async () => {
    setSubmitting(true);
    await base44.entities.ReservaInstalacion.create({
      estado: "pendiente",
      tipoServicio: service.tipoServicioEnum,
      fecha: format(selectedDate, "yyyy-MM-dd"),
      franja: selectedFranja,
      nombre: form.nombre,
      telefono: form.telefono,
      email: form.email,
      direccion: form.direccion,
      codigoPostal: form.codigoPostal,
      ciudad: form.ciudad,
      tipoVivienda: form.tipoVivienda,
      ascensor: form.ascensor,
      accesoExterior: form.accesoExterior,
      equipoComprado: selectedProduct ? "Sí" : form.equipoComprado,
      aceptaCondiciones: form.aceptaCondiciones,
      plantaAltura: form.plantaAltura || undefined,
      marcaModelo: form.marcaModelo || undefined,
      unidadesInteriores: form.unidadesInteriores ? parseInt(form.unidadesInteriores) : undefined,
      distanciaAprox: form.distanciaAprox || undefined,
      preinstalacion: form.preinstalacion || undefined,
      comentarios: form.comentarios || undefined,
      fotos: form.fotos,
      foto_file_ids: form.foto_file_ids,
    });
    setSubmitting(false);
    setStep("success");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-[#003366] text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {step === "calendar" ? "Elige fecha y franja" : step === "form" ? "Datos de instalación" : "¡Reserva confirmada!"}
            </h2>
            <p className="text-sm text-gray-500">{service.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* STEP: Calendar */}
          {step === "calendar" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-gray-100">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="font-semibold text-[#003366] capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: es })}
                </h3>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-gray-100">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map(d => (
                  <div key={d} className="text-xs font-semibold text-gray-400 py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
                {days.map(day => {
                  const disabled = isDayDisabled(day);
                  const count = getDayCount(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  return (
                    <button
                      key={day.toISOString()}
                      disabled={disabled}
                      onClick={() => { setSelectedDate(day); setSelectedFranja(""); }}
                      className={`aspect-square rounded-xl text-sm font-medium flex flex-col items-center justify-center transition-all
                        ${isSelected ? "bg-[#00509E] text-white shadow-lg" :
                          disabled ? "text-gray-300 cursor-not-allowed" :
                          "hover:bg-[#F0F4F8] text-[#003366]"}`}
                    >
                      <span>{format(day, "d")}</span>
                      {!disabled && count > 0 && (
                        <span className={`text-[9px] ${isSelected ? "text-blue-200" : "text-orange-400"}`}>
                          {MAX_PER_DAY - count} libre{MAX_PER_DAY - count !== 1 ? "s" : ""}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-gray-400 text-center">No disponible: fines de semana y días con agenda completa.</p>

              {selectedDate && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-[#003366]">
                    Franja horaria para el {format(selectedDate, "d 'de' MMMM", { locale: es })}
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {["Mañana (9–14)", "Tarde (15–19)"].map(franja => (
                      <button
                        key={franja}
                        onClick={() => setSelectedFranja(franja)}
                        className={`p-4 rounded-xl border-2 font-medium transition-all ${
                          selectedFranja === franja ? "border-[#00509E] bg-[#F0F4F8] text-[#003366]" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {franja}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => setStep("form")}
                disabled={!selectedDate || !selectedFranja}
                className="w-full bg-[#00509E] hover:bg-[#003366] text-white rounded-xl"
              >
                Continuar con los datos →
              </Button>
            </div>
          )}

          {/* STEP: Form */}
          {step === "form" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 bg-[#F0F4F8] rounded-xl px-4 py-3 text-sm">
                <Calendar className="w-4 h-4 text-[#00509E]" />
                <span className="text-[#003366] font-medium capitalize">
                  {format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es })} — {selectedFranja}
                </span>
                <button onClick={() => setStep("calendar")} className="ml-auto text-xs text-[#00509E] hover:underline">Cambiar</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Required */}
                <div className="col-span-2">
                  <Label>Nombre completo *</Label>
                  <Input value={form.nombre} onChange={e => setF("nombre", e.target.value)} />
                </div>
                <div>
                  <Label>Teléfono *</Label>
                  <Input value={form.telefono} onChange={e => setF("telefono", e.target.value)} />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={e => setF("email", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Dirección *</Label>
                  <Input value={form.direccion} onChange={e => setF("direccion", e.target.value)} />
                </div>
                <div>
                  <Label>Código postal * (5 dígitos)</Label>
                  <Input value={form.codigoPostal} onChange={e => setF("codigoPostal", e.target.value)} placeholder="28001" maxLength={5} />
                  {form.codigoPostal && !/^\d{5}$/.test(form.codigoPostal) && (
                    <p className="text-xs text-red-500 mt-1">Debe tener 5 dígitos</p>
                  )}
                </div>
                <div>
                  <Label>Ciudad *</Label>
                  <Input value={form.ciudad} onChange={e => setF("ciudad", e.target.value)} />
                </div>
                <div>
                  <Label>Tipo de vivienda *</Label>
                  <Select value={form.tipoVivienda} onValueChange={v => setF("tipoVivienda", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{["Piso", "Chalet", "Local", "Oficina"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ascensor *</Label>
                  <Select value={form.ascensor} onValueChange={v => setF("ascensor", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{["Sí", "No", "No aplica"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Acceso exterior *</Label>
                  <Select value={form.accesoExterior} onValueChange={v => setF("accesoExterior", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{["Balcón", "Patio interior", "Fachada", "Azotea", "No lo sé"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Equipo comprado *</Label>
                  <Select value={selectedProduct ? "Sí" : form.equipoComprado} onValueChange={v => setF("equipoComprado", v)} disabled={!!selectedProduct}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Sí", "No"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Optional */}
                <div>
                  <Label>Planta / Altura</Label>
                  <Input value={form.plantaAltura} onChange={e => setF("plantaAltura", e.target.value)} placeholder="Ej: 3º" />
                </div>
                <div>
                  <Label>Marca y modelo del equipo</Label>
                  <Input value={form.marcaModelo} onChange={e => setF("marcaModelo", e.target.value)} />
                </div>
                <div>
                  <Label>Nº unidades interiores</Label>
                  <Input type="number" value={form.unidadesInteriores} onChange={e => setF("unidadesInteriores", e.target.value)} />
                </div>
                <div>
                  <Label>Distancia aprox. entre unidades</Label>
                  <Select value={form.distanciaAprox} onValueChange={v => setF("distanciaAprox", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{["<3m", "3–5m", "5–10m", ">10m", "No lo sé"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>¿Tiene preinstalación?</Label>
                  <Select value={form.preinstalacion} onValueChange={v => setF("preinstalacion", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{["Sí", "No", "No lo sé"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Comentarios</Label>
                  <Textarea value={form.comentarios} onChange={e => setF("comentarios", e.target.value)} rows={2} />
                </div>

                {/* Photos */}
                <div className="col-span-2">
                  <Label>Fotos (opcional)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.fotos.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} className="h-16 w-16 object-cover rounded-lg border" alt="" />
                        <button className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100"
                          onClick={() => setF("fotos", form.fotos.filter((_, j) => j !== i))}>✕</button>
                      </div>
                    ))}
                    <label className="h-16 w-16 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files?.length && handleUpload(e.target.files)} />
                    </label>
                  </div>
                  {uploading && <p className="text-xs text-gray-400 mt-1">Subiendo...</p>}
                </div>

                {/* Terms */}
                <div className="col-span-2 flex items-start gap-3">
                  <input type="checkbox" id="terms-booking" checked={form.aceptaCondiciones}
                    onChange={e => setF("aceptaCondiciones", e.target.checked)} className="mt-1" />
                  <label htmlFor="terms-booking" className="text-sm text-gray-600 cursor-pointer">
                    Acepto los términos y condiciones del servicio y la política de privacidad. *
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("calendar")} className="flex-1 rounded-xl">← Volver</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid || submitting}
                  className="flex-2 bg-[#00509E] hover:bg-[#003366] text-white rounded-xl px-8"
                >
                  {submitting ? "Enviando..." : "Confirmar reserva"}
                </Button>
              </div>
            </div>
          )}

          {/* STEP: Success */}
          {step === "success" && (
            <div className="flex flex-col items-center text-center py-8 gap-5">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>¡Reserva enviada!</h3>
              <p className="text-gray-600 max-w-sm">
                Hemos recibido tu solicitud para el <strong>{selectedDate && format(selectedDate, "d 'de' MMMM", { locale: es })}</strong> — {selectedFranja}.
                Nos pondremos en contacto contigo para confirmar.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="rounded-full px-6">Cerrar</Button>
                <Link to={createPageUrl("Cart")}>
                  <Button className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-6">Ver carrito</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
