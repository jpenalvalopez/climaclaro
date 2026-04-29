import React, { useState, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { es } from "date-fns/locale";
import { format, isSunday, startOfDay, addDays } from "date-fns";
import { Calendar, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const SLOTS = [
  { id: "manana", label: "Mañana", hours: "9–14" },
  { id: "tarde", label: "Tarde", hours: "15–19" },
];

const MAX_DAYS = 2;

/**
 * value: array of { date: "yyyy-MM-dd", slot: "manana" | "tarde" }
 * onChange: called with the same format
 * Cart.jsx joins them as strings using .join(", ") — so we expose formatted strings
 * via a separate onChangeFormatted, but to keep Cart.jsx working we'll store objects
 * internally and call onChange with formatted strings.
 */
const SLOT_MAP = { manana: "Mañana (9–14)", tarde: "Tarde (15–19)" };

export default function InstallationDatePicker({ value = [], onChange }) {
  // Parse incoming value: can be string[] (legacy) or object[]
  const parseValue = (v) => {
    if (!v || v.length === 0) return [];
    if (typeof v[0] === "string") {
      return v
        .map(s => ({ date: s.split(" ")[0], slot: null }))
        .filter(s => !isNaN(new Date(s.date + "T12:00:00").getTime()));
    }
    return v;
  };

  const [selections, setSelections] = useState(parseValue(value));

  const { data: reservas = [] } = useQuery({
    queryKey: ["reservas_ocupacion"],
    queryFn: () => base44.entities.ReservaInstalacion.list("-created_date", 500),
    staleTime: 30000,
  });

  // Mapa de ocupación por día y franja
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

  const isDayFull = (day) => {
    const iso = format(day, "yyyy-MM-dd");
    const f = ocupacionPorDia[iso] || {};
    return f["Mañana (9–14)"] && f["Tarde (15–19)"];
  };

  const isFranjaDisabled = (iso, slotId) => {
    const franjaLabel = SLOT_MAP[slotId];
    return !!(ocupacionPorDia[iso] && ocupacionPorDia[iso][franjaLabel]);
  };

  const selectedDates = selections.map(s => new Date(s.date + "T12:00:00"));
  const minDate = addDays(new Date(), 2);
  const disabledDays = [{ before: startOfDay(minDate) }, (d) => isSunday(d), (d) => isDayFull(d)];

  const handleDayClick = (day) => {
    const iso = format(day, "yyyy-MM-dd");
    const exists = selections.find(s => s.date === iso);
    let next;
    if (exists) {
      next = selections.filter(s => s.date !== iso);
    } else {
      if (selections.length >= MAX_DAYS) return;
      next = [...selections, { date: iso, slot: null }];
    }
    setSelections(next);
    notifyChange(next);
  };

  const setSlot = (iso, slot) => {
    const next = selections.map(s => s.date === iso ? { ...s, slot } : s);
    setSelections(next);
    notifyChange(next);
  };

  const removeDate = (iso) => {
    const next = selections.filter(s => s.date !== iso);
    setSelections(next);
    notifyChange(next);
  };

  const notifyChange = (sels) => {
    const formatted = sels.map(s => {
      const dayLabel = format(new Date(s.date + "T12:00:00"), "EEE d MMM", { locale: es });
      const slotLabel = s.slot === "manana" ? "Mañana (9–14h)" : s.slot === "tarde" ? "Tarde (15–19h)" : "Franja pendiente";
      return `${dayLabel} – ${slotLabel}`;
    });
    onChange(formatted);
  };

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#00509E]/10 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4 text-[#00509E]" />
        </div>
        <div>
          <p className="font-semibold text-sm text-[#003366]">¿Qué días te vendrían bien para la instalación?</p>
          <p className="text-xs text-gray-500">Selecciona hasta {MAX_DAYS} días preferidos e indica la franja horaria.</p>
        </div>
      </div>

      <style>{`
        .gcal-picker {
          font-family: 'Google Sans', Roboto, Arial, sans-serif;
          font-size: 13px;
          width: 100%;
        }
        .gcal-picker .rdp-months { justify-content: center; }
        .gcal-picker .rdp-caption { padding: 8px 0 4px; display: flex; align-items: center; justify-content: space-between; }
        .gcal-picker .rdp-caption_label { font-size: 14px; font-weight: 500; color: #3c4043; letter-spacing: 0; }
        .gcal-picker .rdp-nav_button { color: #5f6368; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
        .gcal-picker .rdp-nav_button:hover { background-color: #f1f3f4; }
        .gcal-picker .rdp-head_cell { font-size: 11px; font-weight: 500; color: #70757a; text-transform: uppercase; padding: 4px 0; width: 36px; text-align: center; }
        .gcal-picker .rdp-cell { padding: 2px; }
        .gcal-picker .rdp-button { width: 36px; height: 36px; border-radius: 50%; font-size: 12px; color: #3c4043; font-weight: 400; display: flex; align-items: center; justify-content: center; }
        .gcal-picker .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: #f1f3f4; }
        .gcal-picker .rdp-day_today:not(.rdp-day_selected) { color: #1a73e8; font-weight: 600; }
        .gcal-picker .rdp-day_selected { background-color: #1a73e8 !important; color: #fff !important; border-radius: 50% !important; font-weight: 500; }
        .gcal-picker .rdp-day_selected:hover { background-color: #1557b0 !important; }
        .gcal-picker .rdp-day_disabled { color: #bdc1c6 !important; cursor: not-allowed; }
        .gcal-picker .rdp-table { width: 100%; }
      `}</style>
      <div className="flex justify-center w-full">
        <DayPicker
          mode="multiple"
          selected={selectedDates}
          onDayClick={handleDayClick}
          disabled={[...disabledDays, (d) => {
            const iso = format(d, "yyyy-MM-dd");
            return selections.length >= MAX_DAYS && !selections.find(s => s.date === iso);
          }]}
          locale={es}
          fromDate={startOfDay(new Date())}
          className="gcal-picker"
        />
      </div>

      {selections.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#003366]">Días seleccionados:</p>
          {selections.map(({ date, slot }) => (
            <div key={date} className="bg-white rounded-xl p-3 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#00509E]">
                  Franja horaria para el {format(new Date(date + "T12:00:00"), "d 'de' MMMM", { locale: es })}
                </span>
                <button onClick={() => removeDate(date)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                {SLOTS.map(({ id, label, hours }) => {
                  const disabled = isFranjaDisabled(date, id);
                  return (
                    <button
                      key={id}
                      onClick={() => !disabled && setSlot(date, id)}
                      disabled={disabled}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                        disabled
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : slot === id
                          ? "bg-[#00509E] text-white border-[#00509E]"
                          : "bg-white text-gray-700 border-gray-200 hover:border-[#00509E] hover:text-[#00509E]"
                      }`}
                    >
                      {label} ({hours})
                      {disabled && <span className="block text-xs mt-0.5">No disponible</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {selections.length === 0 && (
        <p className="text-xs text-gray-400 text-center">Opcional — puedes dejarlo en blanco y te contactamos nosotros.</p>
      )}

      {selections.length >= MAX_DAYS && (
        <p className="text-xs text-center text-[#00509E] font-medium">Máximo {MAX_DAYS} días seleccionados.</p>
      )}
    </div>
  );
}