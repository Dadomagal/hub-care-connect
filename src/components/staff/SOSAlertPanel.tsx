import { useHospital } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, User, X } from "lucide-react";
import { format } from "date-fns";

export default function SOSAlertPanel() {
  const { sosAlerts, dismissSOS } = useHospital();
  const active = sosAlerts.filter((a) => a.active);

  if (active.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-emergency flex items-center gap-2 uppercase tracking-wider">
        <AlertTriangle className="w-4 h-4 animate-blink-alert" />
        Alertas de Emergência ({active.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {active.map((alert) => (
          <Card key={alert.id} className="border-2 border-emergency animate-blink-alert">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emergency/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-emergency" />
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
              <Button
                size="sm"
                variant="outline"
                className="w-full border-emergency text-emergency hover:bg-emergency hover:text-emergency-foreground"
                onClick={() => dismissSOS(alert.id)}
              >
                <X className="w-3.5 h-3.5 mr-1" /> Resolver
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
