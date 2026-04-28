import { createFileRoute } from "@tanstack/react-router";
import { AppProvider, useApp } from "@/medsmart/AppContext";
import { ToastProvider } from "@/medsmart/shared/Toast";
import Login from "@/medsmart/Login";
import Shell from "@/medsmart/Shell";
import { StoreDashboard, DiseaseMonitor, DemandForecast, AISuggestions, Inventory, StockTransfers, AutoRedistribute, Analytics } from "@/medsmart/store/StoreSections";
import { PatientDashboard, HealthAlerts, MedicineSearch, PurchaseHistory } from "@/medsmart/patient/PatientSections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PharmaLink — Healthcare Supply Intelligence" },
      { name: "description", content: "Real-time disease intelligence, AI-powered demand forecasting and generic medicine discovery for pharmacies and patients." },
      { property: "og:title", content: "PharmaLink — Healthcare Supply Intelligence" },
      { property: "og:description", content: "Smart pharmacy operations and patient savings, in one platform." },
    ],
  }),
  component: () => (
    <AppProvider>
      <ToastProvider>
        <Root />
      </ToastProvider>
    </AppProvider>
  ),
});

function Root() {
  const { user, section, setSection } = useApp();
  if (!user) return <Login />;
  return (
    <Shell>
      {user.role === "store" ? renderStore(section) : renderPatient(section, setSection)}
    </Shell>
  );
}

function renderStore(s: string) {
  switch (s) {
    case "disease": return <DiseaseMonitor />;
    case "forecast": return <DemandForecast />;
    case "ai": return <AISuggestions />;
    case "inventory": return <Inventory />;
    case "transfers": return <StockTransfers />;
    case "redistribute": return <AutoRedistribute />;
    case "analytics": return <Analytics />;
    default: return <StoreDashboard />;
  }
}

function renderPatient(s: string, go: (s: string) => void) {
  switch (s) {
    case "alerts": return <HealthAlerts />;
    case "search": return <MedicineSearch />;
    case "history": return <PurchaseHistory />;
    default: return <PatientDashboard go={go} />;
  }
}
