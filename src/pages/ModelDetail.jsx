import React, { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Wifi, Thermometer, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageUrl } from "../utils";

const CATEGORY_LABELS = {
  monosplit: "Monosplit",
  multisplit_2x1: "Multisplit 2x1",
  multisplit_3x1: "Multisplit 3x1",
  multisplit_4x1: "Multisplit 4x1",
  multisplit_5x1: "Multisplit 5x1",
  conductos: "Conductos",
  cassette: "Cassette",
  portatil: "Portátil",
  accesorio: "Accesorio"
};

const ENERGY_COLORS = {
  "A+++": "bg-green-600",
  "A++": "bg-green-500",
  "A+": "bg-green-400",
  A: "bg-lime-500",
  B: "bg-yellow-400",
  C: "bg-orange-400"
};

export default function ModelDetail() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const modelCode = params.get("model");
  const brand = params.get("brand");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.filter({ active: true }, "power_kw", 200),
    initialData: []
  });

  // Group products by model_code or derive model from name
  const modelProducts = useMemo(() => {
    if (!modelCode && !brand) return [];
    return products.filter((p) => {
      const pModel = p.model_code || deriveModel(p.name);
      const matchesModel = modelCode ? pModel === modelCode : true;
      const matchesBrand = brand ? p.brand === brand : true;
      return matchesModel && matchesBrand;
    }).sort((a, b) => (a.power_kw || 0) - (b.power_kw || 0));
  }, [products, modelCode, brand]);

  const firstProduct = modelProducts[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F4F8]">
        <div className="max-w-5xl mx-auto px-4 py-12 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>);

  }

  if (!firstProduct) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Modelo no encontrado.</p>
          <Button onClick={() => navigate(createPageUrl("Products"))} className="bg-[#00509E] text-white rounded-full">
            Ver catálogo
          </Button>
        </div>
      </div>);

  }

  return (
    <div className="bg-[hsl(var(--background))] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to={createPageUrl("Products")} className="hover:text-[#00509E] transition-colors">
            Catálogo
          </Link>
          <span>/</span>
          {firstProduct.brand &&
          <>
              <Link
              to={`${createPageUrl("Products")}?brand=${encodeURIComponent(firstProduct.brand)}`}
              className="hover:text-[#00509E] transition-colors">
              
                {firstProduct.brand}
              </Link>
              <span>/</span>
            </>
          }
          <span className="text-[#003366] font-medium">
            {firstProduct.model_code || deriveModel(firstProduct.name)}
          </span>
        </div>

        {/* Hero */}
        <div className="bg-white rounded-2xl p-6 md:p-10 mb-8 flex flex-col md:flex-row gap-8 items-center shadow-sm">
          {firstProduct.image_url &&
          <img
            src={firstProduct.image_url}
            alt={firstProduct.image_alt || firstProduct.name}
            className="w-48 h-48 object-contain shrink-0" />

          }
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-3">
              {firstProduct.brand &&
              <Badge className="bg-[#00509E]/10 text-[#00509E]">{firstProduct.brand}</Badge>
              }
              <Badge variant="outline">{CATEGORY_LABELS[firstProduct.category] || firstProduct.category}</Badge>
              {firstProduct.product_family &&
              <Badge variant="outline" className="capitalize">
                  {firstProduct.product_family === "gama_domestica" ?
                "Gama Doméstica" :
                firstProduct.product_family === "gama_comercial" ?
                "Gama Comercial" :
                "Gama Otros"}
                </Badge>
              }
            </div>
            <h1
              className="text-2xl md:text-3xl font-bold text-[#003366] mb-2"
              style={{ fontFamily: "'Poppins', sans-serif" }}>
              
              {firstProduct.model_code || deriveModel(firstProduct.name)}
            </h1>
            {firstProduct.description &&
            <p className="text-gray-600 text-sm leading-relaxed">{firstProduct.description}</p>
            }
            <p className="text-sm text-gray-500 mt-3">
              {modelProducts.length} {modelProducts.length === 1 ? "potencia disponible" : "potencias disponibles"}
            </p>
          </div>
        </div>

        {/* Power variants table */}
        <h2
          className="text-xl font-bold text-[#003366] mb-4"
          style={{ fontFamily: "'Poppins', sans-serif" }}>
          
          Elige tu potencia
        </h2>
        <div className="space-y-3">
          {modelProducts.map((product) =>
          <PowerVariantCard key={product.id} product={product} />
          )}
        </div>
      </div>
    </div>);

}

function PowerVariantCard({ product }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow">
      {/* Power + area */}
      <div className="flex items-center gap-4 flex-1">
        <div className="w-14 h-14 rounded-xl bg-[#00509E]/10 flex flex-col items-center justify-center shrink-0">
          <span className="text-[#00509E] font-bold text-lg leading-none">
            {product.power_kw ? `${product.power_kw}` : "—"}
          </span>
          <span className="text-[#00509E] text-[10px] font-medium">kW</span>
        </div>
        <div>
          <p className="font-semibold text-[#003366]">{product.name}</p>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
            {product.area_min_m2 && product.area_max_m2 &&
            <span className="flex items-center gap-1">
                <Thermometer className="w-3 h-3" />
                {product.area_min_m2}–{product.area_max_m2} m²
              </span>
            }
            {product.noise_db &&
            <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3" />
                {product.noise_db} dB
              </span>
            }
            {product.has_wifi &&
            <span className="flex items-center gap-1 text-[#00509E]">
                <Wifi className="w-3 h-3" />
                WiFi
              </span>
            }
          </div>
        </div>
      </div>

      {/* Energy rating */}
      {product.energy_rating &&
      <span
        className={`hidden sm:inline-flex px-2.5 py-1 rounded-lg text-white text-sm font-bold ${
        ENERGY_COLORS[product.energy_rating] || "bg-gray-400"}`
        }>
        
          {product.energy_rating}
        </span>
      }

      {/* Price + CTA */}
      <div className="flex items-center gap-4 sm:text-right">
        <div>
          <p className="text-xl font-bold text-[#003366]">Consultar</p>
        </div>
        <Button
          onClick={() => navigate(createPageUrl("ProductDetail") + `?id=${product.id}`)}
          className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full shrink-0">
          
          Ver detalle
        </Button>
      </div>
    </div>);

}

// Helper: extract model code from product name
// e.g. "MSZ-AP 2.5kW" → "MSZ-AP", "FTXB35C (3.5kW)" → "FTXB35C"
function deriveModel(name) {
  if (!name) return "";
  // Remove trailing power designation like "2.5kW", "(2.5kW)", "2500 frig"
  return name.
  replace(/\s*\(?\d+[\.,]?\d*\s*(kW|frig|BTU|kcal)[^)]*\)?/gi, "").
  replace(/\s+\d+\s*$/g, "").
  trim();
}