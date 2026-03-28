import { useState } from "react";
import { useHospital } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Stethoscope, UserRound, Star } from "lucide-react";

const AVAILABLE_TEAM = [
  { name: "Dr. Rafael Moura", role: "Clínico Geral", shift: "Manhã", handoff: "Troca 13:00" },
  { name: "Dra. Luiza Pacheco", role: "Oncologia", shift: "Tarde", handoff: "Troca 19:00" },
  { name: "Enf. Ana Costa", role: "Enfermagem", shift: "Manhã", handoff: "Troca 13:00" },
  { name: "Enf. Marcos Lima", role: "Enfermagem", shift: "Noite", handoff: "Troca 07:00" },
];

export default function PatientList() {
  const { patients, triageTickets, feedbackScores } = useHospital();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const selectedPatient = selectedPatientId ? patients.find((p) => p.id === selectedPatientId) || null : null;
  const patientTickets = selectedPatient
    ? [...triageTickets]
        .filter((t) => t.patientId === selectedPatient.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    : [];
  const patientFeedbacks = selectedPatient
    ? feedbackScores.filter((entry) => entry.patientId === selectedPatient.id)
    : [];

  const closeDialog = (open: boolean) => {
    if (!open) {
      setSelectedPatientId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Pacientes Cadastrados
      </h2>
      <div className="space-y-2">
        {patients.map((p) => {
          const latestScore = getLatestFeedbackScore(feedbackScores, p.id);
          const feedbackShadow = latestScore ? getFeedbackShadow(latestScore) : "";
          return (
            <Card
              key={p.id}
              className={`cursor-pointer transition-shadow hover:shadow-md ${feedbackShadow}`}
              onClick={() => setSelectedPatientId(p.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => event.key === "Enter" && setSelectedPatientId(p.id)}
            >
            <CardContent className="flex items-center gap-3 p-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {p.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.age} anos · {p.cpf}</p>
              </div>
              {p.oncology && (
                <Badge variant="secondary" className="text-[10px]">Onco</Badge>
              )}
            </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="pt-4 border-t border-border/60 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Equipe disponível
        </h2>
        <div className="space-y-2">
          {AVAILABLE_TEAM.map((member) => (
            <Card key={member.name}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center">
                  {member.role === "Enfermagem" ? (
                    <UserRound className="w-4 h-4 text-secondary" />
                  ) : (
                    <Stethoscope className="w-4 h-4 text-secondary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="text-[10px]">{member.shift}</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">{member.handoff}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" /> Trocas de turno sinalizadas por setor e avisos no painel.
        </div>
      </div>

      <Dialog open={Boolean(selectedPatient)} onOpenChange={closeDialog}>
        {selectedPatient && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Prontuário do paciente</DialogTitle>
              <DialogDescription>
                {selectedPatient.name} · {selectedPatient.age} anos · {selectedPatient.cpf}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Informações gerais</p>
                    <p className="text-xs text-muted-foreground mt-1">Registro atualizado conforme atendimentos</p>
                  </div>
                  {selectedPatient.oncology && (
                    <Badge variant="secondary" className="text-[10px]">Oncologia</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Atendimentos recentes</p>
                {patientTickets.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum atendimento registrado ainda.</p>
                ) : (
                  <div className="grid gap-3">
                    {patientTickets.map((ticket) => (
                      <div key={ticket.id} className="rounded-lg border border-border/60 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{ticket.ticketNumber}</span>
                            <Badge variant="secondary" className="text-[10px]">
                              {ticket.status === "pending" && "Aguardando"}
                              {ticket.status === "approved" && "Aprovado"}
                              {ticket.status === "in-queue" && "Em fila"}
                              {ticket.status === "in-care" && "Em atendimento"}
                              {ticket.status === "completed" && "Concluído"}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {Math.round((Date.now() - ticket.createdAt.getTime()) / 60000)} min atrás
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {ticket.symptomsDescription || ticket.symptoms.join(", ")}
                        </p>
                        {ticket.telemedicineNote && (
                          <p className="text-xs text-muted-foreground mt-2">Feedback médico: {ticket.telemedicineNote}</p>
                        )}
                        {ticket.resolution && (
                          <p className="text-xs text-muted-foreground mt-2">Resolução: {ticket.resolution}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Feedback do paciente</p>
                {patientFeedbacks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum feedback registrado.</p>
                ) : (
                  <div className="space-y-2">
                    {patientFeedbacks.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${getFeedbackTag(entry.score)}`}>
                          <Star className="w-3 h-3" /> {entry.score} estrela{entry.score > 1 ? "s" : ""}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {entry.comment || "Sem comentário"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function getFeedbackTag(score: number) {
  if (score === 1) return "bg-triage-red/15 text-triage-red";
  if (score === 2) return "bg-triage-orange/15 text-triage-orange";
  if (score === 3) return "bg-triage-yellow/20 text-triage-yellow";
  if (score === 4) return "bg-success/15 text-success";
  return "bg-success text-success-foreground";
}

function getLatestFeedbackScore(feedbackScores: ReturnType<typeof useHospital>["feedbackScores"], patientId: string) {
  const latest = feedbackScores
    .filter((entry) => entry.patientId === patientId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  return latest?.score ?? null;
}

function getFeedbackShadow(score: number) {
  if (score === 1) return "shadow-[0_0_0_3px_hsl(var(--triage-red)/0.35)]";
  if (score === 2) return "shadow-[0_0_0_3px_hsl(var(--triage-orange)/0.35)]";
  if (score === 3) return "shadow-[0_0_0_3px_hsl(var(--triage-yellow)/0.35)]";
  if (score === 4) return "shadow-[0_0_0_3px_hsl(var(--success)/0.25)]";
  return "shadow-[0_0_0_3px_hsl(var(--success)/0.4)]";
}
