// @ts-nocheck
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, FileText, MessageCircle, Shield } from "lucide-react";
import { acceptPublicQuote, getPublicQuote } from "@/api/publicQuotesApi";
import {
  QUOTE_STATUS_CLASSES,
  QUOTE_STATUS_LABELS,
  buildQuoteWhatsAppUrl,
  downloadQuotePdf,
  formatMoney,
} from "@/lib/quoteUtils";

export default function QuotePublic() {
  const { id } = useParams();
  const token = new URLSearchParams(window.location.search).get("token");
  const queryClient = useQueryClient();

  const { data: quote, isLoading } = useQuery({
    queryKey: ["public_quote", id, token],
    queryFn: () => getPublicQuote(id, token),
    enabled: !!id,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!quote || quote.status === "accepted") return quote;
      return acceptPublicQuote(quote.id, token);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["public_quote", id, token] }),
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8] text-gray-400">Cargando presupuesto...</div>;
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8] px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-md">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#003366] mb-2">Enlace no valido</h1>
          <p className="text-gray-500 text-sm">Este enlace de presupuesto no es valido o ha caducado.</p>
        </div>
      </div>
    );
  }

  const publicQuote = { ...quote, public_token: token };
  const canAccept = ["draft", "sent"].includes(quote.status);
  const isAccepted = quote.status === "accepted";

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <section className="bg-[#003366] text-white py-10">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-blue-200 text-sm font-medium mb-2">ClimaClaro</p>
              <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Presupuesto {quote.quote_number}
              </h1>
              <p className="text-blue-100 mt-2">Equipo e instalacion de aire acondicionado en Madrid.</p>
            </div>
            <Badge className={`${QUOTE_STATUS_CLASSES[quote.status] || QUOTE_STATUS_CLASSES.draft} w-fit`}>
              {QUOTE_STATUS_LABELS[quote.status] || quote.status}
            </Badge>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-[#003366] mb-4">Datos del cliente</h2>
              <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
                <p><strong className="text-[#003366]">Nombre:</strong> {quote.customer_name}</p>
                <p><strong className="text-[#003366]">Telefono:</strong> {quote.customer_phone}</p>
                {quote.customer_email && <p><strong className="text-[#003366]">Email:</strong> {quote.customer_email}</p>}
                {[quote.customer_address, quote.customer_postal_code, quote.customer_city, quote.customer_province].filter(Boolean).length > 0 && (
                  <p className="sm:col-span-2"><strong className="text-[#003366]">Direccion de instalacion:</strong> {[quote.customer_address, quote.customer_postal_code, quote.customer_city, quote.customer_province].filter(Boolean).join(", ")}</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="font-bold text-[#003366]">Detalle del presupuesto</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-500">
                    <tr>
                      <th className="px-6 py-3">Concepto</th>
                      <th className="px-6 py-3 text-right">Cant.</th>
                      <th className="px-6 py-3 text-right">Precio</th>
                      <th className="px-6 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(quote.items || []).map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-6 py-4">
                          <div className="font-medium text-[#003366]">{item.name}</div>
                          {item.description && <div className="text-xs text-gray-500 mt-1">{item.description}</div>}
                        </td>
                        <td className="px-6 py-4 text-right">{item.quantity}</td>
                        <td className="px-6 py-4 text-right">{formatMoney(item.unit_price)}</td>
                        <td className="px-6 py-4 text-right font-semibold">{formatMoney(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-[#003366] mb-3">Condiciones</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.terms}</p>
              {/* quote.notes is internal admin context and must not be exposed on public quote pages. */}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><strong>{formatMoney(quote.subtotal)}</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">IVA ({quote.tax_rate || 21}%)</span><strong>{formatMoney(quote.tax_amount)}</strong></div>
                <div className="flex justify-between text-xl text-[#003366] border-t pt-4"><span>Total</span><strong>{formatMoney(quote.total)}</strong></div>
              </div>

              {quote.valid_until && (
                <p className="text-xs text-gray-400 mt-4">Valido hasta {new Date(`${quote.valid_until}T00:00:00`).toLocaleDateString("es-ES")}.</p>
              )}

              <div className="mt-6 space-y-3">
                {isAccepted ? (
                  <>
                    <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-green-800">Presupuesto aceptado</p>
                        <p className="text-xs text-green-700 mt-1">El siguiente paso es elegir fecha de instalacion.</p>
                      </div>
                    </div>
                    <Link to={`/Reservar?quote_id=${quote.id}&token=${encodeURIComponent(token)}`} className="block">
                      <Button className="w-full bg-[#00509E] hover:bg-[#003366] text-white rounded-full">
                        Reservar instalacion
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Button
                    onClick={() => acceptMutation.mutate()}
                    disabled={!canAccept || acceptMutation.isPending}
                    className="w-full bg-[#FF6F61] hover:bg-[#e5574a] text-white rounded-full"
                  >
                    {acceptMutation.isPending ? "Aceptando..." : "Aceptar presupuesto"}
                  </Button>
                )}

                <Button variant="outline" className="w-full rounded-full" onClick={() => downloadQuotePdf(publicQuote)}>
                  <Download className="w-4 h-4 mr-2" /> Descargar PDF
                </Button>
                {quote.customer_phone && (
                  <Button variant="outline" className="w-full rounded-full text-green-700 hover:bg-green-50" onClick={() => window.open(buildQuoteWhatsAppUrl(publicQuote), "_blank")}>
                    <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                  </Button>
                )}
              </div>

              <div className="flex gap-2 text-xs text-gray-500 mt-5">
                <Shield className="w-4 h-4 text-[#00509E] shrink-0" />
                <span>Presupuesto claro, sin compromiso y con atencion directa de ClimaClaro.</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
