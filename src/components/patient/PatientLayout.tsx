import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useHospital } from "@/contexts/HospitalContext";
import SOSButton from "@/components/SOSButton";
import PatientTriage from "@/components/patient/PatientTriage";
import PatientOncology from "@/components/patient/PatientOncology";
import PatientNavigation from "@/components/patient/PatientNavigation";
import PatientQueue from "@/components/patient/PatientQueue";
import PatientFeedback from "@/components/patient/PatientFeedback";
import { ClipboardList, Calendar, MapPin, Clock, LogOut, Star } from "lucide-react";
import hubLogo from "@/assets/hub-logo.png";

const TABS = [
  { id: "triage", label: "Triagem", icon: ClipboardList },
  { id: "oncology", label: "Oncologia", icon: Calendar },
  { id: "nav", label: "Mapa", icon: MapPin },
  { id: "queue", label: "Fila", icon: Clock },
  { id: "feedback", label: "Feedback", icon: Star },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function PatientLayout() {
  const { currentPatient, setRole, pendingDestination } = useHospital();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const isValidTab = (value: string | null): value is TabId => TABS.some((item) => item.id === value);
  const tab: TabId = isValidTab(tabParam) ? tabParam : "triage";

  const setTabParam = (nextTab: TabId, replace = false) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", nextTab);
    setSearchParams(next, { replace });
  };

  const handleLogout = () => {
    setRole(null);
    const next = new URLSearchParams(searchParams);
    next.delete("role");
    next.delete("tab");
    setSearchParams(next);
  };

  useEffect(() => {
    if (!isValidTab(tabParam)) {
      setTabParam("triage", true);
    }
  }, [tabParam, searchParams]);

  useEffect(() => {
    if (pendingDestination && tab !== "nav") {
      setTabParam("nav", true);
    }
  }, [pendingDestination, tab, searchParams]);

  return (
    <div className="min-h-screen bg-background/80 flex flex-col max-w-5xl mx-auto relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-primary/10 bg-card/85 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <img src={hubLogo} alt="UnB HUB" className="h-8 object-contain" />
          <div>
            <p className="text-xs text-muted-foreground">Olá,</p>
            <p className="font-display font-semibold text-foreground">{currentPatient.name}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground p-2" aria-label="Sair">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-28 px-4 sm:px-6 lg:px-8 pt-5">
        {tab === "triage" && <PatientTriage />}
        {tab === "oncology" && <PatientOncology />}
        {tab === "nav" && <PatientNavigation />}
        {tab === "queue" && <PatientQueue />}
        {tab === "feedback" && <PatientFeedback />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-5xl mx-auto bg-card/90 backdrop-blur-lg border-t border-primary/10 flex z-40" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTabParam(id)}
            className={`flex-1 flex flex-col items-center py-2.5 text-xs transition-colors ${
              tab === id ? "text-primary font-semibold" : "text-muted-foreground"
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
