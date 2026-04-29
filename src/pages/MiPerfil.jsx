import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Calendar, Package, Download, Clock, CheckCircle2, XCircle, Home, Save, LogOut } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import {
  getLocalAdminUser,
  isLocalAdminLoginEnabled,
  loginLocalAdmin,
  logoutLocalAdmin,
} from "@/lib/local-admin-auth";

const LOCAL_PROFILE_STORAGE_KEY = "climaclaro_local_profile";

const RESERVATION_STATUS = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  confirmada: { label: "Confirmada", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-700", icon: XCircle },
};

const ORDER_STATUS = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  installation_scheduled: { label: "Instalación programada", color: "bg-purple-100 text-purple-700", icon: Calendar },
  completed: { label: "Completado", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle },
};

function generateInvoicePDF(order) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURA", 20, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("ClimaClaro - Instalacion profesional de A/C", 20, 28);
  doc.text(`Nº: ${order.order_number || order.id?.slice(0, 8).toUpperCase()}`, pageWidth - 20, 18, { align: "right" });
  doc.text(`Fecha: ${new Date(order.created_date).toLocaleDateString("es-ES")}`, pageWidth - 20, 28, { align: "right" });

  // Customer info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Datos del cliente", 20, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(order.customer_name || "—", 20, 65);
  doc.text(order.customer_email || "—", 20, 73);
  doc.text(order.customer_phone || "—", 20, 81);
  if (order.address) doc.text(`${order.address}, ${order.postal_code || ""} ${order.city || ""}, ${order.province || ""}`, 20, 89);

  // Items table header
  doc.setFillColor(240, 244, 248);
  doc.rect(20, 100, pageWidth - 40, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Descripción", 22, 107);
  doc.text("Uds.", pageWidth - 80, 107, { align: "right" });
  doc.text("Precio unit.", pageWidth - 50, 107, { align: "right" });
  doc.text("Total", pageWidth - 20, 107, { align: "right" });

  // Items
  doc.setFont("helvetica", "normal");
  let y = 120;
  (order.items || []).forEach((item) => {
    const name = item.item_type === "service" ? item.service_name : item.product_name;
    const qty = item.quantity || 1;
    const price = item.price || 0;
    doc.text(name || "Servicio", 22, y);
    doc.text(String(qty), pageWidth - 80, y, { align: "right" });
    doc.text(`${price.toFixed(2)} €`, pageWidth - 50, y, { align: "right" });
    doc.text(`${(price * qty).toFixed(2)} €`, pageWidth - 20, y, { align: "right" });
    y += 10;
  });

  // Total
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y + 2, pageWidth - 20, y + 2);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL", pageWidth - 60, y);
  doc.text(`${(order.total || 0).toFixed(2)} €`, pageWidth - 20, y, { align: "right" });

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("ClimaClaro · info@climaclaro.es · www.climaclaro.es", pageWidth / 2, 270, { align: "center" });
  doc.text("Gracias por confiar en nosotros", pageWidth / 2, 278, { align: "center" });

  doc.save(`factura-${order.order_number || order.id?.slice(0, 8)}.pdf`);
}

export default function MiPerfil() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("reservas");
  const [profileForm, setProfileForm] = useState(null);
  const [localPassword, setLocalPassword] = useState("");
  const [localLoginError, setLocalLoginError] = useState("");
  // first_name / last_name son campos custom guardados en el perfil
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const localUser = getLocalAdminUser();
    if (localUser) {
      const storedProfile = JSON.parse(localStorage.getItem(LOCAL_PROFILE_STORAGE_KEY) || "{}");
      setUser(localUser);
      setProfileForm({
        first_name: storedProfile.first_name || "Admin",
        last_name: storedProfile.last_name || "local",
        phone: storedProfile.phone || "",
        address: storedProfile.address || "",
        city: storedProfile.city || "",
        postal_code: storedProfile.postal_code || "",
        province: storedProfile.province || "",
        nif: storedProfile.nif || "",
        billing_name: storedProfile.billing_name || "",
        billing_address: storedProfile.billing_address || "",
        tipo_vivienda: storedProfile.tipo_vivienda || "",
        planta: storedProfile.planta || "",
        ascensor: storedProfile.ascensor || "",
        acceso_exterior: storedProfile.acceso_exterior || "",
        superficie_m2: storedProfile.superficie_m2 || "",
        num_habitaciones: storedProfile.num_habitaciones || "",
        preinstalacion: storedProfile.preinstalacion || "",
        notas_vivienda: storedProfile.notas_vivienda || "",
      });
      return;
    }

    setUser(null);
  }, []);

  const { data: reservas = [], isLoading: loadingReservas } = useQuery({
    queryKey: ["mis_reservas", user?.email],
    queryFn: () => base44.entities.ReservaInstalacion.filter({ email: user.email }, "-created_date", 50),
    enabled: !!user?.email && !user?.isLocalAdmin,
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["mis_orders", user?.email],
    queryFn: () => base44.entities.Order.filter({ customer_email: user.email }, "-created_date", 50),
    enabled: !!user?.email && !user?.isLocalAdmin,
  });

  if (!user) {
    const handleLocalLogin = (event) => {
      event.preventDefault();
      setLocalLoginError("");

      const result = loginLocalAdmin(localPassword);
      if (!result.ok) {
        setLocalLoginError(result.message);
        return;
      }

      const localUser = getLocalAdminUser();
      setUser(localUser);
      setProfileForm({
        first_name: "Admin",
        last_name: "local",
        phone: "",
        address: "",
        city: "",
        postal_code: "",
        province: "",
        nif: "",
        billing_name: "",
        billing_address: "",
        tipo_vivienda: "",
        planta: "",
        ascensor: "",
        acceso_exterior: "",
        superficie_m2: "",
        num_habitaciones: "",
        preinstalacion: "",
        notas_vivienda: "",
      });
    };

    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm max-w-sm w-full">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-6">Debes iniciar sesión local para ver tu perfil.</p>
          {isLocalAdminLoginEnabled() && (
            <form onSubmit={handleLocalLogin} className="space-y-3">
              <Input
                type="password"
                value={localPassword}
                onChange={(event) => setLocalPassword(event.target.value)}
                placeholder="Contraseña local"
                className="h-11 text-center"
              />
              {localLoginError && <p className="text-xs text-red-500">{localLoginError}</p>}
              <Button type="submit" className="w-full bg-[#00509E] text-white rounded-full">
                Entrar en local
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "reservas", label: "Mis reservas", icon: Calendar },
    { id: "pedidos", label: "Mis pedidos", icon: Package },
    { id: "datos", label: "Mis datos", icon: User },
  ];

  const saveProfile = async () => {
    setSavingProfile(true);
    if (user.isLocalAdmin) {
      localStorage.setItem(LOCAL_PROFILE_STORAGE_KEY, JSON.stringify(profileForm));
      setSavingProfile(false);
      toast.success("Datos guardados en local");
      return;
    }
    await base44.auth.updateMe(profileForm);
    setSavingProfile(false);
    toast.success("Datos guardados correctamente");
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* Header */}
      <div className="bg-[#003366] text-white py-10">
        <div className="max-w-4xl mx-auto px-4 md:px-6 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{user.full_name}</h1>
            <p className="text-blue-200 text-sm mt-1">{user.email}</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              if (user.isLocalAdmin) {
                logoutLocalAdmin();
                setUser(null);
                return;
              }
              localStorage.removeItem("base44_access_token");
              localStorage.removeItem("token");
              setUser(null);
            }}
            className="text-blue-200 hover:text-white hover:bg-white/10 gap-2"
          >
            <LogOut className="w-4 h-4" /> Salir
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === id
                  ? "border-[#00509E] text-[#00509E]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Reservas */}
        {activeTab === "reservas" && (
          <div className="space-y-4">
            {loadingReservas ? (
              <LoadingCards />
            ) : reservas.length === 0 ? (
              <EmptyState icon={Calendar} text="No tienes reservas aún." />
            ) : (
              reservas.map((r) => {
                const status = RESERVATION_STATUS[r.estado] || RESERVATION_STATUS.pendiente;
                const Icon = status.icon;
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-semibold text-[#003366]">{r.tipoServicio}</span>
                          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <Icon className="w-3 h-3" /> {status.label}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 space-y-0.5">
                          <p><span className="font-medium">Fecha:</span> {r.fecha ? new Date(r.fecha).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—"} · {r.franja}</p>
                          <p><span className="font-medium">Dirección:</span> {r.direccion}, {r.codigoPostal} {r.ciudad}</p>
                          {r.marcaModelo && <p><span className="font-medium">Equipo:</span> {r.marcaModelo}</p>}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 shrink-0">
                        {new Date(r.created_date).toLocaleDateString("es-ES")}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Datos */}
        {activeTab === "datos" && profileForm && (
          <div className="space-y-6">
            {/* Datos de contacto */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-[#003366] mb-4 flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <User className="w-5 h-5 text-[#00509E]" /> Datos de contacto
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Nombre</label>
                  <Input placeholder="Tu nombre" value={profileForm.first_name} onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Apellidos</label>
                  <Input placeholder="Tus apellidos" value={profileForm.last_name} onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                  <Input value={user.email} disabled className="rounded-xl bg-gray-50 text-gray-400" />
                  <p className="text-xs text-gray-400 mt-1">El email no se puede modificar.</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Teléfono</label>
                  <Input placeholder="Ej: 612 345 678" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="rounded-xl" />
                </div>
              </div>
            </div>

            {/* Dirección principal */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-[#003366] mb-4 flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <Home className="w-5 h-5 text-[#00509E]" /> Dirección de instalación
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Dirección</label>
                  <Input placeholder="Calle y número" value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Ciudad</label>
                  <Input placeholder="Madrid" value={profileForm.city} onChange={e => setProfileForm({ ...profileForm, city: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Código postal</label>
                  <Input placeholder="28001" value={profileForm.postal_code} onChange={e => setProfileForm({ ...profileForm, postal_code: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Provincia</label>
                  <Input placeholder="Madrid" value={profileForm.province} onChange={e => setProfileForm({ ...profileForm, province: e.target.value })} className="rounded-xl" />
                </div>
              </div>
            </div>

            {/* Datos de facturación */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-[#003366] mb-4 flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <Package className="w-5 h-5 text-[#00509E]" /> Datos de facturación
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Nombre fiscal / Empresa</label>
                  <Input placeholder="Nombre o razón social" value={profileForm.billing_name} onChange={e => setProfileForm({ ...profileForm, billing_name: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">NIF / CIF</label>
                  <Input placeholder="12345678A" value={profileForm.nif} onChange={e => setProfileForm({ ...profileForm, nif: e.target.value })} className="rounded-xl" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Dirección de facturación (si difiere)</label>
                  <Input placeholder="Dejar vacío si es la misma que la principal" value={profileForm.billing_address} onChange={e => setProfileForm({ ...profileForm, billing_address: e.target.value })} className="rounded-xl" />
                </div>
              </div>
            </div>

            {/* Datos de la vivienda */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-[#003366] mb-1 flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <Home className="w-5 h-5 text-[#00509E]" /> Datos de la vivienda
              </h3>
              <p className="text-xs text-gray-400 mb-4">Nos ayuda a preparar mejor las visitas e instalaciones.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo de vivienda</label>
                  <Select value={profileForm.tipo_vivienda} onValueChange={v => setProfileForm({ ...profileForm, tipo_vivienda: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {["Piso", "Chalet", "Local", "Oficina"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Planta / Altura</label>
                  <Input placeholder="Ej: 3ª" value={profileForm.planta} onChange={e => setProfileForm({ ...profileForm, planta: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Ascensor</label>
                  <Select value={profileForm.ascensor} onValueChange={v => setProfileForm({ ...profileForm, ascensor: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {["Sí", "No", "No aplica"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Acceso al exterior</label>
                  <Select value={profileForm.acceso_exterior} onValueChange={v => setProfileForm({ ...profileForm, acceso_exterior: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {["Balcón", "Patio interior", "Fachada", "Azotea", "No lo sé"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Superficie aprox. (m²)</label>
                  <Input type="number" placeholder="Ej: 80" value={profileForm.superficie_m2} onChange={e => setProfileForm({ ...profileForm, superficie_m2: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Nº de habitaciones</label>
                  <Input type="number" placeholder="Ej: 3" value={profileForm.num_habitaciones} onChange={e => setProfileForm({ ...profileForm, num_habitaciones: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">¿Tiene preinstalación?</label>
                  <Select value={profileForm.preinstalacion} onValueChange={v => setProfileForm({ ...profileForm, preinstalacion: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {["Sí", "No", "No lo sé"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Notas adicionales sobre la vivienda</label>
                  <Input placeholder="Ej: Portal con código, acceso difícil por obra..." value={profileForm.notas_vivienda} onChange={e => setProfileForm({ ...profileForm, notas_vivienda: e.target.value })} className="rounded-xl" />
                </div>
              </div>
            </div>

            <Button
              onClick={saveProfile}
              disabled={savingProfile}
              className="w-full bg-[#00509E] hover:bg-[#003366] text-white rounded-full h-11 font-semibold gap-2"
            >
              <Save className="w-4 h-4" />
              {savingProfile ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        )}

        {/* Pedidos */}
        {activeTab === "pedidos" && (
          <div className="space-y-4">
            {loadingOrders ? (
              <LoadingCards />
            ) : orders.length === 0 ? (
              <EmptyState icon={Package} text="No tienes pedidos aún." />
            ) : (
              orders.map((order) => {
                const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
                const Icon = status.icon;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-semibold text-[#003366] font-mono text-sm">
                            #{order.order_number || order.id?.slice(0, 8).toUpperCase()}
                          </span>
                          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <Icon className="w-3 h-3" /> {status.label}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          {(order.items || []).map((item, i) => (
                            <p key={i} className="flex justify-between">
                              <span>{item.item_type === "service" ? item.service_name : item.product_name} × {item.quantity}</span>
                              <span className="font-medium text-gray-700">{((item.price || 0) * (item.quantity || 1)).toFixed(2)} €</span>
                            </p>
                          ))}
                          <p className="border-t pt-1 font-bold text-[#003366] flex justify-between">
                            <span>Total</span>
                            <span>{(order.total || 0).toFixed(2)} €</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs text-gray-400">{new Date(order.created_date).toLocaleDateString("es-ES")}</span>
                        {(order.status === "completed" || order.status === "confirmed" || order.status === "installation_scheduled") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateInvoicePDF(order)}
                            className="gap-1.5 text-xs border-[#00509E] text-[#00509E] hover:bg-[#F0F4F8]"
                          >
                            <Download className="w-3.5 h-3.5" /> Descargar factura
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
          <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
      <Icon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
      <p className="text-gray-400">{text}</p>
    </div>
  );
}
