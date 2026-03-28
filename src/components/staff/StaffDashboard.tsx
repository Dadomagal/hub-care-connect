import { useSearchParams } from "react-router-dom";
import { useHospital } from "@/contexts/HospitalContext";
import { LogOut } from "lucide-react";
import SOSAlertPanel from "@/components/staff/SOSAlertPanel";
import LostAlertPanel from "@/components/staff/LostAlertPanel";
import TriageKanban from "@/components/staff/TriageKanban";
import PatientList from "@/components/staff/PatientList";
import hubLogo from "@/assets/hub-logo.png";

export default function StaffDashboard() {
  const { setRole, sosAlerts, lostAlerts } = useHospital();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeAlerts = sosAlerts.filter((a) => a.active).length;
  const activeLost = lostAlerts.filter((a) => a.active && !a.assignedTo).length;

  const handleLogout = () => {
    setRole(null);
    const next = new URLSearchParams(searchParams);
    next.delete("role");
    next.delete("tab");
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b border-primary/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={hubLogo} alt="UnB HUB" className="h-10 object-contain" />
          <div>
            <h1 className="font-display font-bold text-foreground text-lg">Painel da Equipe</h1>
            <p className="text-xs text-muted-foreground">Hospital Universitário de Brasília</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {activeLost > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning animate-blink-alert">
              <span className="w-2 h-2 rounded-full bg-warning" />
              {activeLost} paciente{activeLost > 1 ? "s" : ""} perdido{activeLost > 1 ? "s" : ""}
            </span>
          )}
          {activeAlerts > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emergency animate-blink-alert">
              <span className="w-2 h-2 rounded-full bg-emergency" />
              {activeAlerts} SOS ativo{activeAlerts > 1 ? "s" : ""}
            </span>
          )}
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground p-2" aria-label="Sair">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        <SOSAlertPanel />
        <LostAlertPanel />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TriageKanban />
          </div>
          <div>
            <PatientList />
          </div>
        </div>
      </main>
    </div>
  );
}
