import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, SlidersHorizontal, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const CATEGORIES = [
  { value: "all", label: "Todas" },
  { value: "monosplit", label: "Monosplit" },
  { value: "multisplit_2x1", label: "Multisplit 2x1" },
  { value: "multisplit_3x1", label: "Multisplit 3x1" },
  { value: "multisplit_4x1", label: "Multisplit 4x1" },
  { value: "multisplit_5x1", label: "Multisplit 5x1" },
  { value: "conductos", label: "Conductos" },
  { value: "cassette", label: "Cassette" },
  { value: "portatil", label: "Portátil" },
  { value: "accesorio", label: "Accesorio" },
];

const AREA_RANGES = [
  { value: "all", label: "Todos los m²" },
  { value: "0-20", label: "Hasta 20 m²" },
  { value: "20-30", label: "20–30 m²" },
  { value: "30-40", label: "30–40 m²" },
  { value: "40+", label: "Más de 40 m²" },
];

const ENERGY_RATINGS = ["A+++", "A++", "A+", "A"];

export default function ProductFilters({ filters, onFilterChange, productCount, brands = [] }) {
  const setFilter = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== "search" && v && v !== "all" && v !== false
  ).length + (filters.search ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Buscar</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Modelo, nombre o SKU..."
            value={filters.search || ""}
            onChange={(e) => setFilter("search", e.target.value)}
            className="rounded-xl pl-9"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Ordenar por</label>
        <Select value={filters.sort || "featured"} onValueChange={(v) => setFilter("sort", v)}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Destacados</SelectItem>
            <SelectItem value="price_asc">Precio: menor a mayor</SelectItem>
            <SelectItem value="price_desc">Precio: mayor a menor</SelectItem>
            <SelectItem value="newest">Más recientes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Brand */}
      {brands.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Marca</label>
          <Select value={filters.brand || "all"} onValueChange={(v) => setFilter("brand", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Todas las marcas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Category */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Categoría</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilter("category", cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filters.category === cat.value
                  ? "bg-[#00509E] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Area */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Superficie</label>
        <Select value={filters.area || "all"} onValueChange={(v) => setFilter("area", v)}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            {AREA_RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Energy */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Eficiencia</label>
        <div className="flex flex-wrap gap-2">
          {ENERGY_RATINGS.map((rating) => (
            <button
              key={rating}
              onClick={() => setFilter("energy", filters.energy === rating ? "all" : rating)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filters.energy === rating
                  ? "bg-green-600 text-white"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
      </div>

      {/* WiFi */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="wifi"
          checked={filters.wifi || false}
          onCheckedChange={(v) => setFilter("wifi", v)}
          className="data-[state=checked]:bg-[#00509E] data-[state=checked]:border-[#00509E] data-[state=checked]:text-white"
        />
        <Label htmlFor="wifi" className="text-sm">Con WiFi</Label>
      </div>

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          onClick={() => onFilterChange({ category: "all", area: "all", energy: "all", wifi: false, brand: "all", sort: "featured", search: "" })}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs w-full"
        >
          <X className="w-3 h-3 mr-1" /> Borrar filtros ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 p-6 max-h-[calc(100vh-7rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-[#003366] text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>Filtros</h3>
            <span className="text-xs text-gray-500">{productCount} productos</span>
          </div>
          <FilterContent />
        </div>
      </div>

      {/* Mobile filter button */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="rounded-full gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge className="bg-[#00509E] text-white text-[10px] ml-1">{activeFilterCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-6 overflow-y-auto">
            <h3 className="font-semibold text-[#003366] text-lg mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Filtros</h3>
            <FilterContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}