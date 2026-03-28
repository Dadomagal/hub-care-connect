import { useHospital, type TriageLevel, type TriageTicket } from "@/contexts/HospitalContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock } from "lucide-react";

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
                {tickets.map((ticket) => (
                  <Card key={ticket.id} className="shadow-sm">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{ticket.patientName}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-triage-${ticket.level}/15 text-triage-${ticket.level}`}>
                          {LEVEL_LABELS[ticket.level]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {Math.round((Date.now() - ticket.createdAt.getTime()) / 60000)} min atrás
                      </div>
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
                ))}
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
