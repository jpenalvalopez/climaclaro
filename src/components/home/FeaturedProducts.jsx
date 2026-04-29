import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "../shared/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useCmsTexts } from "@/components/cms/cmsHelpers";
import { normalizeEntityList } from "@/lib/entity-list";

export default function FeaturedProducts() {
  const { t } = useCmsTexts();
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => base44.entities.Product.filter({ is_featured: true }, "-created_date", 8),
    initialData: [],
  });
  const products = normalizeEntityList(productsData);

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12"
        >
          <div>
            <span className="text-[#00509E] text-sm font-semibold uppercase tracking-widest">{t("home.featured.label", "Catálogo")}</span>
            <h2
              className="text-3xl md:text-4xl lg:text-[40px] font-bold text-[#003366] mt-3"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {t("home.featured.title", "Productos destacados")}
            </h2>
          </div>
          <Link to={createPageUrl("Products")}>
            <Button variant="ghost" className="text-[#00509E] font-semibold mt-4 md:mt-0">
              {t("home.featured.btn_catalog", "Ver todo el catálogo")} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden">
                <Skeleton className="aspect-square" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
