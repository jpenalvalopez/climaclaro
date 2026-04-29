import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wrench, ShoppingCart, Check, ChevronRight, X, ChevronDown, ChevronUp, Plus, Minus, MapPin } from "lucide-react";
import { useCmsTexts } from "@/components/cms/cmsHelpers";

// Códigos postales de la Comunidad de Madrid: 28xxx y algunos 288xx
function isMadridPostalCode(cp) {
  const num = parseInt(cp, 10);
  return cp.length === 5 && num >= 28000 && num <= 28999;
}

export default function InstallationBannerModal({ product, isSelected, onToggle, matchedService }) {
  const [open, setOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [extraQtys, setExtraQtys] = useState({});
  const [postalCode, setPostalCode] = useState("");
  const [postalChecked, setPostalChecked] = useState(false);
  const [postalValid, setPostalValid] = useState(false);

  const checkPostalCode = () => {
    setPostalChecked(true);
    setPostalValid(isMadridPostalCode(postalCode.trim()));
  };
  const { t } = useCmsTexts();

  if (!matchedService) return null;

  const bannerTitle = t("product_detail.install_banner.title", "¿Quieres que lo instalemos nosotros?");
  const bannerSubtitle = t("product_detail.install_banner.subtitle", "Instalación profesional con garantía. Técnicos certificados en tu zona.");
  const bannerCta = t("product_detail.install_banner.cta", "Ver condiciones de instalación");
  const modalTitle = t("product_detail.install_modal.title", "Condiciones de instalación");

  // Datos del servicio coincidente o fallback de CMS
  const includedLines = matchedService?.includes?.length ?
  matchedService.includes :
  t("product_detail.install_modal.included", "Montaje de unidad interior y exterior\nHasta 3 metros de tubería de cobre\nCableado eléctrico\nDesagüe\nSoportes de unidad exterior\nPuesta en marcha y comprobación").
  split("\n").filter(Boolean);

  const notIncludedLines = matchedService?.excludes?.length ?
  matchedService.excludes :
  t("product_detail.install_modal.not_included", "Obra de albañilería\nTubería adicional más de 3 metros\nCableado eléctrico de nueva instalación").
  split("\n").filter(Boolean);

  const serviceExtras = matchedService?.extras || [];
  const installationPrice = matchedService?.price || product?.price_with_installation || null;

  const setQty = (name, delta, min = 1, max) => {
    setExtraQtys((prev) => {
      const current = prev[name] ?? 0;
      const next = Math.max(0, Math.min(max || 99, current + delta));
      if (next === 0) {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      }
      return { ...prev, [name]: Math.max(min, next) };
    });
  };

  const selectedExtrasTotal = serviceExtras.reduce((sum, ex) => {
    const qty = extraQtys[ex.name] || 0;
    return sum + qty * (ex.price || 0);
  }, 0);

  const handleAddInstallation = () => {
    onToggle?.(extraQtys);
    setOpen(false);
  };

  return (
    <>
      {/* Banner */}
      <button
        data-install-banner
        onClick={() => setOpen(true)}
        className={`w-full text-left rounded-xl p-4 flex items-center gap-3 transition-colors group border ${
        isSelected ?
        "bg-green-50 border-green-200 hover:bg-green-100/60" :
        "bg-blue-50 border-blue-100 hover:bg-blue-100/60"}`
        }>
        
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-green-500/15" : "bg-[#00509E]/10"}`}>
          {isSelected ? <Check className="w-4 h-4 text-green-600" /> : <Wrench className="w-4 h-4 text-[#00509E]" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm leading-tight ${isSelected ? "text-green-700" : "text-[#003366]"}`}>
            {isSelected ? "✓ Instalación añadida" : bannerTitle}
          </p>
          <p className="text-slate-800 mt-0.5 text-sm leading-snug">{bannerSubtitle}</p>
        </div>
        {isSelected ?
        <span className="text-xs text-green-600 font-semibold shrink-0 bg-green-100 px-2 py-1 rounded-full">Incluida</span> :

        <div className="flex items-center gap-1 text-xs text-[#00509E] shrink-0">
            <span className="hidden sm:inline">{bannerCta}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        }
      </button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#003366] text-xl" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {matchedService?.title || modalTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Verificador de código postal */}
            {!isSelected &&
            <div className="border border-[#00509E]/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#00509E]" />
                  <p className="text-[#003366] text-base font-semibold">¿Está en la Comunidad de Madrid?</p>
                </div>
                <p className="text-slate-700 text-sm">Introduce tu código postal para comprobar si realizamos instalación en tu zona.</p>
                <div className="flex gap-2">
                  <Input
                  placeholder="Ej: 28001"
                  value={postalCode}
                  onChange={(e) => {setPostalCode(e.target.value);setPostalChecked(false);}}
                  onKeyDown={(e) => e.key === "Enter" && checkPostalCode()}
                  maxLength={5}
                  className="rounded-lg flex-1" />
                
                  <Button
                  onClick={checkPostalCode}
                  disabled={postalCode.trim().length !== 5}
                  className="bg-[#003366] hover:bg-[#00509E] text-white rounded-lg shrink-0">
                  
                    Comprobar
                  </Button>
                </div>
                {postalChecked && postalValid &&
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 text-sm text-green-700">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>¡Perfecto! Realizamos instalaciones en tu zona (Comunidad de Madrid). Puedes añadir la instalación.</span>
                  </div>
              }
                {postalChecked && !postalValid &&
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-600">
                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Lo sentimos, de momento solo realizamos instalaciones en la Comunidad de Madrid.</span>
                  </div>
              }
              </div>
            }

            {/* Incluye */}
            <div className="bg-[#F0F4F8] rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Incluye</p>
              <ul className="space-y-2">
                {includedLines.map((line, i) =>
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {line}
                  </li>
                )}
              </ul>
            </div>

            {/* No incluye */}
            {notIncludedLines.length > 0 &&
            <div className="bg-red-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">No incluye</p>
                <ul className="space-y-2">
                  {notIncludedLines.map((line, i) =>
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      {line}
                    </li>
                )}
                </ul>
              </div>
            }

            {/* Precio base */}
            {installationPrice &&
            <div className="bg-[#00509E]/5 border border-[#00509E]/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#003366]">Instalación estándar</p>
                  <p className="text-xs text-gray-500 mt-0.5">Precio cerrado, sin sorpresas</p>
                </div>
                <span className="text-2xl font-bold text-[#00509E]">{Number(installationPrice).toFixed(2)} €</span>
              </div>
            }

            {/* Extras desplegable */}
            {serviceExtras.length > 0 &&
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                onClick={() => setExtrasOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                
                  <span className="font-semibold text-[#003366] text-sm">
                    Extras opcionales
                    {Object.keys(extraQtys).length > 0 &&
                  <span className="ml-2 text-xs bg-[#00509E] text-white rounded-full px-2 py-0.5">
                        {Object.keys(extraQtys).length} seleccionado{Object.keys(extraQtys).length > 1 ? "s" : ""}
                      </span>
                  }
                  </span>
                  {extrasOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>

                {extrasOpen &&
              <div className="divide-y divide-gray-100">
                    {serviceExtras.map((ex, i) => {
                  const qty = extraQtys[ex.name] || 0;
                  const min = ex.min_qty ?? 1;
                  const max = ex.max_qty || 99;
                  return (
                    <div key={i} className="px-4 py-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 font-medium">{ex.name}</p>
                            {ex.description && <p className="text-xs text-gray-400">{ex.description}</p>}
                            <p className="text-xs text-gray-500 mt-0.5">
                              +{Number(ex.price).toFixed(2)} € / {ex.unit || "ud."}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {qty > 0 ?
                        <>
                                <button
                            onClick={() => setQty(ex.name, -1, min, max)}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                            
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                                <button
                            onClick={() => setQty(ex.name, 1, min, max)}
                            className="w-7 h-7 rounded-lg bg-[#00509E]/10 hover:bg-[#00509E]/20 flex items-center justify-center">
                            
                                  <Plus className="w-3 h-3 text-[#00509E]" />
                                </button>
                              </> :

                        <button
                          onClick={() => setQty(ex.name, min, min, max)}
                          className="text-xs px-3 py-1.5 rounded-full border border-[#00509E] text-[#00509E] hover:bg-[#00509E]/10 transition-colors font-medium">
                          
                                Añadir
                              </button>
                        }
                          </div>
                        </div>);

                })}
                  </div>
              }
              </div>
            }

            {/* Total con extras */}
            {selectedExtrasTotal > 0 && installationPrice &&
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-green-700">Total instalación + extras</p>
                <span className="text-xl font-bold text-green-700">
                  {(Number(installationPrice) + selectedExtrasTotal).toFixed(2)} €
                </span>
              </div>
            }

            {/* CTAs */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={handleAddInstallation}
                disabled={!isSelected && (!postalChecked || !postalValid)}
                className={`w-full rounded-full font-semibold gap-2 ${isSelected ? "bg-red-500 hover:bg-red-600 text-white" : "bg-[#00509E] hover:bg-[#003366] text-white"} disabled:opacity-40 disabled:cursor-not-allowed`}>
                
                {isSelected ?
                <><X className="w-4 h-4" /> Quitar instalación</> :

                <><ShoppingCart className="w-4 h-4" /> {installationPrice ? `Añadir instalación${selectedExtrasTotal > 0 ? " + extras" : ""} (+${(Number(installationPrice) + selectedExtrasTotal).toFixed(2)} €)` : "Añadir instalación"}</>
                }
              </Button>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors text-center">
                
                Cerrar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>);

}