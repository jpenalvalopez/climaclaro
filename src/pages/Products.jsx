import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Input } from "@/components/ui/input";
import { Search, Wifi, Zap, SlidersHorizontal, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PromoCarousel from "@/components/products/PromoCarousel";

const FAMILY_TABS = [
  { key: "all", label: "Todos" },
  { key: "gama_domestica", label: "Doméstica" },
  { key: "gama_comercial", label: "Comercial" },
  { key: "gama_otros", label: "Otros" },
];

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

const ENERGY_COLORS = {
  "A+++": "bg-green-600",
  "A++": "bg-green-500",
  "A+": "bg-green-400",
  A: "bg-lime-500",
  B: "bg-yellow-400",
  C: "bg-orange-400",
};

function deriveModel(name) {
  if (!name) return "";
  return name
    .replace(/\s*\(?\d+[\.,]?\d*\s*(kW|frig|BTU|kcal)[^)]*\)?/gi, "")
    .replace(/\s+\d+\s*$/g, "")
    .trim();
}

export default function Products() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const [search, setSearch] = useState(urlParams.get("search") || "");
  const [activeFamily, setActiveFamily] = useState(urlParams.get("family") || "all");
  const [activeCategory, setActiveCategory] = useState(urlParams.get("category") || "all");
  const [activeBrand, setActiveBrand] = useState(urlParams.get("brand") || "all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products_active"],
    queryFn: () => base44.entities.Product.filter({ active: true }, "sort_order", 200),
  });

  const availableBrands = useMemo(() => {
    let filtered = products;
    if (activeFamily !== "all") filtered = filtered.filter(p => p.product_family === activeFamily);
    return [...new Set(filtered.map(p => p.brand).filter(Boolean))].sort();
  }, [products, activeFamily]);

  const availableCategories = useMemo(() => {
    let filtered = products;
    if (activeFamily !== "all") filtered = filtered.filter(p => p.product_family === activeFamily);
    if (activeBrand !== "all") filtered = filtered.filter(p => p.brand === activeBrand);
    return [...new Set(filtered.map(p => p.category).filter(Boolean))];
  }, [products, activeFamily, activeBrand]);

  const modelGroups = useMemo(() => {
    let filtered = products;
    if (activeFamily !== "all") filtered = filtered.filter(p => p.product_family === activeFamily);
    if (activeBrand !== "all") filtered = filtered.filter(p => p.brand === activeBrand);
    if (activeCategory !== "all") filtered = filtered.filter(p => p.category === activeCategory);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.model_code?.toLowerCase().includes(q)
      );
    }

    const groups = {};
    filtered.forEach(p => {
      const key = p.model_code || deriveModel(p.name) || p.name;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    Object.values(groups).forEach(g => g.sort((a, b) => (a.power_kw || 0) - (b.power_kw || 0)));

    return Object.entries(groups).map(([model, variants]) => ({
      model,
      variants,
      representative: variants[0],
    }));
  }, [products, activeFamily, activeBrand, activeCategory, search]);

  const activeFiltersCount = (activeFamily !== "all" ? 1 : 0) + (activeBrand !== "all" ? 1 : 0) + (activeCategory !== "all" ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* Carrusel ancho completo */}
      <PromoCarousel />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* Search + filter toggle row */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="pl-9 rounded-xl bg-white border-0 shadow-sm h-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-colors ${
              showFilters || activeFiltersCount > 0
                ? "bg-[#00509E] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-[#00509E] text-xs font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-5 mb-5 shadow-sm">
            {/* Family */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gama</p>
              <div className="flex flex-wrap gap-2">
                {FAMILY_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveFamily(tab.key); setActiveCategory("all"); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      activeFamily === tab.key
                        ? "bg-[#00509E] text-white border-[#00509E]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand */}
            {availableBrands.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Marca</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveBrand("all")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      activeBrand === "all"
                        ? "bg-[#00509E] text-white border-[#00509E]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    Todas
                  </button>
                  {availableBrands.map(brand => (
                    <button
                      key={brand}
                      onClick={() => setActiveBrand(brand)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        activeBrand === brand
                          ? "bg-[#00509E] text-white border-[#00509E]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category */}
            {availableCategories.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categoría</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveCategory("all")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      activeCategory === "all"
                        ? "bg-[#003366] text-white border-[#003366]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    Todas
                  </button>
                  {availableCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        activeCategory === cat
                          ? "bg-[#003366] text-white border-[#003366]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {CATEGORY_LABELS[cat] || cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear */}
            {activeFiltersCount > 0 && (
              <button
                onClick={() => { setActiveFamily("all"); setActiveBrand("all"); setActiveCategory("all"); }}
                className="mt-4 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700"
              >
                <X className="w-3 h-3" /> Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Active filter chips */}
        {!showFilters && activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeFamily !== "all" && (
              <span className="flex items-center gap-1 bg-[#00509E]/10 text-[#00509E] text-xs px-3 py-1 rounded-full font-medium">
                {FAMILY_TABS.find(f => f.key === activeFamily)?.label}
                <button onClick={() => setActiveFamily("all")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {activeBrand !== "all" && (
              <span className="flex items-center gap-1 bg-[#00509E]/10 text-[#00509E] text-xs px-3 py-1 rounded-full font-medium">
                {activeBrand}
                <button onClick={() => setActiveBrand("all")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {activeCategory !== "all" && (
              <span className="flex items-center gap-1 bg-[#003366]/10 text-[#003366] text-xs px-3 py-1 rounded-full font-medium">
                {CATEGORY_LABELS[activeCategory] || activeCategory}
                <button onClick={() => setActiveCategory("all")}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-gray-400 mb-4">
          {isLoading ? "Cargando..." : `${modelGroups.length} modelo${modelGroups.length !== 1 ? "s" : ""}`}
        </p>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-60 rounded-2xl" />)}
          </div>
        ) : modelGroups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl">
            <p className="text-gray-400 text-lg">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {modelGroups.map(({ model, variants, representative }) => (
              <ModelCard
                key={model}
                model={model}
                variants={variants}
                representative={representative}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ModelCard({ model, variants, representative, navigate }) {
  const isSingle = variants.length === 1;

  const handleClick = () => {
    if (isSingle) {
      navigate(createPageUrl("ProductDetail") + `?id=${representative.id}`);
    } else if (representative.model_code) {
      navigate(`/marca/modelo/${encodeURIComponent(representative.model_code)}`);
    } else {
      navigate(
        createPageUrl("ModelDetail") +
          `?model=${encodeURIComponent(model)}&brand=${encodeURIComponent(representative.brand || "")}`
      );
    }
  };

  const minPrice = Math.min(...variants.map(v => v.sale_price || v.price || 0));
  const hasOffer = variants.some(v => v.sale_price && v.sale_price < v.price);

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
    >
      {/* Image */}
      <div className="relative bg-[#F8FAFC] p-5 aspect-square flex items-center justify-center">
        {representative.image_url ? (
          <img
            src={representative.image_url}
            alt={representative.image_alt || model}
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Zap className="w-12 h-12 text-gray-200" />
        )}
        {hasOffer && (
          <span className="absolute top-2 left-2 bg-[#FF6F61] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Oferta
          </span>
        )}
        {representative.energy_rating && (
          <span className={`absolute top-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded ${ENERGY_COLORS[representative.energy_rating] || "bg-gray-400"}`}>
            {representative.energy_rating}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {representative.brand && (
          <p className="text-[10px] text-[#00509E] font-semibold uppercase tracking-wider mb-0.5">{representative.brand}</p>
        )}
        <h3 className="font-semibold text-[#003366] text-sm leading-snug mb-2 line-clamp-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {model}
        </h3>

        <div className="flex items-center justify-between">
          <div>
            {!isSingle && <p className="text-[10px] text-gray-400 leading-none mb-0.5">{variants.length} potencias</p>}
            <p className="font-bold text-[#003366] text-sm">Consultar</p>
          </div>
          {representative.has_wifi && (
            <span className="flex items-center gap-0.5 text-blue-500 text-[10px] font-medium">
              <Wifi className="w-3 h-3" /> WiFi
            </span>
          )}
        </div>
      </div>
    </div>
  );
}