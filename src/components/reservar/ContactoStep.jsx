import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export default function ContactoStep({ value, onChange }) {
  const set = (field, val) => onChange({ ...value, [field]: val });

  return (
    <div className="space-y-4 mt-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Nombre completo *</Label>
          <Input
            value={value.nombre || ""}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder="Tu nombre"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Teléfono *</Label>
          <Input
            value={value.telefono || ""}
            onChange={(e) => set("telefono", e.target.value)}
            placeholder="600 000 000"
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label>Email *</Label>
        <Input
          type="email"
          value={value.email || ""}
          onChange={(e) => set("email", e.target.value)}
          placeholder="tu@email.com"
          className="mt-1"
        />
      </div>
      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg mt-2">
        <Checkbox
          id="acepta-bw"
          checked={value.aceptaCondiciones || false}
          onCheckedChange={(v) => set("aceptaCondiciones", v === true)}
        />
        <label htmlFor="acepta-bw" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
          Acepto las condiciones de servicio, política de cancelación y protección de datos. *
        </label>
      </div>
    </div>
  );
}