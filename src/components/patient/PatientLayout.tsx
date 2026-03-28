import { useState } from "react";
import { useHospital } from "@/contexts/HospitalContext";
import SOSButton from "@/components/SOSButton";
import PatientTriage from "@/components/patient/PatientTriage";
import PatientOncology from "@/components/patient/PatientOncology";
import PatientNavigation from "@/components/patient/PatientNavigation";
import PatientQueue from "@/components/patient/PatientQueue";
import { ClipboardList, Calendar, MapPin, Clock, LogOut } from "lucide-react";

const TABS = [
  { id: "triage", label: "Triagem", icon: ClipboardList },
  { id: "oncology", label: "Oncologia", icon: Calendar },
  { id: "nav", label: "Mapa", icon: MapPin },
  { id: "queue", label: "Fila", icon: Clock },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function PatientLayout() {
  const [tab, setTab] = useState<TabId>("triage");
  const { currentPatient, setRole } = useHospital();

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div>
          <p className="text-xs text-muted-foreground">Olá,</p>
          <p className="font-display font-semibold text-foreground">{currentPatient.name}</p>
        </div>
        <button onClick={() => setRole(null)} className="text-muted-foreground hover:text-foreground p-2" aria-label="Sair">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {tab === "triage" && <PatientTriage />}
        {tab === "oncology" && <PatientOncology />}
        {tab === "nav" && <PatientNavigation />}
        {tab === "queue" && <PatientQueue />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t flex z-40" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center py-2.5 text-xs transition-colors ${
              tab === id ? "text-primary font-semibold" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            {label}
          </button>
        ))}
      </nav>

      <SOSButton />
    </div>
  );
}
