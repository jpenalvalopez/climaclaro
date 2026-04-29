import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, ShoppingCart, Calendar, Users, Package, Star } from "lucide-react";

const COLORS = ["#00509E", "#FF6F61", "#22c55e", "#a855f7", "#f59e0b", "#06b6d4"];

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function getLast6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: MONTH_NAMES[d.getMonth()] };
  });
}

export default function AdminDashboard({ orders, reservas, leads, products, reviews }) {
  const months = getLast6Months();

  // Ventas mensuales (total €)
  const salesData = useMemo(() => {
    return months.map(({ year, month, label }) => {
      const total = orders
        .filter(o => {
          const d = new Date(o.created_date);
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);
      return { label, total: Math.round(total) };
    });
  }, [orders, months]);

  // Pedidos mensuales (cantidad)
  const ordersData = useMemo(() => {
    return months.map(({ year, month, label }) => {
      const count = orders.filter(o => {
        const d = new Date(o.created_date);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length;
      return { label, count };
    });
  }, [orders, months]);

  // Servicios más contratados (por nombre en items)
  const topServices = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        if (item.item_type === "service") {
          const name = item.service_name || "Servicio";
          map[name] = (map[name] || 0) + (item.quantity || 1);
        }
      });
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders]);

  // Reservas próximas (próximos 30 días por día)
  const upcomingReservas = useMemo(() => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    const map = {};
    reservas.forEach(r => {
      if (!r.fecha) return;
      const d = new Date(r.fecha);
      if (d >= now && d <= in30) {
        const key = `${d.getDate()}/${d.getMonth() + 1}`;
        map[key] = (map[key] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => {
        const [da, ma] = a.day.split("/").map(Number);
        const [db, mb] = b.day.split("/").map(Number);
        return ma !== mb ? ma - mb : da - db;
      });
  }, [reservas]);

  // Estado de reservas (pie)
  const reservaStatusData = useMemo(() => {
    const map = { pendiente: 0, confirmada: 0, cancelada: 0 };
    reservas.forEach(r => { if (map[r.estado] !== undefined) map[r.estado]++; });
    return [
      { name: "Pendientes", value: map.pendiente },
      { name: "Confirmadas", value: map.confirmada },
      { name: "Canceladas", value: map.cancelada },
    ].filter(d => d.value > 0);
  }, [reservas]);

  // KPIs
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : "—";
  const completedOrders = orders.filter(o => o.status === "completed").length;
  const newLeads = leads.filter(l => l.status === "new").length;

  const kpis = [
    { label: "Ingresos totales", value: `${totalRevenue.toLocaleString("es-ES")} €`, icon: TrendingUp, color: "text-green-600 bg-green-50" },
    { label: "Pedidos completados", value: completedOrders, icon: ShoppingCart, color: "text-blue-600 bg-blue-50" },
    { label: "Reservas totales", value: reservas.length, icon: Calendar, color: "text-purple-600 bg-purple-50" },
    { label: "Leads nuevos", value: newLeads, icon: Users, color: "text-orange-600 bg-orange-50" },
    { label: "Productos activos", value: products.filter(p => p.active !== false).length, icon: Package, color: "text-indigo-600 bg-indigo-50" },
    { label: "Valoración media", value: avgRating, icon: Star, color: "text-yellow-600 bg-yellow-50" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm flex flex-col gap-2">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-[#003366]">{value}</div>
            <div className="text-xs text-gray-500 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Ventas mensuales + Reservas próximas */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ventas € mensuales */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-[#003366] mb-4 text-sm">Ingresos mensuales (€)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salesData} barSize={28}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={50}
                tickFormatter={v => `${v}€`} />
              <Tooltip formatter={v => [`${v} €`, "Ingresos"]} cursor={{ fill: "#F0F4F8" }} />
              <Bar dataKey="total" fill="#00509E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Reservas próximas 30 días */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-[#003366] mb-4 text-sm">Reservas próximas (30 días)</h3>
          {upcomingReservas.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-gray-300 text-sm">Sin reservas próximas</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={upcomingReservas}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip formatter={v => [v, "Reservas"]} />
                <Line type="monotone" dataKey="count" stroke="#FF6F61" strokeWidth={2} dot={{ r: 4, fill: "#FF6F61" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pedidos por mes + Servicios más contratados */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Nº pedidos mensuales */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-[#003366] mb-4 text-sm">Pedidos por mes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ordersData} barSize={28}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip formatter={v => [v, "Pedidos"]} cursor={{ fill: "#F0F4F8" }} />
              <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Servicios más contratados */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-[#003366] mb-4 text-sm">Servicios más contratados</h3>
          {topServices.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-gray-300 text-sm">Sin datos suficientes</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={topServices} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {topServices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, name) => [v, name]} />
                <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Estado de reservas */}
      {reservaStatusData.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-[#003366] mb-4 text-sm">Estado de reservas</h3>
          <div className="flex items-center gap-8 flex-wrap">
            {reservaStatusData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-sm text-gray-600">{d.name}:</span>
                <span className="font-bold text-[#003366]">{d.value}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={12} className="mt-3">
            <BarChart data={[{ ...Object.fromEntries(reservaStatusData.map(d => [d.name, d.value])) }]} layout="vertical">
              {reservaStatusData.map((d, i) => (
                <Bar key={d.name} dataKey={d.name} stackId="a" fill={COLORS[i]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}