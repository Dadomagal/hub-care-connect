import { useHospital, type StaffMember } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Heart, Sun, Sunset, Moon } from "lucide-react";

const SHIFT_CONFIG = {
  morning: { label: "Manhã (07h–13h)", icon: Sun, className: "bg-warning/10 text-warning" },
  afternoon: { label: "Tarde (13h–19h)", icon: Sunset, className: "bg-triage-orange/10 text-triage-orange" },
  night: { label: "Noite (19h–07h)", icon: Moon, className: "bg-primary/10 text-primary" },
};

export default function StaffTeam() {
  const { staffMembers } = useHospital();

  const currentHour = new Date().getHours();
  const currentShift = currentHour >= 7 && currentHour < 13 ? "morning" : currentHour >= 13 && currentHour < 19 ? "afternoon" : "night";
  const nextShift = currentShift === "morning" ? "afternoon" : currentShift === "afternoon" ? "night" : "morning";
  const nextShiftLabel = SHIFT_CONFIG[nextShift].label.split(" ")[0];

  const grouped = {
    morning: staffMembers.filter((s) => s.shift === "morning"),
    afternoon: staffMembers.filter((s) => s.shift === "afternoon"),
    night: staffMembers.filter((s) => s.shift === "night"),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Equipe Disponível
        </h2>
        <Badge variant="secondary" className="text-[10px]">
          Turno atual: {SHIFT_CONFIG[currentShift].label.split(" ")[0]}
        </Badge>
      </div>

      {(["morning", "afternoon", "night"] as const).map((shift) => {
        const config = SHIFT_CONFIG[shift];
        const Icon = config.icon;
        const members = grouped[shift];
        const isCurrent = shift === currentShift;
        return (
          <div key={shift} className={`rounded-xl p-3 ${isCurrent ? "bg-secondary/5 border border-secondary/20" : "bg-muted/30"}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-3.5 h-3.5 ${isCurrent ? "text-secondary" : "text-muted-foreground"}`} />
              <span className={`text-xs font-semibold ${isCurrent ? "text-secondary" : "text-muted-foreground"}`}>
                {config.label} {isCurrent && "• Ativo"}
              </span>
            </div>
            <div className="space-y-1.5">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    m.role === "doctor" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                  }`}>
                    {m.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{m.name}</p>
                    {m.specialty && <p className="text-[10px] text-muted-foreground">{m.specialty}</p>}
                  </div>
                  {m.role === "doctor" ? (
                    <Stethoscope className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <Heart className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <p className="text-[10px] text-muted-foreground text-center">
        Próxima troca de turno: {nextShiftLabel}
      </p>
    </div>
  );
}
