import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, Star, Award, Users, Thermometer } from "lucide-react";
import { useCmsTexts } from "@/components/cms/cmsHelpers";

export default function About() {
  const { t } = useCmsTexts();

  const { data: reviews } = useQuery({
    queryKey: ["reviews-about"],
    queryFn: () => base44.entities.Review.list("-created_date", 4),
    initialData: [],
  });

  // Stats from CMS
  const stats = [
    { icon: Thermometer, valueKey: "about.stat1_value", labelKey: "about.stat1_label", valueFb: "+2.500", labelFb: "Instalaciones" },
    { icon: Users,       valueKey: "about.stat2_value", labelKey: "about.stat2_label", valueFb: "+1.800", labelFb: "Clientes satisfechos" },
    { icon: Award,       valueKey: "about.stat3_value", labelKey: "about.stat3_label", valueFb: "12",     labelFb: "Años de experiencia" },
    { icon: Star,        valueKey: "about.stat4_value", labelKey: "about.stat4_label", valueFb: "4.8/5",  labelFb: "Valoración media" },
  ];

  // Lists from CMS (each item separated by newline in CMS)
  const howWeWork = t("about.how_we_work_list",
    "Presupuesto cerrado y detallado antes de empezar\nInstaladores propios certificados (no subcontratas)\nMaterial de primera calidad (cobre, canaletas, soportes)\nProtección de suelos y muebles durante la instalación\nLimpieza total al terminar\nPuesta en marcha y explicación del equipo\nSoporte post-venta real (no un contestador)"
  ).split("\n").filter(Boolean);

  const installIncludes = t("about.install_includes_list",
    "Estudio previo del espacio y necesidades\nTubería de cobre de calidad con aislamiento\nCableado eléctrico independiente\nDesagüe correctamente canalizado\nSoporte antivibraciones para exterior\nVaciado y carga de gas refrigerante\nTest de rendimiento y estanqueidad"
  ).split("\n").filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#003366] to-[#00509E] text-white py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-80 h-80 rounded-full border-2 border-white" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full border-2 border-white" />
        </div>
        <div className="max-w-5xl mx-auto px-4 md:px-6 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1
              className="text-3xl md:text-4xl lg:text-[48px] font-bold leading-tight mb-6"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {t("about.hero.title", "Climatización profesional,\ntrato cercano").split("\n").map((line, i) => (
                <React.Fragment key={i}>{line}{i === 0 && <br />}</React.Fragment>
              ))}
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed">
              {t("about.hero.subtitle", "Somos un equipo de profesionales apasionados por hacer que tu hogar o negocio esté siempre a la temperatura perfecta. Sin complicaciones.")}
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
              >
                <stat.icon className="w-6 h-6 text-blue-200 mx-auto mb-2" />
                <p className="text-2xl md:text-3xl font-bold">{t(stat.valueKey, stat.valueFb)}</p>
                <p className="text-blue-200 text-xs mt-1">{t(stat.labelKey, stat.labelFb)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who we are */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2
              className="text-2xl md:text-3xl font-bold text-[#003366] mb-6"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {t("about.whoweare.title", "Quiénes somos")}
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4 text-base">
              {t("about.whoweare.body",
                "Nacimos con una idea clara: que comprar e instalar un aire acondicionado no tiene por qué ser un dolor de cabeza.\n\nEn ClimaClaro hemos simplificado todo el proceso. Te asesoramos para que elijas el equipo correcto, te damos un precio cerrado (sin letra pequeña) y nuestros instaladores certificados se encargan de que todo quede perfecto.\n\nTrabajamos con las mejores marcas del mercado y nuestro equipo técnico cuenta con más de 12 años de experiencia en climatización residencial y comercial."
              ).split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How we work */}
      <section className="py-16 md:py-24 bg-[#F0F4F8]">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2
                className="text-2xl md:text-3xl font-bold text-[#003366] mb-6"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {t("about.howwework.title", "Cómo trabajamos")}
              </h2>
              <ul className="space-y-3">
                {howWeWork.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-[#00509E] shrink-0 mt-0.5" /> {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <h2
                className="text-2xl md:text-3xl font-bold text-[#003366] mb-6"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {t("about.install.title", "Qué incluye una buena instalación")}
              </h2>
              <ul className="space-y-3">
                {installIncludes.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <h2
              className="text-2xl md:text-3xl font-bold text-[#003366] mb-8 text-center"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {t("about.reviews.title", "Lo que dicen de nosotros")}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#F0F4F8] rounded-2xl p-6"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {Array(5).fill(0).map((_, s) => (
                      <Star key={s} className={`w-4 h-4 ${s < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm mb-3">"{review.text}"</p>
                  <p className="font-semibold text-sm text-[#003366]">{review.author}{review.city ? ` · ${review.city}` : ""}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
