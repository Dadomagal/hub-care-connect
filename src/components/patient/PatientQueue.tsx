import { useEffect, useState } from "react";
import { useHospital } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle2, Hourglass, Ticket } from "lucide-react";

const LEVEL_LABELS: Record<string, string> = {
  red: "Emergência",
  orange: "Muito Urgente",
  yellow: "Urgente",
  green: "Pouco Urgente",
  blue: "Não Urgente",
};

export default function PatientQueue() {
  const { triageTickets, currentPatient } = useHospital();
  const myTickets = triageTickets.filter((t) => t.patientId === currentPatient.id);
  const activeTicket = myTickets.find((t) => t.status === "approved" || t.status === "in-queue");
  const pendingTicket = myTickets.find((t) => t.status === "pending");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground">Fila Virtual</h2>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe seu atendimento</p>
      </div>

      {activeTicket ? (
        <TicketCard ticket={activeTicket} />
      ) : pendingTicket ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <Hourglass className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Triagem em análise</p>
              <p className="text-xs text-muted-foreground mt-1">Aguarde a validação da equipe de saúde</p>
            </div>
            <div className="bg-muted rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Nº Atendimento</span>
                <span className="font-semibold text-foreground">{pendingTicket.ticketNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Sintomas</span>
                <span className="text-foreground text-right max-w-[60%] truncate">{pendingTicket.symptoms.slice(0, 2).join(", ")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Nenhuma triagem ativa</p>
            <p className="text-xs text-muted-foreground mt-1">Realize uma teletriagem na aba "Triagem"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TicketCard({ ticket }: { ticket: ReturnType<typeof useHospital>["triageTickets"][0] }) {
  const [remaining, setRemaining] = useState(ticket.estimatedWait ?? 0);

  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 60000);
    return () => clearInterval(interval);
  }, [remaining]);

  const triageColor = {
    red: "border-triage-red",
    orange: "border-triage-orange",
    yellow: "border-triage-yellow",
    green: "border-triage-green",
    blue: "border-triage-blue",
  }[ticket.level];

  const triageBg = {
    red: "bg-triage-red/10 text-triage-red",
    orange: "bg-triage-orange/10 text-triage-orange",
    yellow: "bg-triage-yellow/10 text-triage-yellow",
    green: "bg-triage-green/10 text-triage-green",
    blue: "bg-triage-blue/10 text-triage-blue",
  }[ticket.level];

  return (
    <Card className={`border-2 ${triageColor}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary" />
            <span className="text-lg font-bold text-foreground">{ticket.ticketNumber}</span>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${triageBg}`}>
            {LEVEL_LABELS[ticket.level]}
          </span>
        </div>

        <div className="text-center py-4">
          <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-3xl font-display font-bold text-foreground">{remaining} min</p>
          <p className="text-sm text-muted-foreground">Previsão de atendimento</p>
        </div>

        <div className="space-y-2">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-sm font-medium text-foreground">
              {ticket.status === "approved" ? "Classificação aprovada — aguardando chamada" : "Em fila virtual"}
            </p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Sintomas reportados</p>
            <p className="text-sm text-foreground">{ticket.symptomsDescription || ticket.symptoms.join(", ")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
