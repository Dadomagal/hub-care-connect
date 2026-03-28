import { useState, useEffect, useCallback } from "react";
import { useHospital } from "@/contexts/HospitalContext";
import SOSButton from "@/components/SOSButton";
import PatientTriage from "@/components/patient/PatientTriage";
import PatientOncology from "@/components/patient/PatientOncology";
import PatientNavigation from "@/components/patient/PatientNavigation";
import PatientQueue from "@/components/patient/PatientQueue";
import { ClipboardList, Calendar, MapPin, Clock, LogOut } from "lucide-react";
import hubLogo from "@/assets/hub-logo.png";

const TABS = [
  { id: "triage", label: "Triagem", icon: ClipboardList },
  { id: "oncology", label: "Oncologia", icon: Calendar },
  { id: "nav", label: "Mapa", icon: MapPin },
  { id: "queue", label: "Fila", icon: Clock },
] as const;

type TabId = (typeof TABS)[number]["id"];

function getHashTab(): TabId {
  const hash = window.location.hash.replace("#", "") as TabId;
  if (TABS.some((t) => t.id === hash)) return hash;
  return "triage";
}

export default function PatientLayout() {
  const [tab, setTab] = useState<TabId>(getHashTab);
  const { currentPatient, setRole, pendingDestination } = useHospital();

  const navigateTab = useCallback((id: TabId) => {
    window.location.hash = id;
    setTab(id);
  }, []);

  useEffect(() => {
    const onHashChange = () => setTab(getHashTab());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (pendingDestination) navigateTab("nav");
  }, [pendingDestination, navigateTab]);

  return (
    <div className="min-h-screen bg-background flex flex-col w-full max-w-lg mx-auto relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-3">
          <img src={hubLogo} alt="UnB HUB" className="h-8 object-contain brightness-0 invert" />
          <div>
            <p className="text-[11px] opacity-80">Olá,</p>
            <p className="font-display font-semibold text-sm">{currentPatient.name}</p>
          </div>
        </div>
        <button onClick={() => { setRole(null); window.location.hash = ""; }} className="opacity-70 hover:opacity-100 p-2" aria-label="Sair">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-5">
        {tab === "triage" && <PatientTriage onComplete={() => navigateTab("queue")} />}
        {tab === "oncology" && <PatientOncology />}
        {tab === "nav" && <PatientNavigation />}
        {tab === "queue" && <PatientQueue />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-primary border-t border-primary-foreground/10 flex z-40 shadow-lg" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => navigateTab(id)}
            className={`flex-1 flex flex-col items-center py-2.5 text-xs transition-colors ${
              tab === id ? "text-secondary font-bold" : "text-primary-foreground/60"
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            {label}
          </button>
        ))}
      </nav>

      {/* SOS only in Oncology tab */}
      {tab === "oncology" && <SOSButton />}
    </div>
  );
}
