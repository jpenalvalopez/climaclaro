import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { normalizeEntityList } from "@/lib/entity-list";

// page: "products" | "home"
export default function PromoCarousel({ page = "products" }) {
  const [current, setCurrent] = useState(0);

  const { data: allSlides = [] } = useQuery({
    queryKey: ["promo_slides"],
    queryFn: () => base44.entities.PromoSlide.list("sort_order", 50),
  });

  const slides = normalizeEntityList(allSlides).filter(s => {
    if (!s.active) return false;
    if (page === "home") return s.show_in_home === true;
    return s.show_in_products !== false;
  });

  useEffect(() => {
    setCurrent(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(i => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const promo = slides[current];
  const prev = () => setCurrent(i => (i - 1 + slides.length) % slides.length);
  const next = () => setCurrent(i => (i + 1) % slides.length);

  return (
    <div className="relative overflow-hidden h-64 mb-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 flex"
          style={{
            background: `linear-gradient(135deg, ${promo.gradient_from || "#003366"}, ${promo.gradient_to || "#00509E"})`,
          }}
        >
          {/* Left content */}
          <div className="flex-1 flex flex-col justify-center px-8 md:px-12 z-10">
            {promo.badge && (
              <span className="inline-block bg-[#FF6F61] text-white text-xs font-bold px-3 py-1 rounded-full mb-3 w-fit">
                {promo.badge}
              </span>
            )}
            <h2
              className="text-white text-xl md:text-2xl lg:text-3xl font-bold mb-2 leading-tight"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {promo.title}
            </h2>
            {promo.subtitle && (
              <p className="text-blue-200 text-sm md:text-base mb-4 max-w-sm hidden sm:block">
                {promo.subtitle}
              </p>
            )}
            {promo.cta_label && promo.cta_url && (
              <Link
                to={promo.cta_url}
                className="inline-flex items-center gap-2 bg-white text-[#003366] font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-blue-50 transition-colors w-fit"
              >
                {promo.cta_label} →
              </Link>
            )}
          </div>

          {/* Right image */}
          {promo.image_url && (
            <div className="w-1/3 md:w-2/5 relative overflow-hidden hidden sm:block">
              <img
                src={promo.image_url}
                alt={promo.title}
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Controls (only if multiple slides) */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors z-20"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors z-20"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${i === current ? "bg-white w-5" : "bg-white/50 w-2"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
