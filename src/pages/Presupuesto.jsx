import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCmsTexts } from "@/components/cms/cmsHelpers";
import { Check, ArrowRight, ArrowLeft, Zap, Shield, MapPin, CheckCircle, Wind, Layers, Briefcase, Grid2x2, Waves, HelpCircle, Sunrise, Sunset, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TIPO_EQUIPO_OPTIONS = [
  { value: "Split Pared", label: "Split Pared", Icon: Wind },
  { value: "Multisplit", label: "Multisplit", Icon: Layers },
  { value: "Portátil", label: "Portátil", Icon: Briefcase },
  { value: "Cassette", label: "Cassette", Icon: Grid2x2 },
  { value: "Conductos", label: "Conductos", Icon: Waves },
  { value: "No lo sé, necesito asesoramiento", label: "No lo sé", Icon: HelpCircle },
];

const METROS_OPTIONS = [
  { value: "Menos de 20 m²", label: "< 20 m²" },
  { value: "20–35 m²", label: "20–35 m²" },
  { value: "35–50 m²", label: "35–50 m²" },
  { value: "50–70 m²", label: "50–70 m²" },
  { value: "Más de 70 m²", label: "+ 70 m²" },
];

const DISPONIBILIDAD_OPTIONS = [
  { value: "Mañanas (9:00–14:00)", label: "Mañanas", sublabel: "9:00 – 14:00", Icon: Sunrise },
  { value: "Tardes (14:00–19:00)", label: "Tardes", sublabel: "14:00 – 19:00", Icon: Sunset },
  { value: "Cualquier horario", label: "Cualquier horario", sublabel: "Me adapto", Icon: Clock },
];

export default function Presupuesto() {
  const navigate = useNavigate();
  const { t } = useCmsTexts();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
    tipo_equipo: "",
    metros_cuadrados: "",
    disponibilidad: "",
    mensaje: "",
    acepta: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canGoNext =
    form.nombre.trim() &&
    form.telefono.trim() &&
    form.tipo_equipo &&
    form.metros_cuadrados;

  const canSubmit =
    form.disponibilidad && form.acepta && !submitting;

  const TIPO_EQUIPO_OPTIONS = [
    { value: "Split Pared", label: t("presupuesto.option.type.split_pared", "Split Pared"), Icon: Wind },
    { value: "Multisplit", label: t("presupuesto.option.type.multisplit", "Multisplit"), Icon: Layers },
    { value: "Portatil", label: t("presupuesto.option.type.portatil", "Portatil"), Icon: Briefcase },
    { value: "Cassette", label: t("presupuesto.option.type.cassette", "Cassette"), Icon: Grid2x2 },
    { value: "Conductos", label: t("presupuesto.option.type.conductos", "Conductos"), Icon: Waves },
    { value: "No lo se, necesito asesoramiento", label: t("presupuesto.option.type.asesoramiento", "No lo se"), Icon: HelpCircle },
  ];

  const METROS_OPTIONS = [
    { value: "Menos de 20 m2", label: t("presupuesto.option.metros.rango1", "< 20 m2") },
    { value: "20-35 m2", label: t("presupuesto.option.metros.rango2", "20-35 m2") },
    { value: "35-50 m2", label: t("presupuesto.option.metros.rango3", "35-50 m2") },
    { value: "50-70 m2", label: t("presupuesto.option.metros.rango4", "50-70 m2") },
    { value: "Mas de 70 m2", label: t("presupuesto.option.metros.rango5", "+ 70 m2") },
  ];

  const DISPONIBILIDAD_OPTIONS = [
    {
      value: "Mananas (9:00-14:00)",
      label: t("presupuesto.option.disponibilidad.mananas", "Mananas"),
      sublabel: t("presupuesto.option.disponibilidad.mananas_sub", "9:00 - 14:00"),
      Icon: Sunrise,
    },
    {
      value: "Tardes (14:00-19:00)",
      label: t("presupuesto.option.disponibilidad.tardes", "Tardes"),
      sublabel: t("presupuesto.option.disponibilidad.tardes_sub", "14:00 - 19:00"),
      Icon: Sunset,
    },
    {
      value: "Cualquier horario",
      label: t("presupuesto.option.disponibilidad.cualquier", "Cualquier horario"),
      sublabel: t("presupuesto.option.disponibilidad.cualquier_sub", "Me adapto"),
      Icon: Clock,
    },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    const lead = {
      nombre: form.nombre,
      telefono: form.telefono,
      email: form.email || undefined,
      tipo_equipo: form.tipo_equipo,
      metros_cuadrados: form.metros_cuadrados,
      disponibilidad: form.disponibilidad,
      mensaje: form.mensaje || undefined,
      origen: "landing",
      estado: "nuevo",
    };
    await base44.entities.LeadLanding.create(lead);
    // Enviar email de notificación
    base44.functions.invoke("notifyLeadLanding", { lead }).catch(() => {});
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F4F8] px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#003366] mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {t("presupuesto.success.title", "¡Lo tenemos!")}
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            {t("presupuesto.success.subtitle", "Te llamamos en menos de 24h. Mientras tanto puedes explorar nuestros equipos.")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/Products" className="flex-1">
              <Button className="w-full bg-[#00509E] hover:bg-[#003366] text-white rounded-full font-semibold">
                {t("presupuesto.success.btn_products", "Ver productos")}
              </Button>
            </Link>
            <Link to="/" className="flex-1">
              <Button variant="outline" className="w-full rounded-full border-2 font-semibold">
                {t("presupuesto.success.btn_home", "Volver al inicio")}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* Hero */}
      <section
        className="relative py-16 md:py-24 flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(rgba(0, 30, 70, 0.80), rgba(0, 51, 102, 0.85)), url(https://media.base44.com/images/public/69c2969bc29b345481dd1048/3522c3b4b_generated_image.png) center/cover no-repeat`,
        }}
      >
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1
            className="text-white text-3xl md:text-5xl font-bold mb-4 leading-tight"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {t("presupuesto.hero.title", "Tu presupuesto gratis en 24h")}
          </h1>
          <p className="text-blue-100 text-lg md:text-xl mb-8">
            {t("presupuesto.hero.subtitle", "Cuentanos que necesitas y te llamamos sin compromiso")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              t("presupuesto.hero.badge1", "Sin compromiso"),
              t("presupuesto.hero.badge2", "Precio cerrado"),
              t("presupuesto.hero.badge3", "Tecnicos certificados"),
            ].map((badge) => (
              <span
                key={badge}
                className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full border border-white/20"
              >
                <Check className="w-3.5 h-3.5 text-green-300" /> {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Form card */}
      <div className="max-w-2xl mx-auto px-4 -mt-10 pb-12">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100">
            <div
              className="h-full bg-[#00509E] transition-all duration-500"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>

          <div className="px-6 md:px-10 pt-10 md:pt-12 pb-8 md:pb-10">
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-14 md:mb-16">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step >= s
                        ? "bg-[#00509E] text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  {s < 2 && (
                    <div className={`flex-1 h-0.5 transition-all ${step > s ? "bg-[#00509E]" : "bg-gray-100"}`} />
                  )}
                </React.Fragment>
              ))}
              <span className="text-sm text-gray-400 ml-2">
                {t("presupuesto.step.counter", "Paso {step} de 2").replace("{step}", String(step))}
              </span>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-xl font-bold text-[#003366] mb-6 mt-1 md:mt-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {t("presupuesto.step1.title", "¿Que necesitas?")}
                  </h2>

                  {/* Datos personales */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("presupuesto.step1.name_label", "Nombre completo *")}</label>
                      <Input
                        placeholder={t("presupuesto.step1.name_placeholder", "Tu nombre")}
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("presupuesto.step1.phone_label", "Telefono *")}</label>
                      <Input
                        type="tel"
                        placeholder={t("presupuesto.step1.phone_placeholder", "600 000 000")}
                        value={form.telefono}
                        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("presupuesto.step1.email_label", "Email")}</label>
                      <Input
                        type="email"
                        placeholder={t("presupuesto.step1.email_placeholder", "tucorreo@ejemplo.com")}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Tipo de equipo */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">{t("presupuesto.step1.type_label", "Tipo de equipo *")}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {TIPO_EQUIPO_OPTIONS.map(({ value, label, Icon }) => (
                       <button
                         key={value}
                         onClick={() => setForm({ ...form, tipo_equipo: value })}
                         className={`p-3 rounded-xl border-2 text-center transition-all ${
                           form.tipo_equipo === value
                             ? "border-[#00509E] bg-[#00509E]/5"
                             : "border-gray-200 hover:border-gray-300 bg-white"
                         }`}
                       >
                         <div className={`flex justify-center mb-2 ${form.tipo_equipo === value ? "text-[#00509E]" : "text-gray-400"}`}>
                           <Icon className="w-6 h-6" />
                         </div>
                         <p className="text-xs font-medium text-[#003366]">{label}</p>
                       </button>
                      ))}
                    </div>
                  </div>

                  {/* Metros */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">{t("presupuesto.step1.size_label", "Metros cuadrados *")}</label>
                    <div className="flex flex-wrap gap-2">
                      {METROS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setForm({ ...form, metros_cuadrados: opt.value })}
                          className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                            form.metros_cuadrados === opt.value
                              ? "border-[#00509E] bg-[#00509E] text-white"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canGoNext}
                    className="w-full bg-[#00509E] hover:bg-[#003366] text-white rounded-full h-12 font-semibold text-base shadow-lg disabled:opacity-50"
                  >
                    {t("presupuesto.step1.next", "Siguiente")} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-xl font-bold text-[#003366] mb-6 mt-1 md:mt-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {t("presupuesto.step2.title", "¿Cuando puedes?")}
                  </h2>

                  {/* Disponibilidad */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">{t("presupuesto.step2.availability_label", "Disponibilidad horaria *")}</label>
                    <div className="grid grid-cols-3 gap-3">
                      {DISPONIBILIDAD_OPTIONS.map(({ value, label, sublabel, Icon }) => (
                        <button
                          key={value}
                          onClick={() => setForm({ ...form, disponibilidad: value })}
                          className={`p-4 rounded-xl border-2 text-center transition-all ${
                            form.disponibilidad === value
                              ? "border-[#00509E] bg-[#00509E]/5"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div className={`flex justify-center mb-2 ${form.disponibilidad === value ? "text-[#00509E]" : "text-gray-400"}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-bold text-[#003366]">{label}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{sublabel}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mensaje */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("presupuesto.step2.message_label", "Mensaje adicional")}</label>
                    <Textarea
                      placeholder={t("presupuesto.step2.message_placeholder", "Cuentanos algo mas si quieres...")}
                      value={form.mensaje}
                      onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                      className="rounded-xl resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Privacidad */}
                  <div className="flex items-start gap-3 mb-8">
                    <input
                      type="checkbox"
                      id="acepta"
                      checked={form.acepta}
                      onChange={(e) => setForm({ ...form, acepta: e.target.checked })}
                      className="mt-1 w-4 h-4 accent-[#00509E] cursor-pointer"
                    />
                    <label htmlFor="acepta" className="text-sm text-gray-500 cursor-pointer leading-relaxed">
                      {t("presupuesto.step2.privacy_prefix", "Acepto la")}{" "}
                      <Link to="/ContentPage?key=privacy.rgpd" className="text-[#00509E] underline">
                        {t("presupuesto.step2.privacy_link", "politica de privacidad")}
                      </Link>{" "}
                      {t("presupuesto.step2.privacy_suffix", "y consiento el tratamiento de mis datos para recibir el presupuesto solicitado.")}
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="rounded-full px-6 border-2"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> {t("presupuesto.step2.back", "Atras")}
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className="flex-1 bg-[#FF6F61] hover:bg-[#e5574a] text-white rounded-full h-12 font-semibold text-base shadow-lg disabled:opacity-50"
                    >
                      {submitting ? t("presupuesto.step2.submitting", "Enviando...") : t("presupuesto.step2.submit", "Quiero mi presupuesto gratis →")}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Trust section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {[
            { icon: <Zap className="w-6 h-6 text-[#00509E]" />, title: t("presupuesto.trust.card1_title", "Respuesta en menos de 24h"), desc: t("presupuesto.trust.card1_desc", "Te contactamos rapido, sin esperas") },
            { icon: <Shield className="w-6 h-6 text-[#00509E]" />, title: t("presupuesto.trust.card2_title", "Garantia 3 anos"), desc: t("presupuesto.trust.card2_desc", "En equipo e instalacion") },
            { icon: <MapPin className="w-6 h-6 text-[#00509E]" />, title: t("presupuesto.trust.card3_title", "Instalamos en Madrid"), desc: t("presupuesto.trust.card3_desc", "Toda la Comunidad de Madrid") },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#00509E]/10 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="font-semibold text-[#003366] text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>{item.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
