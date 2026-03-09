import { useState, useEffect } from "react";
import { Bell, AlertTriangle, TrendingDown, Package } from "lucide-react";
import AlertBadge from "../components/AlertBadge";
import { api } from "../services/api";

// Demo alert data when backend is offline
function buildDemoAlerts() {
  const products = [
    "Running Shoes v1", "T-Shirt v2", "Earbuds v3", "Yoga Mat v1",
    "Jeans v2", "Sunglasses v1", "Power Bank v2", "Cricket Bat v1",
    "Smart Watch v1", "Jacket v3", "Boots v1", "Dumbbell v2",
  ];
  const cities = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai"];
  const levels = ["CRITICAL", "CRITICAL", "LOW", "LOW", "OVERSTOCK"];

  return products.map((name, i) => {
    const level = levels[i % levels.length];
    const demand = Math.round(80 + Math.random() * 120);
    const stock  = level === "CRITICAL" ? Math.round(demand * 0.1)
                 : level === "LOW"      ? Math.round(demand * 0.35)
                                        : Math.round(demand * 3.2);
    return {
      store_id:            i + 1,
      store_name:          `Store-00${(i % 10) + 1}`,
      city:                cities[i % cities.length],
      product_id:          i + 1,
      product_name:        name,
      alert_level:         level,
      current_stock:       stock,
      predicted_demand:    demand,
      recommended_restock: Math.max(0, Math.round(demand * 1.3 - stock)),
    };
  });
}

const LEVEL_ICON = {
  CRITICAL: <AlertTriangle className="w-4 h-4 text-rose-400" />,
  LOW:      <TrendingDown  className="w-4 h-4 text-amber-400" />,
  OVERSTOCK:<Package       className="w-4 h-4 text-sky-400" />,
};

export default function InventoryAlerts() {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("ALL");
  const [error,   setError]   = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAlerts({ limit: 50 });
        setAlerts(data);
      } catch {
        setAlerts(buildDemoAlerts());
        setError("Backend offline — showing demo alerts");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counts = {
    ALL:      alerts.length,
    CRITICAL: alerts.filter(a => a.alert_level === "CRITICAL").length,
    LOW:      alerts.filter(a => a.alert_level === "LOW").length,
    OVERSTOCK:alerts.filter(a => a.alert_level === "OVERSTOCK").length,
  };

  const visible = filter === "ALL" ? alerts : alerts.filter(a => a.alert_level === filter);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" /> Inventory Alerts
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time low-stock and overstock warnings
            {error && <span className="ml-2 text-amber-400">({error})</span>}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: "ALL",       label: "Total Alerts", color: "text-white",         bg: "bg-gray-800" },
          { key: "CRITICAL",  label: "Critical",     color: "text-rose-400",      bg: "bg-rose-500/10" },
          { key: "LOW",       label: "Low Stock",    color: "text-amber-400",     bg: "bg-amber-500/10" },
          { key: "OVERSTOCK", label: "Overstock",    color: "text-sky-400",       bg: "bg-sky-500/10" },
        ].map(({ key, label, color, bg }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`${bg} border ${filter === key ? "border-indigo-500" : "border-gray-800"} rounded-xl p-4 text-left transition hover:border-indigo-500/50`}
          >
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{counts[key]}</p>
          </button>
        ))}
      </div>

      {/* Alerts table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">
            {filter === "ALL" ? "All Alerts" : `${filter} Alerts`}
            <span className="ml-2 text-xs text-gray-500">({visible.length})</span>
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 bg-gray-800/50">
                <th className="text-left px-5 py-3 font-medium">Alert</th>
                <th className="text-left px-4 py-3 font-medium">Store</th>
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-right px-4 py-3 font-medium">Current Stock</th>
                <th className="text-right px-4 py-3 font-medium">7-Day Demand</th>
                <th className="text-right px-5 py-3 font-medium">Restock Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {visible.map((a, i) => (
                <tr key={i} className="text-gray-300 hover:bg-gray-800/30 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {LEVEL_ICON[a.alert_level]}
                      <AlertBadge level={a.alert_level} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{a.store_name}</p>
                    <p className="text-gray-500">{a.city}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{a.product_name}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={a.alert_level === "CRITICAL" ? "text-rose-400 font-semibold" : a.alert_level === "OVERSTOCK" ? "text-sky-400 font-semibold" : "text-amber-400 font-semibold"}>
                      {a.current_stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">{a.predicted_demand}</td>
                  <td className="px-5 py-3 text-right">
                    {a.alert_level === "OVERSTOCK" ? (
                      <span className="text-sky-400">—</span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">+{a.recommended_restock}</span>
                    )}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-600">No alerts for this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
