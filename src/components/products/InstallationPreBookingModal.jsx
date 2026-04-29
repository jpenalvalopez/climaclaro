import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { es } from "date-fns/locale";
import { format, isSunday, startOfDay } from "date-fns";
import { Calendar, Clock, CheckCircle2, ArrowLeft, ArrowRight, CreditCard, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SLOTS = ["Mañana (9–14)", "Tarde (15–19)"];
const MAX_PER_SLOT = 3;

function useOccupancy() {
  const { data: reservas = [] } = useQuery({
    queryKey: ["reservas_for_availability"],
    queryFn: () => base44.entities.ReservaInstalacion.filter({ estado: "confirmada" }, "-fecha", 300),
    staleTime: 60000,
  });
  const { data: leads = [] } = useQuery({
    queryKey: ["leads_scheduled"],
    queryFn: () => base44.entities.Lead.filter({ source: "wizard" }, "-created_date", 300),
    staleTime: 60000,
  });

  return useMemo(() => {
    const map = {};
    const add = (fecha, franja) => {
      if (!fecha || !franja) return;
      const key = `${fecha}__${franja}`;
      map[key] = (map[key] || 0) + 1;
    };
    reservas.forEach(r => add(r.fecha, r.franja));
    leads.forEach(l => l.scheduled_date && l.scheduled_slot && add(l.scheduled_date, l.scheduled_slot));
    return map;
  }, [reservas, leads]);
}

export default function InstallationPreBookingModal({ open, onClose, product, installationPrice }) {
  const [step, setStep] = useState(1); // 1: info+calendar, 2: datos, 3: confirmación
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", city: "", postal_code: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const occupancy = useOccupancy();

  const deposit = installationPrice ? Math.round(installationPrice * 0.1 * 100) / 100 : null;
  const remaining = installationPrice && deposit ? installationPrice - deposit : null;

  const getCount = (d, sl) => {
    if (!d) return 0;
    return occupancy[`${format(d, "yyyy-MM-dd")}__${sl}`] || 0;
  };
  const isFull = (d, sl) => getCount(d, sl) >= MAX_PER_SLOT;

  const disabledDays = [{ before: startOfDay(new Date()) }, (d) => isSunday(d)];

  const handleDaySelect = (d) => {
    setSelectedDate(d);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (sl) => {
    if (isFull(selectedDate, sl)) return;
    setSelectedSlot(sl);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await base44.entities.Lead.create({
      name: form.name,
      phone: form.phone,
      email: form.email,
      city: form.city,
      source: "product_page",
      message: `PRE-RESERVA de instalación — Producto: ${product?.name || ""}. Dirección: ${form.address}, ${form.postal_code} ${form.city}. Fecha propuesta: ${selectedDate ? format(selectedDate, "dd/MM/yyyy") : "—"} / ${selectedSlot || "—"}`,
      scheduled_date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
      scheduled_slot: selectedSlot || undefined,
      status: "new",
    });
    setSubmitted(true);
    setSubmitting(false);
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedDate(null);
    setSelectedSlot(null);
    setForm({ name: "", phone: "", email: "", address: "", city: "", postal_code: "" });
    setSubmitted(false);
    onClose();
  };

  const canGoStep2 = selectedDate && selectedSlot;
  const canSubmit = form.name && form.phone && form.email;

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#003366] text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Pre-reserva de instalación
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-bold text-[#003366] text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>¡Pre-reserva recibida!</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Nos pondremos en contacto contigo en breve para confirmar la fecha y gestionar el pago de la señal ({deposit ? `${deposit.toFixed(2)} €` : "10%"}).
            </p>
            <Button onClick={resetAndClose} className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-8">
              Cerrar
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-5 mt-1">

            {/* Steps indicator */}
            <div className="flex items-center gap-2">
              {["Fecha", "Datos", "Confirmar"].map((label, i) => (
                <React.Fragment key={label}>
                  <div className={`flex items-center gap-1.5 ${i + 1 <= step ? "text-[#00509E]" : "text-gray-300"}`}>
                    <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${i + 1 <= step ? "bg-[#00509E] text-white" : "bg-gray-100 text-gray-400"}`}>{i + 1}</div>
                    <span className="text-xs font-medium hidden sm:inline">{label}</span>
                  </div>
                  {i < 2 && <div className={`flex-1 h-px ${i + 1 < step ? "bg-[#00509E]" : "bg-gray-200"}`} />}
                </React.Fragment>
              ))}
            </div>

            {/* Payment info banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed">
                <strong>Pago en dos partes:</strong> al confirmar la reserva se cobra una señal del <strong>10%</strong>
                {deposit ? ` (${deposit.toFixed(2)} €)` : ""}. El resto
                {remaining ? ` (${remaining.toFixed(2)} €)` : ""} se abona al finalizar la instalación.
              </div>
            </div>

            <AnimatePresence mode="wait">

              {/* STEP 1: Calendario */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#00509E]" />
                    Elige una fecha en la que te venga bien
                  </p>

                  <div className="flex justify-center">
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDaySelect}
                      disabled={disabledDays}
                      locale={es}
                      fromDate={startOfDay(new Date())}
                      classNames={{
                        day_selected: "bg-[#00509E] text-white hover:bg-[#00509E] rounded-lg",
                        day_today: "font-bold text-[#00509E]",
                        day_disabled: "opacity-30 cursor-not-allowed",
                      }}
                    />
                  </div>

                  {selectedDate && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                      <p className="text-sm font-semibold text-[#003366] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#00509E]" />
                        Franja horaria — {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {SLOTS.map((sl) => {
                          const full = isFull(selectedDate, sl);
                          const active = selectedSlot === sl;
                          const remaining = MAX_PER_SLOT - getCount(selectedDate, sl);
                          return (
                            <button key={sl} onClick={() => handleSlotSelect(sl)} disabled={full}
                              className={`p-3 rounded-xl border-2 transition-all text-left ${full ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed" : active ? "border-[#00509E] bg-[#00509E]/5" : "border-gray-200 hover:border-[#00509E]/40"}`}>
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-[#003366] text-sm">{sl}</span>
                                {active && <CheckCircle2 className="w-4 h-4 text-[#00509E]" />}
                              </div>
                              <p className={`text-xs mt-0.5 ${full ? "text-red-400" : remaining <= 1 ? "text-orange-500" : "text-gray-400"}`}>
                                {full ? "Completo" : remaining === 1 ? "¡Último hueco!" : `${remaining} huecos disponibles`}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  <Button onClick={() => setStep(2)} disabled={!canGoStep2}
                    className="w-full bg-[#00509E] hover:bg-[#003366] text-white rounded-full gap-2">
                    Continuar <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}

              {/* STEP 2: Datos */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                  <p className="text-sm text-gray-600 font-medium">Tus datos de contacto</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">Nombre *</Label>
                      <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tu nombre completo" className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Teléfono *</Label>
                      <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="6XX XXX XXX" className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Email *</Label>
                      <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="tu@email.com" className="rounded-xl mt-1" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Dirección de instalación</Label>
                      <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Calle y número" className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Ciudad</Label>
                      <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Ciudad" className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Código postal</Label>
                      <Input value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} placeholder="28000" className="rounded-xl mt-1" />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="gap-1 rounded-full">
                      <ArrowLeft className="w-4 h-4" /> Volver
                    </Button>
                    <Button onClick={() => setStep(3)} disabled={!canSubmit} className="flex-1 bg-[#00509E] hover:bg-[#003366] text-white rounded-full gap-2">
                      Revisar <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Confirmación */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="bg-[#F0F4F8] rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Producto</span>
                      <span className="font-medium text-[#003366] text-right max-w-[200px]">{product?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fecha propuesta</span>
                      <span className="font-medium text-[#003366]">{selectedDate ? format(selectedDate, "dd/MM/yyyy") : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Franja</span>
                      <span className="font-medium text-[#003366]">{selectedSlot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nombre</span>
                      <span className="font-medium text-[#003366]">{form.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Teléfono</span>
                      <span className="font-medium text-[#003366]">{form.phone}</span>
                    </div>
                    {form.city && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ciudad</span>
                        <span className="font-medium text-[#003366]">{form.city}</span>
                      </div>
                    )}
                    {installationPrice && (
                      <>
                        <div className="border-t pt-2 flex justify-between text-xs text-gray-500">
                          <span>Señal ahora (10%)</span>
                          <span className="font-semibold text-amber-700">{deposit?.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Resto al finalizar</span>
                          <span className="font-semibold text-[#003366]">{remaining?.toFixed(2)} €</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="bg-blue-50 rounded-xl p-3 text-xs text-[#00509E] leading-relaxed">
                    📞 Te contactaremos para confirmar la fecha y gestionar el pago de la señal. La reserva no es definitiva hasta recibir la confirmación.
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)} className="gap-1 rounded-full">
                      <ArrowLeft className="w-4 h-4" /> Volver
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-[#FF6F61] hover:bg-[#e5574a] text-white rounded-full gap-2 font-semibold">
                      <CreditCard className="w-4 h-4" />
                      {submitting ? "Enviando..." : "Confirmar pre-reserva"}
                    </Button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}