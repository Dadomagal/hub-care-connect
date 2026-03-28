import { useState } from "react";
import { useHospital } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, User, UserCheck, X } from "lucide-react";
import { format } from "date-fns";

export default function LostAlertPanel() {
  const { lostAlerts, assignLost, dismissLost } = useHospital();
  const active = lostAlerts.filter((a) => a.active);

  if (active.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-warning flex items-center gap-2 uppercase tracking-wider">
        <AlertTriangle className="w-4 h-4 animate-blink-alert" />
        Pacientes Perdidos ({active.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {active.map((alert) => (
          <LostCard key={alert.id} alert={alert} onAssign={assignLost} onDismiss={dismissLost} />
        ))}
      </div>
    </div>
  );
}

function LostCard({ alert, onAssign, onDismiss }: {
  alert: ReturnType<typeof useHospital>["lostAlerts"][0];
  onAssign: (id: string, name: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <Card className={`border-2 ${alert.assignedTo ? "border-success" : "border-warning animate-blink-alert"}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${alert.assignedTo ? "bg-success/10" : "bg-warning/10"}`}>
              <User className={`w-4 h-4 ${alert.assignedTo ? "text-success" : "text-warning"}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{alert.patientName}</p>
              <p className="text-xs text-muted-foreground">{format(alert.timestamp, "HH:mm:ss")}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          {alert.location}
        </div>
        {alert.assignedTo ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-success flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> {alert.assignedTo} designado
            </span>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onDismiss(alert.id)}>
              <X className="w-3 h-3 mr-1" /> Resolver
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="w-full bg-warning text-warning-foreground hover:bg-warning/90"
            onClick={() => onAssign(alert.id, "Enf. Ana")}
          >
            <UserCheck className="w-3.5 h-3.5 mr-1" /> Designar Enfermeiro
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
