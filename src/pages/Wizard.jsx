import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Check, Home, Sun, MapPin, Square, Settings, Phone, Wifi, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WizardRecommendations from "@/components/wizard/WizardRecommendations";
import RoomConfigurator from "@/components/wizard/RoomConfigurator";
import RoomsProgress from "@/components/wizard/RoomsProgress";
import WizardScheduler from "@/components/wizard/WizardScheduler";
import { scoreProducts, getWizardSummary } from "@/components/wizard/wizardScoring";
import { useCmsTexts } from "@/components/cms/cmsHelpers";
import { format } from "date-fns";

const WIZARD_KEY = "home_wizard";
const ICON_MAP = { Home, Square, Sun, MapPin, Settings, Wifi, Phone };
function getIcon(name) { return ICON_MAP[name] || Settings; }

// IDs de pasos que solo aplican en modo single-room
const SINGLE_ONLY_STEPS = ["area", "sun"];
// IDs de pasos que solo se muestran DESPUÉS de configurar estancias (en multi)
const POST_ROOMS_STEPS = ["province", "exterior", "preferences"];

function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const existing = cart.find(i => i.product_id === product.id && i.item_type !== "service");
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({ item_type: "product", product_id: product.id, product_name: product.name, price: product.price, image_url: product.image_url, quantity: 1 });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

/**
 * Flujo del wizard:
 *
 * SINGLE (1 habitación):
 *   rooms → area → sun → province → exterior → preferences → result
 *
 * MULTI (2 o 3+ habitaciones):
 *   rooms → [rooms_config: configura cada habitación] → province → exterior → preferences → result
 */
export default function Wizard() {
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

  // phase: "pre_rooms" | "rooms_config" | "post_rooms" | "schedule" | "result"
  const [phase, setPhase] = useState("pre_rooms");
  const [scheduledDate, setScheduledDate] = useState(null);
  const [scheduledSlot, setScheduledSlot] = useState(null);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadError, setLeadError] = useState(null);
  const queryClient = useQueryClient();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [roomsData, setRoomsData] = useState([]);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", email: "" });
  const [leadSent, setLeadSent] = useState(false);
  const [cartFeedback, setCartFeedback] = useState(null);

  const { t } = useCmsTexts();

  const { data: wizardConfigs = [] } = useQuery({
    queryKey: ["wizard_config"],
    queryFn: () => base44.entities.Wizard.filter({ key: WIZARD_KEY, active: true })
  });
  const maxRecs = wizardConfigs[0]?.max_recommendations || 3;

  const { data: allSteps = [], isLoading: stepsLoading } = useQuery({
    queryKey: ["wizard_steps_active"],
    queryFn: () => base44.entities.WizardStep.filter({ wizard_key: WIZARD_KEY, active: true }, "order", 50)
  });

  const { data: allOptions = [] } = useQuery({
    queryKey: ["wizard_options_all"],
    queryFn: () => base44.entities.WizardOption.filter({ wizard_key: WIZARD_KEY, active: true }, "order", 200)
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products_for_wizard"],
    queryFn: () => base44.entities.Product.filter({ active: true }, "-is_featured", 100)
  });

  // ── Determinar si es multi-room ──
  const roomsAnswer = answers.rooms || "1";
  const isMultiRoom = parseInt(roomsAnswer, 10) >= 2;
  const targetRooms = isMultiRoom ? Math.max(2, parseInt(roomsAnswer, 10)) : 1;
  const maxRooms = parseInt(roomsAnswer, 10) >= 3 ? 6 : targetRooms;

  // ── Pasos según fase ──
  // pre_rooms: solo el paso "rooms" (y en single también area, sun)
  // post_rooms: province, exterior, preferences
  const preRoomsSteps = useMemo(() => {
    if (!allSteps.length) return [];
    if (isMultiRoom) {
      // Solo el paso "rooms" — en multi, area y sun se configuran por estancia
      return allSteps.filter(s => s.step_id === "rooms");
    } else {
      // Single: rooms + area + sun
      return allSteps.filter(s => ["rooms", "area", "sun"].includes(s.step_id));
    }
  }, [allSteps, isMultiRoom]);

  const postRoomsSteps = useMemo(() => {
    return allSteps.filter(s => POST_ROOMS_STEPS.includes(s.step_id));
  }, [allSteps]);

  // Pasos activos según la fase actual
  const currentSteps = phase === "pre_rooms" ? preRoomsSteps : postRoomsSteps;

  const step = currentSteps[stepIndex];

  const stepOptions = useMemo(() => {
    if (!step) return [];
    return allOptions.filter(o => o.step_id === step.step_id).sort((a, b) => a.order - b.order);
  }, [step, allOptions]);

  const selectedMulti = Array.isArray(answers[step?.step_id]) ? answers[step.step_id] : [];

  // Progreso visual
  const totalVisualSteps = preRoomsSteps.length + (isMultiRoom ? targetRooms : 0) + postRoomsSteps.length;
  const completedSteps =
    phase === "pre_rooms" ? stepIndex :
    phase === "rooms_config" ? preRoomsSteps.length + currentRoomIndex :
    phase === "post_rooms" ? preRoomsSteps.length + (isMultiRoom ? targetRooms : 0) + stepIndex :
    totalVisualSteps;
  const progress = totalVisualSteps > 0 ? (completedSteps / totalVisualSteps) * 100 : 0;

  // ── Answers finales para scoring ──
  const finalAnswers = useMemo(() => ({
    ...answers,
    rooms_data: roomsData.length > 0 ? roomsData : undefined,
  }), [answers, roomsData]);

  const recommendations = useMemo(() => {
    if (phase !== "result") return [];
    // Persist wizard answers for the energy calculator on the Products page
    try { localStorage.setItem("wizard_answers", JSON.stringify(finalAnswers)); } catch {}
    return scoreProducts(allProducts, finalAnswers, maxRecs);
  }, [phase, allProducts, finalAnswers, maxRecs]);

  const summary = useMemo(() =>
    phase === "result" ? getWizardSummary(finalAnswers) : null,
    [phase, finalAnswers]
  );

  // ── Selección de opción ──
  const selectOption = (value) => {
    if (!step) return;
    if (step.multi) {
      const cur = Array.isArray(answers[step.step_id]) ? answers[step.step_id] : [];
      const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
      setAnswers(a => ({ ...a, [step.step_id]: next }));
    } else {
      if (step.step_id === "rooms") {
        setRoomsData([]);
        setCurrentRoomIndex(0);
      }
      setAnswers(a => ({ ...a, [step.step_id]: String(value) }));

      // Calcular pasos y si es multi con el nuevo valor
      const newIsMulti = step.step_id === "rooms" ? parseInt(String(value), 10) >= 2 : isMultiRoom;
      const steps = (step.step_id === "rooms" && newIsMulti)
        ? allSteps.filter(s => s.step_id === "rooms")
        : (step.step_id === "rooms" && !newIsMulti)
          ? allSteps.filter(s => ["rooms", "area", "sun"].includes(s.step_id))
          : currentSteps;

      setTimeout(() => {
        if (stepIndex < steps.length - 1) {
          setStepIndex(s => s + 1);
        } else {
          // Último paso de la fase → transición de fase
          if (phase === "pre_rooms") {
            if (newIsMulti) {
              setCurrentRoomIndex(0);
              setPhase("rooms_config");
            } else {
              if (postRoomsSteps.length > 0) {
                setStepIndex(0);
                setPhase("post_rooms");
              } else {
                setPhase("result");
              }
            }
          } else if (phase === "post_rooms") {
            setPhase("schedule");
          }
        }
      }, 280);
    }
  };

  const canAdvance = step && (
    step.multi
      ? (selectedMulti.length > 0 || !step.required)
      : !!answers[step?.step_id]
  );

  // ── Siguiente paso / cambio de fase ──
  const handleNext = () => {
    if (stepIndex < currentSteps.length - 1) {
      setStepIndex(s => s + 1);
      return;
    }
    // Fin de la fase actual
    if (phase === "pre_rooms") {
      if (isMultiRoom) {
        // Pasar a configurar estancias
        setCurrentRoomIndex(0);
        setPhase("rooms_config");
      } else {
        // Single: si hay post-steps, ir a ellos; si no, resultado
        if (postRoomsSteps.length > 0) {
          setStepIndex(0);
          setPhase("post_rooms");
        } else {
          setPhase("result");
        }
      }
    } else if (phase === "post_rooms") {
      setPhase("schedule");
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(s => s - 1);
    } else if (phase === "schedule") {
      if (postRoomsSteps.length > 0) {
        setStepIndex(postRoomsSteps.length - 1);
        setPhase("post_rooms");
      } else if (isMultiRoom) {
        setPhase("rooms_config");
        setCurrentRoomIndex(targetRooms - 1);
      } else {
        setStepIndex(preRoomsSteps.length - 1);
        setPhase("pre_rooms");
      }
    } else if (phase === "post_rooms") {
      if (isMultiRoom) {
        setPhase("rooms_config");
        setCurrentRoomIndex(targetRooms - 1);
      } else {
        setStepIndex(preRoomsSteps.length - 1);
        setPhase("pre_rooms");
      }
    }
  };

  // ── Configurador de estancias ──
  const handleRoomComplete = (roomData) => {
    const newRooms = [...roomsData];
    newRooms[currentRoomIndex] = roomData;
    setRoomsData(newRooms);

    if (currentRoomIndex < targetRooms - 1) {
      setCurrentRoomIndex(i => i + 1);
    } else {
      // Todas las estancias configuradas → post_rooms → schedule
      if (postRoomsSteps.length > 0) {
        setStepIndex(0);
        setPhase("post_rooms");
      } else {
        setPhase("schedule");
      }
    }
  };

  const handleRoomBack = () => {
    if (currentRoomIndex > 0) {
      setCurrentRoomIndex(i => i - 1);
    } else {
      setStepIndex(0);
      setPhase("pre_rooms");
    }
  };

  const handleEditRoom = (idx) => {
    setCurrentRoomIndex(idx);
    setPhase("rooms_config");
  };

  // ── Añadir estancia extra (solo 3+) ──
  const handleAddRoom = () => {
    setCurrentRoomIndex(roomsData.length);
    setPhase("rooms_config");
  };

  // ── Submit lead ──
  const submitLead = async () => {
    setLeadSubmitting(true);
    setLeadError(null);
    try {
      const dateStr = scheduledDate ? format(scheduledDate, "yyyy-MM-dd") : null;

      // If a slot was chosen, validate it is still free (race-condition safe: fresh fetch)
      if (dateStr && scheduledSlot) {
        const freshReservas = await queryClient.fetchQuery({
          queryKey: ["reservas"],
          queryFn: () => base44.entities.ReservaInstalacion.list("-created_date", 500),
          staleTime: 0,
        });
        const taken = freshReservas.some(
          (r) => r.fecha === dateStr && r.franja === scheduledSlot && ["pendiente", "confirmada"].includes(r.estado)
        );
        if (taken) {
          setLeadError(`La franja "${scheduledSlot}" del ${dateStr} ya ha sido reservada. Por favor vuelve atrás y elige otra.`);
          setLeadSubmitting(false);
          return;
        }

        // Block the slot across all three calendars by creating a ReservaInstalacion
        await base44.entities.ReservaInstalacion.create({
          tipoServicio: "Visita técnica",
          fecha: dateStr,
          franja: scheduledSlot,
          nombre: leadForm.name,
          telefono: leadForm.phone,
          email: leadForm.email || "",
          direccion: "",
          codigoPostal: "",
          ciudad: "",
          tipoVivienda: "Piso",
          ascensor: "No lo sé",
          accesoExterior: "No lo sé",
          equipoComprado: "No",
          aceptaCondiciones: true,
          estado: "pendiente",
          comentarios: "Reserva generada desde el wizard de recomendación.",
        });

        // Invalidate shared cache so all three calendars refresh immediately
        queryClient.invalidateQueries({ queryKey: ["reservas"] });
        queryClient.invalidateQueries({ queryKey: ["reservas_ocupacion"] });
      }

      await base44.entities.Lead.create({
        name: leadForm.name,
        phone: leadForm.phone,
        email: leadForm.email || undefined,
        source: "wizard",
        wizard_data: {
          ...answers,
          ...(roomsData.length > 0 ? { rooms_data: roomsData } : {}),
        },
        ...(dateStr ? {
          scheduled_date: dateStr,
          scheduled_slot: scheduledSlot,
        } : {}),
      });

      // Guardar también en LeadLanding
      base44.entities.LeadLanding.create({
        nombre: leadForm.name,
        telefono: leadForm.phone,
        email: leadForm.email || undefined,
        origen: "wizard",
        estado: "nuevo",
      }).catch(() => {});

      setLeadSent(true);
    } catch (err) {
      setLeadError(err.message || "Error al enviar. Inténtalo de nuevo.");
    } finally {
      setLeadSubmitting(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    setCartFeedback(product.id);
    setTimeout(() => setCartFeedback(null), 1500);
  };

  // ── Loading ──
  if (stepsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4F8] via-white to-[#F0F4F8]">
        <div className="text-gray-400">Cargando wizard...</div>
      </div>
    );
  }

  const StepIcon = step ? getIcon(step.icon) : Settings;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4F8] via-white to-[#F0F4F8]">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-12 md:py-20">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {t("wizard.title", "Te ayudamos a elegir")}
          </h1>
          <p className="text-gray-500 mt-2">
            {t("wizard.subtitle", "Responde unas preguntas rápidas y te recomendamos el equipo ideal.")}
          </p>
        </div>

        {/* Barra de progreso global */}
        {phase !== "result" && phase !== "schedule" && (
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#00509E] rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            FASE: PRE_ROOMS y POST_ROOMS (pasos estándar)
        ═══════════════════════════════════════════════════ */}
        {(phase === "pre_rooms" || phase === "post_rooms") && step && (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${phase}-${stepIndex}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#00509E]/10 flex items-center justify-center">
                    <StepIcon className="w-5 h-5 text-[#00509E]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {step.question}
                  </h2>
                </div>

                <div className="grid gap-3">
                  {stepOptions.map(opt => {
                    const isSelected = step.multi
                      ? selectedMulti.includes(opt.value)
                      : answers[step.step_id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => selectOption(opt.value)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-[#00509E] bg-[#00509E]/5"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-[#003366]">{opt.label}</p>
                            {opt.desc && <p className="text-sm text-gray-500 mt-0.5">{opt.desc}</p>}
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-[#00509E] flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={phase === "pre_rooms" && stepIndex === 0}
                className="text-gray-500"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
              {step.multi && canAdvance && (
                <Button
                  onClick={handleNext}
                  className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-6"
                >
                  {phase === "pre_rooms" && stepIndex === currentSteps.length - 1
                    ? (isMultiRoom ? "Configurar estancias →" : "Ver resultado →")
                    : phase === "post_rooms" && stepIndex === currentSteps.length - 1
                      ? "Ver resultado →"
                      : "Siguiente"
                  }
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════
            FASE: CONFIGURAR ESTANCIAS
        ═══════════════════════════════════════════════════ */}
        {phase === "rooms_config" && (
          <>
            {/* Miniaturas de estancias completadas */}
            <RoomsProgress
              rooms={roomsData}
              currentIndex={currentRoomIndex}
              onEdit={handleEditRoom}
            />

            {/* Configurador de la estancia actual */}
            <AnimatePresence mode="wait">
              <RoomConfigurator
                key={`room-${currentRoomIndex}`}
                roomIndex={currentRoomIndex}
                totalRooms={Math.max(targetRooms, roomsData.length + (currentRoomIndex >= roomsData.length ? 1 : 0))}
                initial={roomsData[currentRoomIndex] || {}}
                onComplete={handleRoomComplete}
                onBack={handleRoomBack}
              />
            </AnimatePresence>

            {/* Botón añadir estancia extra (solo cuando ya completó las obligatorias y es 3+) */}
            {parseInt(roomsAnswer, 10) >= 3 &&
              roomsData.length >= targetRooms &&
              roomsData.length < maxRooms &&
              phase === "rooms_config" &&
              currentRoomIndex === roomsData.length && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={handleAddRoom}
                  className="border-[#00509E] text-[#00509E] rounded-full"
                >
                  + Añadir otra estancia
                </Button>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════
            FASE: SELECCIÓN DE FECHA
        ═══════════════════════════════════════════════════ */}
        {phase === "schedule" && (
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
            <WizardScheduler
              selectedDate={scheduledDate}
              selectedSlot={scheduledSlot}
              onChange={({ date, slot }) => {
                setScheduledDate(date);
                setScheduledSlot(slot);
              }}
            />
            <div className="flex justify-between mt-8">
              <Button variant="ghost" onClick={handleBack} className="text-gray-500">
                <ArrowLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
              <Button
                onClick={() => setPhase("result")}
                className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-6"
              >
                {scheduledDate && scheduledSlot ? "Ver mi recomendación →" : "Saltar este paso →"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════
            FASE: RESULTADO
        ═══════════════════════════════════════════════════ */}
        {phase === "result" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

            {/* Resumen de configuración */}
            {summary && (
              <div className="bg-[#00509E]/5 border border-[#00509E]/20 rounded-2xl p-4 mb-6">
                <p className="text-sm font-semibold text-[#003366] mb-2">Tu configuración</p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-3">
                  <span className="bg-white rounded-lg px-3 py-1.5 border border-gray-100">
                    {summary.roomCount === 1 ? "1 estancia" : `${summary.roomCount} estancias`}
                  </span>
                  <span className="bg-white rounded-lg px-3 py-1.5 border border-gray-100">
                    Solución: <strong>{summary.recommendation}</strong>
                  </span>
                </div>
                {roomsData.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {roomsData.map((r, i) => (
                      <div key={i} className="bg-white rounded-lg px-3 py-2 border border-gray-100 text-xs">
                        <p className="font-medium text-[#003366]">{r.name}</p>
                        <p className="text-gray-500">{r.area_m2} m² · {r.sun_exposure}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recomendaciones */}
            {recommendations.length > 0 && (
              <WizardRecommendations
                products={recommendations.map(p => ({ ...p, _cartAdded: cartFeedback === p.id }))}
                onAddToCart={handleAddToCart}
              />
            )}

            {/* Lead form */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 text-center mt-6">
              <div className="w-16 h-16 rounded-2xl bg-[#00509E]/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[#00509E]" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-[#003366] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {t("wizard.result.title", "¡Tenemos tu recomendación!")}
              </h2>
              <p className="text-gray-600 mb-4">
                {t("wizard.result.subtitle", "Déjanos tus datos y te asesoramos sin compromiso.")}
              </p>
              {scheduledDate && scheduledSlot && (
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm text-blue-800 mb-4">
                  <Calendar className="w-4 h-4 shrink-0" />
                  Cita provisional: <strong>{format(scheduledDate, "d MMM yyyy")} — {scheduledSlot}</strong>
                </div>
              )}

              {leadSent ? (
                <div className="bg-green-50 rounded-xl p-6">
                  <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-800">
                    {t("wizard.lead.success_message", "¡Gracias! Te contactaremos pronto.")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-w-sm mx-auto">
                  <Input
                    placeholder="Tu nombre *"
                    value={leadForm.name}
                    onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="Teléfono *"
                    value={leadForm.phone}
                    onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="Email (opcional)"
                    value={leadForm.email}
                    onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="rounded-xl"
                  />
                  {leadError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{leadError}</p>
                  )}
                  <Button
                    onClick={submitLead}
                    disabled={!leadForm.name || !leadForm.phone || leadSubmitting}
                    className="bg-[#FF6F61] hover:bg-[#e5574a] text-white rounded-full w-full h-12 font-semibold shadow-lg shadow-[#FF6F61]/20"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    {leadSubmitting ? "Enviando..." : t("wizard.lead.cta_submit", "Recibir mi recomendación")}
                  </Button>
                </div>
              )}

              <div className="mt-6">
                <Link to={createPageUrl("Products")}>
                  <Button variant="link" className="text-[#00509E]">
                    {t("wizard.catalog_link_label", "O explora el catálogo directamente →")}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}