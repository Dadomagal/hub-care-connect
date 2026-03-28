import { useEffect, useState } from "react";
import { useHospital } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle2, Hourglass } from "lucide-react";

export default function PatientQueue() {
  const { triageTickets, currentPatient } = useHospital();
  const myTickets = triageTickets.filter((t) => t.patientId === currentPatient.id);
  const activeTicket = myTickets.find((t) => t.status === "approved" || t.status === "in-queue");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground">Fila Virtual</h2>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe seu atendimento</p>
      </div>

      {activeTicket ? (
        <TicketCard ticket={activeTicket} />
      ) : myTickets.length > 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Hourglass className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Triagem em análise</p>
            <p className="text-xs text-muted-foreground mt-1">Aguarde a validação da equipe de saúde</p>
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

  return (
    <Card className="border-2 border-primary">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ticket #{ticket.id.slice(-4)}</span>
          <span className={`text-xs px-2 py-1 rounded-full font-semibold bg-triage-${ticket.level}/15 text-triage-${ticket.level}`}>
            {ticket.level.toUpperCase()}
          </span>
        </div>

        <div className="text-center py-4">
          <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-3xl font-display font-bold text-foreground">{remaining} min</p>
          <p className="text-sm text-muted-foreground">Tempo estimado de espera</p>
        </div>

        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="text-sm font-medium text-foreground">
            {ticket.status === "approved" ? "Classificação aprovada — aguardando chamada" : "Em fila virtual"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
