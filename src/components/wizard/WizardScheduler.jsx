import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { es } from "date-fns/locale";
import { format, isSunday, startOfDay, addDays } from "date-fns";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

// Same slot labels as the rest of the booking system
const SLOTS = ["Mañana (9–14)", "Tarde (15–19)"];
// 1 installation per slot, matching BookingWizard and FechaStep
const MAX_PER_SLOT = 1;

export default function WizardScheduler({ selectedDate, selectedSlot, onChange }) {
  const [date, setDate] = useState(selectedDate || null);
  const [slot, setSlot] = useState(selectedSlot || null);

  // Same query key as BookingWizard so React Query deduplicates the request
  const { data: reservas = [] } = useQuery({
    queryKey: ["reservas"],
    queryFn: () => base44.entities.ReservaInstalacion.list("-created_date", 500),
    staleTime: 30000,
  });

  // Build occupancy map from pendiente + confirmada only — same logic as FechaStep
  const ocupacionPorDia = useMemo(() => {
    const map = {};
    reservas.forEach((r) => {
      if (["pendiente", "confirmada"].includes(r.estado) && r.fecha && r.franja) {
        if (!map[r.fecha]) map[r.fecha] = {};
        map[r.fecha][r.franja] = true;
      }
    });
    return map;
  }, [reservas]);

  const isSlotFull = (d, sl) => {
    if (!d) return false;
    const iso = format(d, "yyyy-MM-dd");
    return !!(ocupacionPorDia[iso] && ocupacionPorDia[iso][sl]);
  };

  const isDayFull = (d) => {
    const iso = format(d, "yyyy-MM-dd");
    const f = ocupacionPorDia[iso] || {};
    return !!(f["Mañana (9–14)"] && f["Tarde (15–19)"]);
  };

  // 2-day minimum buffer, matching the other booking calendars
  const minDate = addDays(new Date(), 2);
  const disabledDays = [
    { before: startOfDay(minDate) },
    (d) => isSunday(d),
    (d) => isDayFull(d),
  ];

  const handleDaySelect = (d) => {
    setDate(d);
    setSlot(null);
    onChange({ date: d, slot: null });
  };

  const handleSlotSelect = (sl) => {
    if (isSlotFull(date, sl)) return;
    setSlot(sl);
    onChange({ date, slot: sl });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[#00509E]/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-[#00509E]" />
        </div>
        <h2 className="text-lg font-semibold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>
          ¿Cuándo te viene bien para la visita?
        </h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
        {/* Calendario */}
        <div className="flex justify-center">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={handleDaySelect}
            disabled={disabledDays}
            locale={es}
            fromDate={startOfDay(new Date())}
            modifiersClassNames={{
              selected: "rdp-day_selected_custom",
            }}
            styles={{
              day: { borderRadius: "8px" },
            }}
            classNames={{
              day_selected: "bg-[#00509E] text-white hover:bg-[#00509E] rounded-lg",
              day_today: "font-bold text-[#00509E]",
              day_disabled: "opacity-30 cursor-not-allowed",
            }}
          />
        </div>

        {/* Franjas horarias */}
        {date && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 border-t pt-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#00509E]" />
              <p className="text-sm font-semibold text-[#003366]">
                Franja horaria — {format(date, "EEEE d 'de' MMMM", { locale: es })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SLOTS.map((sl) => {
                const full = isSlotFull(date, sl);
                const selected = slot === sl;
                return (
                  <button
                    key={sl}
                    onClick={() => handleSlotSelect(sl)}
                    disabled={full}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      full
                        ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                        : selected
                        ? "border-[#00509E] bg-[#00509E]/5"
                        : "border-gray-200 bg-white hover:border-[#00509E]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#003366] text-sm">{sl}</span>
                      {selected && (
                        <CheckCircle2 className="w-4 h-4 text-[#00509E]" />
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${full ? "text-red-400" : "text-gray-400"}`}>
                      {full ? "No disponible" : "Disponible"}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Confirmación */}
        {date && slot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-800">
              Cita provisional: <strong>{format(date, "EEEE d 'de' MMMM", { locale: es })}</strong> — <strong>{slot}</strong>
            </p>
          </motion.div>
        )}

        <p className="text-xs text-gray-400 mt-3 text-center">
          * La cita es provisional. Te confirmaremos por teléfono en breve.
        </p>
      </div>
    </motion.div>
  );
}