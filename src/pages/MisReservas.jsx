import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Clock, XCircle, Search, Calendar, MapPin, Wrench, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

const ESTADO_CONFIG = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  confirmada: { label: "Confirmada", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-800", icon: XCircle },
};

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.pendiente;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

function ReservaCard({ reserva }) {
  const fechaFormateada = reserva.fecha
    ? format(new Date(reserva.fecha + "T12:00:00"), "d 'de' MMMM, yyyy", { locale: es })
    : "—";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="w-4 h-4 text-[#00509E]" />
            <h3 className="font-semibold text-[#003366] text-sm md:text-base">{reserva.tipoServicio}</h3>
          </div>
          <p className="text-xs text-gray-400">Solicitud recibida el {format(new Date(reserva.created_date), "d MMM yyyy", { locale: es })}</p>
        </div>
        <EstadoBadge estado={reserva.estado} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-start gap-2 text-gray-600">
          <Calendar className="w-4 h-4 text-[#00509E] mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-gray-800">{fechaFormateada}</p>
            <p className="text-xs text-gray-500">{reserva.franja}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-gray-600">
          <MapPin className="w-4 h-4 text-[#00509E] mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-gray-800">{reserva.ciudad}</p>
            <p className="text-xs text-gray-500">{reserva.direccion}</p>
          </div>
        </div>
      </div>

      {reserva.estado === "pendiente" && (
        <p className="mt-4 text-xs text-gray-500 bg-yellow-50 rounded-lg px-3 py-2">
          Te confirmaremos la cita por WhatsApp o email en menos de 48h laborables.
        </p>
      )}
      {reserva.estado === "confirmada" && (
        <p className="mt-4 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
          Tu instalación está confirmada. Un técnico acudirá en la fecha indicada.
        </p>
      )}
    </div>
  );
}

export default function MisReservas() {
  const [email, setEmail] = useState("");
  const [emailBuscado, setEmailBuscado] = useState("");
  const [buscado, setBuscado] = useState(false);

  const { data: reservas = [], isLoading } = useQuery({
    queryKey: ["mis_reservas", emailBuscado],
    queryFn: () => base44.entities.ReservaInstalacion.filter({ email: emailBuscado }, "-created_date", 50),
    enabled: !!emailBuscado,
  });

  const handleBuscar = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailBuscado(email.trim().toLowerCase());
    setBuscado(true);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#003366] to-[#00509E] py-14 md:py-20 text-white text-center px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Mis Reservas
        </h1>
        <p className="text-blue-200 max-w-md mx-auto">
          Consulta el estado de tus solicitudes de instalación introduciendo tu correo electrónico.
        </p>
      </section>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-10">
        {/* Formulario búsqueda */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-11"
              required
            />
            <Button
              type="submit"
              className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-6 h-11"
              disabled={isLoading}
            >
              <Search className="w-4 h-4 mr-2" />
              {isLoading ? "Buscando..." : "Ver mis reservas"}
            </Button>
          </form>
        </div>

        {/* Resultados */}
        {buscado && !isLoading && (
          <>
            {reservas.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium text-gray-700 mb-1">No encontramos reservas</p>
                <p className="text-sm mb-6">No hay reservas asociadas a <strong>{emailBuscado}</strong></p>
                <Link to={createPageUrl("Reservar")}>
                  <Button className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-6">
                    Hacer una reserva <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">
                  {reservas.length} reserva{reservas.length !== 1 ? "s" : ""} encontrada{reservas.length !== 1 ? "s" : ""} para <strong>{emailBuscado}</strong>
                </p>
                {reservas.map((r) => (
                  <ReservaCard key={r.id} reserva={r} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}