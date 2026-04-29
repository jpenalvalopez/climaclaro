import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Wifi, Volume2, Zap, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const trimName = (name) => name?.split("—")[0].trim();

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const [inCart, setInCart] = useState(false);

  useEffect(() => {
    const check = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setInCart(cart.some(item => item.product_id === product.id));
    };
    check();
    window.addEventListener("cart-updated", check);
    return () => window.removeEventListener("cart-updated", check);
  }, [product.id]);

  const handleButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) {
      navigate(createPageUrl("Cart"));
      return;
    }
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push({
      item_type: "product",
      product_id: product.id,
      product_name: product.name,
      price: product.sale_price || product.price,
      quantity: 1,
      image_url: product.image_url,
      with_installation: false,
    });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={createPageUrl("ProductDetail") + `?id=${product.id}`}
        className="group block bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#00509E]/20 transition-all duration-300"
      >
        {/* Image */}
        <div className="relative aspect-square bg-white overflow-hidden border-b border-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Zap className="w-16 h-16" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.sale_price && (
              <Badge className="bg-[#CC0000] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Oferta
              </Badge>
            )}
            {product.is_top_seller && (
              <Badge className="bg-[#FF6F61] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Top ventas
              </Badge>
            )}
            {product.installation_included && (
              <Badge className="bg-[#00509E] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Instalación incluida
              </Badge>
            )}
          </div>

          {product.energy_rating && (
            <div className="absolute top-3 right-3">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                product.energy_rating.includes("+++") ? "bg-green-100 text-green-700" :
                product.energy_rating.includes("++") ? "bg-green-50 text-green-600" :
                "bg-yellow-50 text-yellow-700"
              }`}>
                {product.energy_rating}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-medium text-[#00509E] bg-[#F0F4F8] px-2 py-0.5 rounded-full uppercase tracking-wide">
              {CATEGORY_LABELS[product.category] || product.category}
            </span>
            {product.brand && (
              <span className="text-[10px] text-gray-400 font-medium">{product.brand}</span>
            )}
          </div>

          <h3 className="font-semibold text-[#003366] text-sm mb-1 line-clamp-2 group-hover:text-[#00509E] transition-colors" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {trimName(product.name)}
          </h3>

          {(product.area_min_m2 || product.area_max_m2) && (
            <p className="text-xs text-gray-500 mb-3">
              Para {product.area_min_m2}–{product.area_max_m2} m²
            </p>
          )}

          {/* Quick specs */}
          <div className="flex items-center gap-3 mb-4 text-[10px] text-gray-400">
            {product.has_wifi && (
              <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> WiFi</span>
            )}
            {(() => {
              const noiseSpec = product.specs?.find(s => s.label === "Nivel sonoro interior");
              const noiseVal = noiseSpec?.value || (product.noise_db ? `${product.noise_db}dB` : null);
              return noiseVal ? <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" /> {noiseVal}</span> : null;
            })()}
            {product.power_kw && (
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {product.power_kw}kW</span>
            )}
          </div>

          {/* Price + CTA */}
          <div className="flex items-end justify-between">
            <div>
              {product.sale_price ? (
                <>
                  <p className="text-xl font-bold text-[#CC0000]">
                    {product.sale_price.toFixed(2)} <span className="text-sm font-normal">€</span>
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-gray-400 line-through">PVPR {product.price?.toFixed(2)} €</p>
                    <span className="text-[10px] font-bold bg-[#CC0000] text-white px-1.5 py-0.5 rounded">
                      -{Math.round((product.price - product.sale_price) / product.price * 100)}%
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-xl font-bold text-[#003366]">
                  {product.price?.toFixed(2)} <span className="text-sm font-normal">€</span>
                </p>
              )}
            </div>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                size="sm"
                onClick={handleButtonClick}
                className={`rounded-full shadow-md transition-all duration-300 text-white text-xs font-semibold ${
                  inCart
                    ? "bg-green-500 hover:bg-green-600 px-3 h-9 gap-1.5"
                    : "bg-[#00509E] hover:bg-[#003366] w-10 h-10 p-0"
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {inCart ? (
                    <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Ver carrito
                    </motion.div>
                  ) : (
                    <motion.div key="cart" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <ShoppingCart className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}