import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wifi, Thermometer, Volume2, Zap } from "lucide-react";
import { getBrandColors } from "@/lib/brandColors";
import QuoteRequestModal from "@/components/services/QuoteRequestModal";

const ENERGY_COLORS = {
  "A+++": "bg-green-600",
  "A++": "bg-green-500",
  "A+": "bg-green-400",
  A: "bg-lime-500",
  B: "bg-yellow-400",
  C: "bg-orange-400",
};

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

function buildModelPageFromProducts(products, modelCode) {
  const first = products[0];
  if (!first) return null;
  const slug = modelCode.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    brand_name: first.brand || "",
    model_code: modelCode,
    slug,
    hero_image_url: first.image_url || "",
    hero_title: modelCode,
    hero_subtitle: first.description
      ? first.description.substring(0, 120)
      : `Descubre la gama ${modelCode} de ${first.brand || ""}`,
    intro_title: `Serie ${modelCode}`,
    intro_text: first.description || "",
    features: [],
    cta_title: "¿Necesitas ayuda para elegir?",
    cta_text: "Nuestros expertos te asesoran sin compromiso y te hacen un presupuesto personalizado.",
    seo_title: `${modelCode} - ${first.brand || ""} | Aire acondicionado`,
    seo_description: `Descubre la serie ${modelCode} de ${first.brand || ""}. ${products.length} potencias disponibles.`,
    active: true,
    sort_order: 100,
  };
}

export default function ModelPageDetalle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const variantsRef = useRef(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  const modelCode = slug ? decodeURIComponent(slug) : null;

  // 1. Cargar ModelPage por slug
  const { data: modelPages = [], isLoading: loadingPage } = useQuery({
    queryKey: ["model_page_detail", modelCode],
    queryFn: () => base44.entities.ModelPage.filter({ slug: modelCode }, "sort_order", 1),
    enabled: !!modelCode,
  });

  const modelPage = modelPages[0];
  const realModelCode = modelPage?.model_code || modelCode;

  // 2. Cargar productos usando el model_code real de la ModelPage
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products_model_page", realModelCode],
    queryFn: () =>
      base44.entities.Product.filter({ model_code: realModelCode, active: true }, "power_kw", 50),
    enabled: !!realModelCode,
  });

  const isLoading = loadingProducts || loadingPage;
  const firstProduct = products[0];
  const brandColors = getBrandColors(firstProduct?.brand || "");

  // Datos a mostrar: ModelPage si existe, fallback a producto
  const display = modelPage || (firstProduct ? buildModelPageFromProducts(products, realModelCode) : null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] p-8">
        <Skeleton className="h-80 w-full rounded-3xl mb-8" />
        <div className="max-w-5xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!firstProduct || !display) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#003366] mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Modelo no encontrado
          </h2>
          <Link to={createPageUrl("Products")}>
            <Button className="bg-[#00509E] text-white rounded-full">Ver productos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const category = CATEGORY_LABELS[firstProduct.category] || firstProduct.category;
  const hasWifi = products.some((p) => p.has_wifi);
  const energyRatings = [...new Set(products.map((p) => p.energy_rating).filter(Boolean))];
  const minPrice = Math.min(...products.map((p) => p.sale_price || p.price || 0).filter(Boolean));
  const hasOffer = products.some((p) => p.sale_price && p.sale_price < p.price);

  return (
    <div className="min-h-screen" style={{ backgroundColor: brandColors.sectionBg }}>

      {/* Hero */}
      <section
        className="relative min-h-[400px] md:min-h-[500px] flex items-center justify-center overflow-hidden"
        style={{
          background: display.hero_image_url
            ? `linear-gradient(rgba(0,19,51,0.70), rgba(0,51,102,0.78)), url(${display.hero_image_url}) center/cover no-repeat`
            : "linear-gradient(135deg, #003366 0%, #00509E 100%)",
        }}
      >
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto py-16">
          {display.brand_name && (
            <p className="text-blue-200 mb-2 text-sm font-semibold uppercase tracking-widest">{display.brand_name}</p>
          )}
          <h1
            className="text-white mb-3 text-3xl font-bold leading-tight md:text-5xl"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {display.hero_title}
          </h1>
          {display.hero_subtitle && (
            <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">{display.hero_subtitle}</p>
          )}

          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {energyRatings.map((r) => (
              <span key={r} className={`text-white text-xs font-bold px-2.5 py-1 rounded ${ENERGY_COLORS[r] || "bg-gray-400"}`}>
                {r}
              </span>
            ))}
            {hasWifi && (
              <span className="bg-white/20 text-white text-xs font-medium px-2.5 py-1 rounded flex items-center gap-1">
                <Wifi className="w-3 h-3" /> WiFi
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={() => variantsRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="bg-white text-[#003366] hover:bg-blue-50 rounded-full px-8 font-semibold shadow-lg h-11"
            >
              {products.length > 1 ? `Ver ${products.length} potencias` : "Ver producto"}
            </Button>

          </div>
        </div>
      </section>

      {/* Intro */}
      {(display.intro_title || display.intro_text) && (
        <section className="bg-white py-10 md:py-14">
          <div className="max-w-5xl mx-auto px-4 md:px-6 flex flex-col md:flex-row gap-8 items-center">
            {firstProduct.image_url && (
              <img
                src={firstProduct.image_url}
                alt={firstProduct.image_alt || modelCode}
                className="w-40 h-40 object-contain shrink-0"
              />
            )}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                {display.brand_name && <Badge className="bg-[#00509E]/10 text-[#00509E]">{display.brand_name}</Badge>}
                <Badge variant="outline">{category}</Badge>
              </div>
              {display.intro_title && (
                <h2 className="text-xl font-bold text-[#003366] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {display.intro_title}
                </h2>
              )}
              {display.intro_text && (
                <p className="text-gray-600 text-sm leading-relaxed mb-3">{display.intro_text}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {firstProduct.area_min_m2 && firstProduct.area_max_m2 && (
                  <span className="flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-[#00509E]" />
                    {firstProduct.area_min_m2}–{firstProduct.area_max_m2} m²
                  </span>
                )}
                {firstProduct.noise_db && (
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-[#00509E]" />
                    Desde {firstProduct.noise_db} dB
                  </span>
                )}
                {hasWifi && (
                  <span className="flex items-center gap-1.5 text-[#00509E] font-medium">
                    <Wifi className="w-4 h-4" /> WiFi incluido
                  </span>
                )}
              </div>
              <p className="mt-4 text-2xl font-bold text-[#003366]">Consultar precio</p>
            </div>
          </div>
        </section>
      )}

      {/* Features personalizadas */}
      {display.features?.length > 0 && (
        <section className="py-10 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {display.features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${brandColors.primary}20` }}
                >
                  <Zap className="w-5 h-5" style={{ color: brandColors.primary }} />
                </div>
                <h3 className="font-bold text-[#003366] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {f.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Variantes */}
      <section ref={variantsRef} className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <h2
          className="text-2xl font-bold text-[#003366] mb-6"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {products.length > 1 ? "Elige tu potencia" : "Producto"}
        </h2>
        <div className="space-y-3">
          {products.map((product) => (
            <VariantRow key={product.id} product={product} navigate={navigate} brandColors={brandColors} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#003366] text-white py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {display.cta_title || "¿Necesitas ayuda para elegir?"}
          </h2>
          <p className="text-blue-200 text-lg mb-8">
            {display.cta_text || "Nuestros expertos te asesoran sin compromiso y te hacen un presupuesto personalizado."}
          </p>

        </div>
      </section>

      <QuoteRequestModal open={quoteOpen} onOpenChange={setQuoteOpen} service={null} />
    </div>
  );
}

function VariantRow({ product, navigate, brandColors }) {
  const hasOffer = product.sale_price && product.sale_price < product.price;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow">
      {product.image_url && (
        <img src={product.image_url} alt={product.name} className="w-14 h-14 object-contain shrink-0" />
      )}
      <div className="flex items-center gap-4 flex-1">
        {product.power_kw && (
          <div
            className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0"
            style={{ backgroundColor: `${brandColors.primary}15` }}
          >
            <span className="font-bold text-lg leading-none" style={{ color: brandColors.primary }}>
              {product.power_kw}
            </span>
            <span className="text-[10px] font-medium" style={{ color: brandColors.primary }}>kW</span>
          </div>
        )}
        <div>
          <p className="font-semibold text-[#003366]">{product.name}</p>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
            {product.area_min_m2 && product.area_max_m2 && (
              <span>{product.area_min_m2}–{product.area_max_m2} m²</span>
            )}
            {product.noise_db && <span>{product.noise_db} dB</span>}
            {product.has_wifi && (
              <span className="flex items-center gap-1 text-[#00509E]">
                <Wifi className="w-3 h-3" /> WiFi
              </span>
            )}
            {product.energy_rating && (
              <span className={`px-1.5 py-0.5 rounded text-white text-[10px] font-bold ${ENERGY_COLORS[product.energy_rating] || "bg-gray-400"}`}>
                {product.energy_rating}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 sm:text-right">
        <div>
          <p className="text-xl font-bold text-[#003366]">Consultar</p>
        </div>
        <Button
          onClick={() => navigate(createPageUrl("ProductDetail") + `?id=${product.id}`)}
          className="rounded-full shrink-0 text-white"
          style={{ backgroundColor: brandColors.primary }}
        >
          Ver detalle
        </Button>
      </div>
    </div>
  );
}