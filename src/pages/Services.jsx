import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import { useCmsTexts } from "@/components/cms/cmsHelpers";

export default function Services() {
  const { t } = useCmsTexts();
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services_active"],
    queryFn: () => base44.entities.Service.filter({ active: true }, "sort_order", 50)
  });

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#F0F4F8] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-[#00509E] text-sm font-semibold uppercase tracking-widest">{t("services.header.label", "Servicios")}</span>
            <h1 className="text-3xl md:text-4xl lg:text-[48px] font-bold text-[#003366] mt-3 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {t("services.header.title", "Todo lo que necesitas, resuelto")}
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {t("services.header.subtitle", "Desde la instalación hasta el mantenimiento. Profesionales certificados, precios claros y sin sorpresas.")}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-8">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)
          ) : services.length === 0 ? (
            <p className="text-center text-gray-400 py-20">No hay servicios disponibles por el momento.</p>
          ) : services.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {service.image_url && (
                  <img src={service.image_url} alt={service.title} className="w-24 h-24 object-cover rounded-xl shrink-0" />
                )}
                {!service.image_url && (
                  <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Wrench className="w-7 h-7" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                    <h3 className="text-xl font-bold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {service.title}
                    </h3>
                    <span className="text-lg font-bold text-[#00509E] whitespace-nowrap">
                      {service.price ? `Desde ${service.price.toLocaleString("es-ES")} €` : "Consultar precio"}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{service.short_description}</p>

                  {(service.includes?.length > 0 || service.excludes?.length > 0) && (
                    <div className="grid md:grid-cols-2 gap-4 mb-5">
                      {service.includes?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Qué incluye</p>
                          <ul className="space-y-1.5">
                            {service.includes.slice(0, 4).map((item, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {service.excludes?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">Qué NO incluye</p>
                          <ul className="space-y-1.5">
                            {service.excludes.slice(0, 3).map((item, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-gray-500">
                                <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <Link to={createPageUrl("ServiceDetail") + `?slug=${service.slug}`}>
                    <Button className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full">
                      Ver detalle y reservar <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}