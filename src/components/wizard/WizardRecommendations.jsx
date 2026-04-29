import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Eye, Wifi, Zap } from "lucide-react";

export default function WizardRecommendations({ products, onAddToCart }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-[#003366] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
        Productos recomendados para ti
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="h-40 bg-[#F0F4F8] flex items-center justify-center overflow-hidden">
              {p.image_url
                ? <img src={p.image_url} alt={p.name} className="h-full w-full object-contain p-3" />
                : <div className="text-gray-300 text-sm">Sin imagen</div>
              }
            </div>
            <div className="p-4 flex flex-col flex-1">
              <div className="flex gap-1 mb-2 flex-wrap">
                {p.energy_rating && (
                  <Badge className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5">
                    <Zap className="w-3 h-3 mr-0.5" />{p.energy_rating}
                  </Badge>
                )}
                {p.has_wifi && (
                  <Badge className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5">
                    <Wifi className="w-3 h-3 mr-0.5" />WiFi
                  </Badge>
                )}
                {p.is_top_seller && (
                  <Badge className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5">Top</Badge>
                )}
              </div>
              <p className="font-semibold text-[#003366] text-sm leading-tight mb-1">{p.name}</p>
              {p.area_min_m2 && p.area_max_m2 && (
                <p className="text-xs text-gray-500 mb-1">{p.area_min_m2}–{p.area_max_m2} m²</p>
              )}
              {p.frigorias && (
                <p className="text-xs text-gray-500 mb-2">{p.frigorias.toLocaleString()} frigorías</p>
              )}
              <p className="text-xl font-bold text-[#003366] mt-auto mb-3">
                {p.price?.toLocaleString("es-ES")} €
              </p>
              <div className="flex gap-2">
                <Link to={createPageUrl("ProductDetail") + `?id=${p.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                    <Eye className="w-3 h-3" /> Ver producto
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={() => onAddToCart(p)}
                  className="flex-1 bg-[#00509E] hover:bg-[#003366] text-white text-xs gap-1"
                >
                  <ShoppingCart className="w-3 h-3" /> Añadir
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}