import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Search, Sparkles, TrendingUp, Package } from "lucide-react";
import { api } from "../services/api";

const STORES = [
  { id: 1, name: "Store-001 (Bangalore)" },
  { id: 2, name: "Store-002 (Mumbai)" },
  { id: 3, name: "Store-003 (Delhi)" },
  { id: 4, name: "Store-004 (Hyderabad)" },
  { id: 5, name: "Store-005 (Chennai)" },
];

const PRODUCTS = [
  { id: 1,  name: "Running Shoes v1" },
  { id: 2,  name: "Running Shoes v2" },
  { id: 7,  name: "T-Shirt v1" },
  { id: 13, name: "Earbuds v1" },
  { id: 19, name: "Sunglasses v1" },
  { id: 25, name: "Yoga Mat v1" },
  { id: 31, name: "Pillow v1" },
];

// Build a 7-day projected demand chart from a single forecast value
function buildForecastChart(predicted) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dailyAvg = predicted / 7;
  // Add variance to each day
  const rand = [0.85, 0.90, 0.95, 1.05, 1.10, 1.30, 1.20];
  return days.map((day, i) => ({
    day,
    forecast: Math.round(dailyAvg * rand[i]),
    actual:   i < 3 ? Math.round(dailyAvg * rand[i] * (0.9 + Math.random() * 0.2)) : null,
  }));
}

export default function DemandForecast() {
  const [storeId,   setStoreId]   = useState(1);
  const [productId, setProductId] = useState(1);
  const [promotion, setPromotion] = useState(0);
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.predictDemand({ store_id: storeId, product_id: productId, promotion });
      setResult(data);
    } catch (e) {
      // Demo fallback
      const demand = Math.round(150 + Math.random() * 100 + (promotion ? 60 : 0));
      setResult({
        store_name: STORES.find(s => s.id === storeId)?.name || `Store-${storeId}`,
        product_name: PRODUCTS.find(p => p.id === productId)?.name || `Product-${productId}`,
        predicted_demand: demand,
        horizon_days: 7,
        store_id: storeId, product_id: productId,
      });
      setError("Backend offline — showing demo prediction");
    } finally {
      setLoading(false);
    }
  };

  const chartData = result ? buildForecastChart(result.predicted_demand) : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Demand Forecast</h1>
        <p className="text-xs text-gray-500 mt-0.5">ML-powered 7-day demand prediction</p>
      </div>

      {/* Config panel */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-indigo-400" /> Configure Prediction
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Store</label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              {STORES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              {PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Promotion Active</label>
            <select
              value={promotion}
              onChange={(e) => setPromotion(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value={0}>No promotion</option>
              <option value={1}>Promotion active (+40%)</option>
            </select>
          </div>
        </div>
        <button
          onClick={handlePredict}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? "Predicting…" : "Run Prediction"}
        </button>
        {error && <p className="text-xs text-amber-400 mt-2">{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Store",            value: result.store_name,                           color: "text-indigo-400" },
              { label: "Product",          value: result.product_name,                         color: "text-cyan-400" },
              { label: "7-Day Forecast",   value: `${result.predicted_demand} units`,          color: "text-emerald-400" },
              { label: "Daily Avg",        value: `${Math.round(result.predicted_demand / 7)} units/day`, color: "text-amber-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                <p className={`text-lg font-bold mt-1 ${color} leading-tight`}>{value}</p>
              </div>
            ))}
          </div>

          {/* 7-day chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              7-Day Demand Projection — {result.product_name}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Projected total: <span className="text-indigo-400 font-semibold">{result.predicted_demand} units</span>
              {promotion === 1 && <span className="ml-2 text-emerald-400">🏷 Promotion applied</span>}
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#9ca3af" }}
                />
                <Bar dataKey="forecast" name="Forecast" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.9} />
                <Bar dataKey="actual"   name="Actual"   fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 mt-2">
              🟣 Forecast &nbsp; 🟢 Actual (Mon–Wed, simulated)
            </p>
          </div>
        </>
      )}
    </div>
  );
}
