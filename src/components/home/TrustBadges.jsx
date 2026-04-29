import React from "react";
import { motion } from "framer-motion";
import { Shield, Award, Headphones, Receipt, CreditCard } from "lucide-react";
import { useCmsTexts } from "@/components/cms/cmsHelpers";

const BADGES = [
  { icon: Receipt,    titleKey: "home.trust.badge1_title", descKey: "home.trust.badge1_desc", titleFb: "Precio claro",              descFb: "Sin sorpresas. El precio que ves es el precio que pagas." },
  { icon: Award,      titleKey: "home.trust.badge2_title", descKey: "home.trust.badge2_desc", titleFb: "Instaladores certificados", descFb: "Profesionales homologados con años de experiencia." },
  { icon: Headphones, titleKey: "home.trust.badge3_title", descKey: "home.trust.badge3_desc", titleFb: "Soporte real",              descFb: "Personas de verdad que te atienden por teléfono o WhatsApp." },
  { icon: Shield,     titleKey: "home.trust.badge4_title", descKey: "home.trust.badge4_desc", titleFb: "Garantía y factura",        descFb: "Garantía del fabricante + nuestra garantía de instalación." },
  { icon: CreditCard, titleKey: "home.trust.badge5_title", descKey: "home.trust.badge5_desc", titleFb: "Financiación",             descFb: "Paga en cómodos plazos. Hasta 12 meses sin intereses." },
];

export default function TrustBadges() {
  const { t } = useCmsTexts();
  return (
    <section className="py-20 md:py-28 bg-[#F0F4F8]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#00509E] text-sm font-semibold uppercase tracking-widest">{t("home.trust.label", "Tranquilidad total")}</span>
          <h2
            className="text-3xl md:text-4xl lg:text-[40px] font-bold text-[#003366] mt-3"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {t("home.trust.title", "Por qué elegirnos")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {BADGES.map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-[#00509E]/10 flex items-center justify-center mx-auto mb-4">
                <badge.icon className="w-7 h-7 text-[#00509E]" />
              </div>
              <h3 className="font-semibold text-[#003366] text-sm mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {t(badge.titleKey, badge.titleFb)}
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                {t(badge.descKey, badge.descFb)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}