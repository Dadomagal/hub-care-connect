import { useHospital } from "@/contexts/HospitalContext";
import { LogOut } from "lucide-react";
import SOSAlertPanel from "@/components/staff/SOSAlertPanel";
import LostAlertPanel from "@/components/staff/LostAlertPanel";
import TriageKanban from "@/components/staff/TriageKanban";
import PatientList from "@/components/staff/PatientList";
import StaffTeam from "@/components/staff/StaffTeam";
import hubLogo from "@/assets/hub-logo.png";

export default function StaffDashboard() {
  const { setRole, sosAlerts, lostAlerts } = useHospital();
  const activeAlerts = sosAlerts.filter((a) => a.active).length;
  const activeLost = lostAlerts.filter((a) => a.active && !a.assignedTo).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 hub-gradient px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <img src={hubLogo} alt="UnB HUB" className="h-10 object-contain brightness-0 invert" />
          <div>
            <h1 className="font-display font-bold text-primary-foreground text-lg">Painel da Equipe</h1>
            <p className="text-xs text-primary-foreground/70">Hospital Universitário de Brasília</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {activeLost > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning animate-blink-alert bg-warning/10 px-2 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-warning" />
              {activeLost} perdido{activeLost > 1 ? "s" : ""}
            </span>
          )}
          {activeAlerts > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emergency animate-blink-alert bg-emergency/10 px-2 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emergency" />
              {activeAlerts} SOS
            </span>
          )}
          <button onClick={() => setRole(null)} className="text-primary-foreground/70 hover:text-primary-foreground p-2" aria-label="Sair">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
        <SOSAlertPanel />
        <LostAlertPanel />
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <TriageKanban />
          </div>
          <div className="space-y-6">
            <PatientList />
            <StaffTeam />
          </div>
        </div>
      </main>
    </div>
  );
}
