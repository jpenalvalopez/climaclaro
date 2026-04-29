import React from "react";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, Clock, ArrowRight } from "lucide-react";
import BookingWizard from "./BookingWizard";

const STEPS = [
{ num: 1, title: "Selecciona fecha", desc: "Elige día y franja horaria" },
{ num: 2, title: "Completa datos", desc: "Dirección e información técnica" },
{ num: 3, title: "Confirmación", desc: "Te llamamos en 24h laborables" }];


export default function Reservar() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#F0F4F8] to-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <span className="text-[#00509E] text-sm font-semibold uppercase tracking-widest">Reserva tu instalación</span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#003366] mt-3 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Elige fecha y franja horaria
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6">Te confirmamos por WhatsApp en menos de 48h laborables.

          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-700">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#00509E]" /> Instalador profesional</div>
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#00509E]" /> Precio claro</div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#00509E]" /> Atención rápida</div>
          </div>
          <Button
            onClick={() => document.getElementById("wizard-reserva").scrollIntoView({ behavior: "smooth" })}
            className="mt-8 bg-[#00509E] hover:bg-[#003d7a] text-white rounded-full px-8 h-12 text-base font-semibold shadow-lg">

            Reservar ahora <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl font-bold text-[#003366] text-center mb-10" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Cómo funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step) =>
            <div key={step.num} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#00509E] text-white font-bold flex items-center justify-center mx-auto mb-3 text-lg">
                  {step.num}
                </div>
                <h3 className="font-semibold text-[#003366] mb-1">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Wizard */}
      <div id="wizard-reserva">
        <BookingWizard />
      </div>
    </div>);

}