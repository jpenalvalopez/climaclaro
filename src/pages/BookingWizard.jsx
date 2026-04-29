import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, ArrowLeft, ArrowRight, CheckCircle, Wrench, Settings, Search, FileText, Hammer, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import UbicacionStep from "@/components/reservar/UbicacionStep";
import FechaStep from "@/components/reservar/FechaStep";
import ContactoStep from "@/components/reservar/ContactoStep";

const WIZARD_KEY = "booking_wizard";
const SPECIAL_STEP_IDS = ["ubicacion", "fecha", "contacto"];

const CARD_COLORS = ["bg-blue-500", "bg-green-500", "bg-orange-500", "bg-purple-500", "bg-teal-500", "bg-rose-500"];

const SERVICE_ICON_MAP = {
  "Instalación Split 1x1": { icon: Wrench, color: "bg-blue-500" },
  "Instalación Multisplit": { icon: Zap, color: "bg-green-500" },
  "Mantenimiento/Limpieza": { icon: Settings, color: "bg-green-500" },
  "Visita técnica": { icon: FileText, color: "bg-purple-500" },
  instalacion: { icon: Wrench, color: "bg-blue-500" },
  mantenimiento: { icon: Settings, color: "bg-green-500" },
  reparacion: { icon: Hammer, color: "bg-orange-500" },
  visita: { icon: FileText, color: "bg-purple-500" },
};

const ICON_MAP = { Wrench, Settings, Search, FileText, Hammer, Zap };
function getIcon(name) { return ICON_MAP[name] || Wrench; }

const STEP_LABELS = {
  servicio: "Servicio",
  ubicacion: "Ubicación",
  fecha: "Fecha/Hora",
  contacto: "Contacto",
};
const formatLabel = (sid) =>
  STEP_LABELS[sid] || (sid.charAt(0).toUpperCase() + sid.slice(1).replace(/_/g, " "));

export default function BookingWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  // Pre-fill from user profile
  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u) return;
      setAnswers(prev => ({
        ...prev,
        contacto: {
          nombre: u.full_name || "",
          telefono: u.phone || "",
          email: u.email || "",
          aceptaCondiciones: false,
          ...prev.contacto,
        },
        ubicacion: {
          direccion: u.address || "",
          codigoPostal: u.postal_code || "",
          ciudad: u.city || "",
          tipoVivienda: u.tipo_vivienda || "",
          plantaAltura: u.planta || "",
          ascensor: u.ascensor || "",
          accesoExterior: u.acceso_exterior || "",
          ...prev.ubicacion,
        },
      }));
    }).catch(() => {});
  }, []);

  const { data: wizardConfig = [] } = useQuery({
    queryKey: ["booking_wizard_config"],
    queryFn: () => base44.entities.Wizard.filter({ key: WIZARD_KEY, active: true }),
  });

  const { data: steps = [], isLoading } = useQuery({
    queryKey: ["booking_wizard_steps"],
    queryFn: () => base44.entities.WizardStep.filter({ wizard_key: WIZARD_KEY, active: true }, "order", 50),
  });

  const { data: allOptions = [] } = useQuery({
    queryKey: ["booking_wizard_options"],
    queryFn: () => base44.entities.WizardOption.filter({ wizard_key: WIZARD_KEY, active: true }, "order", 200),
  });

  const { data: reservas = [] } = useQuery({
    queryKey: ["reservas"],
    queryFn: () => base44.entities.ReservaInstalacion.list("-created_date", 500),
  });

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const isSpecial = step && SPECIAL_STEP_IDS.includes(step.step_id);
  const StepIcon = step ? getIcon(step.icon) : Wrench;

  const stepOptions = useMemo(() => {
    if (!step) return [];
    return allOptions.filter((o) => o.step_id === step.step_id);
  }, [step, allOptions]);

  const progress = steps.length > 0 ? Math.round(((stepIndex + 1) / steps.length) * 100) : 0;

  const canAdvance = useMemo(() => {
    if (!step) return false;
    if (step.step_id === "ubicacion") {
      const u = answers.ubicacion || {};
      return !!(u.direccion && u.codigoPostal && u.ciudad && u.tipoVivienda && u.ascensor && u.accesoExterior);
    }
    if (step.step_id === "fecha") {
      const f = answers.fecha || {};
      return !!(f.date && f.franja);
    }
    if (step.step_id === "contacto") {
      const c = answers.contacto || {};
      return !!(c.nombre && c.telefono && c.email && c.aceptaCondiciones);
    }
    if (step.required !== false) return !!answers[step.step_id];
    return true;
  }, [step, answers]);

  const selectOption = (value) => {
    setAnswers((a) => ({ ...a, [step.step_id]: value }));
    if (!step.multi && !isLastStep) {
      setTimeout(() => setStepIndex((s) => s + 1), 280);
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const f = answers.fecha || {};
      const c = answers.contacto || {};
      const u = answers.ubicacion || {};
      const dateStr = format(f.date, "yyyy-MM-dd");

      // Re-fetch fresh availability right before writing to avoid race conditions
      const freshReservas = await queryClient.fetchQuery({
        queryKey: ["reservas"],
        queryFn: () => base44.entities.ReservaInstalacion.list("-created_date", 500),
        staleTime: 0,
      });
      const franjaOcupada = freshReservas.some(
        (r) => r.fecha === dateStr && r.franja === f.franja && ["pendiente", "confirmada"].includes(r.estado)
      );
      if (franjaOcupada) throw new Error(`La franja "${f.franja}" del ${dateStr} ya está ocupada. Por favor elige otra fecha u otra franja.`);

      const reserva = await base44.entities.ReservaInstalacion.create({
        tipoServicio: answers.servicio,
        fecha: dateStr,
        franja: f.franja,
        nombre: c.nombre,
        telefono: c.telefono,
        email: c.email,
        direccion: u.direccion,
        codigoPostal: u.codigoPostal,
        ciudad: u.ciudad,
        tipoVivienda: u.tipoVivienda,
        plantaAltura: u.plantaAltura,
        ascensor: u.ascensor,
        accesoExterior: u.accesoExterior,
        equipoComprado: "No",
        aceptaCondiciones: true,
        estado: "pendiente",
      });

      base44.functions
        .invoke("enviarReservaAClimaplan", { reserva: { ...reserva, fecha: dateStr } })
        .catch(() => {});
      return reserva;
    },
    onSuccess: () => {
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err) => alert(err.message || "Error al enviar la reserva."),
  });

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]">
        <div className="text-gray-400">Cargando...</div>
      </div>
    );

  if (steps.length === 0)
    return (
      <div className="min-h-screen bg-[#F0F4F8]">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#00509E] flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2
              className="text-xl md:text-2xl font-bold text-[#003366] mb-2"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Configura el asistente de reserva
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              No hay pasos activos para el wizard de reserva. Conecta la app con Base44 mediante
              <span className="font-mono text-sm text-[#003366]"> .env.local </span>
              o crea pasos activos para
              <span className="font-mono text-sm text-[#003366]"> booking_wizard </span>
              en el panel de administración.
            </p>
            <Link to={createPageUrl("Admin")}>
              <Button className="mt-6 bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-6">
                Ir al panel admin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );

  if (success) {
    const f = answers.fecha || {};
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-lg text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2
            className="text-2xl font-bold text-[#003366] mb-3"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            ¡Reserva enviada!
          </h2>
          <p className="text-gray-600 mb-6">
            Te confirmamos por WhatsApp o email en menos de 24h laborables.
            {f.date && (
              <>
                <br />
                <strong className="text-[#00509E]">
                  Fecha: {format(f.date, "d 'de' MMMM, yyyy", { locale: es })}
                </strong>
                <br />
              </>
            )}
            {f.franja && `Franja: ${f.franja}`}
          </p>
          <Link to={createPageUrl("Home")}>
            <Button className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-8">
              Volver al inicio
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const config = wizardConfig[0] || {};

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-14">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold text-[#003366]"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {config.title || "Reserva tu instalación"}
          </h1>
          {config.subtitle && (
            <p className="text-gray-500 mt-2 text-sm">{config.subtitle}</p>
          )}
        </div>

        {/* Progress card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-[#003366]">
              Paso {stepIndex + 1} de {steps.length}
            </span>
            <span className="text-gray-500">{progress}% completado</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-[#00509E] rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div
            className="grid text-xs text-center gap-1"
            style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
          >
            {steps.map((s, i) => (
              <span
                key={s.step_id}
                className={`font-medium truncate ${
                  i === stepIndex
                    ? "text-[#00509E]"
                    : i < stepIndex
                    ? "text-gray-600"
                    : "text-gray-400"
                }`}
              >
                {formatLabel(s.step_id)}
              </span>
            ))}
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-2xl shadow-sm p-6 md:p-8"
          >
            {step && (
              <>
                <h2
                  className="text-xl md:text-2xl font-bold text-[#003366] mb-1"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {step.question}
                </h2>

                {/* Option cards */}
                {!isSpecial && stepOptions.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    {stepOptions.map((opt, idx) => {
                      const iconInfo = SERVICE_ICON_MAP[opt.value] || {
                        icon: StepIcon,
                        color: CARD_COLORS[idx % CARD_COLORS.length],
                      };
                      const OptIcon = iconInfo.icon;
                      const isSelected = answers[step.step_id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => selectOption(opt.value)}
                          className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? "border-[#00509E] bg-blue-50 shadow-sm"
                              : "border-gray-100 hover:border-gray-300 bg-white shadow-sm"
                          }`}
                        >
                          <div
                            className={`w-12 h-12 rounded-xl ${iconInfo.color} flex items-center justify-center shrink-0`}
                          >
                            <OptIcon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#003366] text-sm">{opt.label}</p>
                            {opt.desc && (
                              <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="w-5 h-5 text-[#00509E] shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Special steps */}
                {step.step_id === "ubicacion" && (
                  <UbicacionStep
                    value={answers.ubicacion || {}}
                    onChange={(v) => setAnswers((a) => ({ ...a, ubicacion: v }))}
                  />
                )}
                {step.step_id === "fecha" && (
                  <FechaStep
                    value={answers.fecha || {}}
                    onChange={(v) => setAnswers((a) => ({ ...a, fecha: v }))}
                    reservas={reservas}
                  />
                )}
                {step.step_id === "contacto" && (
                  <ContactoStep
                    value={answers.contacto || {}}
                    onChange={(v) => setAnswers((a) => ({ ...a, contacto: v }))}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => setStepIndex((s) => s - 1)}
            disabled={stepIndex === 0}
            className="text-gray-500"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          <Button
            onClick={() =>
              isLastStep ? submitMutation.mutate() : setStepIndex((s) => s + 1)
            }
            disabled={!canAdvance || submitMutation.isPending}
            className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-6"
          >
            {submitMutation.isPending
              ? "Enviando..."
              : isLastStep
              ? "Confirmar reserva"
              : "Siguiente"}
            {!isLastStep && <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
