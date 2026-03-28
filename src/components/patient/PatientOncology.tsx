import { useState } from "react";
import { useHospital, type OncologyEvent } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Droplets, Stethoscope, FlaskConical, RotateCcw, MapPin, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TYPE_CONFIG = {
  infusion: { icon: Droplets, label: "Infusão", className: "bg-primary/10 text-primary" },
  consult: { icon: Stethoscope, label: "Consulta", className: "bg-secondary/10 text-secondary" },
  exam: { icon: FlaskConical, label: "Exame", className: "bg-warning/10 text-warning" },
  return: { icon: RotateCcw, label: "Retorno", className: "bg-success/10 text-success" },
};

export default function PatientOncology() {
  const { oncologyEvents, currentPatient, setPendingDestination } = useHospital();
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<OncologyEvent | null>(null);
  const now = new Date();

  const upcoming = oncologyEvents.filter((e) => e.date >= now).sort((a, b) => a.date.getTime() - b.date.getTime());
  const past = oncologyEvents.filter((e) => e.date < now).sort((a, b) => b.date.getTime() - a.date.getTime());

  const handleNavigate = (location: string) => {
    setPendingDestination(location);
  };

  const openEvent = (event: OncologyEvent) => {
    setSelectedEvent(event);
  };

  const closeEvent = (open: boolean) => {
    if (!open) {
      setSelectedEvent(null);
    }
  };

  const handleRequestDocument = (doc: string) => {
    toast({
      title: "Solicitação enviada",
      description: `Documento solicitado: ${doc}`,
    });
  };

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
                <Card
                  key={event.id}
                  className="border-l-4 border-l-primary cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => openEvent(event)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && openEvent(event)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.className}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{event.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(event.date, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {event.location}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${config.className} font-medium`}>
                        {config.label}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(event.location);
                      }}
                    >
                      <MapPin className="w-3.5 h-3.5 mr-1" /> Como chegar
                    </Button>
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
                <Card
                  key={event.id}
                  className="opacity-70 cursor-pointer transition-shadow hover:opacity-100 hover:shadow-md"
                  onClick={() => openEvent(event)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && openEvent(event)}
                >
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

      <Dialog open={Boolean(selectedEvent)} onOpenChange={closeEvent}>
        {selectedEvent && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedEvent.description}</DialogTitle>
              <DialogDescription>
                {format(selectedEvent.date, "dd 'de' MMMM, yyyy", { locale: ptBR })} · {selectedEvent.location}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedEvent.preparations && selectedEvent.preparations.length > 0 && (
                <div className="rounded-lg border border-border/60 bg-muted/40 p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Cuidados e preparativos</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {selectedEvent.preparations.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedEvent.results && selectedEvent.results.length > 0 && (
                <div className="rounded-lg border border-border/60 bg-muted/40 p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Resultados</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {selectedEvent.results.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      <FileText className="w-3.5 h-3.5 mr-1" /> Visualizar resultados
                    </Button>
                  </div>
                </div>
              )}

              {selectedEvent.documents && selectedEvent.documents.length > 0 && (
                <div className="rounded-lg border border-border/60 bg-muted/40 p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Documentos</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.documents.map((doc) => (
                      <Button
                        key={doc}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleRequestDocument(doc)}
                      >
                        Solicitar {doc}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
