import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type UserRole = "patient" | "staff" | null;
export type TriageLevel = "red" | "orange" | "yellow" | "green" | "blue";
export type TriageStatus = "pending" | "approved" | "in-queue" | "in-care" | "completed";
export type TelemedicineStatus = "waiting" | "in-call" | "completed";

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  avatar: string;
  age: number;
  oncology?: boolean;
}

export interface SOSAlert {
  id: string;
  patientId: string;
  patientName: string;
  location: string;
  timestamp: Date;
  active: boolean;
}

export interface LostAlert {
  id: string;
  patientId: string;
  patientName: string;
  location: string;
  timestamp: Date;
  active: boolean;
  assignedTo?: string;
}

export interface TriageTicket {
  id: string;
  ticketNumber: string;
  patientId: string;
  patientName: string;
  symptoms: string[];
  symptomsDescription: string;
  level: TriageLevel;
  status: TriageStatus;
  createdAt: Date;
  estimatedWait?: number;
  location?: string;
  telemedicineRequested?: boolean;
  telemedicineEta?: number;
  telemedicineStatus?: TelemedicineStatus;
  telemedicineNote?: string;
  resolution?: string;
  levelChangeReason?: string;
  levelChangedAt?: Date;
}

export interface FeedbackEntry {
  id: string;
  patientId: string;
  type: string;
  score: number;
  comment?: string;
  timestamp: Date;
}

export interface OncologyEvent {
  id: string;
  date: Date;
  type: "infusion" | "consult" | "exam" | "return";
  description: string;
  location: string;
  preparations?: string[];
  results?: string[];
  documents?: string[];
}

interface HospitalState {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentPatient: Patient;
  patients: Patient[];
  sosAlerts: SOSAlert[];
  triggerSOS: (location: string) => void;
  dismissSOS: (id: string) => void;
  lostAlerts: LostAlert[];
  triggerLost: (location: string) => void;
  dismissLost: (id: string) => void;
  assignLost: (id: string, staffName: string) => void;
  triageTickets: TriageTicket[];
  addTriageTicket: (ticket: Omit<TriageTicket, "id" | "createdAt" | "ticketNumber">) => void;
  approveTicket: (id: string, level: TriageLevel) => void;
  sendToQueue: (id: string) => void;
  startCare: (id: string) => void;
  completeCare: (id: string, resolution: string) => void;
  setTicketStatus: (id: string, status: TriageStatus) => void;
  updateTicketLevel: (id: string, level: TriageLevel, reason: string) => void;
  updateTelemedicine: (id: string, status: TelemedicineStatus, note: string, nextStatus?: TriageStatus, resolution?: string) => void;
  oncologyEvents: OncologyEvent[];
  feedbackScores: FeedbackEntry[];
  addFeedback: (patientId: string, type: string, score: number, comment?: string) => void;
  pendingDestination: string | null;
  setPendingDestination: (dest: string | null) => void;
}

const MOCK_PATIENTS: Patient[] = [
  { id: "p1", name: "Maria Silva", cpf: "***.***.***-01", avatar: "MS", age: 58, oncology: true },
  { id: "p2", name: "João Santos", cpf: "***.***.***-02", avatar: "JS", age: 34 },
  { id: "p3", name: "Ana Oliveira", cpf: "***.***.***-03", avatar: "AO", age: 72, oncology: true },
  { id: "p4", name: "Carlos Lima", cpf: "***.***.***-04", avatar: "CL", age: 45 },
  { id: "p5", name: "Beatriz Rocha", cpf: "***.***.***-05", avatar: "BR", age: 29 },
];

const MOCK_ONCOLOGY_EVENTS: OncologyEvent[] = [
  {
    id: "o1",
    date: new Date(2026, 2, 15),
    type: "infusion",
    description: "Ciclo 3 — Quimioterapia",
    location: "Oncologia",
    preparations: [
      "Chegar 30 min antes para triagem de sinais vitais",
      "Levar lista de medicamentos em uso",
      "Manter hidratação leve durante o dia",
    ],
    results: ["Aplicação finalizada sem intercorrências", "Orientado repouso por 24h"],
    documents: ["Receita de suporte", "Atestado de comparecimento"],
  },
  {
    id: "o2",
    date: new Date(2026, 3, 2),
    type: "consult",
    description: "Consulta Dr. Mendes",
    location: "Ambulatório",
    preparations: [
      "Separar exames anteriores e relatórios",
      "Anotar dúvidas para a consulta",
    ],
    results: ["Plano terapêutico atualizado"],
    documents: ["Receita médica", "Atestado médico"],
  },
  {
    id: "o3",
    date: new Date(2026, 3, 10),
    type: "exam",
    description: "Hemograma completo",
    location: "Laboratório",
    preparations: [
      "Jejum de 8 horas",
      "Evitar atividade física intensa no dia anterior",
    ],
    results: ["Hemoglobina dentro do esperado", "Leucócitos sem alterações relevantes"],
    documents: ["Laudo de exame", "Comprovante de realização"],
  },
  {
    id: "o4",
    date: new Date(2026, 3, 22),
    type: "infusion",
    description: "Ciclo 4 — Quimioterapia",
    location: "Oncologia",
    preparations: [
      "Chegar com antecedencia de 20 min",
      "Hidratação reforçada no dia anterior",
    ],
  },
  {
    id: "o5",
    date: new Date(2026, 4, 5),
    type: "return",
    description: "Retorno oncologia",
    location: "Oncologia",
    preparations: [
      "Levar resultados de exames recentes",
      "Registrar sintomas desde o ultimo atendimento",
    ],
  },
  {
    id: "o6",
    date: new Date(2026, 4, 20),
    type: "infusion",
    description: "Ciclo 5 — Quimioterapia",
    location: "Oncologia",
    preparations: ["Confirmar acompanhante", "Trazer documento de identificação"],
  },
];

const INITIAL_FEEDBACK: FeedbackEntry[] = [
  { id: "f1", patientId: "p2", type: "CSAT", score: 5, comment: "Atendimento rápido e atencioso.", timestamp: new Date(Date.now() - 3600000) },
  { id: "f2", patientId: "p1", type: "CSAT", score: 4, comment: "Equipe acolhedora.", timestamp: new Date(Date.now() - 7200000) },
];

let ticketCounter = 102;

const INITIAL_TICKETS: TriageTicket[] = [
  { id: "t1", ticketNumber: "A097", patientId: "p2", patientName: "João Santos", symptoms: ["Dor de cabeça", "Febre"], symptomsDescription: "Dor de cabeça forte há 3 horas, febre de 38.5°C", level: "yellow", status: "pending", createdAt: new Date(Date.now() - 1200000), location: "Recepção Principal" },
  { id: "t2", ticketNumber: "A098", patientId: "p4", patientName: "Carlos Lima", symptoms: ["Dor torácica", "Dispneia"], symptomsDescription: "Dor no peito com falta de ar súbita", level: "red", status: "approved", createdAt: new Date(Date.now() - 600000), estimatedWait: 0, location: "Emergência" },
  { id: "t3", ticketNumber: "A099", patientId: "p5", patientName: "Beatriz Rocha", symptoms: ["Dor de garganta"], symptomsDescription: "Dor de garganta há 2 dias", level: "green", status: "in-queue", createdAt: new Date(Date.now() - 3600000), estimatedWait: 45, location: "Recepção Principal" },
  { id: "t4", ticketNumber: "A100", patientId: "p1", patientName: "Maria Silva", symptoms: ["Fadiga", "Dor"], symptomsDescription: "Relato de fadiga intensa e dor óssea", level: "orange", status: "in-care", createdAt: new Date(Date.now() - 1800000), estimatedWait: 15, location: "Oncologia" },
  { id: "t5", ticketNumber: "A101", patientId: "p3", patientName: "Ana Oliveira", symptoms: ["Consulta"], symptomsDescription: "Retorno pós-exame", level: "green", status: "completed", createdAt: new Date(Date.now() - 7200000), estimatedWait: 0, location: "Ambulatório", resolution: "Retorno agendado dia 04/05/26" },
  { id: "t6", ticketNumber: "A102", patientId: "p2", patientName: "João Santos", symptoms: ["Tosse"], symptomsDescription: "Solicitação de atendimento remoto", level: "green", status: "approved", createdAt: new Date(Date.now() - 900000), estimatedWait: 30, location: "Recepção Principal", telemedicineRequested: true, telemedicineEta: 25, telemedicineStatus: "waiting" },
];

const HospitalContext = createContext<HospitalState | null>(null);

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [sosAlerts, setSOSAlerts] = useState<SOSAlert[]>([]);
  const [lostAlerts, setLostAlerts] = useState<LostAlert[]>([]);
  const [triageTickets, setTriageTickets] = useState<TriageTicket[]>(INITIAL_TICKETS);
  const [feedbackScores, setFeedbackScores] = useState<FeedbackEntry[]>(INITIAL_FEEDBACK);
  const [pendingDestination, setPendingDestination] = useState<string | null>(null);

  const currentPatient = MOCK_PATIENTS[0];

  const triggerSOS = useCallback((location: string) => {
    const alert: SOSAlert = {
      id: `sos-${Date.now()}`,
      patientId: currentPatient.id,
      patientName: currentPatient.name,
      location,
      timestamp: new Date(),
      active: true,
    };
    setSOSAlerts((prev) => [alert, ...prev]);
  }, [currentPatient]);

  const dismissSOS = useCallback((id: string) => {
    setSOSAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active: false } : a)));
  }, []);

  const triggerLost = useCallback((location: string) => {
    const alert: LostAlert = {
      id: `lost-${Date.now()}`,
      patientId: currentPatient.id,
      patientName: currentPatient.name,
      location,
      timestamp: new Date(),
      active: true,
    };
    setLostAlerts((prev) => [alert, ...prev]);
  }, [currentPatient]);

  const dismissLost = useCallback((id: string) => {
    setLostAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active: false } : a)));
  }, []);

  const assignLost = useCallback((id: string, staffName: string) => {
    setLostAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, assignedTo: staffName } : a)));
  }, []);

  const addTriageTicket = useCallback((ticket: Omit<TriageTicket, "id" | "createdAt" | "ticketNumber">) => {
    ticketCounter++;
    const ticketNumber = `A${ticketCounter.toString().padStart(3, "0")}`;
    setTriageTickets((prev) => [
      { ...ticket, id: `t-${Date.now()}`, ticketNumber, createdAt: new Date() },
      ...prev,
    ]);
  }, []);

  const approveTicket = useCallback((id: string, level: TriageLevel) => {
    setTriageTickets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, level, status: "approved" as TriageStatus, estimatedWait: level === "red" ? 0 : level === "orange" ? 10 : level === "yellow" ? 60 : level === "green" ? 120 : 240 } : t
      )
    );
  }, []);

  const sendToQueue = useCallback((id: string) => {
    setTriageTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "in-queue" } : t))
    );
  }, []);

  const startCare = useCallback((id: string) => {
    setTriageTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "in-care" } : t))
    );
  }, []);

  const completeCare = useCallback((id: string, resolution: string) => {
    setTriageTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "completed", resolution } : t))
    );
  }, []);

  const setTicketStatus = useCallback((id: string, status: TriageStatus) => {
    setTriageTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  }, []);

  const updateTicketLevel = useCallback((id: string, level: TriageLevel, reason: string) => {
    setTriageTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, level, levelChangeReason: reason, levelChangedAt: new Date() }
          : t
      )
    );
  }, []);

  const updateTelemedicine = useCallback((
    id: string,
    status: TelemedicineStatus,
    note: string,
    nextStatus?: TriageStatus,
    resolution?: string
  ) => {
    setTriageTickets((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          telemedicineStatus: status,
          telemedicineNote: note,
          status: nextStatus ?? t.status,
          resolution: resolution ?? t.resolution,
        };
      })
    );
  }, []);

  const addFeedback = useCallback((patientId: string, type: string, score: number, comment?: string) => {
    setFeedbackScores((prev) => [
      { id: `f-${Date.now()}`, patientId, type, score, comment, timestamp: new Date() },
      ...prev,
    ]);
  }, []);

  return (
    <HospitalContext.Provider
      value={{
        role, setRole, currentPatient, patients: MOCK_PATIENTS,
        sosAlerts, triggerSOS, dismissSOS,
        lostAlerts, triggerLost, dismissLost, assignLost,
        triageTickets, addTriageTicket, approveTicket, sendToQueue, startCare, completeCare, setTicketStatus, updateTicketLevel, updateTelemedicine,
        oncologyEvents: MOCK_ONCOLOGY_EVENTS,
        feedbackScores, addFeedback,
        pendingDestination, setPendingDestination,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const ctx = useContext(HospitalContext);
  if (!ctx) throw new Error("useHospital must be used within HospitalProvider");
  return ctx;
}
