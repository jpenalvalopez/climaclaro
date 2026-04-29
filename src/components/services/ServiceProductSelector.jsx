import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, X, Check, Wifi, Volume2, Zap, Ruler } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORY_LABELS = {
  monosplit: "Monosplit", multisplit: "Multisplit", conductos: "Conductos",
  cassette: "Cassette", portatil: "Portátil", accesorio: "Accesorio"
};

export default function ServiceProductSelector({ selectedProduct, onSelect }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [previewProduct, setPreviewProduct] = useState(null);

  const { data: products = [] } = useQuery({
    queryKey: ["products_active_selector"],
    queryFn: () => base44.entities.Product.filter({ active: true }, "sort_order", 200)
  });

  const filtered = products.filter((p) => {
    const matchSearch = !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const handleAdd = (product) => {
    onSelect(product);
    setPreviewProduct(null);
  };

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-[#003366] text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Elige tu equipo <span className="text-gray-400 font-normal text-base">(opcional)</span>
        </h2>
        {selectedProduct &&
        <button onClick={() => onSelect(null)} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
            <X className="w-4 h-4" /> Quitar
          </button>
        }
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Añade un equipo de aire acondicionado a tu servicio. Lo instalaremos el mismo día.
      </p>

      {/* Selected product banner */}
      {selectedProduct &&
      <div className="flex items-center gap-4 p-4 mb-5 bg-[#F0F4F8] rounded-xl border-2 border-[#00509E]">
          {selectedProduct.image_url &&
        <img src={selectedProduct.image_url} className="w-16 h-16 object-contain rounded-lg bg-white p-1 shrink-0" alt="" />
        }
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[#003366] truncate">{selectedProduct.name}</div>
            <div className="text-sm text-gray-500">{selectedProduct.brand} · {CATEGORY_LABELS[selectedProduct.category]}</div>
            <div className="font-bold text-[#00509E]">{selectedProduct.price?.toLocaleString("es-ES")} €</div>
          </div>
          <Check className="w-6 h-6 text-[#00509E] shrink-0" />
        </div>
      }

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar equipo..." className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Product grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.slice(0, 24).map((p, i) =>
        <ServiceProductCard
          key={p.id}
          product={p}
          isSelected={selectedProduct?.id === p.id}
          index={i}
          onClick={() => setPreviewProduct(p)} />

        )}
        {filtered.length === 0 &&
        <p className="col-span-3 text-gray-400 text-sm text-center py-10">No se encontraron equipos</p>
        }
      </div>

      {/* Product detail modal */}
      <Dialog open={!!previewProduct} onOpenChange={(open) => !open && setPreviewProduct(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          {previewProduct &&
          <ProductDetailModal
            product={previewProduct}
            isSelected={selectedProduct?.id === previewProduct.id}
            onAdd={() => handleAdd(previewProduct)}
            onRemove={() => {onSelect(null);setPreviewProduct(null);}} />

          }
        </DialogContent>
      </Dialog>
    </div>);

}

/* ── Tarjeta de producto (estilo Products page, sin carrito) ── */
function ServiceProductCard({ product, isSelected, index, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}>

      <button
        onClick={onClick}
        className={`group w-full text-left bg-white rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-lg ${
        isSelected ? "border-[#00509E] ring-2 ring-[#00509E]/20" : "border-gray-100 hover:border-gray-200"}`
        }>

        {/* Image */}
        <div className="relative aspect-square bg-[#F0F4F8] overflow-hidden">
          {product.image_url ?
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500" /> :


          <div className="w-full h-full flex items-center justify-center">
              <Zap className="w-16 h-16 text-gray-300" />
            </div>
          }
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.is_top_seller &&
            <Badge className="bg-[#FF6F61] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Top ventas</Badge>
            }
            {product.installation_included &&
            <Badge className="bg-[#00509E] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Instalación incluida</Badge>
            }
          </div>
          {product.energy_rating &&
          <div className="absolute top-3 right-3">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
            product.energy_rating.includes("+++") ? "bg-green-100 text-green-700" :
            product.energy_rating.includes("++") ? "bg-green-50 text-green-600" :
            "bg-yellow-50 text-yellow-700"}`
            }>{product.energy_rating}</span>
            </div>
          }
          {isSelected &&
          <div className="absolute inset-0 bg-[#00509E]/10 flex items-center justify-center">
              <div className="bg-[#00509E] rounded-full p-2">
                <Check className="w-6 h-6 text-white" />
              </div>
            </div>
          }
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-medium text-[#00509E] bg-[#F0F4F8] px-2 py-0.5 rounded-full uppercase tracking-wide">
              {CATEGORY_LABELS[product.category] || product.category}
            </span>
            {product.brand && <span className="text-gray-400 text-base font-medium">{product.brand}</span>}
          </div>
          <h3 className="font-semibold text-[#003366] text-sm mb-1 line-clamp-2 group-hover:text-[#00509E] transition-colors" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {product.name}
          </h3>
          {(product.area_min_m2 || product.area_max_m2) &&
          <p className="text-gray-700 mb-2 text-sm">Para {product.area_min_m2}–{product.area_max_m2} m²</p>
          }
          <div className="text-gray-600 mb-3 text-xs flex items-center gap-3">
            {product.has_wifi && <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> WiFi</span>}
            {product.noise_db && <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" /> {product.noise_db}dB</span>}
            {product.power_kw && <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {product.power_kw}kW</span>}
          </div>
          <p className="text-xl font-bold text-[#003366]">
            {(product.price_with_installation || product.price)?.toFixed(2)} <span className="text-sm font-normal">€</span>
          </p>
        </div>
      </button>
    </motion.div>);

}

/* ── Modal de detalle del producto ── */
function ProductDetailModal({ product, isSelected, onAdd, onRemove }) {
  return (
    <div>
      {/* Image */}
      <div className="bg-[#F0F4F8] aspect-video flex items-center justify-center p-8">
        {product.image_url ?
        <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain" /> :

        <Zap className="w-24 h-24 text-gray-300" />
        }
      </div>

      <div className="p-6 space-y-4">
        {/* Brand + title */}
        <div>
          <p className="text-xs text-[#00509E] font-semibold uppercase tracking-wider mb-1">{product.brand} · {CATEGORY_LABELS[product.category]}</p>
          <h2 className="text-xl font-bold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>{product.name}</h2>
          {(product.area_min_m2 || product.area_max_m2) &&
          <p className="text-sm text-gray-500 mt-1">Para {product.area_min_m2}–{product.area_max_m2} m²</p>
          }
        </div>

        {/* Quick specs */}
        <div className="flex flex-wrap gap-2">
          {product.energy_rating &&
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
              <Zap className="w-3 h-3" /> {product.energy_rating}
            </span>
          }
          {product.has_wifi &&
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
              <Wifi className="w-3 h-3" /> WiFi
            </span>
          }
          {product.noise_db &&
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
              <Volume2 className="w-3 h-3" /> {product.noise_db} dB
            </span>
          }
          {product.power_kw &&
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
              <Ruler className="w-3 h-3" /> {product.power_kw} kW
            </span>
          }
        </div>

        {/* Description */}
        {product.description &&
        <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
        }

        {/* Specs table */}
        {product.specs?.length > 0 &&
        <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Especificaciones</p>
            {product.specs.map((s, i) =>
          <div key={i} className={`flex justify-between text-sm py-1.5 px-2 rounded-lg ${i % 2 === 0 ? "bg-gray-50" : ""}`}>
                <span className="text-gray-500">{s.label}</span>
                <span className="font-medium text-[#333]">{s.value}</span>
              </div>
          )}
          </div>
        }

        {/* Price + CTA */}
        <div className="border-t pt-4">
          <div className="flex items-end justify-between mb-4">
            <div>
              {product.price_with_installation && product.price_with_installation !== product.price &&
              <p className="text-sm text-gray-400 line-through">{product.price?.toFixed(2)} €</p>
              }
              <p className="text-2xl font-bold text-[#003366]">
                {(product.price_with_installation || product.price)?.toFixed(2)} €
              </p>
              {product.installation_included &&
              <p className="text-xs text-green-600 font-medium mt-0.5 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Instalación estándar incluida
                </p>
              }
            </div>
          </div>

          {isSelected ?
          <div className="space-y-2">
              <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
                <Check className="w-4 h-4" /> Equipo añadido al servicio
              </div>
              <Button
              variant="outline"
              onClick={onRemove}
              className="w-full rounded-xl text-red-500 border-red-200 hover:bg-red-50">

                Quitar del servicio
              </Button>
            </div> :

          <Button
            onClick={onAdd}
            className="w-full bg-[#00509E] hover:bg-[#003366] text-white rounded-xl h-11 font-semibold shadow-lg shadow-[#00509E]/20 gap-2">

              <Check className="w-4 h-4" /> Añadir al servicio
            </Button>
          }
        </div>
      </div>
    </div>);

}