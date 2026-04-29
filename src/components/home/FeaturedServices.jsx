import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeEntityList } from "@/lib/entity-list";

export default function FeaturedServices() {
  const { data: servicesData, isLoading } = useQuery({
    queryKey: ["featured-services"],
    queryFn: () => base44.entities.Service.filter({ active: true }, "sort_order", 6),
    initialData: [],
  });
  const services = normalizeEntityList(servicesData);

  if (!isLoading && services.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-[#F0F4F8]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12"
        >
          <div>
            <span className="text-[#00509E] text-sm font-semibold uppercase tracking-widest">Servicios</span>
            <h2
              className="text-3xl md:text-4xl lg:text-[40px] font-bold text-[#003366] mt-3"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              ¿Qué podemos hacer por ti?
            </h2>
          </div>
          <Link to={createPageUrl("Services")}>
            <Button variant="ghost" className="text-[#00509E] font-semibold mt-4 md:mt-0">
              Ver todos los servicios <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link to={createPageUrl("ServiceDetail") + `?slug=${service.slug}`} className="group block bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  {service.image_url ? (
                    <div className="h-44 overflow-hidden">
                      <img
                        src={service.image_url}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-44 bg-[#00509E]/10 flex items-center justify-center">
                      <Wrench className="w-12 h-12 text-[#00509E]/40" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-bold text-[#003366] text-lg mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {service.title}
                    </h3>
                    {service.short_description && (
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{service.short_description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {service.price ? (
                        <span className="font-bold text-[#00509E]">desde {service.price.toLocaleString("es-ES")} €</span>
                      ) : <span />}
                      <span className="text-xs text-[#00509E] font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        Ver servicio <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
