import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Check, X, ShoppingCart, ArrowLeft, Wrench } from "lucide-react";
import ServiceProductSelector from "../components/services/ServiceProductSelector";
import ServiceExtrasSelector from "../components/services/ServiceExtrasSelector";

export default function ServiceDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [cartAdded, setCartAdded] = useState(false);

  const INSTALLATION_TYPES = ["Instalación Split 1x1", "Instalación Multisplit"];

  const handleExtraChange = (extra, qty) => {
    setSelectedExtras(prev => {
      const without = prev.filter(e => e.name !== extra.name);
      if (qty <= 0) return without;
      return [...without, { ...extra, qty }];
    });
  };

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["service_by_slug", slug],
    queryFn: () => base44.entities.Service.filter({ slug, active: true }),
    enabled: !!slug
  });

  const service = services[0] || null;

  const addToCart = () => {
    if (!service) return;
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    // Add service item
    const hasService = cart.find((i) => i.item_type === "service" && i.service_id === service.id);
    if (!hasService) {
      cart.push({
        item_type: "service",
        service_id: service.id,
        service_name: service.title,
        product_id: "",
        product_name: "",
        quantity: 1,
        price: service.price || 0,
        with_installation: false,
        extras: [],
        image_url: service.image_url || null
      });
    }

    // Add selected extras as separate cart items
    selectedExtras.forEach(e => {
      cart.push({
        item_type: "service",
        service_id: service.id,
        service_name: `Extra: ${e.name}`,
        quantity: e.qty || 1,
        price: e.price || 0,
        with_installation: false,
        extras: [],
        image_url: null
      });
    });

    // Add product item if selected
    if (selectedProduct) {
      const existing = cart.find((i) => i.item_type === "product" && i.product_id === selectedProduct.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          item_type: "product",
          service_id: "",
          service_name: "",
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          quantity: 1,
          price: selectedProduct.price || 0,
          with_installation: true,
          extras: [],
          image_url: selectedProduct.image_url || null
        });
      }
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
  };

  const extrasTotal = selectedExtras.reduce((sum, e) => sum + (e.price || 0) * (e.qty || 1), 0);
  const total = (service?.price || 0) + (selectedProduct?.price || 0) + extrasTotal;

  if (isLoading) {
    return <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center text-gray-400">Cargando...</div>;
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Servicio no encontrado.</p>
        <Link to={createPageUrl("Services")}><Button variant="outline">← Volver a servicios</Button></Link>
      </div>);

  }

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* Header */}
      <div className="bg-[#003366] text-white py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <Link to={createPageUrl("Services")} className="flex items-center gap-2 text-blue-200 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver a servicios
          </Link>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {service.image_url ?
            <img src={service.image_url} alt={service.title} className="w-24 h-24 object-cover rounded-2xl shrink-0" /> :

            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                <Wrench className="w-8 h-8 text-white" />
              </div>
            }
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{service.title}</h1>
              <p className="text-blue-200 mt-2">{service.short_description}</p>
            </div>
            {service.price &&
            <div className="md:ml-auto text-right">
                <div className="text-3xl font-bold">{service.price.toLocaleString("es-ES")} €</div>
                <div className="text-blue-200 text-sm">precio del servicio</div>
              </div>
            }
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid lg:grid-cols-3 gap-8">
        {/* Left: Detail */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          {service.description &&
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="font-bold text-[#003366] text-lg mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Descripción del servicio</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{service.description}</p>
            </div>
          }

          {/* Includes / Excludes */}
          {(service.includes?.length > 0 || service.excludes?.length > 0) &&
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="font-bold text-[#003366] text-lg mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>¿Qué incluye?</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {service.includes?.length > 0 &&
              <div>
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3">Incluye</p>
                    <ul className="space-y-2">
                      {service.includes.map((item, i) =>
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {item}
                        </li>
                  )}
                    </ul>
                  </div>
              }
                {service.excludes?.length > 0 &&
              <div>
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3">NO INCLUYE (Contratable como extra)
                </p>
                    <ul className="space-y-2">
                      {service.excludes.map((item, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                          <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> {item}
                        </li>
                  )}
                    </ul>
                  </div>
              }
              </div>
            </div>
          }

          {/* Extras */}
          <ServiceExtrasSelector
            extras={service.extras}
            selectedExtras={selectedExtras}
            onChange={handleExtraChange}
          />

          {/* Product selector — only for installation services */}
          {INSTALLATION_TYPES.includes(service.tipoServicioEnum) && (
            <ServiceProductSelector selectedProduct={selectedProduct} onSelect={setSelectedProduct} />
          )}
        </div>

        {/* Right: Summary & CTA */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-20">
            <h3 className="font-bold text-[#003366] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Resumen</h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{service.title}</span>
                <span className="font-semibold">{service.price ? `${service.price.toLocaleString("es-ES")} €` : "—"}</span>
              </div>
              {selectedProduct &&
              <div className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate max-w-[160px]">{selectedProduct.name}</span>
                  <span className="font-semibold">{selectedProduct.price?.toLocaleString("es-ES")} €</span>
                </div>
              }
              {selectedExtras.map((e, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate max-w-[130px]">{e.name} {e.qty > 1 ? `× ${e.qty} ${e.unit || "ud."}` : ""}</span>
                  <span className="font-semibold">+{((e.price || 0) * (e.qty || 1)).toLocaleString("es-ES")} €</span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-bold text-[#003366]">
                <span>Total estimado</span>
                <span>{total.toLocaleString("es-ES")} €</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={addToCart}
                className="w-full bg-[#00509E] hover:bg-[#003366] text-white rounded-xl gap-2">
                <ShoppingCart className="w-4 h-4" />
                {cartAdded ? "¡Añadido!" : "Añadir al carrito"}
              </Button>
              {cartAdded &&
              <Link to={createPageUrl("Cart")}>
                  <Button variant="outline" className="w-full rounded-xl border-[#00509E] text-[#00509E]">
                    Ver carrito →
                  </Button>
                </Link>
              }

            </div>

            <p className="text-xs text-gray-400 mt-4 text-center">
              Sin compromiso. Te contactaremos para confirmar.
            </p>
          </div>
        </div>
      </div>


    </div>);

}