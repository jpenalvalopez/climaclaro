import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  Package, Users, ShoppingCart, Star, Calendar,
  LayoutDashboard, Settings, FileText, AlertCircle, LogOut, Wrench, Wand2, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getLocalAdminUser,
  isLocalAdminLoginEnabled,
  loginLocalAdmin,
  logoutLocalAdmin,
} from "@/lib/local-admin-auth";
import AdminProducts from "../components/admin/AdminProducts";
import AdminLeads from "../components/admin/AdminLeads";
import AdminOrders from "../components/admin/AdminOrders";
import AdminReviews from "../components/admin/AdminReviews";
import AdminReservas from "../components/admin/AdminReservas";
import AdminSiteSettings from "../components/admin/AdminSiteSettings";
import AdminServices from "../components/admin/AdminServices";
import AdminCmsContent from "../components/admin/AdminCmsContent";
import AdminWizard from "../components/admin/AdminWizard";
import AdminBookingWizard from "../components/admin/AdminBookingWizard";
import AdminDashboard from "../components/admin/AdminDashboard";
import AdminExports from "../components/admin/AdminExports";
import AdminBrandPages from "../components/admin/AdminBrandPages";
import AdminQuoteWizard from "../components/admin/AdminQuoteWizard";
import AdminPromoSlides from "../components/admin/AdminPromoSlides";
import AdminModelPages from "../components/admin/AdminModelPages";
import AdminQuotes from "../components/admin/AdminQuotes";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "products",  label: "Productos",  icon: Package },
  { key: "services",  label: "Servicios",  icon: Wrench },
  { key: "wizard",    label: "Wizard recomendador", icon: Wand2 },
  { key: "booking_wizard", label: "Wizard reservas", icon: Wand2 },
  { key: "brand_wizard",   label: "Wizard marca",   icon: Wand2 },
  { key: "quote_wizard",  label: "Wizard presupuesto", icon: Wand2 },
  { key: "reservas",  label: "Reservas",   icon: Calendar },
  { key: "quotes",    label: "Presupuestos", icon: FileText },
  { key: "orders",    label: "Pedidos",    icon: ShoppingCart },
  { key: "leads",     label: "Leads",      icon: Users },
  { key: "reviews",   label: "Reseñas",    icon: Star },
  { key: "settings",  label: "Ajustes",    icon: Settings },
  { key: "cms",       label: "Contenido web", icon: FileText },
  { key: "exports",   label: "Exportaciones", icon: Download },
  { key: "brands",    label: "Páginas de marca", icon: Package },
  { key: "promo_slides", label: "Carrusel promos", icon: Package },
  { key: "model_pages", label: "Páginas de modelo", icon: Package },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(undefined); // undefined = loading
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [localPassword, setLocalPassword] = useState("");
  const [localLoginError, setLocalLoginError] = useState("");

  useEffect(() => {
    const localAdmin = getLocalAdminUser();
    if (localAdmin) {
      setUser(localAdmin);
      return;
    }
    setUser(null);
  }, []);

  const canLoadAdminData = user?.role === "admin" && !user?.isLocalAdmin;
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => base44.entities.Product.list(), enabled: canLoadAdminData });
  const { data: leads = [] } = useQuery({ queryKey: ["leads"], queryFn: () => base44.entities.Lead.list(), enabled: canLoadAdminData });
  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: () => base44.entities.Order.list(), enabled: canLoadAdminData });
  const { data: reservas = [] } = useQuery({ queryKey: ["reservas"], queryFn: () => base44.entities.ReservaInstalacion.list(), enabled: canLoadAdminData });
  const { data: reviews = [] } = useQuery({ queryKey: ["reviews"], queryFn: () => base44.entities.Review.list(), enabled: canLoadAdminData });

  if (user === undefined) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]"><div className="text-gray-400">Verificando acceso...</div></div>;
  }

  if (!user) {
    const handleLocalLogin = (event) => {
      event.preventDefault();
      setLocalLoginError("");

      const result = loginLocalAdmin(localPassword);
      if (!result.ok) {
        setLocalLoginError(result.message);
        return;
      }

      setUser(getLocalAdminUser());
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F4F8] gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center gap-4 max-w-sm text-center">
          <AlertCircle className="w-14 h-14 text-[#00509E]" />
          <h2 className="text-2xl font-bold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>Inicia sesión para entrar</h2>
          <p className="text-gray-500 text-sm">El panel de administración requiere una cuenta con permisos de administrador.</p>
          {isLocalAdminLoginEnabled() && (
            <form onSubmit={handleLocalLogin} className="w-full space-y-3">
              <Input
                type="password"
                value={localPassword}
                onChange={(event) => setLocalPassword(event.target.value)}
                placeholder="Contraseña local"
                className="h-11 text-center"
              />
              {localLoginError && <p className="text-xs text-red-500">{localLoginError}</p>}
              <Button type="submit" className="w-full bg-[#00509E] hover:bg-[#003366] text-white rounded-full">
                Entrar en local
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F4F8] gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center gap-4 max-w-sm text-center">
          <AlertCircle className="w-14 h-14 text-red-400" />
          <h2 className="text-2xl font-bold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>Acceso no autorizado</h2>
          <p className="text-gray-500 text-sm">Solo los administradores pueden acceder a este panel.</p>
          <Link to={createPageUrl("Home")}>
            <Button className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-8">Ir a inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const activeNav = NAV.find(n => n.key === activeTab);

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-[#003366] text-white flex flex-col transform transition-transform duration-300 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 lg:flex`}>
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <span className="font-bold text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>Admin Panel</span>
          <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setActiveTab(key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${activeTab === key ? "bg-white/20 text-white" : "text-blue-200 hover:bg-white/10 hover:text-white"}`}>
              <Icon className="w-4 h-4 shrink-0" />{label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link to={createPageUrl("Home")} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-all">
            ← Ver web
          </Link>
          <button
            onClick={() => {
              if (user.isLocalAdmin) {
                logoutLocalAdmin();
                setUser(null);
                return;
              }
              base44.auth.logout();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b px-4 md:px-6 h-14 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
              <span className="block w-5 h-0.5 bg-gray-600 mb-1"></span>
              <span className="block w-5 h-0.5 bg-gray-600 mb-1"></span>
              <span className="block w-5 h-0.5 bg-gray-600"></span>
            </button>
            <h1 className="font-semibold text-[#003366]" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {activeNav?.label || "Dashboard"}
            </h1>
          </div>
          <span className="text-xs text-gray-500 hidden sm:block">
            {user.full_name || user.email}
            {user.isLocalAdmin ? " · modo local" : ""}
          </span>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {activeTab === "dashboard" && (
            <AdminDashboard orders={orders} reservas={reservas} leads={leads} products={products} reviews={reviews} />
          )}
          {activeTab === "products" && <AdminProducts />}
          {activeTab === "services" && <AdminServices />}
          {activeTab === "reservas" && <AdminReservas />}
          {activeTab === "quotes" && <AdminQuotes />}
          {activeTab === "orders" && <AdminOrders />}
          {activeTab === "leads" && <AdminLeads />}
          {activeTab === "reviews" && <AdminReviews />}
          {activeTab === "settings" && <AdminSiteSettings />}
          {activeTab === "wizard" && <AdminWizard />}
          {activeTab === "booking_wizard" && <AdminBookingWizard />}
          {activeTab === "brand_wizard" && <AdminWizard wizardKey="brand_wizard" />}
          {activeTab === "quote_wizard" && <AdminQuoteWizard />}
          {activeTab === "cms" && <AdminCmsContent />}
          {activeTab === "exports" && <AdminExports />}
          {activeTab === "brands" && <AdminBrandPages />}
          {activeTab === "promo_slides" && <AdminPromoSlides />}
          {activeTab === "model_pages" && <AdminModelPages />}
        </main>
      </div>
    </div>
  );
}
