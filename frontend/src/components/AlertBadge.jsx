const STYLES = {
  CRITICAL: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  LOW:      "bg-amber-500/15 text-amber-400 border-amber-500/30",
  OVERSTOCK:"bg-sky-500/15 text-sky-400 border-sky-500/30",
  OK:       "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export default function AlertBadge({ level }) {
  const cls = STYLES[level] || STYLES.OK;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {level}
    </span>
  );
}
