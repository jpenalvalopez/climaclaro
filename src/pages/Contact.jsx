import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, Clock, MapPin, MessageCircle, Check, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useCmsTexts } from "@/components/cms/cmsHelpers";

export default function Contact() {
  const { t } = useCmsTexts();
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: () => base44.entities.SiteSettings.list("updated_at", 1),
    select: d => d[0],
  });

  const phone = settings?.phone || "";
  const whatsapp = settings?.whatsapp || "";
  const email = settings?.email || "";
  const phoneHref = `tel:+${phone.replace(/\D/g, "")}`;
  const waHref = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await base44.entities.Lead.create({ ...form, source: "contact_form" });
    setSent(true);
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-[#F0F4F8] py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-[#00509E] text-sm font-semibold uppercase tracking-widest">{t("contact.header.label", "Contacto")}</span>
            <h1
              className="text-3xl md:text-4xl lg:text-[48px] font-bold text-[#003366] mt-3 mb-4"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {t("contact.header.title", "Hablemos")}
            </h1>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              {t("contact.header.subtitle", "Cuéntanos qué necesitas. Respondemos en menos de 24 horas.")}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-5 gap-12">
            {/* Contact info */}
            <div className="md:col-span-2 space-y-8">
              <div>
                <h3 className="font-semibold text-[#003366] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {t("contact.info.direct_title", "Contacto directo")}
                </h3>
                <div className="space-y-4">
                  {phone && <a href={phoneHref} className="flex items-center gap-3 text-gray-700 hover:text-[#00509E] transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-[#00509E]/10 flex items-center justify-center group-hover:bg-[#00509E]/20 transition-colors">
                      <Phone className="w-5 h-5 text-[#00509E]" />
                    </div>
                    <div>
                      <p className="font-medium">{phone}</p>
                      <p className="text-xs text-gray-500">{t("contact.info.phone_label", "Llamada gratuita")}</p>
                    </div>
                  </a>}
                  {whatsapp && <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-green-600 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp: {whatsapp}</p>
                      <p className="text-xs text-gray-500">{t("contact.info.wa_label", "Respuesta inmediata")}</p>
                    </div>
                  </a>}
                  {email && <a href={`mailto:${email}`} className="flex items-center gap-3 text-gray-700 hover:text-[#00509E] transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-[#00509E]/10 flex items-center justify-center group-hover:bg-[#00509E]/20 transition-colors">
                      <Mail className="w-5 h-5 text-[#00509E]" />
                    </div>
                    <div>
                      <p className="font-medium">{email}</p>
                      <p className="text-xs text-gray-500">Email</p>
                    </div>
                  </a>}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-[#003366] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {t("contact.info.schedule_title", "Horario")}
                </h3>
                <div className="flex items-start gap-3 text-gray-700">
                  <Clock className="w-5 h-5 text-[#00509E] mt-0.5" />
                  <div className="text-sm leading-relaxed whitespace-pre-line">
                    {t("contact.info.schedule", "Lunes a Viernes: 9:00 – 19:00\nSábados: 10:00 – 14:00\nDomingos y festivos: cerrado")}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-[#003366] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {t("contact.info.zones_title", "Zonas de servicio")}
                </h3>
                <div className="flex items-start gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-[#00509E] mt-0.5" />
                  <div className="text-sm leading-relaxed whitespace-pre-line">
                    {t("contact.info.zones", "Madrid y alrededores\nBarcelona y alrededores\nValencia y alrededores\nSevilla y alrededores\n¿Otra zona? Consúltanos.")}
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-3">
              <div className="bg-[#F0F4F8] rounded-2xl p-6 md:p-8">
                {sent ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-[#003366] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {t("contact.form.success_title", "¡Mensaje enviado!")}
                    </h3>
                    <p className="text-gray-600">{t("contact.form.success_subtitle", "Te contactaremos lo antes posible.")}</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="font-semibold text-[#003366] text-lg mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {t("contact.form.title", "Cuéntanos qué necesitas")}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input placeholder={t("contact.form.name_placeholder", "Tu nombre *")} required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="rounded-xl bg-white border-gray-200" />
                      <Input placeholder={t("contact.form.phone_placeholder", "Teléfono *")} required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="rounded-xl bg-white border-gray-200" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input type="email" placeholder={t("contact.form.email_placeholder", "Email")} value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-xl bg-white border-gray-200" />
                      <Input placeholder={t("contact.form.city_placeholder", "Ciudad")} value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="rounded-xl bg-white border-gray-200" />
                    </div>
                    <Textarea
                      placeholder={t("contact.form.message_placeholder", "¿Qué necesitas? (instalación, mantenimiento, asesoramiento...)")}
                      rows={4}
                      value={form.message}
                      onChange={e => setForm({...form, message: e.target.value})}
                      className="rounded-xl bg-white border-gray-200"
                    />
                    <Button
                      type="submit"
                      disabled={sending}
                      className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-[#00509E]/20 w-full sm:w-auto"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sending ? t("contact.form.sending", "Enviando...") : t("contact.form.submit", "Enviar mensaje")}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
