import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { DollarSign, Package, TrendingUp, ShoppingCart, RefreshCw } from "lucide-react";
import StatCard from "../components/StatCard";
import { api } from "../services/api";

// ── Mock data used when backend isn't available ───────────────────────────────
function buildMockAnalytics() {
  const days = 30;
  const daily_trend = Array.from({ length: days }, (_, i) => {
    const d = new Date("2023-11-01");
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().slice(0, 10),
      total_quantity: Math.round(4000 + Math.random() * 2000 + Math.sin(i / 5) * 800),
      total_revenue:  Math.round(180000 + Math.random() * 60000 + Math.sin(i / 5) * 20000),
      num_transactions: Math.round(1200 + Math.random() * 400),
    };
  });

  const categories = ["Footwear", "Apparel", "Electronics", "Sports", "Home", "Accessories"];
  const top_products = categories.map((cat, i) => ({
    product_id:    i + 1,
    product_name:  `${cat} Top Seller`,
    category:      cat,
    total_sold:    Math.round(8000 - i * 900 + Math.random() * 500),
    total_revenue: Math.round(350000 - i * 35000 + Math.random() * 20000),
  }));

  const cities = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai"];
  const store_summaries = cities.map((city, i) => ({
    store_id: i + 1, store_name: `Store-00${i + 1}`, city,
    total_sales:   Math.round(25000 - i * 2000 + Math.random() * 1500),
    total_revenue: Math.round(1100000 - i * 90000 + Math.random() * 50000),
  }));

  const total_revenue   = daily_trend.reduce((s, r) => s + r.total_revenue, 0);
  const total_units_sold = daily_trend.reduce((s, r) => s + r.total_quantity, 0);

  return { daily_trend, top_products, store_summaries, total_revenue, total_units_sold,
    period_start: daily_trend[0].date, period_end: daily_trend[daily_trend.length - 1].date };
}

const PIE_COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e", "#a78bfa"];

const fmt = (n) =>
  n >= 1_000_000 ? `₹${(n / 1e6).toFixed(1)}M`
  : n >= 1_000   ? `₹${(n / 1e3).toFixed(0)}K`
  : `₹${n}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.name === "Revenue" ? fmt(p.value) : p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSalesAnalytics({ start_date: "2023-11-01", end_date: "2023-11-30" });
      setAnalytics(data);
    } catch {
      setAnalytics(buildMockAnalytics());
      setError("Backend offline — showing demo data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading analytics…</p>
      </div>
    </div>
  );

  const a = analytics;
  const dailyForChart = a.daily_trend.slice(-30).map((d) => ({
    date:     d.date.slice(5),   // MM-DD
    Revenue:  d.total_revenue,
    Units:    d.total_quantity,
  }));

  // Category pie
  const catMap = {};
  a.top_products.forEach((p) => {
    catMap[p.category] = (catMap[p.category] || 0) + p.total_revenue;
  });
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Retail Analytics Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {a.period_start} → {a.period_end}
            {error && <span className="ml-2 text-amber-400">({error})</span>}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 rounded-lg text-gray-300 transition"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Revenue"    value={fmt(a.total_revenue)}    icon={DollarSign} color="indigo"  subtitle={`${a.period_start} — ${a.period_end}`} />
        <StatCard title="Units Sold"       value={a.total_units_sold?.toLocaleString()} icon={ShoppingCart} color="emerald" subtitle="Across all stores" />
        <StatCard title="Active Stores"    value={a.store_summaries?.length || 50}      icon={Package}      color="sky"    subtitle="Multi-city operations" />
        <StatCard title="Avg Daily Revenue" value={fmt(Math.round(a.total_revenue / (a.daily_trend?.length || 30)))} icon={TrendingUp} color="amber" subtitle="Per day this period" />
      </div>

      {/* Revenue + Units Trend */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-white mb-4">Revenue Trend (30 days)</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyForChart}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} interval={4} />
              <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Revenue Pie */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-white mb-4">Revenue by Category</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} strokeWidth={0}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products + Store Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top Products bar */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-white mb-4">Top 6 Products by Units Sold</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={a.top_products.slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="product_name" tick={{ fill: "#9ca3af", fontSize: 10 }} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total_sold" name="Units" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Store Performance table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-white mb-4">Store Performance</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left pb-2 font-medium">Store</th>
                <th className="text-left pb-2 font-medium">City</th>
                <th className="text-right pb-2 font-medium">Units</th>
                <th className="text-right pb-2 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {a.store_summaries.slice(0, 8).map((s) => (
                <tr key={s.store_id} className="text-gray-300">
                  <td className="py-2">{s.store_name}</td>
                  <td className="py-2 text-gray-500">{s.city}</td>
                  <td className="py-2 text-right">{s.total_sales.toLocaleString()}</td>
                  <td className="py-2 text-right text-indigo-400 font-medium">{fmt(s.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
