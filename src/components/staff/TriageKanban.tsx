import { useState } from "react";
import { useHospital, type TriageLevel, type TriageTicket } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clock, MapPin, Ticket, User, Play, Eye, X, AlertTriangle, Video } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLUMNS: { status: TriageTicket["status"]; title: string; color: string }[] = [
  { status: "pending", title: "Pendentes", color: "bg-muted-foreground" },
  { status: "in-queue", title: "Em Fila", color: "bg-triage-yellow" },
  { status: "in-service", title: "Em Atendimento", color: "bg-secondary" },
  { status: "completed", title: "Concluídos", color: "bg-primary" },
];

const LEVEL_LABELS: Record<TriageLevel, string> = {
  red: "Emergência",
  orange: "Muito Urgente",
  yellow: "Urgente",
  green: "Pouco Urgente",
  blue: "Não Urgente",
};

export default function TriageKanban() {
  const { triageTickets, approveTicket, startServiceTicket, completeTicket, changeSeverity } = useHospital();
  const [selectedTicket, setSelectedTicket] = useState<TriageTicket | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [resolution, setResolution] = useState("");
  const [showSeverity, setShowSeverity] = useState(false);
  const [newLevel, setNewLevel] = useState<TriageLevel | "">("");
  const [justification, setJustification] = useState("");

  const handleComplete = (id: string) => {
    if (!resolution.trim()) return;
    completeTicket(id, resolution);
    setResolution("");
    setShowComplete(false);
    setSelectedTicket(null);
  };

  const handleChangeSeverity = (id: string) => {
    if (!newLevel || !justification.trim()) return;
    changeSeverity(id, newLevel as TriageLevel, justification, "Dr. Ricardo Mendes");
    setNewLevel("");
    setJustification("");
    setShowSeverity(false);
    // Update selectedTicket reference
    setSelectedTicket(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Teletriagem — Kanban
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {COLUMNS.map((col) => {
          const tickets = triageTickets.filter((t) => t.status === col.status);
          return (
            <div key={col.status} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <h3 className="text-xs font-bold text-foreground uppercase">{col.title}</h3>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full ml-auto">{tickets.length}</span>
              </div>
              <div className="space-y-2 min-h-[100px] bg-muted/20 rounded-xl p-2">
                {tickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onApprove={() => approveTicket(ticket.id, ticket.level)}
                    onStartService={() => startServiceTicket(ticket.id)}
                    onView={() => setSelectedTicket(ticket)}
                    onCompleteClick={() => { setSelectedTicket(ticket); setShowComplete(true); }}
                  />
                ))}
                {tickets.length === 0 && (
                  <p className="text-[10px] text-muted-foreground text-center py-6">Vazio</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedTicket && !showComplete} onOpenChange={(o) => { if (!o) { setSelectedTicket(null); setShowSeverity(false); } }}>
        {selectedTicket && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ticket className="w-4 h-4" /> {selectedTicket.ticketNumber} — {selectedTicket.patientName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <TriageBadge level={selectedTicket.level} />
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                <p><strong>Sintomas:</strong> {selectedTicket.symptoms.join(", ")}</p>
                {selectedTicket.symptomsDescription && <p><strong>Descrição:</strong> {selectedTicket.symptomsDescription}</p>}
                {selectedTicket.location && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedTicket.location}</p>}
                {selectedTicket.telemedicine && (
                  <p className="flex items-center gap-1 text-secondary"><Video className="w-3 h-3" />Teleconsulta solicitada</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Criado há {Math.round((Date.now() - selectedTicket.createdAt.getTime()) / 60000)} min
                </p>
              </div>

              {/* Severity changes log */}
              {selectedTicket.severityChanges && selectedTicket.severityChanges.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Alterações de gravidade:</p>
                  {selectedTicket.severityChanges.map((c, i) => (
                    <div key={i} className="text-xs bg-warning/5 border border-warning/20 p-2 rounded-lg">
                      <span className="font-semibold">{c.changedBy}</span>: {LEVEL_LABELS[c.from]} → {LEVEL_LABELS[c.to]}
                      <br /><span className="text-muted-foreground">"{c.justification}"</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Change severity section */}
              {!showSeverity && selectedTicket.status !== "completed" && (
                <Button variant="outline" size="sm" className="w-full text-xs border-warning/40 text-warning" onClick={() => setShowSeverity(true)}>
                  <AlertTriangle className="w-3 h-3 mr-1" /> Alterar gravidade
                </Button>
              )}

              {showSeverity && (
                <div className="border border-warning/30 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-warning">Alterar classificação</p>
                  <Select value={newLevel} onValueChange={(v) => setNewLevel(v as TriageLevel)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Nova classificação..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(["red", "orange", "yellow", "green", "blue"] as TriageLevel[]).map((l) => (
                        <SelectItem key={l} value={l}>{LEVEL_LABELS[l]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Justificativa obrigatória..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="min-h-[60px] text-xs"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setShowSeverity(false)}>Cancelar</Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs bg-warning text-warning-foreground hover:bg-warning/90"
                      disabled={!newLevel || !justification.trim()}
                      onClick={() => handleChangeSeverity(selectedTicket.id)}
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              {selectedTicket.status === "pending" && (
                <Button size="sm" onClick={() => { approveTicket(selectedTicket.id, selectedTicket.level); setSelectedTicket(null); }}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovar
                </Button>
              )}
              {selectedTicket.status === "in-queue" && (
                <Button size="sm" onClick={() => { startServiceTicket(selectedTicket.id); setSelectedTicket(null); }}>
                  <Play className="w-3 h-3 mr-1" /> Iniciar Atendimento
                </Button>
              )}
              {selectedTicket.status === "in-service" && (
                <Button size="sm" className="bg-secondary hover:bg-secondary/90" onClick={() => { setShowComplete(true); }}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Concluir Atendimento
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={showComplete} onOpenChange={(o) => { if (!o) { setShowComplete(false); setResolution(""); } }}>
        {selectedTicket && (
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm">Concluir — {selectedTicket.ticketNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Descreva a resolução do atendimento (obrigatório):</p>
              <Textarea
                placeholder="Ex: Retorno agendado dia 04/05/26, medicação prescrita..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => { setShowComplete(false); setResolution(""); }}>Cancelar</Button>
              <Button size="sm" disabled={!resolution.trim()} onClick={() => handleComplete(selectedTicket.id)}>
                Confirmar Conclusão
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function TriageBadge({ level }: { level: TriageLevel }) {
  const cls = {
    red: "bg-triage-red/10 text-triage-red border-triage-red/30",
    orange: "bg-triage-orange/10 text-triage-orange border-triage-orange/30",
    yellow: "bg-triage-yellow/10 text-triage-yellow border-triage-yellow/30",
    green: "bg-triage-green/10 text-triage-green border-triage-green/30",
    blue: "bg-triage-blue/10 text-triage-blue border-triage-blue/30",
  }[level];
  return (
    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-bold uppercase border ${cls}`}>
      {LEVEL_LABELS[level]}
    </span>
  );
}

function TicketCard({ ticket, onApprove, onStartService, onView, onCompleteClick }: {
  ticket: TriageTicket;
  onApprove: () => void;
  onStartService: () => void;
  onView: () => void;
  onCompleteClick: () => void;
}) {
  const triageBg = {
    red: "bg-triage-red/10 text-triage-red",
    orange: "bg-triage-orange/10 text-triage-orange",
    yellow: "bg-triage-yellow/10 text-triage-yellow",
    green: "bg-triage-green/10 text-triage-green",
    blue: "bg-triage-blue/10 text-triage-blue",
  }[ticket.level];

  const borderLeft = {
    red: "border-l-triage-red",
    orange: "border-l-triage-orange",
    yellow: "border-l-triage-yellow",
    green: "border-l-triage-green",
    blue: "border-l-triage-blue",
  }[ticket.level];

  return (
    <Card className={`shadow-sm border-l-4 ${borderLeft} cursor-pointer hover:shadow-md transition-shadow`} onClick={onView}>
      <CardContent className="p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Ticket className="w-3 h-3 text-muted-foreground" />
            <span className="text-[11px] font-bold text-foreground">{ticket.ticketNumber}</span>
          </div>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${triageBg}`}>
            {LEVEL_LABELS[ticket.level]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <User className="w-2.5 h-2.5 text-muted-foreground" />
          <p className="text-xs font-medium text-foreground truncate">{ticket.patientName}</p>
        </div>
        <p className="text-[10px] text-muted-foreground line-clamp-1">
          {ticket.symptomsDescription || ticket.symptoms.join(", ")}
        </p>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {Math.round((Date.now() - ticket.createdAt.getTime()) / 60000)} min
          </div>
          {ticket.estimatedWait !== undefined && (
            <span>~{ticket.estimatedWait} min</span>
          )}
        </div>
        {ticket.telemedicine && (
          <div className="flex items-center gap-1 text-[10px] text-secondary">
            <Video className="w-2.5 h-2.5" /> Teleconsulta
          </div>
        )}
        {ticket.resolution && (
          <p className="text-[10px] text-secondary font-medium truncate">✓ {ticket.resolution}</p>
        )}
        <div className="flex gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" className="flex-1 text-[10px] h-6 px-1" onClick={onView}>
            <Eye className="w-2.5 h-2.5 mr-0.5" /> Ver
          </Button>
          {ticket.status === "pending" && (
            <Button size="sm" className="flex-1 text-[10px] h-6 px-1" onClick={onApprove}>
              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Aprovar
            </Button>
          )}
          {ticket.status === "in-queue" && (
            <Button size="sm" className="flex-1 text-[10px] h-6 px-1 bg-secondary hover:bg-secondary/90" onClick={onStartService}>
              <Play className="w-2.5 h-2.5 mr-0.5" /> Atender
            </Button>
          )}
          {ticket.status === "in-service" && (
            <Button size="sm" className="flex-1 text-[10px] h-6 px-1" onClick={onCompleteClick}>
              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Concluir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
