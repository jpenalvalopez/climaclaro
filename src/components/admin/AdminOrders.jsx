import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  installation_scheduled: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600"
};
const STATUS_LABELS = {
  pending: "Pendiente", confirmed: "Confirmado",
  installation_scheduled: "Instalación programada", completed: "Completado", cancelled: "Cancelado"
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => base44.entities.Order.list("-created_date", 200)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] })
  });

  const filtered = filterStatus === "all" ? orders : orders.filter(o => o.status === filterStatus);

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">Cliente</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Ciudad</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Total</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Fecha</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay pedidos</td></tr>
              ) : filtered.map(order => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#003366]">{order.customer_name}</div>
                    <div className="text-xs text-gray-500">{order.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.city || "—"}</td>
                  <td className="px-4 py-3 font-semibold">{order.total ? `${order.total?.toLocaleString("es-ES")}€` : "—"}</td>
                  <td className="px-4 py-3">
                    <Select value={order.status} onValueChange={v => updateMutation.mutate({ id: order.id, data: { status: v } })}>
                      <SelectTrigger className="h-7 text-xs w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {format(new Date(order.created_date), "d MMM yy", { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>Ver</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Pedido de {selectedOrder?.customer_name}</DialogTitle></DialogHeader>
                        {selectedOrder && (
                          <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                              <div><strong>Email:</strong><br />{selectedOrder.customer_email}</div>
                              <div><strong>Teléfono:</strong><br />
                                <a href={`tel:${selectedOrder.customer_phone}`} className="text-[#00509E]">{selectedOrder.customer_phone}</a>
                              </div>
                              <div className="col-span-2"><strong>Dirección:</strong><br />{selectedOrder.address}, {selectedOrder.postal_code} {selectedOrder.city}</div>
                            </div>
                            {selectedOrder.items && selectedOrder.items.length > 0 && (
                              <div>
                                <strong className="block mb-2">Productos:</strong>
                                {selectedOrder.items.map((item, i) => (
                                  <div key={i} className="flex justify-between py-2 border-b">
                                    <div>{item.product_name} x{item.quantity}</div>
                                    <div>{item.price?.toLocaleString("es-ES")}€</div>
                                  </div>
                                ))}
                                <div className="flex justify-between pt-2 font-bold">
                                  <div>Total</div>
                                  <div>{selectedOrder.total?.toLocaleString("es-ES")}€</div>
                                </div>
                              </div>
                            )}
                            {selectedOrder.notes && <div><strong>Notas:</strong> {selectedOrder.notes}</div>}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}