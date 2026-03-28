import { useHospital, type TriageLevel, type TriageTicket } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, MapPin, Ticket, User } from "lucide-react";

const COLUMNS: { status: TriageTicket["status"]; title: string }[] = [
  { status: "pending", title: "Pendentes" },
  { status: "approved", title: "Aprovados" },
  { status: "in-queue", title: "Em Fila" },
];

const LEVEL_LABELS: Record<TriageLevel, string> = {
  red: "Emergência",
  orange: "Muito Urgente",
  yellow: "Urgente",
  green: "Pouco Urgente",
  blue: "Não Urgente",
};

export default function TriageKanban() {
  const { triageTickets, approveTicket } = useHospital();

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Teletriagem — Kanban
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const tickets = triageTickets.filter((t) => t.status === col.status);
          return (
            <div key={col.status} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{tickets.length}</span>
              </div>
              <div className="space-y-2 min-h-[120px] bg-muted/30 rounded-lg p-2">
                {tickets.map((ticket) => {
                  const triageBg = {
                    red: "bg-triage-red/10 text-triage-red",
                    orange: "bg-triage-orange/10 text-triage-orange",
                    yellow: "bg-triage-yellow/10 text-triage-yellow",
                    green: "bg-triage-green/10 text-triage-green",
                    blue: "bg-triage-blue/10 text-triage-blue",
                  }[ticket.level];

                  return (
                    <Card key={ticket.id} className="shadow-sm">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs font-bold text-foreground">{ticket.ticketNumber}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${triageBg}`}>
                            {LEVEL_LABELS[ticket.level]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <p className="text-sm font-medium text-foreground">{ticket.patientName}</p>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {ticket.symptomsDescription || ticket.symptoms.join(", ")}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {Math.round((Date.now() - ticket.createdAt.getTime()) / 60000)} min atrás
                          </div>
                          {ticket.estimatedWait !== undefined && (
                            <span>Previsão: {ticket.estimatedWait} min</span>
                          )}
                        </div>
                        {ticket.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {ticket.location}
                          </div>
                        )}
                        {ticket.status === "pending" && (
                          <Button
                            size="sm"
                            className="w-full text-xs h-7"
                            onClick={() => approveTicket(ticket.id, ticket.level)}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovar
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {tickets.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">Vazio</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
