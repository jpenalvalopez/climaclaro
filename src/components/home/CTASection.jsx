import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useCmsTexts } from "@/components/cms/cmsHelpers";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function CTASection() {
  const { t } = useCmsTexts();
  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: () => base44.entities.SiteSettings.list("updated_at", 1),
    select: d => d[0],
  });
  const phone = settings?.phone || "900 000 000";
  const whatsapp = settings?.whatsapp || "34600000000";
  const phoneHref = `tel:+${phone.replace(/\D/g, "")}`;
  const waHref = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-[#00509E] to-[#003366] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2
            className="text-3xl md:text-4xl lg:text-[48px] font-bold text-white leading-tight mb-6"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {t("home.cta.title", "¿Tienes dudas? Te asesoramos en 2 minutos.")}
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-md mx-auto">
            {t("home.cta.subtitle", "Llámanos, escríbenos por WhatsApp o rellena el formulario. Respondemos siempre.")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={phoneHref}>
              <Button
                className="bg-white text-[#00509E] hover:bg-blue-50 rounded-full px-5 text-sm font-semibold w-full sm:w-auto"
              >
                <Phone className="w-4 h-4 mr-2" /> {t("home.cta.btn_call", "Llamar ahora")}
              </Button>
            </a>
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <Button
                className="bg-[#25D366] hover:bg-[#1fba58] text-white rounded-full px-5 text-sm font-semibold w-full sm:w-auto"
              >
                <MessageCircle className="w-4 h-4 mr-2" /> {t("home.cta.btn_whatsapp", "WhatsApp")}
              </Button>
            </a>
            <Link to={createPageUrl("Contact")}>
              <Button
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-full px-5 text-sm font-semibold w-full sm:w-auto"
              >
                {t("home.cta.btn_form", "Formulario")}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}