import React, { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Settings, Home, Square, Sun, MapPin, Wrench, Phone } from "lucide-react";
import { normalizeEntityList } from "@/lib/entity-list";

const WIZARD_KEY = "quote_wizard";
const ICON_MAP = { Home, Square, Sun, MapPin, Settings, Wrench, Phone };
function getIcon(name) { return ICON_MAP[name] || Settings; }

export default function QuoteWizardModal({ open, onOpenChange, service }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setStepIndex(0);
    setAnswers({});
    setForm({ name: "", phone: "", email: "" });
    setDone(false);
    setSubmitting(false);
  };

  const handleClose = (val) => {
    onOpenChange(val);
    if (!val) setTimeout(reset, 300);
  };

  const { data: allStepsData = [] } = useQuery({
    queryKey: ["wizard_steps_active", WIZARD_KEY],
    queryFn: () => base44.entities.WizardStep.filter({ wizard_key: WIZARD_KEY, active: true }, "order", 50),
  });

  const { data: allOptionsData = [] } = useQuery({
    queryKey: ["wizard_options_all", WIZARD_KEY],
    queryFn: () => base44.entities.WizardOption.filter({ wizard_key: WIZARD_KEY, active: true }, "order", 200),
  });

  const { data: wizardConfigsData = [] } = useQuery({
    queryKey: ["wizard_config", WIZARD_KEY],
    queryFn: () => base44.entities.Wizard.filter({ key: WIZARD_KEY, active: true }),
  });
  const allSteps = normalizeEntityList(allStepsData);
  const allOptions = normalizeEntityList(allOptionsData);
  const wizardConfigs = normalizeEntityList(wizardConfigsData);
  const wizardConfig = wizardConfigs[0];

  const currentStep = allSteps[stepIndex];
  const stepOptions = useMemo(() => {
    if (!currentStep) return [];
    return allOptions.filter(o => o.step_id === currentStep.step_id);
  }, [currentStep, allOptions]);

  const selectedMulti = Array.isArray(answers[currentStep?.step_id]) ? answers[currentStep.step_id] : [];
  const isLastStep = stepIndex === allSteps.length - 1;
  const isContactStep = allSteps.length === 0 || stepIndex >= allSteps.length;

  const canAdvance = currentStep && (
    currentStep.multi
      ? (selectedMulti.length > 0 || !currentStep.required)
      : !!answers[currentStep.step_id]
  );

  const selectOption = (value) => {
    if (!currentStep) return;
    if (currentStep.multi) {
      const cur = Array.isArray(answers[currentStep.step_id]) ? answers[currentStep.step_id] : [];
      const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
      setAnswers(a => ({ ...a, [currentStep.step_id]: next }));
    } else {
      setAnswers(a => ({ ...a, [currentStep.step_id]: String(value) }));
      setTimeout(() => {
        if (!isLastStep) setStepIndex(s => s + 1);
        else setStepIndex(allSteps.length); // go to contact
      }, 280);
    }
  };

  const handleNext = () => {
    if (!isLastStep) setStepIndex(s => s + 1);
    else setStepIndex(allSteps.length); // go to contact
  };

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex(s => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await base44.entities.Lead.create({
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      source: "wizard",
      message: service ? `Presupuesto para: ${service.title}` : "Solicitud de presupuesto",
      wizard_data: {
        ...answers,
        service_id: service?.id,
        service_name: service?.title,
      },
    });
    setDone(true);
    setSubmitting(false);
  };

  const progress = allSteps.length > 0
    ? Math.min(100, (stepIndex / (allSteps.length + 1)) * 100)
    : 0;

  const StepIcon = currentStep ? getIcon(currentStep.icon) : Settings;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="p-6 pb-0">
          <h2 className="text-xl font-bold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {wizardConfig?.title || "Solicitar presupuesto"}
          </h2>
          {service && (
            <p className="text-sm text-gray-500 mt-1">
              Servicio: <span className="font-medium text-[#00509E]">{service.title}</span>
            </p>
          )}
          {wizardConfig?.subtitle && !isContactStep && (
            <p className="text-sm text-gray-500 mt-1">{wizardConfig.subtitle}</p>
          )}

          {/* Progress bar */}
          {!done && allSteps.length > 0 && !isContactStep && (
            <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#00509E] rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-[#003366] text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>
                ¡Solicitud enviada!
              </h3>
              <p className="text-gray-500 text-sm">
                Revisaremos tu solicitud y te contactaremos en menos de 24h.
              </p>
              <Button onClick={() => handleClose(false)} className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-8">
                Cerrar
              </Button>
            </div>
          ) : isContactStep ? (
            /* Contact form */
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#00509E]/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#00509E]" />
                </div>
                <h3 className="text-lg font-semibold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  ¿Cómo te contactamos?
                </h3>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="Tu nombre *"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="rounded-xl"
                />
                <Input
                  placeholder="Teléfono *"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="rounded-xl"
                />
                <Input
                  placeholder="Email (opcional)"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="flex justify-between mt-6">
                {allSteps.length > 0 && (
                  <Button variant="ghost" onClick={handleBack} className="text-gray-500">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Anterior
                  </Button>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={!form.name || !form.phone || submitting}
                  className="bg-[#FF6F61] hover:bg-[#e5574a] text-white rounded-full px-8 font-semibold ml-auto"
                >
                  {submitting ? "Enviando..." : "Enviar solicitud"}
                </Button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">Sin compromiso. Te responderemos en menos de 24h.</p>
            </motion.div>
          ) : currentStep ? (
            /* Wizard steps */
            <AnimatePresence mode="wait">
              <motion.div
                key={stepIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#00509E]/10 flex items-center justify-center">
                    <StepIcon className="w-5 h-5 text-[#00509E]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {currentStep.question}
                  </h3>
                </div>

                <div className="grid gap-3">
                  {stepOptions.map(opt => {
                    const isSelected = currentStep.multi
                      ? selectedMulti.includes(opt.value)
                      : answers[currentStep.step_id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => selectOption(opt.value)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-[#00509E] bg-[#EFF6FF]"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-[#003366]">{opt.label}</p>
                            {opt.desc && <p className="text-sm text-gray-500 mt-0.5">{opt.desc}</p>}
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-[#00509E] flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between mt-6">
                  <Button
                    variant="ghost"
                    onClick={stepIndex === 0 ? () => handleClose(false) : handleBack}
                    className="text-gray-500"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    {stepIndex === 0 ? "Cancelar" : "Anterior"}
                  </Button>
                  {currentStep.multi && canAdvance && (
                    <Button
                      onClick={handleNext}
                      className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-6"
                    >
                      {isLastStep ? "Continuar" : "Siguiente"}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            /* Fallback: no steps configured, go straight to contact */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* auto-redirect to contact on mount */}
              {(() => { if (stepIndex === 0 && allSteps.length === 0) setStepIndex(1); return null; })()}
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
