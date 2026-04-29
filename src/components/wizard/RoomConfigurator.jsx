import React, { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const ROOM_NAMES = ["Salón", "Dormitorio principal", "Dormitorio", "Despacho", "Sala", "Otra"];

const AREA_OPTIONS = [
  { value: "10-20", label: "10–20 m²", desc: "Habitación pequeña" },
  { value: "20-30", label: "20–30 m²", desc: "Habitación o salón mediano" },
  { value: "30-40", label: "30–40 m²", desc: "Salón grande" },
  { value: "40+",   label: "Más de 40 m²", desc: "Espacio amplio" },
];

const SUN_OPTIONS = [
  { value: "poco",  label: "Poco sol",      desc: "Orientación norte o interior" },
  { value: "medio", label: "Sol moderado",  desc: "Orientación este u oeste" },
  { value: "mucho", label: "Mucho sol",     desc: "Orientación sur o muchas horas de sol" },
];

const STEPS = ["name", "area", "sun"];

export default function RoomConfigurator({ roomIndex, totalRooms, initial = {}, onComplete, onBack }) {
  const [subStep, setSubStep] = useState(0);
  const [data, setData] = useState({
    name: initial.name || "",
    area_m2: initial.area_m2 || "",
    sun_exposure: initial.sun_exposure || "",
    customName: "",
  });

  const isCustomName = data.name === "Otra";
  const currentSubStep = STEPS[subStep];

  const canAdvanceName = data.name && (data.name !== "Otra" || data.customName.trim());
  const canAdvanceArea = !!data.area_m2;
  const canAdvanceSun  = !!data.sun_exposure;

  const canAdvance = currentSubStep === "name" ? canAdvanceName
    : currentSubStep === "area" ? canAdvanceArea
    : canAdvanceSun;

  const handleNext = () => {
    if (subStep < STEPS.length - 1) {
      setSubStep(s => s + 1);
    } else {
      const finalName = data.name === "Otra" ? data.customName.trim() : data.name;
      onComplete({ name: finalName, area_m2: data.area_m2, sun_exposure: data.sun_exposure });
    }
  };

  const handleBack = () => {
    if (subStep > 0) setSubStep(s => s - 1);
    else onBack();
  };

  return (
    <motion.div key={`room-${roomIndex}-${subStep}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
      {/* Room header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex gap-1">
          {Array.from({ length: totalRooms }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i < roomIndex ? "w-6 bg-green-400" : i === roomIndex ? "w-6 bg-[#00509E]" : "w-6 bg-gray-200"}`} />
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-4">Estancia {roomIndex + 1} de {totalRooms}</p>

      {/* Sub-step: Nombre */}
      {currentSubStep === "name" && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#00509E]/10 flex items-center justify-center text-[#00509E] font-bold text-sm">{roomIndex + 1}</div>
            <h2 className="text-lg font-semibold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>
              ¿Cómo se llama esta estancia?
            </h2>
          </div>
          <div className="grid gap-2">
            {ROOM_NAMES.map(name => {
              const isSelected = data.name === name;
              return (
                <button key={name} onClick={() => {
                  setData(d => ({ ...d, name }));
                  if (name !== "Otra") setTimeout(() => setSubStep(s => s + 1), 280);
                }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected ? "border-[#00509E] bg-[#00509E]/5" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[#003366]">{name}</p>
                    {isSelected && <div className="w-6 h-6 rounded-full bg-[#00509E] flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white" /></div>}
                  </div>
                </button>
              );
            })}
          </div>
          {isCustomName && (
            <Input
              className="mt-3 rounded-xl"
              placeholder="Escribe el nombre de la estancia"
              value={data.customName}
              onChange={e => setData(d => ({ ...d, customName: e.target.value }))}
              autoFocus
            />
          )}
        </>
      )}

      {/* Sub-step: Área */}
      {currentSubStep === "area" && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#00509E]/10 flex items-center justify-center text-[#00509E] font-bold text-sm">{roomIndex + 1}</div>
            <h2 className="text-lg font-semibold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>
              ¿Cuántos m² tiene{data.name && data.name !== "Otra" ? ` el ${data.name.toLowerCase()}` : ""}?
            </h2>
          </div>
          <div className="grid gap-3">
            {AREA_OPTIONS.map(opt => {
              const isSelected = data.area_m2 === opt.value;
              return (
                <button key={opt.value} onClick={() => { setData(d => ({ ...d, area_m2: opt.value })); setTimeout(() => setSubStep(s => s + 1), 280); }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected ? "border-[#00509E] bg-[#00509E]/5" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#003366]">{opt.label}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{opt.desc}</p>
                    </div>
                    {isSelected && <div className="w-6 h-6 rounded-full bg-[#00509E] flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white" /></div>}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Sub-step: Sol */}
      {currentSubStep === "sun" && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#00509E]/10 flex items-center justify-center text-[#00509E] font-bold text-sm">{roomIndex + 1}</div>
            <h2 className="text-lg font-semibold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>
              ¿Cuánto sol recibe{data.name && data.name !== "Otra" ? ` el ${data.name.toLowerCase()}` : ""}?
            </h2>
          </div>
          <div className="grid gap-3">
            {SUN_OPTIONS.map(opt => {
              const isSelected = data.sun_exposure === opt.value;
              return (
                <button key={opt.value} onClick={() => {
                  setData(d => ({ ...d, sun_exposure: opt.value }));
                  const finalName = data.name === "Otra" ? data.customName.trim() : data.name;
                  setTimeout(() => onComplete({ name: finalName, area_m2: data.area_m2, sun_exposure: opt.value }), 280);
                }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected ? "border-[#00509E] bg-[#00509E]/5" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#003366]">{opt.label}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{opt.desc}</p>
                    </div>
                    {isSelected && <div className="w-6 h-6 rounded-full bg-[#00509E] flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white" /></div>}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Nav */}
      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={handleBack} className="text-gray-500">
          ← Anterior
        </Button>
        {canAdvance && (
          <Button onClick={handleNext} className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-6">
            {subStep === STEPS.length - 1 ? (roomIndex < totalRooms - 1 ? "Siguiente estancia" : "Continuar") : "Siguiente"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}