import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, CheckCircle, XCircle, Clock, Filter } from "lucide-react";
import { format, startOfDay, subDays, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";

const ESTADO_COLORS = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmada: "bg-green-100 text-green-800 border-green-200",
  cancelada: "bg-gray-100 text-gray-800 border-gray-200"
};

export default function PanelReservas() {
  const queryClient = useQueryClient();
  const [filtros, setFiltros] = useState({
    rango: "30",
    estado: "all",
    servicio: "all"
  });
  const [selectedReserva, setSelectedReserva] = useState(null);

  const { data: reservas = [], isLoading } = useQuery({
    queryKey: ["reservas"],
    queryFn: () => base44.entities.ReservaInstalacion.list("-fecha", 500)
  });

  // Aplicar filtros
  const reservasFiltradas = useMemo(() => {
    let result = [...reservas];

    // Filtro por rango de fechas
    if (filtros.rango !== "all") {
      const dias = parseInt(filtros.rango);
      const desde = subDays(startOfDay(new Date()), 0);
      const hasta = subDays(startOfDay(new Date()), -dias);
      result = result.filter(r => {
        const fecha = new Date(r.fecha);
        return isWithinInterval(fecha, { start: desde, end: hasta });
      });
    }

    // Filtro por estado
    if (filtros.estado !== "all") {
      result = result.filter(r => r.estado === filtros.estado);
    }

    // Filtro por servicio
    if (filtros.servicio !== "all") {
      result = result.filter(r => r.tipoServicio === filtros.servicio);
    }

    return result;
  }, [reservas, filtros]);

  // Resumen
  const resumen = useMemo(() => {
    const hoy = format(new Date(), "yyyy-MM-dd");
    const desde7 = subDays(new Date(), 0);
    const hasta7 = subDays(new Date(), -7);

    return {
      hoyPendientes: reservas.filter(r => r.fecha === hoy && r.estado === "pendiente").length,
      hoyConfirmadas: reservas.filter(r => r.fecha === hoy && r.estado === "confirmada").length,
      semanaPendientes: reservas.filter(r => {
        const fecha = new Date(r.fecha);
        return isWithinInterval(fecha, { start: desde7, end: hasta7 }) && r.estado === "pendiente";
      }).length,
      semanaConfirmadas: reservas.filter(r => {
        const fecha = new Date(r.fecha);
        return isWithinInterval(fecha, { start: desde7, end: hasta7 }) && r.estado === "confirmada";
      }).length
    };
  }, [reservas]);

  // Cambiar estado
  const updateMutation = useMutation({
    mutationFn: ({ id, estado }) => base44.entities.ReservaInstalacion.update(id, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      setSelectedReserva(null);
    }
  });

  const handleCambiarEstado = (reserva, nuevoEstado) => {
    if (confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) {
      updateMutation.mutate({ id: reserva.id, estado: nuevoEstado });
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#003366] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Panel de Reservas
          </h1>
          <p className="text-gray-600">Gestiona y confirma las reservas de instalación</p>
        </div>

        {/* Resumen */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Hoy - Pendientes</div>
            <div className="text-2xl font-bold text-yellow-600">{resumen.hoyPendientes}</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Hoy - Confirmadas</div>
            <div className="text-2xl font-bold text-green-600">{resumen.hoyConfirmadas}</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Esta semana - Pendientes</div>
            <div className="text-2xl font-bold text-yellow-600">{resumen.semanaPendientes}</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Esta semana - Confirmadas</div>
            <div className="text-2xl font-bold text-green-600">{resumen.semanaConfirmadas}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-[#00509E]" />
            <h3 className="font-semibold text-[#003366]">Filtros</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Rango de fechas</label>
              <Select value={filtros.rango} onValueChange={(v) => setFiltros({...filtros, rango: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="7">Próximos 7 días</SelectItem>
                  <SelectItem value="30">Próximos 30 días</SelectItem>
                  <SelectItem value="60">Próximos 60 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Estado</label>
              <Select value={filtros.estado} onValueChange={(v) => setFiltros({...filtros, estado: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="confirmada">Confirmada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Servicio</label>
              <Select value={filtros.servicio} onValueChange={(v) => setFiltros({...filtros, servicio: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Instalación Split 1x1">Instalación Split 1x1</SelectItem>
                  <SelectItem value="Instalación Multisplit">Instalación Multisplit</SelectItem>
                  <SelectItem value="Mantenimiento/Limpieza">Mantenimiento/Limpieza</SelectItem>
                  <SelectItem value="Visita técnica">Visita técnica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Franja</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">Cargando...</TableCell>
                  </TableRow>
                ) : reservasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">No hay reservas</TableCell>
                  </TableRow>
                ) : (
                  reservasFiltradas.map((reserva) => (
                    <TableRow key={reserva.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {format(new Date(reserva.fecha), "d MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-sm">{reserva.franja}</TableCell>
                      <TableCell className="text-sm">{reserva.tipoServicio}</TableCell>
                      <TableCell>{reserva.nombre}</TableCell>
                      <TableCell>
                        <a href={`tel:${reserva.telefono}`} className="text-[#00509E] hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {reserva.telefono}
                        </a>
                      </TableCell>
                      <TableCell className="text-sm">{reserva.codigoPostal} {reserva.ciudad}</TableCell>
                      <TableCell>
                        <Badge className={`${ESTADO_COLORS[reserva.estado]} border text-xs`}>
                          {reserva.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {format(new Date(reserva.created_date), "d/MM/yy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedReserva(reserva)}>
                                Ver
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Detalle de Reserva</DialogTitle>
                              </DialogHeader>
                              {selectedReserva && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <span className="text-gray-500">Estado:</span>
                                      <Badge className={`${ESTADO_COLORS[selectedReserva.estado]} border ml-2`}>
                                        {selectedReserva.estado}
                                      </Badge>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Creada:</span>
                                      <span className="ml-2 font-medium">
                                        {format(new Date(selectedReserva.created_date), "d/MM/yyyy HH:mm")}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="font-semibold text-[#003366] mb-2">📅 Reserva</div>
                                    <div className="space-y-1 text-sm">
                                      <p><strong>Fecha:</strong> {format(new Date(selectedReserva.fecha), "d 'de' MMMM, yyyy", { locale: es })}</p>
                                      <p><strong>Franja:</strong> {selectedReserva.franja}</p>
                                      <p><strong>Servicio:</strong> {selectedReserva.tipoServicio}</p>
                                    </div>
                                  </div>

                                  <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="font-semibold text-[#003366] mb-2">👤 Cliente</div>
                                    <div className="space-y-1 text-sm">
                                      <p><strong>Nombre:</strong> {selectedReserva.nombre}</p>
                                      <p>
                                        <strong>Teléfono:</strong>{" "}
                                        <a href={`tel:${selectedReserva.telefono}`} className="text-[#00509E] hover:underline">
                                          {selectedReserva.telefono}
                                        </a>
                                        {" | "}
                                        <a href={`https://wa.me/34${selectedReserva.telefono.replace(/\s/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                                          WhatsApp
                                        </a>
                                      </p>
                                      <p><strong>Email:</strong> <a href={`mailto:${selectedReserva.email}`} className="text-[#00509E] hover:underline">{selectedReserva.email}</a></p>
                                    </div>
                                  </div>

                                  <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="font-semibold text-[#003366] mb-2">📍 Dirección</div>
                                    <div className="space-y-1 text-sm">
                                      <p>{selectedReserva.direccion}</p>
                                      <p>{selectedReserva.codigoPostal} {selectedReserva.ciudad}</p>
                                      <p><strong>Tipo:</strong> {selectedReserva.tipoVivienda}</p>
                                      {selectedReserva.plantaAltura && <p><strong>Planta:</strong> {selectedReserva.plantaAltura}</p>}
                                      <p><strong>Ascensor:</strong> {selectedReserva.ascensor}</p>
                                      <p><strong>Acceso exterior:</strong> {selectedReserva.accesoExterior}</p>
                                    </div>
                                  </div>

                                  <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="font-semibold text-[#003366] mb-2">🔧 Info técnica</div>
                                    <div className="space-y-1 text-sm">
                                      <p><strong>Equipo comprado:</strong> {selectedReserva.equipoComprado}</p>
                                      {selectedReserva.marcaModelo && <p><strong>Marca/Modelo:</strong> {selectedReserva.marcaModelo}</p>}
                                      {selectedReserva.unidadesInteriores && <p><strong>Unidades interiores:</strong> {selectedReserva.unidadesInteriores}</p>}
                                      {selectedReserva.distanciaAprox && <p><strong>Distancia:</strong> {selectedReserva.distanciaAprox}</p>}
                                      {selectedReserva.preinstalacion && <p><strong>Preinstalación:</strong> {selectedReserva.preinstalacion}</p>}
                                    </div>
                                  </div>

                                  {selectedReserva.comentarios && (
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                      <div className="font-semibold text-[#003366] mb-2">💬 Comentarios</div>
                                      <p className="text-sm">{selectedReserva.comentarios}</p>
                                    </div>
                                  )}

                                  {selectedReserva.fotos && selectedReserva.fotos.length > 0 && (
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                      <div className="font-semibold text-[#003366] mb-2">📷 Fotos ({selectedReserva.fotos.length})</div>
                                      <div className="grid grid-cols-2 gap-2">
                                        {selectedReserva.fotos.map((url, i) => (
                                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                            <img src={url} alt={`Foto ${i + 1}`} className="w-full h-32 object-cover rounded border" />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex gap-3 pt-4 border-t">
                                    {selectedReserva.estado === "pendiente" && (
                                      <>
                                        <Button
                                          onClick={() => handleCambiarEstado(selectedReserva, "confirmada")}
                                          className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2" /> Confirmar
                                        </Button>
                                        <Button
                                          onClick={() => handleCambiarEstado(selectedReserva, "cancelada")}
                                          variant="outline"
                                          className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                                        >
                                          <XCircle className="w-4 h-4 mr-2" /> Cancelar
                                        </Button>
                                      </>
                                    )}
                                    {selectedReserva.estado === "confirmada" && (
                                      <Button
                                        onClick={() => handleCambiarEstado(selectedReserva, "cancelada")}
                                        variant="outline"
                                        className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" /> Cancelar reserva
                                      </Button>
                                    )}
                                    {selectedReserva.estado === "cancelada" && (
                                      <Button
                                        onClick={() => handleCambiarEstado(selectedReserva, "pendiente")}
                                        variant="outline"
                                        className="flex-1"
                                      >
                                        <Clock className="w-4 h-4 mr-2" /> Reactivar como pendiente
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          {reserva.estado === "pendiente" && (
                            <Button
                              size="sm"
                              onClick={() => handleCambiarEstado(reserva, "confirmada")}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}