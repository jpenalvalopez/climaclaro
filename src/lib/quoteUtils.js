import jsPDF from "jspdf";

export const QUOTE_STATUS_LABELS = {
  draft: "Borrador",
  sent: "Enviado",
  accepted: "Aceptado",
  rejected: "Rechazado",
  expired: "Caducado",
};

export const QUOTE_STATUS_CLASSES = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-amber-100 text-amber-800",
};

export const DEFAULT_QUOTE_TERMS =
  "Presupuesto valido hasta la fecha indicada. Incluye materiales y mano de obra descritos. Cualquier trabajo no incluido se confirmara antes de realizarse.";

export const EMPTY_QUOTE_ITEM = {
  type: "custom",
  name: "",
  description: "",
  quantity: 1,
  unit_price: 0,
  tax_rate: 21,
  total: 0,
  product_id: "",
  service_id: "",
};

const moneyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export function formatMoney(value) {
  return moneyFormatter.format(Number(value || 0));
}

export function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

export function normalizeQuoteItems(items = [], defaultTaxRate = 21) {
  return items
    .filter((item) => item && String(item.name || "").trim())
    .map((item) => {
      const quantity = Math.max(0, Number(item.quantity || 0));
      const unitPrice = roundCurrency(item.unit_price);
      const taxRate = Number(item.tax_rate ?? defaultTaxRate);
      return {
        type: item.type || "custom",
        name: String(item.name || "").trim(),
        description: String(item.description || "").trim(),
        quantity,
        unit_price: unitPrice,
        tax_rate: taxRate,
        total: roundCurrency(quantity * unitPrice),
        product_id: item.product_id || "",
        service_id: item.service_id || "",
      };
    });
}

export function calculateQuoteTotals(items = [], taxRate = 21) {
  const normalized = normalizeQuoteItems(items, taxRate);
  const subtotal = roundCurrency(normalized.reduce((sum, item) => sum + item.total, 0));
  const taxAmount = roundCurrency(subtotal * (Number(taxRate || 0) / 100));
  const total = roundCurrency(subtotal + taxAmount);
  return { items: normalized, subtotal, tax_rate: Number(taxRate || 0), tax_amount: taxAmount, total };
}

export function getDefaultValidUntil(days = 15) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function generateNextQuoteNumber(quotes = [], now = new Date()) {
  const year = now.getFullYear();
  const prefix = `PRES-${year}-`;
  // TODO: Move quote numbering server-side/transactional if multiple admins create quotes concurrently.
  const max = quotes.reduce((highest, quote) => {
    const value = quote.quote_number || "";
    if (!value.startsWith(prefix)) return highest;
    const num = parseInt(value.slice(prefix.length), 10);
    return Number.isFinite(num) ? Math.max(highest, num) : highest;
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export function generatePublicQuoteToken() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function getPublicQuoteUrl(quote) {
  if (!quote?.id || !quote?.public_token) return "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/quote/${quote.id}?token=${encodeURIComponent(quote.public_token)}`;
}

export function buildQuoteWhatsAppUrl(quote) {
  const phone = String(quote?.customer_phone || "").replace(/\D/g, "");
  const target = phone.length === 9 ? `34${phone}` : phone;
  const text = [
    `Hola ${quote.customer_name || ""}, te envio tu presupuesto de ClimaClaro ${quote.quote_number}.`,
    `Total: ${formatMoney(quote.total)}.`,
    `Puedes verlo y aceptarlo aqui: ${getPublicQuoteUrl(quote)}`,
  ].join(" ");
  return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight = 5) {
  const lines = doc.splitTextToSize(String(text || ""), maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export function generateQuotePdfBlob(quote) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2;
  const primary = "#00509E";
  const navy = "#003366";

  doc.setFillColor(primary);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ClimaClaro", margin, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Venta e instalacion de aire acondicionado en Madrid", margin, 22);

  doc.setTextColor(navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Presupuesto", margin, 42);
  doc.setFontSize(11);
  doc.text(quote.quote_number || "", 150, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#4B5563");
  doc.text(`Fecha: ${new Date(quote.created_date || Date.now()).toLocaleDateString("es-ES")}`, 150, 49);
  if (quote.valid_until) doc.text(`Valido hasta: ${new Date(`${quote.valid_until}T00:00:00`).toLocaleDateString("es-ES")}`, 150, 55);

  doc.setDrawColor("#D8E1EA");
  doc.line(margin, 63, pageWidth - margin, 63);

  doc.setTextColor(navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Cliente", margin, 73);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#374151");
  doc.text(quote.customer_name || "-", margin, 80);
  doc.text(quote.customer_phone || "-", margin, 86);
  if (quote.customer_email) doc.text(quote.customer_email, margin, 92);
  const address = [quote.customer_address, quote.customer_postal_code, quote.customer_city, quote.customer_province].filter(Boolean).join(", ");
  if (address) addWrappedText(doc, address, margin, 98, 78, 4.5);

  let y = 115;
  doc.setFillColor("#F0F4F8");
  doc.roundedRect(margin, y - 7, contentWidth, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(navy);
  doc.text("Concepto", margin + 3, y - 1);
  doc.text("Cant.", 123, y - 1);
  doc.text("Precio", 143, y - 1);
  doc.text("Total", 174, y - 1);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setTextColor("#374151");
  (quote.items || []).forEach((item) => {
    if (y > 245) {
      doc.addPage();
      y = 24;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(item.name || "-", margin + 3, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(item.quantity || 0), 126, y, { align: "right" });
    doc.text(formatMoney(item.unit_price), 158, y, { align: "right" });
    doc.text(formatMoney(item.total), 194, y, { align: "right" });
    y += 5;
    if (item.description) {
      doc.setFontSize(8);
      doc.setTextColor("#6B7280");
      y = addWrappedText(doc, item.description, margin + 3, y, 100, 4);
      doc.setTextColor("#374151");
    }
    doc.setDrawColor("#EEF2F7");
    doc.line(margin, y + 1, pageWidth - margin, y + 1);
    y += 7;
  });

  y = Math.max(y, 190);
  doc.setFontSize(10);
  doc.setTextColor("#374151");
  doc.text("Subtotal", 145, y);
  doc.text(formatMoney(quote.subtotal), 194, y, { align: "right" });
  y += 7;
  doc.text(`IVA (${quote.tax_rate || 21}%)`, 145, y);
  doc.text(formatMoney(quote.tax_amount), 194, y, { align: "right" });
  y += 9;
  doc.setFillColor(primary);
  doc.roundedRect(140, y - 6, 54, 11, 2, 2, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.text("Total", 145, y + 1);
  doc.text(formatMoney(quote.total), 191, y + 1, { align: "right" });

  y += 18;
  doc.setTextColor(navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Condiciones", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#4B5563");
  doc.setFontSize(8);
  y = addWrappedText(doc, quote.terms || DEFAULT_QUOTE_TERMS, margin, y + 6, contentWidth, 4);
  if (quote.notes) {
    // quote.notes is internal admin context and must not be exposed in customer-facing PDFs.
  }

  doc.setTextColor("#6B7280");
  doc.setFontSize(8);
  doc.text("ClimaClaro - Presupuesto profesional sin compromiso", margin, 286);

  return doc.output("blob");
}

export function downloadQuotePdf(quote) {
  const blob = generateQuotePdfBlob(quote);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${quote.quote_number || "presupuesto"}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
