import { useHospital } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Droplets, Stethoscope, FlaskConical, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TYPE_CONFIG = {
  infusion: { icon: Droplets, label: "Infusão", className: "bg-primary/10 text-primary" },
  consult: { icon: Stethoscope, label: "Consulta", className: "bg-secondary/10 text-secondary" },
  exam: { icon: FlaskConical, label: "Exame", className: "bg-warning/10 text-warning" },
  return: { icon: RotateCcw, label: "Retorno", className: "bg-success/10 text-success" },
};

export default function PatientOncology() {
  const { oncologyEvents, currentPatient } = useHospital();
  const now = new Date();

  const upcoming = oncologyEvents.filter((e) => e.date >= now).sort((a, b) => a.date.getTime() - b.date.getTime());
  const past = oncologyEvents.filter((e) => e.date < now).sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground">Jornada Oncológica</h2>
        <p className="text-sm text-muted-foreground mt-1">Linha do tempo de {currentPatient.name}</p>
      </div>

      {upcoming.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Próximos</h3>
          <div className="space-y-3">
            {upcoming.map((event) => {
              const config = TYPE_CONFIG[event.type];
              const Icon = config.icon;
              return (
                <Card key={event.id} className="border-l-4 border-l-primary">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.className}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{event.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(event.date, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${config.className} font-medium`}>
                      {config.label}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Realizados</h3>
          <div className="space-y-2">
            {past.map((event) => {
              const config = TYPE_CONFIG[event.type];
              const Icon = config.icon;
              return (
                <Card key={event.id} className="opacity-60">
                  <CardContent className="flex items-center gap-4 p-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.className}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{event.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(event.date, "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
