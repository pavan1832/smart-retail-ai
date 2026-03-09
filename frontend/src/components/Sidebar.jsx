import {
  LayoutDashboard, TrendingUp, Bell, Store, Zap, ChevronRight
} from "lucide-react";

const NAV = [
  { id: "dashboard", label: "Dashboard",        icon: LayoutDashboard },
  { id: "forecast",  label: "Demand Forecast",  icon: TrendingUp },
  { id: "alerts",    label: "Inventory Alerts", icon: Bell },
  { id: "stores",    label: "Store Performance",icon: Store },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">SmartRetail</p>
            <p className="text-xs text-indigo-400 leading-tight">AI Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = activePage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {active && <ChevronRight className="w-3 h-3" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">v1.0.0 — Production</p>
        <p className="text-xs text-gray-600 mt-0.5">© 2024 SmartRetail AI</p>
      </div>
    </aside>
  );
}
