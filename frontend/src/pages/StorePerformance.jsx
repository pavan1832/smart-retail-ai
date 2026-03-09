import { useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Store, MapPin } from "lucide-react";
import { api } from "../services/api";

const CITIES = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai"];

const CITY_STATS = {
  Bangalore:  { revenue: 1_250_000, units: 28_400, stores: 12, growth: 14.2 },
  Mumbai:     { revenue: 1_100_000, units: 24_800, stores: 10, growth: 9.8  },
  Delhi:      { revenue:   980_000, units: 22_000, stores:  9, growth: 7.4  },
  Hyderabad:  { revenue:   820_000, units: 18_500, stores:  8, growth: 11.1 },
  Chennai:    { revenue:   690_000, units: 15_200, stores:  7, growth: 6.3  },
};

const RADAR_DATA = [
  { metric: "Revenue",  Bangalore: 95, Mumbai: 84, Delhi: 75, Hyderabad: 63, Chennai: 53 },
  { metric: "Growth",   Bangalore: 90, Mumbai: 62, Delhi: 47, Hyderabad: 70, Chennai: 40 },
  { metric: "Avg Ticket",Bangalore: 78,Mumbai: 82, Delhi: 70, Hyderabad: 65, Chennai: 60 },
  { metric: "Footfall", Bangalore: 85, Mumbai: 90, Delhi: 88, Hyderabad: 72, Chennai: 68 },
  { metric: "Fill Rate",Bangalore: 80, Mumbai: 75, Delhi: 70, Hyderabad: 85, Chennai: 78 },
];

const CITY_COLORS = {
  Bangalore: "#6366f1",
  Mumbai:    "#22d3ee",
  Delhi:     "#f59e0b",
  Hyderabad: "#10b981",
  Chennai:   "#f43f5e",
};

const fmt = (n) =>
  n >= 1_000_000 ? `₹${(n / 1e6).toFixed(1)}M` : `₹${(n / 1e3).toFixed(0)}K`;

export default function StorePerformance() {
  const [selected, setSelected] = useState("Bangalore");
  const stats = CITY_STATS[selected];

  const barData = CITIES.map((c) => ({
    city: c,
    Revenue: CITY_STATS[c].revenue,
    Units: CITY_STATS[c].units,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Store className="w-5 h-5 text-indigo-400" /> Store Performance
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Multi-city retail operations overview</p>
      </div>

      {/* City selector */}
      <div className="flex flex-wrap gap-2">
        {CITIES.map((city) => (
          <button
            key={city}
            onClick={() => setSelected(city)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition ${
              selected === city
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600"
            }`}
          >
            <MapPin className="w-3 h-3" />
            {city}
          </button>
        ))}
      </div>

      {/* City KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue",  value: fmt(stats.revenue), color: "text-indigo-400" },
          { label: "Units Sold",     value: stats.units.toLocaleString(), color: "text-emerald-400" },
          { label: "Active Stores",  value: stats.stores, color: "text-cyan-400" },
          { label: "YoY Growth",     value: `+${stats.growth}%`, color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{selected} region</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Revenue by city bar */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-white mb-4">Revenue by City</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="city" tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} />
              <YAxis tickFormatter={(v) => `₹${(v/1e6).toFixed(1)}M`} tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => fmt(v)}
                contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="Revenue" radius={[4, 4, 0, 0]}>
                {barData.map((entry) => (
                  <rect key={entry.city} fill={CITY_COLORS[entry.city]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-white mb-4">Performance Metrics — {selected} vs Network</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="#1f2937" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Radar name={selected} dataKey={selected} stroke={CITY_COLORS[selected]} fill={CITY_COLORS[selected]} fillOpacity={0.25} strokeWidth={2} />
              <Radar name="Mumbai"   dataKey="Mumbai"   stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.1}  strokeWidth={1} strokeDasharray="4 4" />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Store table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <p className="text-sm font-semibold text-white">Stores in {selected} ({stats.stores} locations)</p>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 bg-gray-800/50">
              <th className="text-left px-5 py-3 font-medium">Store ID</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-right px-4 py-3 font-medium">Revenue</th>
              <th className="text-right px-4 py-3 font-medium">Units Sold</th>
              <th className="text-right px-5 py-3 font-medium">Fill Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {Array.from({ length: stats.stores }, (_, i) => {
              const rev = Math.round((stats.revenue / stats.stores) * (0.7 + Math.random() * 0.6));
              const units = Math.round((stats.units / stats.stores) * (0.7 + Math.random() * 0.6));
              const fill = Math.round(70 + Math.random() * 25);
              return (
                <tr key={i} className="text-gray-300 hover:bg-gray-800/30">
                  <td className="px-5 py-2.5 text-gray-500">#{String(i + 1).padStart(3, "0")}</td>
                  <td className="px-4 py-2.5 font-medium text-white">{selected} Store {i + 1}</td>
                  <td className="px-4 py-2.5 text-right text-indigo-400 font-semibold">{fmt(rev)}</td>
                  <td className="px-4 py-2.5 text-right">{units.toLocaleString()}</td>
                  <td className="px-5 py-2.5 text-right">
                    <span className={fill >= 90 ? "text-emerald-400" : fill >= 75 ? "text-amber-400" : "text-rose-400"}>
                      {fill}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
