import React from "react";
import { Plus, Minus } from "lucide-react";

export default function ServiceExtrasSelector({ extras = [], selectedExtras, onChange }) {
  if (!extras || extras.length === 0) return null;

  const getSelected = (extra) => selectedExtras.find(e => e.name === extra.name);

  const handleToggle = (extra) => {
    const current = getSelected(extra);
    if (current) {
      onChange(extra, 0); // remove
    } else {
      onChange(extra, extra.min_qty || 1); // add with min qty
    }
  };

  const handleQtyChange = (extra, delta) => {
    const current = getSelected(extra);
    const currentQty = current?.qty || 0;
    const min = extra.min_qty || 1;
    const max = extra.max_qty || 99;
    const newQty = Math.max(0, Math.min(max, currentQty + delta));
    if (newQty < min && newQty !== 0) return; // don't go below min unless removing
    onChange(extra, newQty);
  };

  const handleInputQty = (extra, val) => {
    const min = extra.min_qty || 1;
    const max = extra.max_qty || 99;
    const parsed = parseInt(val);
    if (isNaN(parsed) || parsed < 0) return;
    const qty = parsed === 0 ? 0 : Math.max(min, Math.min(max, parsed));
    onChange(extra, qty);
  };

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
      <h2 className="font-bold text-[#003366] text-lg mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
        Extras opcionales
      </h2>
      <p className="text-sm text-gray-500 mb-5">Añade servicios adicionales a tu instalación.</p>

      <div className="space-y-3">
        {extras.map((extra, i) => {
          const sel = getSelected(extra);
          const isSelected = !!sel;
          const hasUnit = !!extra.unit;

          return (
            <div
              key={i}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                isSelected ? "border-[#00509E] bg-[#00509E]/5" : "border-gray-200 bg-white"
              }`}
            >
              {/* Toggle checkbox */}
              <button
                onClick={() => handleToggle(extra)}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? "bg-[#00509E]" : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {isSelected
                  ? <Minus className="w-4 h-4 text-white" />
                  : <Plus className="w-4 h-4 text-gray-400" />
                }
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#003366] text-sm">{extra.name}</p>
                {extra.description && <p className="text-xs text-gray-500 mt-0.5">{extra.description}</p>}
                <p className="text-xs text-[#00509E] font-medium mt-0.5">
                  {extra.price?.toLocaleString("es-ES")} € / {extra.unit || "ud."}
                </p>
              </div>

              {/* Quantity controls (only when selected and has unit) */}
              {isSelected && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleQtyChange(extra, -1)}
                    className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="w-3 h-3 text-gray-600" />
                  </button>
                  <input
                    type="number"
                    value={sel.qty}
                    onChange={e => handleInputQty(extra, e.target.value)}
                    className="w-14 text-center text-sm font-semibold border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-[#00509E]"
                    min={extra.min_qty || 1}
                    max={extra.max_qty || 99}
                  />
                  <span className="text-xs text-gray-500 min-w-[24px]">{extra.unit || "ud."}</span>
                  <button
                    onClick={() => handleQtyChange(extra, 1)}
                    className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
              )}

              {/* Price total */}
              <div className="shrink-0 font-bold text-[#003366] text-sm min-w-[60px] text-right">
                {isSelected
                  ? `+${((extra.price || 0) * sel.qty).toLocaleString("es-ES")} €`
                  : <span className="text-gray-400 font-normal text-xs">+{extra.price?.toLocaleString("es-ES")} €/{extra.unit || "ud."}</span>
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}