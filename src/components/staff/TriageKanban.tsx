import { useRef, useState } from "react";
import type { DragEvent, TouchEvent } from "react";
import { useHospital, type TelemedicineStatus, type TriageLevel, type TriageTicket } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clock, MapPin, Ticket, User, Video } from "lucide-react";

const COLUMNS: { status: TriageTicket["status"]; title: string }[] = [
  { status: "pending", title: "Pendentes" },
  { status: "approved", title: "Aprovados" },
  { status: "in-queue", title: "Em fila" },
  { status: "in-care", title: "Em atendimento" },
  { status: "completed", title: "Concluídos" },
];

const LEVEL_LABELS: Record<TriageLevel, string> = {
  red: "Emergência",
  orange: "Muito Urgente",
  yellow: "Urgente",
  green: "Pouco Urgente",
  blue: "Não Urgente",
};

const STATUS_LABELS: Record<TriageTicket["status"], string> = {
  pending: "Aguardando triagem",
  approved: "Classificação aprovada",
  "in-queue": "Em fila presencial",
  "in-care": "Em atendimento",
  completed: "Concluído",
};

const TELEMED_LABELS: Record<TelemedicineStatus, string> = {
  waiting: "Aguardando médico",
  "in-call": "Atendimento remoto",
  completed: "Atendimento finalizado",
};

const ALLOWED_MOVES: Record<TriageTicket["status"], TriageTicket["status"][]> = {
  pending: ["approved"],
  approved: ["pending", "in-queue"],
  "in-queue": ["approved", "in-care"],
  "in-care": ["in-queue"],
  completed: [],
};

const MOBILE_DRAG_HOLD_MS = 280;

export default function TriageKanban() {
  const {
    triageTickets,
    approveTicket,
    sendToQueue,
    startCare,
    completeCare,
    setTicketStatus,
    updateTicketLevel,
    updateTelemedicine,
  } = useHospital();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTicketId, setDetailsTicketId] = useState<string | null>(null);
  const [levelDraft, setLevelDraft] = useState<TriageLevel>("green");
  const [levelReason, setLevelReason] = useState("");
  const [telemedStatusDraft, setTelemedStatusDraft] = useState<TelemedicineStatus>("waiting");
  const [telemedNote, setTelemedNote] = useState("");
  const [telemedOutcome, setTelemedOutcome] = useState<"keep" | "queue">("keep");
  const [resolutionDraft, setResolutionDraft] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TriageTicket["status"] | null>(null);
  const [isMobileDragging, setIsMobileDragging] = useState(false);
  const [mobileDragPoint, setMobileDragPoint] = useState<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const selectedTicket = detailsTicketId
    ? triageTickets.find((ticket) => ticket.id === detailsTicketId) || null
    : null;
  const draggingTicket = draggingId ? triageTickets.find((ticket) => ticket.id === draggingId) || null : null;

  const openDetails = (ticket: TriageTicket) => {
    setDetailsTicketId(ticket.id);
    setLevelDraft(ticket.level);
    setLevelReason("");
    setTelemedStatusDraft(ticket.telemedicineStatus ?? "waiting");
    setTelemedNote(ticket.telemedicineNote ?? "");
    setTelemedOutcome("keep");
    setResolutionDraft(ticket.resolution ?? "");
    setDetailsOpen(true);
  };

  const handleLevelUpdate = () => {
    if (!selectedTicket) return;
    if (levelDraft === selectedTicket.level) return;
    if (!levelReason.trim()) return;
    updateTicketLevel(selectedTicket.id, levelDraft, levelReason.trim());
    setLevelReason("");
  };

  const handleTelemedUpdate = () => {
    if (!selectedTicket) return;
    const note = telemedNote.trim();
    const nextStatus = telemedOutcome === "queue" ? "in-queue" : undefined;
    if (telemedOutcome === "queue" && !note) return;
    updateTelemedicine(selectedTicket.id, telemedStatusDraft, note, nextStatus);
  };

  const handleComplete = () => {
    if (!selectedTicket) return;
    if (!resolutionDraft.trim()) return;
    completeCare(selectedTicket.id, resolutionDraft.trim());
  };

  const closeDetails = (open: boolean) => {
    setDetailsOpen(open);
    if (!open) {
      setDetailsTicketId(null);
    }
  };

  const canDropTo = (ticket: TriageTicket, status: TriageTicket["status"]) =>
    ALLOWED_MOVES[ticket.status].includes(status);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const getDropStatusFromPoint = (x: number, y: number) => {
    const dropTarget = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>("[data-drop-status]");
    const status = dropTarget?.dataset.dropStatus as TriageTicket["status"] | undefined;
    if (!status) return null;
    return COLUMNS.some((column) => column.status === status) ? status : null;
  };

  const moveTicketToStatus = (ticket: TriageTicket, status: TriageTicket["status"]) => {
    if (status === "approved" && ticket.status === "pending") {
      approveTicket(ticket.id, ticket.level);
    } else if (status === "pending" && ticket.status === "approved") {
      setTicketStatus(ticket.id, "pending");
    } else if (status === "in-queue" && ticket.status === "approved") {
      sendToQueue(ticket.id);
    } else if (status === "approved" && ticket.status === "in-queue") {
      setTicketStatus(ticket.id, "approved");
    } else if (status === "in-care" && ticket.status === "in-queue") {
      startCare(ticket.id);
    } else if (status === "in-queue" && ticket.status === "in-care") {
      setTicketStatus(ticket.id, "in-queue");
    }
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, ticket: TriageTicket) => {
    clearLongPressTimer();
    event.dataTransfer.setData("text/plain", ticket.id);
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(ticket.id);
  };

  const handleDragEnd = () => {
    clearLongPressTimer();
    setIsMobileDragging(false);
    setMobileDragPoint(null);
    setDraggingId(null);
    setDragOverStatus(null);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>, ticket: TriageTicket) => {
    if (ticket.status === "completed") return;
    const touch = event.touches[0];
    if (!touch) return;

    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      setDraggingId(ticket.id);
      setIsMobileDragging(true);
      setMobileDragPoint({ x: touch.clientX, y: touch.clientY });
    }, MOBILE_DRAG_HOLD_MS);
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>, ticket: TriageTicket) => {
    if (!isMobileDragging || draggingId !== ticket.id) return;
    const touch = event.touches[0];
    if (!touch) return;

    if (event.cancelable) {
      event.preventDefault();
    }
    const point = { x: touch.clientX, y: touch.clientY };
    setMobileDragPoint(point);

    const targetStatus = getDropStatusFromPoint(point.x, point.y);
    if (targetStatus && canDropTo(ticket, targetStatus)) {
      setDragOverStatus(targetStatus);
      return;
    }
    setDragOverStatus(null);
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>, ticket: TriageTicket) => {
    clearLongPressTimer();
    if (!isMobileDragging || draggingId !== ticket.id) return;

    if (event.cancelable) {
      event.preventDefault();
    }
    const touch = event.changedTouches[0];
    const targetStatus = touch ? getDropStatusFromPoint(touch.clientX, touch.clientY) : dragOverStatus;
    if (targetStatus && ticket.status !== targetStatus && canDropTo(ticket, targetStatus)) {
      moveTicketToStatus(ticket, targetStatus);
    }

    setIsMobileDragging(false);
    setMobileDragPoint(null);
    setDraggingId(null);
    setDragOverStatus(null);
  };

  const handleTouchCancel = () => {
    clearLongPressTimer();
    setIsMobileDragging(false);
    setMobileDragPoint(null);
    setDraggingId(null);
    setDragOverStatus(null);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, status: TriageTicket["status"]) => {
    event.preventDefault();
    setDragOverStatus(null);
    setDraggingId(null);
    const ticketId = event.dataTransfer.getData("text/plain");
    const ticket = triageTickets.find((item) => item.id === ticketId);
    if (!ticket || ticket.status === status || !canDropTo(ticket, status)) return;
    moveTicketToStatus(ticket, status);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Teletriagem — Kanban
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((col) => {
          const tickets = triageTickets.filter((t) => t.status === col.status);
          const isDropAllowed = draggingTicket ? canDropTo(draggingTicket, col.status) : false;
          const dropActive = dragOverStatus === col.status && isDropAllowed;
          return (
            <div key={col.status} className="space-y-3 min-w-[240px] sm:min-w-[260px] w-[260px] shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{tickets.length}</span>
              </div>
              <div
                data-drop-status={col.status}
                className={`space-y-2 min-h-[120px] bg-muted/30 rounded-xl p-2 transition-shadow ${dropActive ? "ring-2 ring-primary/40 bg-primary/10" : ""}`}
                onDragOver={(event) => {
                  if (isDropAllowed) {
                    event.preventDefault();
                    setDragOverStatus(col.status);
                  }
                }}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={(event) => handleDrop(event, col.status)}
              >
                {tickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className={`shadow-sm ${getStatusAccent(ticket.status)} ${draggingId === ticket.id ? "opacity-60" : ""} ${isMobileDragging && draggingId === ticket.id ? "ring-2 ring-primary/50" : ""}`}
                    draggable={ticket.status !== "completed"}
                    onDragStart={(event) => handleDragStart(event, ticket)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={(event) => handleTouchStart(event, ticket)}
                    onTouchMove={(event) => handleTouchMove(event, ticket)}
                    onTouchEnd={(event) => handleTouchEnd(event, ticket)}
                    onTouchCancel={handleTouchCancel}
                    style={{ touchAction: isMobileDragging && draggingId === ticket.id ? "none" : "pan-y" }}
                  >
                    <CardContent className="p-3 flex flex-col gap-2 h-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-bold text-foreground">{ticket.ticketNumber}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getTriageBadge(ticket.level)}`}>
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
                      {ticket.telemedicineRequested && (
                        <Badge variant="secondary" className="text-[10px] inline-flex items-center gap-1">
                          <Video className="w-3 h-3" /> Telemedicina
                        </Badge>
                      )}
                      {ticket.resolution && ticket.status === "completed" && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          Resolução: {ticket.resolution}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-auto">
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openDetails(ticket)}>
                          Detalhes
                        </Button>
                        {ticket.status === "pending" && (
                          <Button
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => approveTicket(ticket.id, ticket.level)}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovar
                          </Button>
                        )}
                        {ticket.status === "approved" && (
                          <Button size="sm" className="text-xs h-7" onClick={() => sendToQueue(ticket.id)}>
                            Enviar para fila
                          </Button>
                        )}
                        {ticket.status === "in-queue" && (
                          <Button size="sm" className="text-xs h-7" onClick={() => startCare(ticket.id)}>
                            Iniciar atendimento
                          </Button>
                        )}
                        {ticket.status === "in-care" && (
                          <Button size="sm" className="text-xs h-7" onClick={() => openDetails(ticket)}>
                            Concluir atendimento
                          </Button>
                        )}
                      </div>
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

      {isMobileDragging && draggingTicket && mobileDragPoint && (
        <div
          className="fixed z-[70] pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-md bg-foreground text-background text-xs px-2.5 py-1.5 shadow-lg"
          style={{ left: mobileDragPoint.x, top: mobileDragPoint.y }}
        >
          Movendo {draggingTicket.ticketNumber}
        </div>
      )}

      <Dialog open={detailsOpen} onOpenChange={closeDetails}>
        <DialogContent className="max-w-2xl">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle>Atendimento {selectedTicket.ticketNumber}</DialogTitle>
                <DialogDescription>
                  {STATUS_LABELS[selectedTicket.status]} · {selectedTicket.patientName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Sintomas reportados</p>
                    <p className="text-sm text-foreground mt-1">
                      {selectedTicket.symptomsDescription || selectedTicket.symptoms.join(", ")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Previsão e localização</p>
                    <p className="text-sm text-foreground">{selectedTicket.estimatedWait ?? 0} min · {selectedTicket.location ?? "Local não informado"}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px]">{LEVEL_LABELS[selectedTicket.level]}</Badge>
                      <span>{Math.round((Date.now() - selectedTicket.createdAt.getTime()) / 60000)} min atrás</span>
                    </div>
                  </div>
                </div>

                {selectedTicket.status !== "completed" && (
                  <div className="rounded-lg border border-border/60 p-3 space-y-3">
                    <p className="text-sm font-semibold text-foreground">Atualizar gravidade</p>
                    <Select value={levelDraft} onValueChange={(value) => setLevelDraft(value as TriageLevel)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione a gravidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LEVEL_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Justifique o ajuste de gravidade (obrigatório para alteração)."
                      value={levelReason}
                      onChange={(event) => setLevelReason(event.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={handleLevelUpdate}
                      disabled={levelDraft === selectedTicket.level || !levelReason.trim()}
                    >
                      Salvar atualização
                    </Button>
                  </div>
                )}

                {selectedTicket.telemedicineRequested && (
                  <div className="rounded-lg border border-border/60 p-3 space-y-3">
                    <p className="text-sm font-semibold text-foreground">Telemedicina</p>
                    <Select
                      value={telemedStatusDraft}
                      onValueChange={(value) => setTelemedStatusDraft(value as TelemedicineStatus)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Status do atendimento remoto" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TELEMED_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={telemedOutcome}
                      onValueChange={(value) => setTelemedOutcome(value as "keep" | "queue")}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Feedback do médico" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keep">Manter acompanhamento remoto</SelectItem>
                        <SelectItem value="queue">Encaminhar para fila presencial</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Informe o feedback/encaminhamento médico."
                      value={telemedNote}
                      onChange={(event) => setTelemedNote(event.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={handleTelemedUpdate}
                      disabled={telemedOutcome === "queue" && !telemedNote.trim()}
                    >
                      Salvar feedback
                    </Button>
                  </div>
                )}

                {selectedTicket.status === "in-care" && (
                  <div className="rounded-lg border border-border/60 p-3 space-y-3">
                    <p className="text-sm font-semibold text-foreground">Concluir atendimento</p>
                    <Textarea
                      placeholder="Informe a resolução obrigatória (ex: Retorno agendado dia 04/05/26)."
                      value={resolutionDraft}
                      onChange={(event) => setResolutionDraft(event.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button size="sm" className="w-full" onClick={handleComplete} disabled={!resolutionDraft.trim()}>
                      Concluir atendimento
                    </Button>
                  </div>
                )}

                {selectedTicket.resolution && selectedTicket.status === "completed" && (
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Resolução registrada</p>
                    <p className="text-sm text-foreground mt-1">{selectedTicket.resolution}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getTriageBadge(level: TriageLevel) {
  return {
    red: "bg-triage-red/10 text-triage-red",
    orange: "bg-triage-orange/10 text-triage-orange",
    yellow: "bg-triage-yellow/10 text-triage-yellow",
    green: "bg-triage-green/10 text-triage-green",
    blue: "bg-triage-blue/10 text-triage-blue",
  }[level];
}

function getStatusAccent(status: TriageTicket["status"]) {
  return {
    pending: "border-l-4 border-l-info",
    approved: "border-l-4 border-l-primary",
    "in-queue": "border-l-4 border-l-warning",
    "in-care": "border-l-4 border-l-secondary",
    completed: "border-l-4 border-l-success opacity-80",
  }[status];
}
