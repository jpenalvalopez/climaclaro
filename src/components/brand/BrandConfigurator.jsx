import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { scoreProducts } from "@/components/wizard/wizardScoring";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Zap, Wifi, Volume2, Ruler, ChevronDown, ChevronUp, ArrowLeft, ArrowRight, Check, Settings, Home, Square, Sun, MapPin } from "lucide-react";
import RoomConfigurator from "@/components/wizard/RoomConfigurator";
import RoomsProgress from "@/components/wizard/RoomsProgress";

const BRAND_WIZARD_KEY = "brand_wizard";
const COLORS = { primary: "#00509E", dark: "#003366", light: "#EFF6FF" };

const ICON_MAP = { Home, Square, Sun, MapPin, Settings, Zap, Wifi };
function getIcon(name) {return ICON_MAP[name] || Settings;}

const SINGLE_ONLY_STEPS = ["area", "sun"];
const POST_ROOMS_STEPS = ["province", "exterior", "preferences"];

const ENERGY_COLORS = {
  "A+++": "bg-green-600 text-white",
  "A++": "bg-green-500 text-white",
  "A+": "bg-green-400 text-white",
  "A": "bg-lime-400 text-white",
  "B": "bg-yellow-400 text-gray-900",
  "C": "bg-orange-400 text-white"
};

const trimName = (name) => name?.split("—")[0].trim();

function MiniProductCard({ product }) {
  const [expanded, setExpanded] = useState(false);
  const noiseSpec = product.specs?.find((s) => s.label === "Nivel sonoro interior");
  const noiseVal = noiseSpec?.value || (product.noise_db ? `${product.noise_db} dB` : null);
  const energyColor = ENERGY_COLORS[product.energy_rating] || "bg-gray-200 text-gray-700";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-white border-b border-gray-100 flex items-center justify-center overflow-hidden">
        {product.image_url ?
        <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-6" /> :
        <Zap className="w-12 h-12 text-gray-300" />}
        {product.energy_rating &&
        <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full ${energyColor}`}>
            {product.energy_rating}
          </span>
        }
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h4 className="font-semibold text-[#003366] text-sm mb-2 line-clamp-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {trimName(product.name)}
        </h4>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {product.power_kw &&
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-medium">
              <Zap className="w-2.5 h-2.5" /> {product.power_kw} kW
            </span>
          }
          {(product.area_min_m2 || product.area_max_m2) &&
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
              <Ruler className="w-2.5 h-2.5" /> {product.area_min_m2}–{product.area_max_m2} m²
            </span>
          }
          {noiseVal &&
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
              <Volume2 className="w-2.5 h-2.5" /> {noiseVal}
            </span>
          }
          {product.has_wifi &&
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-medium">
              <Wifi className="w-2.5 h-2.5" /> WiFi
            </span>
          }
        </div>

        {product.specs?.length > 0 &&
        <div className="mb-3">
            <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1 text-xs text-[#00509E] font-medium hover:underline">
              Ficha técnica {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <AnimatePresence>
              {expanded &&
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2">
                  <div className="space-y-1 text-xs">
                    {product.specs.map((s, i) =>
                <div key={i} className={`flex justify-between py-1 px-2 rounded ${i % 2 === 0 ? "bg-gray-50" : ""}`}>
                        <span className="text-gray-500">{s.label}</span>
                        <span className="font-medium text-[#333] text-right ml-2">{s.value}</span>
                      </div>
                )}
                  </div>
                </motion.div>
            }
            </AnimatePresence>
          </div>
        }

        <div className="mt-auto pt-2">
          {product.sale_price ?
          <div className="mb-3">
              <span className="text-base font-bold text-[#CC0000]">{product.sale_price.toFixed(2)} €</span>
              <span className="text-xs text-gray-400 line-through ml-2">PVPR {product.price?.toFixed(2)} €</span>
            </div> :
          product.price > 0 ?
          <p className="text-base font-bold text-[#003366] mb-3">{product.price?.toFixed(2)} €</p> :
          null}
          <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`} className="block">
            <Button size="sm" style={{ backgroundColor: COLORS.primary }} className="w-full text-white rounded-full text-xs">
              Ver ficha completa
            </Button>
          </Link>
        </div>
      </div>
    </div>);

}

export default function BrandConfigurator({ products, brandName, brandData }) {
  const [open, setOpen] = useState(false);

  // phase: "pre_rooms" | "rooms_config" | "post_rooms" | "result"
  const [phase, setPhase] = useState("pre_rooms");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [roomsData, setRoomsData] = useState([]);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [results, setResults] = useState(null);

  // Fetch wizard config
  const { data: wizardConfigs = [] } = useQuery({
    queryKey: ["wizard_config", BRAND_WIZARD_KEY],
    queryFn: () => base44.entities.Wizard.filter({ key: BRAND_WIZARD_KEY, active: true })
  });
  const wizardConfig = wizardConfigs[0];
  const maxRecs = wizardConfig?.max_recommendations || 4;

  const { data: allSteps = [], isLoading: stepsLoading } = useQuery({
    queryKey: ["wizard_steps_active", BRAND_WIZARD_KEY],
    queryFn: () => base44.entities.WizardStep.filter({ wizard_key: BRAND_WIZARD_KEY, active: true }, "order", 50)
  });

  const { data: allOptions = [] } = useQuery({
    queryKey: ["wizard_options_all", BRAND_WIZARD_KEY],
    queryFn: () => base44.entities.WizardOption.filter({ wizard_key: BRAND_WIZARD_KEY, active: true }, "order", 200)
  });

  // ── Multi-room logic ──
  const roomsAnswer = answers.rooms || "1";
  const isMultiRoom = parseInt(roomsAnswer, 10) >= 2;
  const targetRooms = isMultiRoom ? Math.max(2, parseInt(roomsAnswer, 10)) : 1;

  // ── Step groups ──
  const preRoomsSteps = useMemo(() => {
    if (!allSteps.length) return [];
    if (isMultiRoom) {
      return allSteps.filter((s) => s.step_id === "rooms");
    } else {
      return allSteps.filter((s) => ["rooms", "area", "sun"].includes(s.step_id));
    }
  }, [allSteps, isMultiRoom]);

  const postRoomsSteps = useMemo(() => {
    return allSteps.filter((s) => POST_ROOMS_STEPS.includes(s.step_id));
  }, [allSteps]);

  const currentSteps = phase === "pre_rooms" ? preRoomsSteps : postRoomsSteps;
  const currentStep = currentSteps[stepIndex];

  const stepOptions = useMemo(() => {
    if (!currentStep) return [];
    return allOptions.filter((o) => o.step_id === currentStep.step_id).sort((a, b) => a.order - b.order);
  }, [currentStep, allOptions]);

  const selectedMulti = Array.isArray(answers[currentStep?.step_id]) ? answers[currentStep.step_id] : [];

  // ── Select option ──
  const selectOption = (value) => {
    if (!currentStep) return;
    if (currentStep.multi) {
      const cur = Array.isArray(answers[currentStep.step_id]) ? answers[currentStep.step_id] : [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      setAnswers((a) => ({ ...a, [currentStep.step_id]: next }));
    } else {
      if (currentStep.step_id === "rooms") {
        setRoomsData([]);
        setCurrentRoomIndex(0);
      }
      const newAnswers = { ...answers, [currentStep.step_id]: String(value) };
      setAnswers(newAnswers);

      const newIsMulti = currentStep.step_id === "rooms" ? parseInt(String(value), 10) >= 2 : isMultiRoom;
      const steps = currentStep.step_id === "rooms" && newIsMulti ?
      allSteps.filter((s) => s.step_id === "rooms") :
      currentStep.step_id === "rooms" && !newIsMulti ?
      allSteps.filter((s) => ["rooms", "area", "sun"].includes(s.step_id)) :
      currentSteps;

      setTimeout(() => {
        if (stepIndex < steps.length - 1) {
          setStepIndex((s) => s + 1);
        } else {
          if (phase === "pre_rooms") {
            if (newIsMulti) {
              setCurrentRoomIndex(0);
              setPhase("rooms_config");
            } else {
              if (postRoomsSteps.length > 0) {
                setStepIndex(0);
                setPhase("post_rooms");
              } else {
                finish(newAnswers, []);
              }
            }
          } else if (phase === "post_rooms") {
            finish(newAnswers, roomsData);
          }
        }
      }, 280);
    }
  };

  const canAdvance = currentStep && (
  currentStep.multi ?
  selectedMulti.length > 0 || !currentStep.required :
  !!answers[currentStep?.step_id]);


  const handleNext = () => {
    if (stepIndex < currentSteps.length - 1) {
      setStepIndex((s) => s + 1);
      return;
    }
    if (phase === "pre_rooms") {
      if (isMultiRoom) {
        setCurrentRoomIndex(0);
        setPhase("rooms_config");
      } else {
        if (postRoomsSteps.length > 0) {
          setStepIndex(0);
          setPhase("post_rooms");
        } else {
          finish(answers, []);
        }
      }
    } else if (phase === "post_rooms") {
      finish(answers, roomsData);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex((s) => s - 1);
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

  // ── Room configurator callbacks ──
  const handleRoomComplete = (roomData) => {
    const newRooms = [...roomsData];
    newRooms[currentRoomIndex] = roomData;
    setRoomsData(newRooms);

    if (currentRoomIndex < targetRooms - 1) {
      setCurrentRoomIndex((i) => i + 1);
    } else {
      if (postRoomsSteps.length > 0) {
        setStepIndex(0);
        setPhase("post_rooms");
      } else {
        finish(answers, newRooms);
      }
    }
  };

  const handleRoomBack = () => {
    if (currentRoomIndex > 0) {
      setCurrentRoomIndex((i) => i - 1);
    } else {
      setStepIndex(0);
      setPhase("pre_rooms");
    }
  };

  const handleEditRoom = (idx) => {
    setCurrentRoomIndex(idx);
    setPhase("rooms_config");
  };

  const finish = (finalAnswers, finalRooms) => {
    const fa = { ...finalAnswers, rooms_data: finalRooms?.length > 0 ? finalRooms : undefined };
    const recs = scoreProducts(products, fa, maxRecs);
    setResults(recs);
    setPhase("result");
  };

  const reset = () => {
    setPhase("pre_rooms");
    setStepIndex(0);
    setAnswers({});
    setRoomsData([]);
    setCurrentRoomIndex(0);
    setResults(null);
    setOpen(false);
  };

  // Texts from brandData or fallback
  const configTitle = brandData?.configurator_title || wizardConfig?.title || "¿Qué equipo necesitas?";
  const configSubtitle = brandData?.configurator_subtitle || wizardConfig?.subtitle || "Responde unas preguntas y te recomendamos el producto ideal.";
  const configHint1 = brandData?.configurator_hint1 || "";
  const configHint2 = brandData?.configurator_hint2 || "";

  const StepIcon = currentStep ? getIcon(currentStep.icon) : Settings;

  if (!stepsLoading && allSteps.length === 0) return null;

  return (
    <section className="bg-[#F0F4F8] md:py-20">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <p className="text-[#00509E] mb-3 text-base font-bold uppercase tracking-widest">
          CONFIGURADOR {brandName?.toUpperCase()}
        </p>
        <h2 className="text-2xl md:text-4xl font-bold text-[#003366] mb-4 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {configTitle}
        </h2>
        <p className="text-gray-500 text-base mb-2 leading-relaxed">{configSubtitle}</p>
        {configHint1 && <p className="text-[#00509E] text-sm mb-1">{configHint1}</p>}
        {configHint2 && <p className="text-[#00509E] text-sm mb-8">{configHint2}</p>}
        {!configHint1 && !configHint2 && <div className="mb-8" />}

        {!open && phase === "pre_rooms" && !results &&
        <Button
          onClick={() => setOpen(true)}
          style={{ backgroundColor: COLORS.primary }}
          className="text-white rounded-full px-10 h-12 text-sm font-bold uppercase tracking-wider shadow-lg">
          
            Comenzar
          </Button>
        }

        {open && phase !== "result" &&
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 md:p-8 text-left">

            {/* ── PRE_ROOMS / POST_ROOMS steps ── */}
            {(phase === "pre_rooms" || phase === "post_rooms") && currentStep &&
          <AnimatePresence mode="wait">
                <motion.div
              key={`${phase}-${stepIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}>
              
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLORS.primary}20` }}>
                      <StepIcon className="w-5 h-5" style={{ color: COLORS.primary }} />
                    </div>
                    <h3 className="text-lg font-bold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {currentStep.question}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {stepOptions.map((opt) => {
                  const isSelected = currentStep.multi ?
                  selectedMulti.includes(opt.value) :
                  answers[currentStep.step_id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => selectOption(opt.value)}
                      className="p-4 rounded-xl border-2 text-left transition-all"
                      style={isSelected ?
                      { borderColor: COLORS.primary, backgroundColor: COLORS.light } :
                      { borderColor: "#e5e7eb", backgroundColor: "white" }}>
                      
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-[#003366] text-sm">{opt.label}</p>
                              {opt.desc && <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>}
                            </div>
                            {isSelected && <Check className="w-4 h-4" style={{ color: COLORS.primary }} />}
                          </div>
                        </button>);

                })}
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <button
                  onClick={() => phase === "pre_rooms" && stepIndex === 0 ? reset() : handleBack()}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
                  
                      <ArrowLeft className="w-4 h-4" />
                      {phase === "pre_rooms" && stepIndex === 0 ? "Cancelar" : "Anterior"}
                    </button>
                    {currentStep.multi && canAdvance &&
                <Button
                  onClick={handleNext}
                  style={{ backgroundColor: COLORS.primary }}
                  className="text-white rounded-full px-6">
                  
                        {phase === "post_rooms" && stepIndex === currentSteps.length - 1 ?
                  "Ver resultados" :
                  "Siguiente"
                  }
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                }
                  </div>
                </motion.div>
              </AnimatePresence>
          }

            {/* ── ROOMS CONFIG ── */}
            {phase === "rooms_config" &&
          <>
                <RoomsProgress
              rooms={roomsData}
              currentIndex={currentRoomIndex}
              onEdit={handleEditRoom} />
            
                <AnimatePresence mode="wait">
                  <RoomConfigurator
                key={`room-${currentRoomIndex}`}
                roomIndex={currentRoomIndex}
                totalRooms={Math.max(targetRooms, roomsData.length + (currentRoomIndex >= roomsData.length ? 1 : 0))}
                initial={roomsData[currentRoomIndex] || {}}
                onComplete={handleRoomComplete}
                onBack={handleRoomBack} />
              
                </AnimatePresence>
              </>
          }
          </div>
        }

        {/* Results */}
        <AnimatePresence>
          {results &&
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-left">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Productos recomendados para ti
                </h3>
                <button onClick={reset} className="text-sm text-[#00509E] hover:underline">
                  ← Volver a empezar
                </button>
              </div>

              {results.length === 0 ?
            <p className="text-gray-500 text-center py-8">No hemos encontrado productos que coincidan. Prueba con otros parámetros.</p> :

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {results.map((p) => <MiniProductCard key={p.id} product={p} />)}
                </div>
            }
            </motion.div>
          }
        </AnimatePresence>
      </div>
    </section>);

}