import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart, ArrowLeft, Check, Wifi, Volume2, Zap, Ruler,
  Star, Shield, Phone, Truck, ChevronRight, Wrench, CheckCircle2, PlusCircle, X, HelpCircle } from
"lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useCmsTexts } from "@/components/cms/cmsHelpers";
import InstallationBannerModal from "@/components/products/InstallationBannerModal";

const trimName = (name) => name?.split("—")[0].trim();

export default function ProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const { t } = useCmsTexts();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [inCart, setInCart] = useState(false);
  const [withInstallation, setWithInstallation] = useState(false);
  const [installationExtras, setInstallationExtras] = useState({});
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    if (!id) return;
    const check = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setInCart(cart.some((item) => item.product_id === id));
    };
    check();
    window.addEventListener("cart-updated", check);
    return () => window.removeEventListener("cart-updated", check);
  }, [id]);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", city: "" });
  const [leadSent, setLeadSent] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const items = await base44.entities.Product.filter({ id });
      return items[0];
    },
    enabled: !!id
  });

  // Determinar el servicio de instalación aplicable según categoría y potencia
  const { data: allServices = [] } = useQuery({
    queryKey: ["services_active"],
    queryFn: () => base44.entities.Service.filter({ active: true }, "sort_order", 50)
  });

  const matchedService = React.useMemo(() => {
    if (!product || !allServices.length) return null;
    const kw = product.power_kw || 0;
    const cat = product.category;

    // Para multisplit — cada subcategoría tiene su tipoServicioEnum directo
    const multisplitMap = {
      multisplit_2x1: "Instalación Multisplit 2x1",
      multisplit_3x1: "Instalación Multisplit 3x1",
      multisplit_4x1: "Instalación Multisplit 4x1",
      multisplit_5x1: "Instalación Multisplit 5x1",
    };
    if (multisplitMap[cat]) {
      return allServices.find((s) => s.tipoServicioEnum === multisplitMap[cat] && s.active !== false) || null;
    }
    // Fallback para productos con categoría legacy "multisplit"
    if (cat === "multisplit") {
      return allServices.find((s) => s.tipoServicioEnum?.startsWith("Instalación Multisplit") && s.active !== false) || null;
    }
    // Para monosplit y otros: buscar por rango de potencia en Instalación Split 1x1
    if (cat === "monosplit" || cat === "cassette" || cat === "conductos") {
      const candidates = allServices.filter((s) =>
      s.tipoServicioEnum === "Instalación Split 1x1" && (
      s.power_kw_min === undefined || s.power_kw_min === null || kw >= s.power_kw_min) && (
      s.power_kw_max === undefined || s.power_kw_max === null || kw <= s.power_kw_max)
      );
      // Si no hay rango configurado, devuelve cualquier Split 1x1
      if (!candidates.length) return allServices.find((s) => s.tipoServicioEnum === "Instalación Split 1x1") || null;
      return candidates[0];
    }
    return null;
  }, [product, allServices]);

  const { data: reviews } = useQuery({
    queryKey: ["product-reviews", id],
    queryFn: () => base44.entities.Review.filter({ product_id: id }, "-created_date", 10),
    initialData: [],
    enabled: !!id
  });

  const handleCartButton = () => {
    if (inCart) {
      navigate(createPageUrl("Cart"));
      return;
    }
    // Si hay servicio de instalación disponible y no lo ha seleccionado, preguntar primero
    if (matchedService && !withInstallation) {
      setShowInstallPrompt(true);
      return;
    }
    addToCartNow();
  };

  const addToCartNow = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push({
      item_type: "product",
      product_id: product.id,
      product_name: product.name,
      price: product.sale_price || product.price,
      quantity: qty,
      image_url: product.image_url,
      with_installation: withInstallation
    });
    if (withInstallation && matchedService) {
      cart.push({
        item_type: "service",
        service_id: matchedService.id,
        service_name: `${matchedService.title} — ${product.name}`,
        quantity: 1,
        price: matchedService.price || 0,
        with_installation: true,
        product_ref: product.id,
        image_url: product.image_url || null
      });
      // Añadir extras opcionales seleccionados
      const extras = matchedService.extras || [];
      Object.entries(installationExtras).forEach(([name, qty]) => {
        if (qty > 0) {
          const extra = extras.find((e) => e.name === name);
          if (extra) {
            cart.push({
              item_type: "service",
              service_name: `Extra: ${extra.name}`,
              quantity: qty,
              price: extra.price || 0,
              with_installation: true,
              product_ref: product.id,
              image_url: null
            });
          }
        }
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const submitLead = async () => {
    await base44.entities.Lead.create({
      ...leadForm,
      source: "product_page",
      message: `Consulta sobre: ${product?.name}`
    });
    setLeadSent(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-12 w-72" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>);

  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Producto no encontrado.</p>
        <Link to={createPageUrl("Products")}>
          <Button variant="link" className="text-[#00509E] mt-4">Volver al catálogo</Button>
        </Link>
      </div>);

  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to={createPageUrl("Products")} className="flex items-center gap-1 hover:text-[#00509E]">
            <ArrowLeft className="w-4 h-4" /> {t("product_detail.breadcrumb_products", "Productos")}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#003366] font-medium">{product.name}</span>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}>

            <div className="lg:sticky lg:top-24 space-y-3">
              <div className="bg-transparent p-8 rounded-3xl relative md:p-12 aspect-square flex items-center justify-center">
                {activeImage || product.image_url ?
                <img src={activeImage || product.image_url} alt={product.name} className="max-w-full max-h-full object-contain" /> :
                <Zap className="w-32 h-32 text-gray-300" />
                }
                {/* Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  {product.is_top_seller &&
                  <Badge className="bg-[#FF6F61] text-white rounded-full px-3 py-1">Top ventas</Badge>
                  }
                </div>
              </div>
              {/* Galería de miniaturas */}
              {product.image_gallery?.length > 0 &&
              <div className="flex gap-2 flex-wrap">
                  {product.image_url &&
                <button
                  onClick={() => setActiveImage(null)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden bg-[#F0F4F8] p-1 transition-all ${!activeImage ? "border-[#00509E]" : "border-gray-200 hover:border-gray-400"}`}>
                  
                      <img src={product.image_url} alt="" className="w-full h-full object-contain" />
                    </button>
                }
                  {product.image_gallery.map((url, i) =>
                <button
                  key={i}
                  onClick={() => setActiveImage(url)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden bg-[#F0F4F8] p-1 transition-all ${activeImage === url ? "border-[#00509E]" : "border-gray-200 hover:border-gray-400"}`}>
                  
                      <img src={url} alt="" className="w-full h-full object-contain" />
                    </button>
                )}
                </div>
              }
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6">

            <div>
              <p className="text-sm text-[#00509E] font-medium uppercase tracking-wider mb-1">{product.brand}</p>
              <h1 className="text-[#003366] text-xl font-medium leading-tight md:text-3xl lg:text-4xl"

              style={{ fontFamily: "'Poppins', sans-serif" }}>

                {trimName(product.name)}
              </h1>
              {(product.area_min_m2 || product.area_max_m2) &&
              <p className="text-gray-500 mt-2">{t("product_detail.area_label", "Para")} {product.area_min_m2}–{product.area_max_m2} m²</p>
              }
            </div>

            {/* Quick specs */}
            <div className="flex flex-wrap gap-3">
              {product.energy_rating &&
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                  <Zap className="w-3.5 h-3.5" /> {product.energy_rating}
                </span>
              }
              {product.has_wifi &&
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                  <Wifi className="w-3.5 h-3.5" /> WiFi
                </span>
              }
              {(() => {
                const noiseSpec = product.specs?.find((s) => s.label === "Nivel sonoro interior");
                const noiseVal = noiseSpec?.value || (product.noise_db ? `${product.noise_db} dB` : null);
                return noiseVal ?
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-medium">
                    <Volume2 className="w-3.5 h-3.5" /> {noiseVal}
                  </span> :
                null;
              })()}
              {product.power_kw &&
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-sm font-medium">
                  <Ruler className="w-3.5 h-3.5" /> {product.power_kw} kW / {product.frigorias} frig.
                </span>
              }
            </div>

            {/* Price */}
            <div className="bg-[#F0F4F8] rounded-2xl p-6">
              <span className="text-3xl md:text-4xl font-bold text-[#003366]">Consultar precio</span>
            </div>

            {/* Installation banner */}
            <InstallationBannerModal
              product={product}
              isSelected={withInstallation}
              onToggle={(extraQtys) => {
                setWithInstallation((v) => !v);
                setInstallationExtras(extraQtys || {});
              }}
              matchedService={matchedService} />

            {/* Diálogo: ¿quieres instalación? */}
            <Dialog open={showInstallPrompt} onOpenChange={setShowInstallPrompt}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-[#003366] flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    <HelpCircle className="w-5 h-5 text-[#00509E]" /> ¿Necesitas instalación?
                  </DialogTitle>
                </DialogHeader>
                <p className="text-gray-500 text-sm mt-1 mb-5">
                  Ofrecemos instalación profesional con garantía incluida. ¿Quieres añadirla a tu pedido?
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => {
                      setShowInstallPrompt(false);
                      // Abrir el modal de instalación (scroll al banner)
                      document.querySelector("[data-install-banner]")?.click();
                    }}
                    className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full font-semibold gap-2"
                  >
                    <Wrench className="w-4 h-4" /> Sí, ver opciones de instalación
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setShowInstallPrompt(false); addToCartNow(); }}
                    className="rounded-full border-2 font-medium"
                  >
                    No, solo el producto
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            

            {/* Add to cart */}
            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded-xl overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-3 hover:bg-gray-50 text-lg">−</button>
                <span className="px-4 py-3 font-semibold min-w-[48px] text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-4 py-3 hover:bg-gray-50 text-lg">+</button>
              </div>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  onClick={handleCartButton}
                  size="lg"
                  className={`rounded-full px-8 text-base font-semibold shadow-lg transition-colors duration-300 ${
                  inCart ? "bg-green-500 hover:bg-green-600 shadow-green-500/20" : "bg-[#00509E] hover:bg-[#003366] shadow-[#00509E]/20"} text-white`
                  }>
                  <AnimatePresence mode="wait" initial={false}>
                    {inCart ?
                    <motion.span key="check" className="flex items-center gap-2" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                        <Check className="w-5 h-5" /> Ver carrito
                      </motion.span> :
                    <motion.span key="cart" className="flex items-center gap-2" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                        <ShoppingCart className="w-5 h-5" /> {t("product_detail.add_to_cart", "Añadir al carrito")}
                      </motion.span>
                    }
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>

            {/* Trust icons */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600"><Truck className="w-4 h-4 text-[#00509E]" /> {t("product_detail.trust_shipping", "Envío gratuito")}</div>
              <div className="flex items-center gap-2 text-gray-600"><Shield className="w-4 h-4 text-[#00509E]" /> {t("product_detail.trust_warranty", "Garantía 3 años")}</div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="description" className="mt-8">
              <TabsList className="bg-[#F0F4F8] text-muted-foreground my-2 px-1 rounded-xl h-auto items-center justify-center w-full grid grid-cols-4 gap-0.5 py-1">
                <TabsTrigger value="description" className="text-sm px-1 py-1.5 font-medium rounded-lg inline-flex items-center justify-center text-center leading-tight ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
                  <span className="sm:hidden">Descrip.</span>
                  <span className="hidden sm:inline">{t("product_detail.tab_description", "Descripción")}</span>
                </TabsTrigger>
                <TabsTrigger value="specs" className="text-sm px-1 py-1.5 font-medium rounded-lg inline-flex items-center justify-center text-center leading-tight ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
                  <span className="sm:hidden">Espec.</span>
                  <span className="hidden sm:inline">{t("product_detail.tab_specs", "Especific.")}</span>
                </TabsTrigger>
                <TabsTrigger value="installation" className="text-sm px-1 py-1.5 font-medium rounded-lg inline-flex items-center justify-center text-center leading-tight ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
                  <span className="sm:hidden">Instalac.</span>
                  <span className="hidden sm:inline">{t("product_detail.tab_installation", "Instalación")}</span>
                </TabsTrigger>
                <TabsTrigger value="reviews" className="text-sm px-1 py-1.5 font-medium rounded-lg inline-flex items-center justify-center text-center leading-tight ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
                  <span className="sm:hidden">Opiniones ({reviews.length})</span>
                  <span className="hidden sm:inline">{t("product_detail.tab_reviews", "Opiniones")} ({reviews.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-4">
                {product.description ?
                <ReactMarkdown className="prose prose-sm max-w-none text-gray-700 [&>ul]:list-disc [&>ul]:ml-5 [&>ol]:list-decimal [&>ol]:ml-5 [&>h1]:font-bold [&>h2]:font-semibold [&>h3]:font-semibold [&>strong]:font-semibold [&>p]:mb-3 [&>ul]:mb-3 [&>ol]:mb-3">
                    {product.description}
                  </ReactMarkdown> :

                <p className="text-gray-500 text-sm">{t("product_detail.no_description", "Descripción no disponible.")}</p>
                }
              </TabsContent>

              <TabsContent value="specs" className="mt-4">
                {product.specs?.length > 0 ?
                <div className="space-y-2">
                    {product.specs.map((s, i) =>
                  <div key={i} className={`flex justify-between py-2 px-3 rounded-lg text-sm ${i % 2 === 0 ? "bg-gray-50" : ""}`}>
                        <span className="text-gray-500">{s.label}</span>
                        <span className="font-medium text-[#333]">{s.value}</span>
                      </div>
                  )}
                  </div> :

                <p className="text-gray-500 text-sm">{t("product_detail.no_specs", "Especificaciones no disponibles.")}</p>
                }
              </TabsContent>

              <TabsContent value="installation" className="mt-4 space-y-4">
                {matchedService ?
                <>
                    {/* Nombre del servicio */}
                    <div className="flex items-center gap-2 mb-1">
                      <Wrench className="w-4 h-4 text-[#00509E]" />
                      <h4 className="font-semibold text-[#003366] text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        {matchedService.title}
                      </h4>
                    </div>

                    {/* Qué incluye */}
                    {matchedService.includes?.length > 0 &&
                  <div className="bg-[#F0F4F8] rounded-2xl p-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Incluye</p>
                        <ul className="space-y-2">
                          {matchedService.includes.map((item, i) =>
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                              {item}
                            </li>
                      )}
                        </ul>
                      </div>
                  }

                    {/* Qué NO incluye */}
                    {matchedService.excludes?.length > 0 &&
                  <div className="bg-red-50 rounded-2xl p-5">
                        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">No incluye</p>
                        <ul className="space-y-2">
                          {matchedService.excludes.map((item, i) =>
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                              {item}
                            </li>
                      )}
                        </ul>
                      </div>
                  }

                    {/* Precio instalación */}
                    {matchedService.price &&
                  <div className="bg-[#00509E]/5 border border-[#00509E]/20 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#003366]">Precio instalación estándar</p>
                          <p className="text-xs text-gray-500 mt-0.5">Precio cerrado, sin sorpresas</p>
                        </div>
                        <span className="text-2xl font-bold text-[#00509E]">{matchedService.price.toFixed(2)} €</span>
                      </div>
                  }

                    {/* Extras del servicio */}
                    {matchedService.extras?.length > 0 &&
                  <div className="border border-gray-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <PlusCircle className="w-4 h-4 text-[#FF6F61]" />
                          <h4 className="font-semibold text-[#003366] text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            Extras opcionales
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {matchedService.extras.map((ex, i) =>
                      <div key={i} className={`flex justify-between items-center py-2 px-3 rounded-xl text-sm ${i % 2 === 0 ? "bg-gray-50" : ""}`}>
                              <div>
                                <span className="text-gray-700">{ex.name}</span>
                                {ex.description && <span className="text-gray-400 text-xs ml-2">{ex.description}</span>}
                                <span className="text-gray-400 text-xs ml-1">/ {ex.unit || "ud."}</span>
                              </div>
                              <span className="font-semibold text-[#003366]">+{Number(ex.price).toFixed(2)} €</span>
                            </div>
                      )}
                        </div>
                      </div>
                  }
                  </> : (

                /* Fallback si no hay servicio configurado */
                <div className="bg-[#F0F4F8] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Wrench className="w-4 h-4 text-[#00509E]" />
                      <h4 className="font-semibold text-[#003366] text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        Instalación estándar incluye
                      </h4>
                    </div>
                    {product.installation_details ?
                  <p className="text-gray-700 text-sm leading-relaxed">{product.installation_details}</p> :

                  <ul className="space-y-2">
                        {["Montaje de unidad interior y exterior", "Hasta 3 metros de tubería de cobre", "Cableado eléctrico", "Desagüe", "Soportes de unidad exterior", "Puesta en marcha y comprobación", "Limpieza básica tras la instalación"].map((item, i) =>
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            {item}
                          </li>
                    )}
                      </ul>
                  }
                    {product.price_with_installation &&
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#003366]">Precio instalación estándar</p>
                        <span className="text-2xl font-bold text-[#00509E]">{product.price_with_installation.toFixed(2)} €</span>
                      </div>
                  }
                  </div>)
                }
              </TabsContent>

              <TabsContent value="reviews" className="mt-4 space-y-4">
                {reviews.length > 0 ? reviews.map((r) =>
                <div key={r.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-1 mb-2">
                      {Array(5).fill(0).map((_, s) =>
                    <Star key={s} className={`w-3.5 h-3.5 ${s < r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                    )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{r.text}</p>
                    <p className="text-xs text-gray-500">{r.author} · {r.city}</p>
                  </div>
                ) :
                <p className="text-gray-500 text-sm">{t("product_detail.no_reviews", "Aún no hay opiniones para este producto.")}</p>
                }
              </TabsContent>
            </Tabs>

            {/* Lead mini-form */}
            <div className="bg-[#F0F4F8] rounded-2xl p-6 mt-8">
              <h3 className="font-semibold text-[#003366] mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {t("product_detail.lead_title", "¿Tienes dudas? Te llamamos.")}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{t("product_detail.lead_subtitle", "Déjanos tus datos y te asesoramos sin compromiso.")}</p>
              {leadSent ?
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <Check className="w-5 h-5" /> {t("product_detail.lead_success", "¡Gracias! Te contactaremos pronto.")}
                </div> :

              <div className="flex flex-col sm:flex-row gap-2">
                  <Input placeholder={t("product_detail.lead_name_placeholder", "Tu nombre")} value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} className="rounded-xl" />
                  <Input placeholder={t("product_detail.lead_phone_placeholder", "Teléfono")} value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} className="rounded-xl" />
                  <Input placeholder={t("product_detail.lead_city_placeholder", "Ciudad")} value={leadForm.city} onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })} className="rounded-xl" />
                  <Button onClick={submitLead} className="bg-[#FF6F61] hover:bg-[#e5574a] text-white rounded-xl shrink-0">
                    <Phone className="w-4 h-4 mr-1" /> {t("product_detail.lead_submit", "Enviar")}
                  </Button>
                </div>
              }
            </div>
          </motion.div>
        </div>
      </div>
    </div>);

}