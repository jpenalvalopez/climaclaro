import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingDown, Euro, Leaf, ChevronDown, ChevronUp, Info } from "lucide-react";

const ELECTRICITY_PRICE = 0.22; // €/kWh Spain avg 2024
const OLD_AC_EER = 2.5;         // old/no AC efficiency ratio
const NEW_AC_EER = 4.5;         // A+++ typical EER

// Watts needed per m² to maintain comfort
const W_PER_M2 = 100;

// Average hours of use per year (Madrid climate)
const HOURS_SUN_MAP = {
  "Mucho sol (orientación sur)": 900,
  "Sol moderado (este/oeste)": 700,
  "Poco sol (orientación norte)": 500,
};

// Area midpoint map
const AREA_MAP = {
  "Menos de 15 m²": 12,
  "15 – 20 m²": 17,
  "20 – 30 m²": 25,
  "30 – 40 m²": 35,
  "Más de 40 m²": 50,
};

function calcSavings(answers) {
  const rooms = answers?.rooms_data || [];
  let totalOldKwh = 0;
  let totalNewKwh = 0;

  if (rooms.length > 0) {
    rooms.forEach(room => {
      const area = AREA_MAP[room.area_m2] || 25;
      const hours = HOURS_SUN_MAP[room.sun_exposure] || 700;
      const watts = area * W_PER_M2;
      totalOldKwh += (watts / OLD_AC_EER / 1000) * hours;
      totalNewKwh += (watts / NEW_AC_EER / 1000) * hours;
    });
  } else {
    // single room answers
    const area = AREA_MAP[answers?.area_m2] || 25;
    const hours = HOURS_SUN_MAP[answers?.sun_exposure] || 700;
    const watts = area * W_PER_M2;
    totalOldKwh = (watts / OLD_AC_EER / 1000) * hours;
    totalNewKwh = (watts / NEW_AC_EER / 1000) * hours;
  }

  const oldCost = totalOldKwh * ELECTRICITY_PRICE;
  const newCost = totalNewKwh * ELECTRICITY_PRICE;
  const savedCost = oldCost - newCost;
  const savedKwh = totalOldKwh - totalNewKwh;
  const savedPct = totalOldKwh > 0 ? Math.round((savedKwh / totalOldKwh) * 100) : 0;
  const co2Saved = savedKwh * 0.25; // kg CO2 (Spain grid avg)

  return { oldCost, newCost, savedCost, savedKwh, savedPct, co2Saved, roomCount: rooms.length || 1 };
}

export default function EnergySavingsCalculator() {
  const [open, setOpen] = useState(false);
  const [customArea, setCustomArea] = useState(null);
  const [customSun, setCustomSun] = useState(null);

  const wizardAnswers = useMemo(() => {
    try {
      const raw = localStorage.getItem("wizard_answers");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const hasWizardData = !!wizardAnswers;

  // Build effective answers (wizard or custom)
  const effectiveAnswers = useMemo(() => {
    if (hasWizardData) return wizardAnswers;
    return {
      area_m2: customArea || "20 – 30 m²",
      sun_exposure: customSun || "Sol moderado (este/oeste)",
    };
  }, [wizardAnswers, customArea, customSun]);

  const savings = useMemo(() => calcSavings(effectiveAnswers), [effectiveAnswers]);

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl overflow-hidden mb-8">
      {/* Header toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-emerald-50/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-emerald-900 text-sm md:text-base">
              Calculadora de ahorro energético
            </p>
            <p className="text-emerald-600 text-xs">
              {hasWizardData
                ? `Basado en tus respuestas del wizard · ${savings.roomCount} estancia${savings.roomCount > 1 ? "s" : ""}`
                : "Estima cuánto ahorrarás con un equipo A+++"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!open && (
            <span className="hidden sm:block bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
              ~{Math.round(savings.savedCost)}€/año de ahorro
            </span>
          )}
          {open ? (
            <ChevronUp className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-5 pb-5 border-t border-emerald-100">

              {/* Custom inputs if no wizard data */}
              {!hasWizardData && (
                <div className="mt-4 p-3 bg-white/70 rounded-xl border border-emerald-100 mb-4">
                  <p className="text-xs text-emerald-700 font-medium mb-3 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Personaliza el cálculo (o usa el wizard para mayor precisión)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 font-medium block mb-1">Área de la estancia</label>
                      <select
                        value={customArea || "20 – 30 m²"}
                        onChange={e => setCustomArea(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                      >
                        {Object.keys(AREA_MAP).map(k => <option key={k}>{k}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium block mb-1">Exposición solar</label>
                      <select
                        value={customSun || "Sol moderado (este/oeste)"}
                        onChange={e => setCustomSun(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                      >
                        {Object.keys(HOURS_SUN_MAP).map(k => <option key={k}>{k}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats grid */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={<Euro className="w-4 h-4" />}
                  label="Ahorro anual"
                  value={`~${Math.round(savings.savedCost)} €`}
                  sub="con equipo A+++"
                  color="emerald"
                />
                <StatCard
                  icon={<TrendingDown className="w-4 h-4" />}
                  label="Reducción consumo"
                  value={`${savings.savedPct}%`}
                  sub={`${Math.round(savings.savedKwh)} kWh/año`}
                  color="teal"
                />
                <StatCard
                  icon={<Zap className="w-4 h-4" />}
                  label="Coste actual est."
                  value={`${Math.round(savings.oldCost)} €/año`}
                  sub="equipo convencional"
                  color="amber"
                />
                <StatCard
                  icon={<Leaf className="w-4 h-4" />}
                  label="CO₂ evitado"
                  value={`${Math.round(savings.co2Saved)} kg`}
                  sub="por año"
                  color="green"
                />
              </div>

              {/* Savings bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Coste con equipo antiguo</span>
                  <span>Coste con A+++</span>
                </div>
                <div className="relative h-4 bg-amber-100 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute left-0 top-0 h-full bg-amber-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <motion.div
                    className="absolute left-0 top-0 h-full bg-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - savings.savedPct}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-emerald-600 font-medium">~{Math.round(savings.newCost)} €/año</span>
                  <span className="text-amber-600 font-medium">~{Math.round(savings.oldCost)} €/año</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-3">
                * Estimación basada en el precio medio de la electricidad en España ({(ELECTRICITY_PRICE * 100).toFixed(0)} cts/kWh) y climatología de Madrid. Los valores reales pueden variar.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    teal: "bg-teal-50 text-teal-700 border-teal-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    green: "bg-green-50 text-green-700 border-green-100",
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-1 opacity-70">{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs opacity-60">{sub}</p>
    </div>
  );
}