import { useHospital } from "@/contexts/HospitalContext";
import { LogOut } from "lucide-react";
import SOSAlertPanel from "@/components/staff/SOSAlertPanel";
import TriageKanban from "@/components/staff/TriageKanban";
import PatientList from "@/components/staff/PatientList";

export default function StaffDashboard() {
  const { setRole, sosAlerts } = useHospital();
  const activeAlerts = sosAlerts.filter((a) => a.active).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-card border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">HUB</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-foreground text-lg">Painel da Equipe</h1>
            <p className="text-xs text-muted-foreground">Hospital Universitário de Brasília</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {activeAlerts > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emergency animate-blink-alert">
              <span className="w-2 h-2 rounded-full bg-emergency" />
              {activeAlerts} SOS ativo{activeAlerts > 1 ? "s" : ""}
            </span>
          )}
          <button onClick={() => setRole(null)} className="text-muted-foreground hover:text-foreground p-2" aria-label="Sair">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        <SOSAlertPanel />
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
