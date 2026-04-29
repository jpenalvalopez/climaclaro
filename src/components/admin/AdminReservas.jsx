import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Phone, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ESTADOS = ["pendiente", "confirmada", "cancelada"];
const ESTADO_COLORS = {
  pendiente: "bg-yellow-100 text-yellow-800",
  confirmada: "bg-green-100 text-green-800",
  cancelada: "bg-gray-100 text-gray-600",
};

export default function AdminReservas() {
  const queryClient = useQueryClient();
  const [filterEstado, setFilterEstado] = useState("all");
  const [filterCiudad, setFilterCiudad] = useState("");
  const [filterFecha, setFilterFecha] = useState("");
  const [editReserva, setEditReserva] = useState(null);

  const { data: reservas = [], isLoading } = useQuery({
    queryKey: ["reservas"],
    queryFn: () => base44.entities.ReservaInstalacion.list("-created_date", 300)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ReservaInstalacion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      setEditReserva(null);
    }
  });

  let filtered = reservas;
  if (filterEstado !== "all") filtered = filtered.filter(r => r.estado === filterEstado);
  if (filterCiudad) filtered = filtered.filter(r => r.ciudad?.toLowerCase().includes(filterCiudad.toLowerCase()) || r.codigoPostal?.includes(filterCiudad));
  if (filterFecha) filtered = filtered.filter(r => r.fecha === filterFecha);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input placeholder="Ciudad / CP..." className="pl-9 w-44" value={filterCiudad} onChange={e => setFilterCiudad(e.target.value)} />
        </div>
        <Input type="date" className="w-44" value={filterFecha} onChange={e => setFilterFecha(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">Cliente</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Servicio</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Fecha</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Ciudad</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay reservas</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#003366]">{r.nombre}</div>
                    <a href={`tel:${r.telefono}`} className="text-xs text-[#00509E] flex items-center gap-1">
                      <Phone className="w-3 h-3" />{r.telefono}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.tipoServicio}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {r.fecha ? format(new Date(r.fecha + "T00:00:00"), "d MMM yyyy", { locale: es }) : "—"}<br />
                    <span className="text-gray-400">{r.franja}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.ciudad} {r.codigoPostal}</td>
                  <td className="px-4 py-3">
                    <Select value={r.estado || "pendiente"} onValueChange={v => updateMutation.mutate({ id: r.id, data: { estado: v } })}>
                      <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => setEditReserva({ ...r })}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editReserva} onOpenChange={(open) => !open && setEditReserva(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar reserva</DialogTitle></DialogHeader>
          {editReserva && (
            <ReservaEditForm
              reserva={editReserva}
              onChange={setEditReserva}
              onSave={() => updateMutation.mutate({ id: editReserva.id, data: editReserva })}
              saving={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReservaEditForm({ reserva, onChange, onSave, saving }) {
  const set = (field, value) => onChange({ ...reserva, [field]: value });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Estado</Label>
          <Select value={reserva.estado || "pendiente"} onValueChange={v => set("estado", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["pendiente", "confirmada", "cancelada"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tipo de servicio</Label>
          <Select value={reserva.tipoServicio || ""} onValueChange={v => set("tipoServicio", v)}>
            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
            <SelectContent>
              {["Instalación Split 1x1", "Instalación Multisplit", "Mantenimiento/Limpieza", "Visita técnica"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Fecha</Label>
          <Input type="date" value={reserva.fecha || ""} onChange={e => set("fecha", e.target.value)} />
        </div>
        <div>
          <Label>Franja</Label>
          <Select value={reserva.franja || ""} onValueChange={v => set("franja", v)}>
            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
            <SelectContent>
              {["Mañana (9–14)", "Tarde (15–19)"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Nombre</Label>
          <Input value={reserva.nombre || ""} onChange={e => set("nombre", e.target.value)} />
        </div>
        <div>
          <Label>Teléfono</Label>
          <Input value={reserva.telefono || ""} onChange={e => set("telefono", e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={reserva.email || ""} onChange={e => set("email", e.target.value)} />
        </div>
        <div>
          <Label>Código postal</Label>
          <Input value={reserva.codigoPostal || ""} onChange={e => set("codigoPostal", e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label>Dirección</Label>
          <Input value={reserva.direccion || ""} onChange={e => set("direccion", e.target.value)} />
        </div>
        <div>
          <Label>Ciudad</Label>
          <Input value={reserva.ciudad || ""} onChange={e => set("ciudad", e.target.value)} />
        </div>
        <div>
          <Label>Tipo de vivienda</Label>
          <Select value={reserva.tipoVivienda || ""} onValueChange={v => set("tipoVivienda", v)}>
            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
            <SelectContent>
              {["Piso", "Chalet", "Local", "Oficina"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Planta / Altura</Label>
          <Input value={reserva.plantaAltura || ""} onChange={e => set("plantaAltura", e.target.value)} />
        </div>
        <div>
          <Label>Ascensor</Label>
          <Select value={reserva.ascensor || ""} onValueChange={v => set("ascensor", v)}>
            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
            <SelectContent>
              {["Sí", "No", "No aplica"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Acceso exterior</Label>
          <Select value={reserva.accesoExterior || ""} onValueChange={v => set("accesoExterior", v)}>
            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
            <SelectContent>
              {["Balcón", "Patio interior", "Fachada", "Azotea", "No lo sé"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Equipo comprado</Label>
          <Select value={reserva.equipoComprado || ""} onValueChange={v => set("equipoComprado", v)}>
            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
            <SelectContent>
              {["Sí", "No"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Marca y modelo</Label>
          <Input value={reserva.marcaModelo || ""} onChange={e => set("marcaModelo", e.target.value)} />
        </div>
        <div>
          <Label>Unidades interiores</Label>
          <Input type="number" value={reserva.unidadesInteriores || ""} onChange={e => set("unidadesInteriores", parseInt(e.target.value))} />
        </div>
        <div>
          <Label>Distancia aprox.</Label>
          <Select value={reserva.distanciaAprox || ""} onValueChange={v => set("distanciaAprox", v)}>
            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
            <SelectContent>
              {["<3m", "3–5m", "5–10m", ">10m", "No lo sé"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Preinstalación</Label>
          <Select value={reserva.preinstalacion || ""} onValueChange={v => set("preinstalacion", v)}>
            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
            <SelectContent>
              {["Sí", "No", "No lo sé"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Comentarios</Label>
          <Textarea value={reserva.comentarios || ""} onChange={e => set("comentarios", e.target.value)} rows={3} />
        </div>
      </div>
      <Button onClick={onSave} disabled={saving} className="w-full bg-[#00509E] hover:bg-[#003366] text-white">
        {saving ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}