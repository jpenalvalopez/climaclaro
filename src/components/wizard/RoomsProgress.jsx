import React from "react";
import { Check, Pencil } from "lucide-react";

const SUN_LABEL = { poco: "Poco sol", medio: "Sol moderado", mucho: "Mucho sol" };

export default function RoomsProgress({ rooms, currentIndex, onEdit }) {
  if (!rooms || rooms.length === 0) return null;

  const completed = rooms.filter(r => r.name && r.area_m2 && r.sun_exposure);
  if (completed.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Estancias configuradas</p>
      {completed.map((room, i) => (
        <div key={i}
          className={`flex items-center justify-between p-3 rounded-xl border ${i === currentIndex ? "border-[#00509E] bg-[#00509E]/5" : "border-gray-100 bg-white"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < currentIndex ? "bg-green-100 text-green-700" : "bg-[#00509E]/10 text-[#00509E]"}`}>
              {i < currentIndex ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <div>
              <p className="text-sm font-medium text-[#003366]">{room.name}</p>
              <p className="text-xs text-gray-500">{room.area_m2} m² · {SUN_LABEL[room.sun_exposure] || room.sun_exposure}</p>
            </div>
          </div>
          {i < currentIndex && onEdit && (
            <button onClick={() => onEdit(i)} className="text-gray-400 hover:text-[#00509E] transition-colors p-1">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}