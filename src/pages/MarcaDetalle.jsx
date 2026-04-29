import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Wifi } from "lucide-react";
import QuoteRequestModal from "@/components/services/QuoteRequestModal";
import BrandConfigurator from "@/components/brand/BrandConfigurator";
import { getBrandColors } from "@/lib/brandColors";

const ENERGY_BADGE_COLORS = {
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

function ModelGroupCard({ model, variants, representative, navigate }) {
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
  const minPrice = Math.min(...variants.map((v) => v.sale_price || v.price || 0));
  const hasOffer = variants.some((v) => v.sale_price && v.sale_price < v.price);

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
    >
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
          <span className={`absolute top-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded ${ENERGY_BADGE_COLORS[representative.energy_rating] || "bg-gray-400"}`}>
            {representative.energy_rating}
          </span>
        )}
      </div>
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

const DOMESTIC_CATS = ["monosplit", "multisplit_2x1", "multisplit_3x1", "multisplit_4x1", "multisplit_5x1", "multisplit", "portatil", "split_pared", "split_suelo"];
const COMMERCIAL_CATS = ["cassette", "conductos", "exterior"];

const CAT_LABELS = {
  monosplit: "Split Pared",
  split_pared: "Split Pared",
  split_suelo: "Split Suelo",
  multisplit: "Multisplit",
  multisplit_2x1: "Multisplit 2x1",
  multisplit_3x1: "Multisplit 3x1",
  multisplit_4x1: "Multisplit 4x1",
  multisplit_5x1: "Multisplit 5x1",
  portatil: "Portátil",
  cassette: "Cassette",
  conductos: "Conductos",
  exterior: "Exterior"
};

const ENERGY_COLORS = {
  "A+++": "bg-green-600 text-white",
  "A++": "bg-green-500 text-white",
  "A+": "bg-green-400 text-white",
  "A": "bg-lime-400 text-white",
  "B": "bg-yellow-400 text-gray-900",
  "C": "bg-orange-400 text-white"
};

const trimName = (name) => name?.split("—")[0].trim();



export default function MarcaDetalle() {
  const { slug } = useParams();
  const productsRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  const { data: brandList = [], isLoading: loadingBrand } = useQuery({
    queryKey: ["brand_page", slug],
    queryFn: () => base44.entities.BrandPage.filter({ slug, active: true }, "sort_order", 1),
    enabled: !!slug
  });
  const brand = brandList[0];

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products_brand", brand?.name],
    queryFn: () => base44.entities.Product.filter({ brand: brand.name, active: true }, "sort_order", 200),
    enabled: !!brand?.name
  });

  const domesticProducts = useMemo(() => products.filter((p) => DOMESTIC_CATS.includes(p.category)), [products]);
  const commercialProducts = useMemo(() => products.filter((p) => COMMERCIAL_CATS.includes(p.category)), [products]);

  const hasDomestic = domesticProducts.length > 0;
  const hasCommercial = commercialProducts.length > 0;

  const tabs = [
  hasDomestic && { key: "domestic", label: "Gama Doméstica", count: domesticProducts.length, products: domesticProducts, cats: DOMESTIC_CATS },
  hasCommercial && { key: "commercial", label: "Gama Comercial", count: commercialProducts.length, products: commercialProducts, cats: COMMERCIAL_CATS }].
  filter(Boolean);

  const [activeTab, setActiveTab] = useState(null);
  const [activeCat, setActiveCat] = useState(null);
  const [quoteOpen, setQuoteOpen] = useState(false);

  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].key);
    }
  }, [tabs.length]);

  const currentTab = tabs.find((t) => t.key === activeTab);

  const catsInTab = useMemo(() => {
    if (!currentTab) return [];
    const catSet = new Set(currentTab.products.map((p) => p.category));
    return currentTab.cats.filter((c) => catSet.has(c));
  }, [currentTab]);

  useEffect(() => {
    setActiveCat(null);
  }, [activeTab]);

  const displayProducts = useMemo(() => {
    if (!currentTab) return [];
    if (!activeCat) return currentTab.products;
    return currentTab.products.filter((p) => p.category === activeCat);
  }, [currentTab, activeCat]);

  const modelGroups = useMemo(() => {
    const groups = {};
    displayProducts.forEach((p) => {
      const key = p.model_code || deriveModel(p.name) || p.name;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    Object.values(groups).forEach((g) => g.sort((a, b) => (a.power_kw || 0) - (b.power_kw || 0)));
    return Object.entries(groups).map(([model, variants]) => ({
      model,
      variants,
      representative: variants[0],
    }));
  }, [displayProducts]);

  const navigate = useNavigate();

  if (loadingBrand) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] p-8">
        <Skeleton className="h-80 w-full rounded-3xl mb-8" />
        <div className="max-w-7xl mx-auto grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </div>);

  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#003366] mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Marca no encontrada</h2>
          <Link to={createPageUrl("Products")}>
            <Button className="bg-[#00509E] text-white rounded-full">Ver productos</Button>
          </Link>
        </div>
      </div>);

  }

  const brandColors = getBrandColors(brand.name);

  return (
    <div className="min-h-screen" style={{ backgroundColor: brandColors.sectionBg }}>
      {/* Hero */}
      <section className="bg-transparent opacity-100 relative min-h-[440px] md:min-h-[540px] flex items-center justify-center overflow-hidden"

      style={{
        background: brand.hero_image_url ?
        `linear-gradient(rgba(0,19,51,0.62), rgba(0,51,102,0.72)), url(${brand.hero_image_url}) center/cover no-repeat` :
        "linear-gradient(135deg, #003366 0%, #00509E 100%)"
      }}>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto py-16">
          {brand.logo_url ?
          <img src={brand.logo_url} alt={brand.name} className="mb-6 mx-auto rounded-[20px] h-14 md:h-20 object-contain drop-shadow-lg" /> :

          <p className="text-blue-200 mb-3 text-3xl font-bold uppercase tracking-widest">{brand.name}</p>
          }
          <h1 className="text-white mb-4 text-2xl font-medium leading-tight md:text-5xl" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {brand.hero_title || brand.name}
          </h1>
          {brand.hero_subtitle &&
          <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">{brand.hero_subtitle}</p>
          }
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={() => productsRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="bg-white text-[#003366] hover:bg-blue-50 rounded-full px-8 font-semibold shadow-lg h-11">
              
              Ver productos
            </Button>
            




            
          </div>
        </div>
      </section>

      {/* Intro */}
      {(brand.intro_title || brand.intro_text) &&
      <section className="bg-white py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            {brand.intro_title &&
          <h2 className="text-2xl md:text-3xl font-bold text-[#003366] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {brand.intro_title}
              </h2>
          }
            {brand.intro_text &&
          <p className="text-gray-600 text-base md:text-lg leading-relaxed">{brand.intro_text}</p>
          }
          </div>
        </section>
      }

      {/* Configurador */}
      <BrandConfigurator products={products} brandName={brand.name} brandData={brand} />

      {/* Productos */}
      <section ref={productsRef} className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">

        {/* Tabs gama — sticky */}
        {tabs.length > 0 &&
        <div className="sticky top-[72px] z-20 pb-2 pt-1 -mx-4 px-4 md:-mx-6 md:px-6" style={{ backgroundColor: brandColors.sectionBg }}>
            {/* Tabs gama */}
            {tabs.length > 1 &&
          <div className="flex gap-1 mb-3 bg-white rounded-xl p-1 shadow-sm w-fit">
                {tabs.map((tab) =>
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key ? "text-white shadow" : "text-gray-500 hover:text-gray-700"}`
              }
              style={activeTab === tab.key ? { backgroundColor: brandColors.primary } : {}}>
              
                    {tab.label}
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/20" : "bg-gray-100 text-gray-400"}`}>
                      {tab.count}
                    </span>
                  </button>
            )}
              </div>
          }

            {/* Selector de categoría */}
            {catsInTab.length > 1 &&
          <div className="flex flex-wrap gap-2">
                <button
              onClick={() => setActiveCat(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              !activeCat ? "text-white shadow" : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"}`
              }
              style={!activeCat ? { backgroundColor: brandColors.dark, borderColor: brandColors.dark } : {}}>
              
                  Todos <span className="ml-1 text-xs opacity-70">({currentTab?.products.length})</span>
                </button>
                {catsInTab.map((cat) => {
              const count = currentTab?.products.filter((p) => p.category === cat).length || 0;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  activeCat === cat ? "text-white shadow" : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"}`
                  }
                  style={activeCat === cat ? { backgroundColor: brandColors.dark, borderColor: brandColors.dark } : {}}>
                  
                      {CAT_LABELS[cat] || cat} <span className="ml-1 text-xs opacity-70">({count})</span>
                    </button>);

            })}
              </div>
          }
          </div>
        }

        {/* Grid productos */}
        <div className="mt-6">
          {loadingProducts ?
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
            </div> :
          displayProducts.length === 0 ?
          <div className="text-center py-20 text-gray-400">No hay productos disponibles en esta categoría.</div> :

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {modelGroups.map(({ model, variants, representative }) => (
                <ModelGroupCard
                  key={model}
                  model={model}
                  variants={variants}
                  representative={representative}
                  navigate={navigate}
                />
              ))}
            </div>
          }
        </div>
      </section>

      {/* CTA final */}
      {(brand.cta_title || brand.cta_text) &&
      <section className="bg-[#003366] text-white py-14 md:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            {brand.cta_title &&
          <h2 className="text-2xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>{brand.cta_title}</h2>
          }
            {brand.cta_text &&
          <p className="text-blue-200 text-lg mb-8 leading-relaxed">{brand.cta_text}</p>
          }
            <Button
            onClick={() => setQuoteOpen(true)}
            className="bg-[#FF6F61] hover:bg-[#e5574a] text-white rounded-full px-10 h-12 text-base font-semibold shadow-xl">
            
              Solicitar presupuesto gratuito
            </Button>
          </div>
        </section>
      }

      <QuoteRequestModal open={quoteOpen} onOpenChange={setQuoteOpen} service={null} />
    </div>);

}