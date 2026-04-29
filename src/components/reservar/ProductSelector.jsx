import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, Wifi, Search } from "lucide-react";

const CATEGORIES = [
  { value: "", label: "Todos" },
  { value: "monosplit", label: "Monosplit" },
  { value: "multisplit", label: "Multisplit" },
  { value: "conductos", label: "Conductos" },
  { value: "cassette", label: "Cassette" },
  { value: "portatil", label: "Portátil" },
];

export default function ProductSelector({ selected, onSelect }) {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products_for_booking"],
    queryFn: () => base44.entities.Product.filter({ active: true }, "sort_order", 60),
  });

  const filtered = products.filter((p) => {
    const matchCat = !category || p.category === category;
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar marca o modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === cat.value
                  ? "bg-[#00509E] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de productos */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
          {filtered.map((product) => {
            const isSelected = selected?.id === product.id;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => onSelect(isSelected ? null : product)}
                className={`relative text-left rounded-xl border-2 p-3 transition-all hover:shadow-md flex flex-col ${
                  isSelected
                    ? "border-[#00509E] bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-blue-200"
                }`}
              >
                {isSelected && (
                  <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-[#00509E]" />
                )}
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-20 object-contain mb-2"
                  />
                ) : (
                  <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-gray-300 text-xs">
                    Sin imagen
                  </div>
                )}
                <p className="text-xs font-semibold text-[#003366] leading-tight line-clamp-2 flex-1">
                  {product.name}
                </p>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {product.energy_rating && (
                    <Badge className="text-[10px] px-1.5 py-0 h-4 bg-green-100 text-green-700 border-0">
                      {product.energy_rating}
                    </Badge>
                  )}
                  {product.has_wifi && <Wifi className="w-3 h-3 text-blue-500" />}
                  {product.power_kw && (
                    <span className="text-[10px] text-gray-400">{product.power_kw} kW</span>
                  )}
                </div>
                {product.price && (
                  <p className="text-sm font-bold text-[#00509E] mt-1">
                    {product.price.toLocaleString("es-ES")} €
                  </p>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-10 text-gray-400 text-sm">
              No hay productos que coincidan.
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-2">
          <span className="text-sm text-[#00509E] font-medium">
            ✓ {selected.name}
          </span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs text-gray-400 hover:text-red-500 shrink-0"
          >
            Quitar
          </button>
        </div>
      )}
    </div>
  );
}