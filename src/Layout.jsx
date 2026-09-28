import React, { useState, useEffect } from "react";
import AIAssistant from "@/components/shared/AIAssistant";
import { Link, useLocation } from "react-router-dom";

import { createPageUrl } from "./utils";
import { Menu, ShoppingCart, Phone, Mail, Clock, UserCircle2 } from "lucide-react";
import HeaderSearch from "@/components/layout/HeaderSearch";
import QuoteWizardModal from "@/components/services/QuoteWizardModal";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getLocalAdminUser } from "@/lib/local-admin-auth";

const NAV_ITEMS = [
{ label: "Productos", page: "Products" },
{ label: "Servicios", page: "Services" },
{ label: "Te ayudamos a elegir", page: "Wizard" },
{ label: "Reservar instalación", page: "Reservar" }];

const headerIconButtonClass =
  "relative inline-flex h-11 w-11 md:h-12 md:w-12 lg:h-10 lg:w-10 items-center justify-center rounded-xl hover:bg-[#F0F4F8] active:bg-[#E0EAF5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00509E]/35 transition-colors";

function useCart() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCount(cart.reduce((s, i) => s + (i.quantity || 1), 0));
    };
    update();
    window.addEventListener("cart-updated", update);
    return () => window.removeEventListener("cart-updated", update);
  }, []);
  return count;
}

function useAuthUser() {
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    const localAdmin = getLocalAdminUser();
    if (localAdmin) {
      setUser(localAdmin);
      return;
    }
    setUser(null);
  }, []);
  return user;
}

function useSiteSettings() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["site_settings"],
    queryFn: () => base44.entities.SiteSettings.list("updated_at", 1),
    select: (d) => d?.[0],
    staleTime: 1000 * 60 * 5
  });
  useEffect(() => {
    const unsub = base44.entities.SiteSettings.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["site_settings"] });
    });
    return unsub;
  }, [queryClient]);
  return query;
}

function ScrollToTop() {
  const { pathname, search } = useLocation();
  React.useEffect(() => {window.scrollTo({ top: 0, behavior: "instant" });}, [pathname, search]);
  return null;
}

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const cartCount = useCart();
  const authUser = useAuthUser();
  const { data: settings, isLoading: isLoadingSettings } = useSiteSettings();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isLoadingSettings && !settings) {
    return (
      <div className="min-h-screen bg-[#E2E8F0] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const siteName = settings?.site_name || "ClimaClaro";
  const tagline = settings?.tagline || "Instalacion profesional de climatizacion";
  const phone = settings?.phone || "";
  const whatsapp = settings?.whatsapp || "";
  const email = settings?.email || "";
  const schedule = settings?.schedule || "";
  const serviceArea = settings?.service_area || "";
  const serviceAreasList = settings?.service_areas_list?.length ? settings.service_areas_list : ["Madrid y alrededores", "Barcelona y alrededores", "Valencia y alrededores", "Sevilla y alrededores"];
  const footerText = settings?.footer_text || `(c) ${new Date().getFullYear()} ${siteName}. Todos los derechos reservados.`;
  const logoUrl = settings?.logo_url;
  const phoneHref = `tel:+${phone.replace(/\D/g, "")}`;
  const waHref = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;

  const isHome = currentPageName === "Home";

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Figtree', sans-serif", backgroundColor: "#E2E8F0" }}>
      <ScrollToTop />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Figtree:wght@300;400;500;600;700&display=swap');
        :root {
          --primary: #00509E;
          --primary-dark: #003366;
          --accent: #FF6F61;
          --bg-accent: #F0F4F8;
          --text: #333333;
        }
        h1, h2, h3, h4, h5, h6 { font-family: 'Poppins', sans-serif; }
      `}</style>

      {/* Top bar */}
      <div className="bg-[#003366] text-white text-xs py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-6">
            {phone && <a href={phoneHref} className="flex items-center gap-1.5 hover:text-blue-200 transition-colors">
              <Phone className="w-3 h-3" /> {phone}
            </a>}
            {email && <a href={`mailto:${email}`} className="flex items-center gap-1.5 hover:text-blue-200 transition-colors">
              <Mail className="w-3 h-3" /> {email}
            </a>}
          </div>
          <div className="flex items-center gap-6">
            {schedule && <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> {schedule}
            </span>}
            {serviceArea && <span className="flex items-center gap-1.5">{serviceArea}</span>}
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto px-3 md:px-6 h-[72px] flex items-center justify-between">
          <Link to={createPageUrl("Home")} className="flex items-center shrink-0">
            {logoUrl && <img src={logoUrl} alt={siteName} className="h-[34px] md:h-[52px] w-auto object-contain" />}
          </Link>
          <nav className="hidden lg:flex items-center gap-0">
            {NAV_ITEMS.map((item) =>
            <Link key={item.page} to={createPageUrl(item.page)} className="text-[#333] px-3 py-2 text-sm font-medium rounded-lg transition-all hover:bg-[#F0F4F8] whitespace-nowrap">
              {item.label}
            </Link>
            )}
          </nav>
          <div className="flex items-center gap-1 md:gap-1.5">
            <HeaderSearch buttonClassName={headerIconButtonClass} />
            <Link to="/presupuesto" className="hidden xl:inline-flex bg-[#00509E] hover:bg-[#003d7a] text-white rounded-full px-4 text-sm font-semibold shadow-lg shadow-[#00509E]/20 h-9 items-center whitespace-nowrap">
              Pide presupuesto
            </Link>
            <Link to={createPageUrl("Cart")} className={headerIconButtonClass} aria-label={`Carrito${cartCount > 0 ? `, ${cartCount} productos` : ""}`}>
              <ShoppingCart className="w-5 h-5 text-[#333]" />
              {cartCount > 0 &&
              <span className="absolute right-1 top-1 w-5 h-5 bg-[#00509E] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              }
            </Link>
            <Link to={createPageUrl("MiPerfil")} className={headerIconButtonClass} title="Mi perfil" aria-label="Mi perfil">
              <div className="w-8 h-8 rounded-full bg-[#e0eaf5] flex items-center justify-center">
                <UserCircle2 className="w-5 h-5 text-[#00509E]" />
              </div>
            </Link>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button type="button" className={`${headerIconButtonClass} lg:hidden`} aria-label="Abrir menú">
                  <Menu className="w-5 h-5 text-[#333]" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="p-6 border-b">
                  <div className="flex items-center">
                    {logoUrl && <img src={logoUrl} alt={siteName} className="h-[38px] w-auto object-contain" />}
                  </div>
                </div>
                <nav className="p-4 space-y-1">
                  {NAV_ITEMS.map((item) =>
                  <Link key={item.page} to={createPageUrl(item.page)} onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${currentPageName === item.page ? "bg-[#F0F4F8] text-[#00509E]" : "text-[#333] hover:bg-gray-50"}`}>
                    {item.label}
                  </Link>
                  )}
                </nav>
                <div className="p-4 mt-auto border-t">
                  <Link to="/presupuesto" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-[#00509E] hover:bg-[#003d7a] text-white rounded-full font-semibold">
                      Pide presupuesto
                    </Button>
                  </Link>
                  <div className="mt-4 space-y-2 text-xs text-gray-500">
                    {phone && <a href={phoneHref} className="flex items-center gap-2"><Phone className="w-3 h-3" /> {phone}</a>}
                    {email && <a href={`mailto:${email}`} className="flex items-center gap-2"><Mail className="w-3 h-3" /> {email}</a>}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[#003366] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="40" height="40" rx="8" fill="white" fillOpacity="0.1" />
                  <path d="M20 10C16.134 10 13 13.134 13 17C13 19.21 14.21 21.14 16 22.24V27C16 27.55 16.45 28 17 28H23C23.55 28 24 27.55 24 27V22.24C25.79 21.14 27 19.21 27 17C27 13.134 23.866 10 20 10ZM22 21.11V26H18V21.11C16.84 20.49 16 19.32 16 18C16 16.35 17.35 15 19 15H21C22.65 15 24 16.35 24 18C24 19.32 23.16 20.49 22 21.11Z" fill="white" />
                  <circle cx="20" cy="17" r="2" fill="#FF6F61" />
                </svg>
                <span className="text-lg font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{siteName}</span>
              </div>
              <p className="text-blue-200 text-sm leading-relaxed mb-4">{tagline}</p>
              <div className="space-y-2 text-sm">
                {phone && <a href={phoneHref} className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" /> {phone}
                </a>}
                {whatsapp && <a href={waHref} className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" /> WhatsApp: {whatsapp}
                </a>}
                {email && <a href={`mailto:${email}`} className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors">
                  <Mail className="w-4 h-4" /> {email}
                </a>}
                {schedule && <p className="flex items-center gap-2 text-blue-200">
                  <Clock className="w-4 h-4" /> {schedule}
                </p>}
              </div>
            </div>

            {/* Productos */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Productos</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><Link to={createPageUrl("Products") + "?category=monosplit"} className="hover:text-white transition-colors">Monosplit</Link></li>
                <li><Link to={createPageUrl("Products") + "?category=multisplit"} className="hover:text-white transition-colors">Multisplit</Link></li>
                <li><Link to={createPageUrl("Products") + "?category=conductos"} className="hover:text-white transition-colors">Conductos</Link></li>
                <li><Link to={createPageUrl("Products") + "?category=cassette"} className="hover:text-white transition-colors">Cassette</Link></li>
                <li><Link to={createPageUrl("Products") + "?category=portatil"} className="hover:text-white transition-colors">Portátiles</Link></li>
                <li><Link to={createPageUrl("Products") + "?category=accesorio"} className="hover:text-white transition-colors">Accesorios</Link></li>
              </ul>
            </div>

            {/* Servicios */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Servicios</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><Link to={createPageUrl("Services")} className="hover:text-white transition-colors">Instalación</Link></li>
                <li><Link to={createPageUrl("Services")} className="hover:text-white transition-colors">Mantenimiento</Link></li>
                <li><Link to={createPageUrl("Services")} className="hover:text-white transition-colors">Reparación</Link></li>
                <li><Link to={createPageUrl("Services")} className="hover:text-white transition-colors">Asesoría</Link></li>
                <li><Link to={createPageUrl("Wizard")} className="hover:text-white transition-colors">Te ayudamos a elegir</Link></li>
              </ul>
            </div>

            {/* Zonas + Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Zonas de servicio</h4>
              <ul className="space-y-2 text-sm text-blue-200 mb-6">
                {serviceAreasList.map((zone, i) => <li key={i}>{zone}</li>)}
              </ul>
              <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Legal e información</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><Link to={createPageUrl("ContentPage") + "?key=about.nosotros"} className="hover:text-white transition-colors">Nosotros</Link></li>
                <li><Link to={createPageUrl("ContentPage") + "?key=install.condiciones"} className="hover:text-white transition-colors">Condiciones de instalación</Link></li>
                <li><Link to={createPageUrl("ContentPage") + "?key=warranty.garantia"} className="hover:text-white transition-colors">Garantía</Link></li>
                <li><Link to={createPageUrl("ContentPage") + "?key=returns.devoluciones"} className="hover:text-white transition-colors">Política de devoluciones</Link></li>
                <li><Link to={createPageUrl("ContentPage") + "?key=legal.aviso"} className="hover:text-white transition-colors">Aviso legal</Link></li>
                <li><Link to={createPageUrl("ContentPage") + "?key=privacy.rgpd"} className="hover:text-white transition-colors">Política de privacidad</Link></li>
                <li><Link to={createPageUrl("ContentPage") + "?key=cookies.policy"} className="hover:text-white transition-colors">Política de cookies</Link></li>
                <li><Link to={createPageUrl("ContentPage") + "?key=terms.general"} className="hover:text-white transition-colors">Condiciones de contratación</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-blue-200 text-xs">{footerText || `(c) ${new Date().getFullYear()} ${siteName}. Todos los derechos reservados.`}</p>
            <div className="flex items-center gap-4 text-blue-200 text-xs">
              <span>Pago seguro con tarjeta, PayPal y Bizum</span>
              {authUser === null &&
              <Link to="/admin" className="text-white/30 hover:text-white/60 transition-colors text-xs">
                Acceso admin
              </Link>
              }
              {authUser?.role === "admin" &&
              <Link to={createPageUrl("Admin")} className="text-white/30 hover:text-white/60 transition-colors text-xs">
                Panel admin
              </Link>
              }
            </div>
          </div>
        </div>
      </footer>

      <AIAssistant />
      <QuoteWizardModal open={quoteOpen} onOpenChange={setQuoteOpen} service={null} />
    </div>);
}
