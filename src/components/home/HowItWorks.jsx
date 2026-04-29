import React from "react";
import { motion } from "framer-motion";
import { HelpCircle, ShoppingCart, Wrench, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { useCmsTexts } from "@/components/cms/cmsHelpers";

export default function HowItWorks() {
  const { t } = useCmsTexts();

  const STEPS = [
    { icon: HelpCircle, number: "01", titleKey: "home.howitworks.step1_title", descKey: "home.howitworks.step1_desc", titleFb: "Te ayudamos a elegir", descFb: "Según los m², orientación y tipo de estancia, te recomendamos el equipo ideal. Sin tecnicismos." },
    { icon: ShoppingCart, number: "02", titleKey: "home.howitworks.step2_title", descKey: "home.howitworks.step2_desc", titleFb: "Compra fácil y segura", descFb: "Añade al carrito, elige tus extras y paga de forma segura con tarjeta, PayPal o Bizum." },
    { icon: Wrench, number: "03", titleKey: "home.howitworks.step3_title", descKey: "home.howitworks.step3_desc", titleFb: "Instalación profesional", descFb: "Nuestros instaladores certificados lo montan, lo prueban y te lo dejan funcionando. Limpio y rápido." },
  ];

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#00509E] text-sm font-semibold uppercase tracking-widest">{t("home.howitworks.label", "Así de fácil")}</span>
          <h2
            className="text-3xl md:text-4xl lg:text-[40px] font-bold text-[#003366] mt-3"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {t("home.howitworks.title", "Cómo funciona")}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center group"
            >
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[calc(100%-20%)] h-[2px] bg-gradient-to-r from-[#00509E]/20 to-[#00509E]/20" />
              )}
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-[#F0F4F8] group-hover:bg-[#00509E]/10 transition-colors duration-300 mb-6">
                <step.icon className="w-10 h-10 text-[#00509E]" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-[#00509E] text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {step.number}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#003366] mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {t(step.titleKey, step.titleFb)}
              </h3>
              <p className="text-gray-600 leading-relaxed max-w-xs mx-auto">
                {t(step.descKey, step.descFb)}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link to={createPageUrl("Wizard")}>
            <Button className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-8 py-4 text-base font-semibold shadow-lg shadow-[#00509E]/20 gap-2">
              <Sparkles className="w-5 h-5" /> Te ayudamos a elegir
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}