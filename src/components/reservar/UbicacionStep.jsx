import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UbicacionStep({ value, onChange }) {
  const set = (field, val) => onChange({ ...value, [field]: val });

  return (
    <div className="space-y-4 mt-6">
      <div>
        <Label>Dirección completa *</Label>
        <Input
          value={value.direccion || ""}
          onChange={(e) => set("direccion", e.target.value)}
          placeholder="Calle, número, piso, puerta"
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Código postal *</Label>
          <Input
            value={value.codigoPostal || ""}
            onChange={(e) => set("codigoPostal", e.target.value)}
            placeholder="28001"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Ciudad *</Label>
          <Input
            value={value.ciudad || ""}
            onChange={(e) => set("ciudad", e.target.value)}
            placeholder="Madrid"
            className="mt-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tipo de vivienda *</Label>
          <Select value={value.tipoVivienda || ""} onValueChange={(v) => set("tipoVivienda", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Piso">Piso</SelectItem>
              <SelectItem value="Chalet">Chalet</SelectItem>
              <SelectItem value="Local">Local</SelectItem>
              <SelectItem value="Oficina">Oficina</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Planta/Altura</Label>
          <Input
            value={value.plantaAltura || ""}
            onChange={(e) => set("plantaAltura", e.target.value)}
            placeholder="Ej: 3º"
            className="mt-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>¿Hay ascensor? *</Label>
          <Select value={value.ascensor || ""} onValueChange={(v) => set("ascensor", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sí">Sí</SelectItem>
              <SelectItem value="No">No</SelectItem>
              <SelectItem value="No aplica">No aplica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Acceso al exterior *</Label>
          <Select value={value.accesoExterior || ""} onValueChange={(v) => set("accesoExterior", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Balcón">Balcón</SelectItem>
              <SelectItem value="Patio interior">Patio interior</SelectItem>
              <SelectItem value="Fachada">Fachada</SelectItem>
              <SelectItem value="Azotea">Azotea</SelectItem>
              <SelectItem value="No lo sé">No lo sé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}