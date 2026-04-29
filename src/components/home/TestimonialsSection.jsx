import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useCmsTexts } from "@/components/cms/cmsHelpers";
import { normalizeEntityList } from "@/lib/entity-list";

export default function TestimonialsSection() {
  const { t } = useCmsTexts();
  const { data: reviewsData } = useQuery({
    queryKey: ["reviews-home"],
    queryFn: () => base44.entities.Review.list("-created_date", 6),
    initialData: [],
  });
  const reviews = normalizeEntityList(reviewsData);

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#00509E] text-sm font-semibold uppercase tracking-widest">{t("home.testimonials.label", "Opiniones")}</span>
          <h2
            className="text-3xl md:text-4xl lg:text-[40px] font-bold text-[#003366] mt-3"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {t("home.testimonials.title", "Lo que dicen nuestros clientes")}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#F0F4F8] rounded-2xl p-6 relative"
            >
              <Quote className="w-8 h-8 text-[#00509E]/15 absolute top-4 right-4" />
              <div className="flex items-center gap-1 mb-3">
                {Array(5).fill(0).map((_, s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">"{review.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#00509E]/10 flex items-center justify-center text-[#00509E] font-bold text-sm">
                  {review.author?.[0]?.toUpperCase() || "A"}
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#003366]">{review.author}</p>
                  {review.city && <p className="text-xs text-gray-500">{review.city}</p>}
                </div>
                {review.verified && (
                  <span className="ml-auto text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                    Verificado
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
