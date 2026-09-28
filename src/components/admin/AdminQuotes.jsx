// @ts-nocheck
import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { createQuote, deleteQuote, listQuotes, updateQuote } from "@/api/quotesApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Copy,
  Download,
  Eye,
  FileText,
  MessageCircle,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import {
  DEFAULT_QUOTE_TERMS,
  EMPTY_QUOTE_ITEM,
  QUOTE_STATUS_CLASSES,
  QUOTE_STATUS_LABELS,
  buildQuoteWhatsAppUrl,
  calculateQuoteTotals,
  downloadQuotePdf,
  formatMoney,
  generateQuotePdfBlob,
  getDefaultValidUntil,
  getPublicQuoteUrl,
} from "@/lib/quoteUtils";

const EMPTY_FORM = {
  quote_number: "",
  status: "draft",
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  customer_address: "",
  customer_postal_code: "",
  customer_city: "Madrid",
  customer_province: "Madrid",
  public_token: "",
  source_type: "manual",
  source_id: "",
  items: [{ ...EMPTY_QUOTE_ITEM }],
  tax_rate: 21,
  valid_until: getDefaultValidUntil(),
  notes: "",
  terms: DEFAULT_QUOTE_TERMS,
  pdf_url: "",
};

const SOURCE_LABELS = {
  manual: "Manual",
  lead: "Lead",
  lead_landing: "Lead landing",
  presupuesto: "Solicitud presupuesto",
};

function sortByDateDesc(items) {
  return [...items].sort((a, b) => new Date(b.created_date || b.created_at || 0) - new Date(a.created_date || a.created_at || 0));
}

function sourceName(source) {
  if (!source) return "";
  return source.name || source.nombre || source.customer_name || "Sin nombre";
}

function sourcePhone(source) {
  return source?.phone || source?.telefono || source?.customer_phone || "";
}

function sourceEmail(source) {
  return source?.email || source?.customer_email || "";
}

function buildQuoteFromSource(type, source, current) {
  if (!source) return current;
  const base = {
    ...current,
    source_type: type,
    source_id: source.id,
    customer_name: sourceName(source),
    customer_phone: sourcePhone(source),
    customer_email: sourceEmail(source),
    customer_city: source.city || source.ciudad || current.customer_city,
  };

  if (type === "presupuesto") {
    return {
      ...base,
      notes: [source.descripcion, source.service_name ? `Servicio solicitado: ${source.service_name}` : ""]
        .filter(Boolean)
        .join("\n"),
      items: source.service_name
        ? [{ ...EMPTY_QUOTE_ITEM, type: "service", name: source.service_name, description: source.descripcion || "", service_id: source.service_id || "" }]
        : current.items,
    };
  }

  if (type === "lead") {
    return {
      ...base,
      notes: [source.message, source.wizard_data ? `Datos wizard: ${JSON.stringify(source.wizard_data)}` : ""]
        .filter(Boolean)
        .join("\n"),
    };
  }

  if (type === "lead_landing") {
    return {
      ...base,
      notes: [
        source.tipo_equipo ? `Tipo de equipo: ${source.tipo_equipo}` : "",
        source.metros_cuadrados ? `Superficie: ${source.metros_cuadrados}` : "",
        source.disponibilidad ? `Disponibilidad: ${source.disponibilidad}` : "",
        source.mensaje || "",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  return base;
}

export default function AdminQuotes() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [editQuote, setEditQuote] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data: quotes = [], isLoading, error: quotesError } = useQuery({
    queryKey: ["quotes"],
    queryFn: listQuotes,
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products_for_quotes"],
    queryFn: () => base44.entities.Product.filter({ active: true }, "sort_order", 300),
  });
  const { data: services = [] } = useQuery({
    queryKey: ["services_for_quotes"],
    queryFn: () => base44.entities.Service.filter({ active: true }, "sort_order", 200),
  });
  const { data: leads = [] } = useQuery({
    queryKey: ["leads_for_quotes"],
    queryFn: () => base44.entities.Lead.list("-created_date", 100),
  });
  const { data: leadLandings = [] } = useQuery({
    queryKey: ["lead_landings_for_quotes"],
    queryFn: () => base44.entities.LeadLanding.list("-created_date", 100),
  });
  const { data: presupuestoRequests = [] } = useQuery({
    queryKey: ["presupuesto_requests_for_quotes"],
    queryFn: () => base44.entities.Presupuesto.list("-created_date", 100),
  });

  const saveMutation = useMutation({
    mutationFn: (form) => {
      const payload = {
        ...form,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email || undefined,
      };
      return form.id ? updateQuote(form.id, payload) : createQuote(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setShowForm(false);
      setEditQuote(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateQuote(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteQuote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotes"] }),
  });

  const pdfMutation = useMutation({
    mutationFn: async (quote) => {
      const blob = generateQuotePdfBlob(quote);
      const file = new File([blob], `${quote.quote_number}.pdf`, { type: "application/pdf" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateQuote(quote.id, { ...quote, pdf_url: file_url, status: quote.status === "draft" ? "sent" : quote.status });
      return file_url;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotes"] }),
  });

  const filtered = useMemo(() => {
    const rows = filterStatus === "all" ? quotes : quotes.filter((q) => q.status === filterStatus);
    return sortByDateDesc(rows);
  }, [quotes, filterStatus]);

  const quoteApiError = [
    quotesError,
    saveMutation.error,
    updateMutation.error,
    deleteMutation.error,
    pdfMutation.error,
  ].find(Boolean);

  const openNew = () => {
    setEditQuote({
      ...EMPTY_FORM,
      valid_until: getDefaultValidUntil(),
    });
    setShowForm(true);
  };

  const openEdit = (quote) => {
    setEditQuote({
      ...EMPTY_FORM,
      ...quote,
      items: quote.items?.length ? quote.items : [{ ...EMPTY_QUOTE_ITEM }],
      tax_rate: quote.tax_rate ?? 21,
      valid_until: quote.valid_until || getDefaultValidUntil(),
      terms: quote.terms || DEFAULT_QUOTE_TERMS,
    });
    setShowForm(true);
  };

  const sourceLists = { lead: leads, lead_landing: leadLandings, presupuesto: presupuestoRequests };

  const ensurePublicToken = async (quote) => {
    if (quote.public_token) return quote;
    const updated = await updateQuote(quote.id, quote);
    queryClient.invalidateQueries({ queryKey: ["quotes"] });
    return updated;
  };

  const openPublicQuote = async (quote) => {
    const safeQuote = await ensurePublicToken(quote);
    window.open(getPublicQuoteUrl(safeQuote), "_blank");
  };

  const openWhatsApp = async (quote) => {
    const safeQuote = await ensurePublicToken(quote);
    window.open(buildQuoteWhatsAppUrl(safeQuote), "_blank");
  };

  const copyPublicLink = async (quote) => {
    const safeQuote = await ensurePublicToken(quote);
    navigator.clipboard?.writeText(getPublicQuoteUrl(safeQuote));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(QUOTE_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="bg-[#00509E] hover:bg-[#003366] text-white gap-2">
          <Plus className="w-4 h-4" /> Nuevo presupuesto
        </Button>
      </div>

      {quoteApiError && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {quoteApiError.message || "No se pudo conectar con la API propia de presupuestos."}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">Presupuesto</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Cliente</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Origen</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Total</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay presupuestos profesionales</td></tr>
              ) : filtered.map((quote) => (
                <tr key={quote.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#003366]">{quote.quote_number}</div>
                    <div className="text-xs text-gray-500">{quote.valid_until ? `Valido hasta ${quote.valid_until}` : "Sin fecha de validez"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#003366]">{quote.customer_name}</div>
                    <div className="text-xs text-gray-500">{quote.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{SOURCE_LABELS[quote.source_type] || quote.source_type}</td>
                  <td className="px-4 py-3 font-semibold">{formatMoney(quote.total)}</td>
                  <td className="px-4 py-3">
                    <Badge className={QUOTE_STATUS_CLASSES[quote.status] || QUOTE_STATUS_CLASSES.draft}>
                      {QUOTE_STATUS_LABELS[quote.status] || quote.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(quote)}><Eye className="w-3 h-3" /></Button>
                      <Button size="sm" variant="outline" onClick={() => pdfMutation.mutate(quote)} disabled={pdfMutation.isPending}>
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => quote.pdf_url ? window.open(quote.pdf_url, "_blank") : openPublicQuote(quote)}>
                        <FileText className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadQuotePdf(quote)}>
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => openWhatsApp(quote)}>
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => copyPublicLink(quote)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => confirm("Eliminar presupuesto?") && deleteMutation.mutate(quote.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditQuote(null); } }}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editQuote?.id ? `Editar ${editQuote.quote_number}` : "Nuevo presupuesto profesional"}</DialogTitle>
          </DialogHeader>
          {editQuote && (
            <QuoteForm
              form={editQuote}
              onChange={setEditQuote}
              onSave={() => saveMutation.mutate(editQuote)}
              saving={saveMutation.isPending}
              products={products}
              services={services}
              sourceLists={sourceLists}
              quoteApiError={quoteApiError}
              onOpenPublic={async (quote) => {
                const safeQuote = await ensurePublicToken(quote);
                setEditQuote((current) => current?.id === safeQuote.id ? safeQuote : current);
                window.open(getPublicQuoteUrl(safeQuote), "_blank");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuoteForm({ form, onChange, onSave, saving, products, services, sourceLists, quoteApiError, onOpenPublic }) {
  const totals = calculateQuoteTotals(form.items, form.tax_rate);
  const set = (field, value) => onChange({ ...form, [field]: value });
  const setItem = (index, patch) => {
    const items = [...(form.items || [])];
    items[index] = { ...items[index], ...patch };
    set("items", items);
  };
  const addItem = (item = EMPTY_QUOTE_ITEM) => set("items", [...(form.items || []), { ...item }]);
  const removeItem = (index) => set("items", (form.items || []).filter((_, i) => i !== index));

  const addProduct = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    addItem({
      ...EMPTY_QUOTE_ITEM,
      type: "product",
      name: product.name,
      description: product.brand ? `${product.brand}${product.power_kw ? ` - ${product.power_kw} kW` : ""}` : "",
      quantity: 1,
      unit_price: product.sale_price || product.price || 0,
      product_id: product.id,
    });
  };

  const addService = (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;
    addItem({
      ...EMPTY_QUOTE_ITEM,
      type: "service",
      name: service.title,
      description: service.short_description || "",
      quantity: 1,
      unit_price: service.price || 0,
      service_id: service.id,
    });
  };

  const selectSource = (type, id) => {
    const source = (sourceLists[type] || []).find((entry) => entry.id === id);
    onChange(buildQuoteFromSource(type, source, form));
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <div>
          <Label>Numero</Label>
          <Input value={form.quote_number || ""} onChange={(e) => set("quote_number", e.target.value)} placeholder="Se asigna al guardar" disabled={!form.id} />
        </div>
        <div>
          <Label>Estado</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(QUOTE_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>IVA (%)</Label>
          <Input type="number" value={form.tax_rate} onChange={(e) => set("tax_rate", parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label>Valido hasta</Label>
          <Input type="date" value={form.valid_until || ""} onChange={(e) => set("valid_until", e.target.value)} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
        <div>
          <Label>Crear desde Lead</Label>
          <Select value={form.source_type === "lead" ? form.source_id : ""} onValueChange={(id) => selectSource("lead", id)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar lead..." /></SelectTrigger>
            <SelectContent>{sourceLists.lead.map((l) => <SelectItem key={l.id} value={l.id}>{sourceName(l)} - {sourcePhone(l)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Desde landing</Label>
          <Select value={form.source_type === "lead_landing" ? form.source_id : ""} onValueChange={(id) => selectSource("lead_landing", id)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar solicitud..." /></SelectTrigger>
            <SelectContent>{sourceLists.lead_landing.map((l) => <SelectItem key={l.id} value={l.id}>{sourceName(l)} - {sourcePhone(l)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Desde Presupuesto actual</Label>
          <Select value={form.source_type === "presupuesto" ? form.source_id : ""} onValueChange={(id) => selectSource("presupuesto", id)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar solicitud..." /></SelectTrigger>
            <SelectContent>{sourceLists.presupuesto.map((p) => <SelectItem key={p.id} value={p.id}>{sourceName(p)} - {p.service_name || sourcePhone(p)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Nombre cliente *</Label>
          <Input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} />
        </div>
        <div>
          <Label>Telefono *</Label>
          <Input value={form.customer_phone} onChange={(e) => set("customer_phone", e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.customer_email || ""} onChange={(e) => set("customer_email", e.target.value)} />
        </div>
        <div>
          <Label>Direccion</Label>
          <Input value={form.customer_address || ""} onChange={(e) => set("customer_address", e.target.value)} />
        </div>
        <div>
          <Label>Codigo postal</Label>
          <Input value={form.customer_postal_code || ""} onChange={(e) => set("customer_postal_code", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Ciudad</Label>
            <Input value={form.customer_city || ""} onChange={(e) => set("customer_city", e.target.value)} />
          </div>
          <div>
            <Label>Provincia</Label>
            <Input value={form.customer_province || ""} onChange={(e) => set("customer_province", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <Select onValueChange={addProduct}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Anadir producto..." /></SelectTrigger>
            <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={addService}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Anadir servicio..." /></SelectTrigger>
            <SelectContent>{services.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}</SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={() => addItem()}><Plus className="w-4 h-4 mr-1" /> Linea manual</Button>
        </div>

        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">Concepto</th>
                <th className="px-3 py-2 w-24">Cant.</th>
                <th className="px-3 py-2 w-32">Precio</th>
                <th className="px-3 py-2 w-32">Total</th>
                <th className="px-3 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {(form.items || []).map((item, index) => {
                const lineTotal = (Number(item.quantity || 0) * Number(item.unit_price || 0)) || 0;
                return (
                  <tr key={index} className="border-t align-top">
                    <td className="px-3 py-2">
                      <Input value={item.name || ""} onChange={(e) => setItem(index, { name: e.target.value })} placeholder="Concepto" />
                      <Textarea className="mt-2" rows={2} value={item.description || ""} onChange={(e) => setItem(index, { description: e.target.value })} placeholder="Descripcion visible en PDF" />
                    </td>
                    <td className="px-3 py-2"><Input type="number" value={item.quantity ?? 1} onChange={(e) => setItem(index, { quantity: parseFloat(e.target.value) || 0 })} /></td>
                    <td className="px-3 py-2"><Input type="number" value={item.unit_price ?? 0} onChange={(e) => setItem(index, { unit_price: parseFloat(e.target.value) || 0 })} /></td>
                    <td className="px-3 py-2 font-semibold text-[#003366] pt-4">{formatMoney(lineTotal)}</td>
                    <td className="px-3 py-2 pt-3">
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeItem(index)}><Trash2 className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          <div>
            <Label>Condiciones</Label>
            <Textarea rows={3} value={form.terms || ""} onChange={(e) => set("terms", e.target.value)} />
          </div>
          <div>
            <Label>Notas internas / visibles</Label>
            <Textarea rows={3} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <div className="bg-[#F0F4F8] rounded-xl p-4 space-y-3 h-fit">
          <div className="flex justify-between text-sm"><span>Subtotal</span><strong>{formatMoney(totals.subtotal)}</strong></div>
          <div className="flex justify-between text-sm"><span>IVA ({totals.tax_rate}%)</span><strong>{formatMoney(totals.tax_amount)}</strong></div>
          <div className="flex justify-between text-lg text-[#003366] border-t pt-3"><span>Total</span><strong>{formatMoney(totals.total)}</strong></div>
          {quoteApiError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {quoteApiError.message || "No se pudo conectar con la API propia de presupuestos."}
            </div>
          )}
          {form.id && <Button variant="outline" className="w-full gap-2" onClick={() => onOpenPublic(form)}><Send className="w-4 h-4" /> Ver enlace publico</Button>}
          <Button onClick={onSave} disabled={saving || !form.customer_name || !form.customer_phone || totals.items.length === 0} className="w-full bg-[#00509E] hover:bg-[#003366] text-white gap-2">
            <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar presupuesto"}
          </Button>
        </div>
      </div>
    </div>
  );
}
