import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import DemandForecast from "./pages/DemandForecast";
import InventoryAlerts from "./pages/InventoryAlerts";
import StorePerformance from "./pages/StorePerformance";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [page, setPage] = useState("dashboard");

  const pages = {
    dashboard: <Dashboard />,
    forecast: <DemandForecast />,
    alerts: <InventoryAlerts />,
    stores: <StorePerformance />,
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <Sidebar activePage={page} onNavigate={setPage} />
      <main className="flex-1 overflow-y-auto">
        {pages[page] || <Dashboard />}
      </main>
    </div>
  );
}
