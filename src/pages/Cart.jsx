import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ArrowRight, Check, CreditCard, MapPin, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import InstallationDatePicker from "@/components/cart/InstallationDatePicker";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [step, setStep] = useState("cart"); // cart, datos, confirm
  const [form, setForm] = useState({
    customer_name: "", customer_email: "", customer_phone: "",
    address: "", city: "", postal_code: "", province: "", notes: ""
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u) return;
      setForm(prev => ({
        customer_name: u.full_name || prev.customer_name,
        customer_email: u.email || prev.customer_email,
        customer_phone: u.phone || prev.customer_phone,
        address: u.address || prev.address,
        city: u.city || prev.city,
        postal_code: u.postal_code || prev.postal_code,
        province: u.province || prev.province,
        notes: prev.notes,
      }));
    }).catch(() => {});
  }, []);
  const [preferredDates, setPreferredDates] = useState([]);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
  }, []);

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const updateQty = (index, delta) => {
    const newCart = [...cart];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
    updateCart(newCart);
  };

  const removeItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    updateCart(newCart);
  };

  const total = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const hasInstallation = cart.some(item => item.item_type === "service");

  const placeOrder = async () => {
    setSubmitting(true);
    const orderNumber = "AC-" + Date.now().toString(36).toUpperCase();
    await base44.entities.Order.create({
      order_number: orderNumber,
      ...form,
      items: cart.map(item => ({
        item_type: item.item_type || "product",
        product_id: item.product_id || "",
        product_name: item.product_name || "",
        service_id: item.service_id || "",
        service_name: item.service_name || "",
        quantity: item.quantity,
        price: item.price,
        with_installation: item.with_installation || false,
        extras: item.extras || []
      })),
      subtotal: total,
      total: total,
      notes: preferredDates.length > 0 ? `Días preferidos para instalación: ${preferredDates.join(", ")}` : form.notes,
      status: "pending"
    });
    localStorage.setItem("cart", "[]");
    window.dispatchEvent(new Event("cart-updated"));
    setOrderPlaced(true);
    setSubmitting(false);
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 md:p-12 text-center max-w-md w-full shadow-xl">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#003366] mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
            ¡Pedido confirmado!
          </h2>
          <p className="text-gray-600 mb-6">
            Te hemos enviado un email de confirmación. Nos pondremos en contacto contigo para concretar la fecha de instalación.
          </p>
          <Link to={createPageUrl("Home")}>
            <Button className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-8">
              Volver al inicio
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-[#003366] mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {step === "cart" ? "Tu carrito" : step === "datos" ? "Datos de envío" : "Confirmar pedido"}
        </h1>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {["Carrito", "Datos", "Confirmar"].map((label, i) => {
            const stepIndex = ["cart", "datos", "confirm"].indexOf(step);
            return (
              <React.Fragment key={label}>
                <div className={`flex items-center gap-2 ${i <= stepIndex ? "text-[#00509E]" : "text-gray-400"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i <= stepIndex ? "bg-[#00509E] text-white" : "bg-gray-200 text-gray-500"
                  }`}>{i + 1}</div>
                  <span className="text-sm font-medium hidden sm:inline">{label}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 ${i < stepIndex ? "bg-[#00509E]" : "bg-gray-200"}`} />}
              </React.Fragment>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {step === "cart" && (
            <motion.div key="cart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {cart.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">Tu carrito está vacío</p>
                  <Link to={createPageUrl("Products")}>
                    <Button className="bg-[#00509E] text-white rounded-full">Ver productos</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 md:p-6 flex items-center gap-4">
                      <div className="w-20 h-20 bg-[#F0F4F8] rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.product_name || item.service_name} className="w-full h-full object-contain p-2" />
                        ) : (
                          <ShoppingCart className="w-8 h-8 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#003366] text-sm truncate">
                          {item.item_type === "service" ? item.service_name : item.product_name}
                        </h3>
                        {item.item_type === "service" && (
                          <p className="text-xs text-[#00509E] font-medium">Servicio de instalación</p>
                        )}

                        <p className="font-bold text-[#003366] mt-1">{item.price?.toFixed(2)} €</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(i, -1)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(i, 1)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-bold text-[#003366] w-24 text-right hidden sm:block">
                        {(item.price * item.quantity).toFixed(2)} €
                      </p>
                      <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-500 p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Installation date picker */}
                  {hasInstallation && (
                    <InstallationDatePicker value={preferredDates} onChange={setPreferredDates} />
                  )}

                  {/* Total */}
                  <div className="bg-white rounded-2xl p-6 flex items-center justify-between">
                    <span className="text-lg font-semibold text-[#003366]">Total</span>
                    <span className="text-2xl font-bold text-[#003366]">{total.toFixed(2)} €</span>
                  </div>

                  <div className="flex justify-between">
                    <Link to={createPageUrl("Products")}>
                      <Button variant="ghost" className="text-gray-500"><ArrowLeft className="w-4 h-4 mr-1" /> Seguir comprando</Button>
                    </Link>
                    <Button onClick={() => setStep("datos")} className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-8">
                      Continuar <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === "datos" && (
            <motion.div key="datos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-2xl p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="font-semibold text-[#003366] mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#00509E]" /> Datos de contacto
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input placeholder="Nombre completo *" required value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} className="rounded-xl" />
                    <Input placeholder="Email *" required type="email" value={form.customer_email} onChange={e => setForm({...form, customer_email: e.target.value})} className="rounded-xl" />
                    <Input placeholder="Teléfono *" required value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} className="rounded-xl" />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-[#003366] mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#00509E]" /> Dirección de instalación
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input placeholder="Dirección *" required value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="rounded-xl sm:col-span-2" />
                    <Input placeholder="Ciudad *" required value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="rounded-xl" />
                    <Input placeholder="Código postal *" required value={form.postal_code} onChange={e => setForm({...form, postal_code: e.target.value})} className="rounded-xl" />
                    <Input placeholder="Provincia *" required value={form.province} onChange={e => setForm({...form, province: e.target.value})} className="rounded-xl" />
                  </div>
                </div>

                <Textarea
                  placeholder="Notas adicionales (piso, acceso, horario preferido para instalación...)"
                  value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                  className="rounded-xl"
                  rows={3}
                />
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setStep("cart")} className="text-gray-500">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Volver
                </Button>
                <Button
                  onClick={() => setStep("confirm")}
                  disabled={!form.customer_name || !form.customer_email || !form.customer_phone || !form.address || !form.city}
                  className="bg-[#00509E] hover:bg-[#003366] text-white rounded-full px-8"
                >
                  Revisar pedido <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6">
                  <h3 className="font-semibold text-[#003366] mb-4">Resumen del pedido</h3>
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between py-2 text-sm border-b last:border-0">
                      <span className="text-gray-700">
                        {item.item_type === "service" ? item.service_name : item.product_name} × {item.quantity}
                      </span>
                      <span className="font-semibold">{(item.price * item.quantity).toFixed(2)} €</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-4 text-lg font-bold text-[#003366]">
                    <span>Total</span>
                    <span>{total.toFixed(2)} €</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6">
                  <h3 className="font-semibold text-[#003366] mb-2">Datos de envío</h3>
                  <p className="text-sm text-gray-600">{form.customer_name} · {form.customer_phone} · {form.customer_email}</p>
                  <p className="text-sm text-gray-600">{form.address}, {form.postal_code} {form.city}, {form.province}</p>
                  {form.notes && <p className="text-sm text-gray-500 mt-2">Notas: {form.notes}</p>}
                  {preferredDates.length > 0 && (
                    <p className="text-sm text-[#00509E] mt-2">📅 Días preferidos para instalación: {preferredDates.join(", ")}</p>
                  )}
                </div>

                <div className="bg-blue-50 rounded-2xl p-4 text-sm text-[#00509E]">
                  <p>📞 Nos pondremos en contacto contigo para concretar la fecha de instalación.</p>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="ghost" onClick={() => setStep("datos")} className="text-gray-500">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Volver
                  </Button>
                  <Button
                    onClick={placeOrder}
                    disabled={submitting}
                    className="bg-[#FF6F61] hover:bg-[#e5574a] text-white rounded-full px-8 h-12 font-semibold shadow-lg shadow-[#FF6F61]/20"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {submitting ? "Procesando..." : `Confirmar pedido · ${total.toFixed(2)} €`}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}