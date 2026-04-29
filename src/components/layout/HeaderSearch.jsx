import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../../utils";
import { normalizeEntityList } from "@/lib/entity-list";

function deriveModel(name) {
  if (!name) return "";
  return name
    .replace(/\s*\(?\d+[\.,]?\d*\s*(kW|frig|BTU|kcal)[^)]*\)?/gi, "")
    .replace(/\s+\d+\s*$/g, "")
    .trim();
}

const CATEGORY_LABELS = {
  monosplit: "Monosplit",
  multisplit_2x1: "Multisplit 2x1",
  multisplit_3x1: "Multisplit 3x1",
  multisplit_4x1: "Multisplit 4x1",
  multisplit_5x1: "Multisplit 5x1",
  conductos: "Conductos",
  cassette: "Cassette",
  portatil: "Portátil",
  accesorio: "Accesorio",
};

export default function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const { data: productsData = [] } = useQuery({
    queryKey: ["products_search_index"],
    queryFn: () => base44.entities.Product.filter({ active: true }, "sort_order", 300),
    staleTime: 1000 * 60 * 5,
  });
  const products = normalizeEntityList(productsData);

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();

    // Deduplicate by model_code
    const seen = new Set();
    const matched = [];

    for (const p of products) {
      const modelKey = p.model_code || deriveModel(p.name) || p.id;
      if (seen.has(modelKey)) continue;

      const matchesName = p.name?.toLowerCase().includes(q);
      const matchesBrand = p.brand?.toLowerCase().includes(q);
      const matchesModel = p.model_code?.toLowerCase().includes(q);
      const matchesCategory = CATEGORY_LABELS[p.category]?.toLowerCase().includes(q);

      if (matchesName || matchesBrand || matchesModel || matchesCategory) {
        seen.add(modelKey);
        matched.push({ product: p, modelKey });
      }
      if (matched.length >= 6) break;
    }
    return matched;
  }, [query, products]);

  useEffect(() => {
    setOpen(results.length > 0 && query.length >= 2);
  }, [results, query]);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setShowInput(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = () => {
    setShowInput(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (product, modelKey) => {
    setOpen(false);
    setShowInput(false);
    setQuery("");
    // If multiple variants exist, go to model page; otherwise product detail
    const variants = products.filter(
      (p) => (p.model_code || deriveModel(p.name)) === modelKey
    );
    if (variants.length > 1 && product.model_code) {
      navigate(`/modelo/${encodeURIComponent(product.model_code)}`);
    } else {
      navigate(createPageUrl("ProductDetail") + `?id=${product.id}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    setShowInput(false);
    navigate(createPageUrl("Products") + `?search=${encodeURIComponent(query)}`);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      {!showInput ? (
        <button
          onClick={handleOpen}
          className="p-2 rounded-lg hover:bg-[#F0F4F8] transition-colors"
          aria-label="Buscar"
        >
          <Search className="w-5 h-5 text-[#333]" />
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar modelo, marca..."
              className="pl-9 pr-8 py-2 w-56 md:w-72 text-sm rounded-xl border border-gray-200 bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#00509E]/30 focus:border-[#00509E] transition-all"
            />
            <button
              type="button"
              onClick={() => { setShowInput(false); setQuery(""); setOpen(false); }}
              className="absolute right-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="py-1">
            {results.map(({ product, modelKey }) => (
              <button
                key={modelKey}
                onMouseDown={() => handleSelect(product, modelKey)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F0F4F8] transition-colors text-left"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-10 h-10 object-contain rounded-lg bg-gray-50 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#003366] truncate">
                    {product.model_code || deriveModel(product.name)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {product.brand && (
                      <span className="text-xs text-[#00509E] font-medium">{product.brand}</span>
                    )}
                    {product.category && (
                      <span className="text-xs text-gray-400">{CATEGORY_LABELS[product.category] || product.category}</span>
                    )}
                  </div>
                </div>
                {(product.sale_price || product.price) > 0 && (
                  <span className="text-sm font-bold text-[#003366] shrink-0">
                    {(product.sale_price || product.price)?.toLocaleString("es-ES")} €
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="border-t px-4 py-2.5">
            <button
              onMouseDown={handleSubmit}
              className="text-sm text-[#00509E] font-medium hover:underline flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              Ver todos los resultados de "{query}"
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
