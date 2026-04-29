import React, { useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { CheckCircle } from "lucide-react";
import { format, addDays, isSunday, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";

const FRANJAS = [
  { value: "Mañana (9–14)", label: "Mañana", hours: "9:00 – 14:00", icon: "🌅" },
  { value: "Tarde (15–19)", label: "Tarde", hours: "15:00 – 19:00", icon: "🌆" },
];

export default function FechaStep({ value, onChange, reservas }) {
  // Mapa: { "yyyy-MM-dd": { "Mañana (9–14)": true, "Tarde (15–19)": true } }
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

  const minDate = addDays(new Date(), 2);

  const isDayDisabled = (day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const franjasDia = ocupacionPorDia[dayStr] || {};
    const ambasFranjasOcupadas = franjasDia["Mañana (9–14)"] && franjasDia["Tarde (15–19)"];
    return (
      isBefore(day, startOfDay(minDate)) ||
      isSunday(day) ||
      ambasFranjasOcupadas
    );
  };

  const isFranjaDisabled = (franja) => {
    if (!value.date) return false;
    const dayStr = format(value.date, "yyyy-MM-dd");
    return !!(ocupacionPorDia[dayStr] && ocupacionPorDia[dayStr][franja]);
  };

  const set = (field, val) => onChange({ ...value, [field]: val });

  return (
    <div className="mt-6 grid md:grid-cols-2 gap-6 items-start">
      {/* Calendar */}
      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-[#003366] text-white px-4 py-3 text-sm font-medium">
          Selecciona una fecha
        </div>
        <div className="p-3 bg-white">
          <Calendar
            mode="single"
            selected={value.date}
            onSelect={(date) => set("date", date)}
            disabled={isDayDisabled}
            locale={es}
            className="mx-auto w-full"
            modifiers={{
              almostFull: (day) => {
                const dayStr = format(day, "yyyy-MM-dd");
                const franjas = ocupacionPorDia[dayStr] || {};
                const count = Object.keys(franjas).length;
                return !isDayDisabled(day) && count === 1;
              },
            }}
            modifiersClassNames={{
              almostFull: "!text-orange-500 font-semibold",
              selected: "!bg-[#00509E] !text-white rounded-full",
            }}
          />
        </div>
        <div className="px-4 py-2 bg-gray-50 border-t flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Disponible
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Casi lleno
          </span>
        </div>
      </div>

      {/* Franja */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-[#003366]">Franja horaria *</p>
        <div className="flex gap-2">
          {FRANJAS.map((f) => {
            const disabled = isFranjaDisabled(f.value);
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => !disabled && set("franja", f.value)}
                disabled={disabled}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                  disabled
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through"
                    : value.franja === f.value
                    ? "bg-[#00509E] text-white border-[#00509E]"
                    : "bg-white text-gray-700 border-gray-200 hover:border-[#00509E] hover:text-[#00509E]"
                }`}
              >
                {f.label} ({f.hours})
                {disabled && <span className="block text-xs mt-0.5 no-underline" style={{ textDecoration: "none" }}>No disponible</span>}
              </button>
            );
          })}
        </div>
        {value.date && !isDayDisabled(value.date) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl border bg-green-50 border-green-200"
          >
            <p className="text-sm font-medium text-green-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {format(value.date, "EEEE, d 'de' MMMM", { locale: es })}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}