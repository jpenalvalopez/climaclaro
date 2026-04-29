import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useCmsTexts } from "@/components/cms/cmsHelpers";

export default function HeroSection() {
  const { t } = useCmsTexts();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#F0F4F8] via-white to-[#F0F4F8]">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00509E]/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#FF6F61]/5 rounded-full translate-y-1/2 -translate-x-1/3" />

      <div className="px-4 py-16 max-w-7xl md:px-6 md:py-24 lg:py-32 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}>
            
            {t("home.hero.badge", "Campaña de verano — Instalación prioritaria") &&
            <div className="bg-[#00509E]/10 text-[#00509E] mb-6 px-3 py-2 text-sm font-medium rounded-full inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {t("home.hero.badge", "Campaña de verano — Instalación prioritaria")}
              </div>
            }

            <h1 className="text-[#003366] mb-6 text-3xl font-semibold leading-[1.1] md:text-5xl lg:text-[56px]"

            style={{ fontFamily: "'Poppins', sans-serif" }}>
              
              {t("home.hero.title", "Aire acondicionado e instalación, sin líos.")}
            </h1>

            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8 max-w-lg">
              {t("home.hero.subtitle", "Te asesoramos, lo compras y lo instalamos. Rápido, limpio y con garantía.")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={createPageUrl("Products")}>
                <Button
                  className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-5 text-sm font-semibold shadow-lg shadow-[#00509E]/20 w-full sm:w-auto">
                  
                  {t("home.hero.btn_products", "Ver productos")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl("Wizard")}>
                <Button
                  variant="outline"
                  className="rounded-full px-5 text-sm font-semibold border-2 border-[#00509E] text-[#00509E] hover:bg-[#00509E]/5 w-full sm:w-auto">
                  
                  {t("home.hero.btn_wizard", "Te ayudamos a elegir")}
                </Button>
              </Link>
            </div>

            {/* Trust mini-badges */}
            <div className="flex flex-wrap gap-6 mt-10 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {t("home.hero.trust1", "Instaladores certificados")}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {t("home.hero.trust2", "Garantía 3 años")}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {t("home.hero.trust3", "Precio sin sorpresas")}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block">
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00509E]/10 to-[#FF6F61]/10 rounded-3xl rotate-3" />
              <img
                src={t("home.hero.image_url", "https://images.unsplash.com/photo-1631545806609-04e4c8a788df?w=700&h=500&fit=crop")}
                alt={t("home.hero.image_alt", "Instalación de aire acondicionado")}
                className="relative rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]" />
              
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#333]">{t("home.hero.stat", "+2.500 instalaciones")}</p>
                  <p className="text-xs text-gray-500">{t("home.hero.stat_sub", "en toda España")}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>);

}