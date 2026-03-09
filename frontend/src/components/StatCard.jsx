export default function StatCard({ title, value, subtitle, icon: Icon, color = "indigo", trend }) {
  const colors = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rose:   "bg-rose-500/10 text-rose-400 border-rose-500/20",
    sky:    "bg-sky-500/10 text-sky-400 border-sky-500/20",
  };
  const cls = colors[color] || colors.indigo;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start gap-4">
      {Icon && (
        <div className={`p-2.5 rounded-lg border ${cls} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{title}</p>
        <p className="text-2xl font-bold text-white mt-1 truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        {trend !== undefined && (
          <span className={`text-xs font-medium mt-1 inline-block ${trend >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last period
          </span>
        )}
      </div>
    </div>
  );
}
