import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type UserRole = "patient" | "staff" | null;
export type TriageLevel = "red" | "orange" | "yellow" | "green" | "blue";
export type TriageStatus = "pending" | "approved" | "in-queue" | "in-service" | "completed";

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

export interface SeverityChange {
  from: TriageLevel;
  to: TriageLevel;
  justification: string;
  changedBy: string;
  timestamp: Date;
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
  resolution?: string;
  severityChanges?: SeverityChange[];
  telemedicine?: boolean;
  telemedicineWait?: number;
}

export interface OncologyEvent {
  id: string;
  date: Date;
  type: "infusion" | "consult" | "exam" | "return";
  description: string;
  location: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: "doctor" | "nurse";
  specialty?: string;
  shift: "morning" | "afternoon" | "night";
  avatar: string;
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
  startServiceTicket: (id: string) => void;
  completeTicket: (id: string, resolution: string) => void;
  changeSeverity: (id: string, newLevel: TriageLevel, justification: string, changedBy: string) => void;
  oncologyEvents: OncologyEvent[];
  feedbackScores: { type: string; score: number; timestamp: Date }[];
  addFeedback: (type: string, score: number) => void;
  pendingDestination: string | null;
  setPendingDestination: (dest: string | null) => void;
  staffMembers: StaffMember[];
}

const MOCK_PATIENTS: Patient[] = [
  { id: "p1", name: "Maria Silva", cpf: "***.***.***-01", avatar: "MS", age: 58, oncology: true },
  { id: "p2", name: "João Santos", cpf: "***.***.***-02", avatar: "JS", age: 34 },
  { id: "p3", name: "Ana Oliveira", cpf: "***.***.***-03", avatar: "AO", age: 72, oncology: true },
  { id: "p4", name: "Carlos Lima", cpf: "***.***.***-04", avatar: "CL", age: 45 },
  { id: "p5", name: "Beatriz Rocha", cpf: "***.***.***-05", avatar: "BR", age: 29 },
];

const MOCK_STAFF: StaffMember[] = [
  { id: "s1", name: "Dr. Ricardo Mendes", role: "doctor", specialty: "Clínica Geral", shift: "morning", avatar: "RM" },
  { id: "s2", name: "Dra. Fernanda Costa", role: "doctor", specialty: "Oncologia", shift: "morning", avatar: "FC" },
  { id: "s3", name: "Dr. Paulo Almeida", role: "doctor", specialty: "Emergência", shift: "afternoon", avatar: "PA" },
  { id: "s4", name: "Enf. Ana Beatriz", role: "nurse", shift: "morning", avatar: "AB" },
  { id: "s5", name: "Enf. Marcos Vieira", role: "nurse", shift: "afternoon", avatar: "MV" },
  { id: "s6", name: "Enf. Juliana Reis", role: "nurse", shift: "night", avatar: "JR" },
  { id: "s7", name: "Dr. Thiago Borges", role: "doctor", specialty: "Cardiologia", shift: "night", avatar: "TB" },
];

const MOCK_ONCOLOGY_EVENTS: OncologyEvent[] = [
  { id: "o1", date: new Date(2026, 2, 15), type: "infusion", description: "Ciclo 3 — Quimioterapia", location: "Oncologia" },
  { id: "o2", date: new Date(2026, 3, 2), type: "consult", description: "Consulta Dr. Mendes", location: "Ambulatório" },
  { id: "o3", date: new Date(2026, 3, 10), type: "exam", description: "Hemograma completo", location: "Laboratório" },
  { id: "o4", date: new Date(2026, 3, 22), type: "infusion", description: "Ciclo 4 — Quimioterapia", location: "Oncologia" },
  { id: "o5", date: new Date(2026, 4, 5), type: "return", description: "Retorno oncologia", location: "Oncologia" },
  { id: "o6", date: new Date(2026, 4, 20), type: "infusion", description: "Ciclo 5 — Quimioterapia", location: "Oncologia" },
];

let ticketCounter = 100;

const INITIAL_TICKETS: TriageTicket[] = [
  { id: "t1", ticketNumber: "A097", patientId: "p2", patientName: "João Santos", symptoms: ["Dor de cabeça", "Febre"], symptomsDescription: "Dor de cabeça forte há 3 horas, febre de 38.5°C", level: "yellow", status: "pending", createdAt: new Date(Date.now() - 1200000), location: "Recepção Principal" },
  { id: "t2", ticketNumber: "A098", patientId: "p4", patientName: "Carlos Lima", symptoms: ["Dor torácica", "Dispneia"], symptomsDescription: "Dor no peito com falta de ar súbita", level: "red", status: "in-service", createdAt: new Date(Date.now() - 600000), estimatedWait: 0, location: "Emergência" },
  { id: "t3", ticketNumber: "A099", patientId: "p5", patientName: "Beatriz Rocha", symptoms: ["Dor de garganta"], symptomsDescription: "Dor de garganta há 2 dias", level: "green", status: "in-queue", createdAt: new Date(Date.now() - 3600000), estimatedWait: 45, location: "Recepção Principal" },
];

const HospitalContext = createContext<HospitalState | null>(null);

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [sosAlerts, setSOSAlerts] = useState<SOSAlert[]>([]);
  const [lostAlerts, setLostAlerts] = useState<LostAlert[]>([]);
  const [triageTickets, setTriageTickets] = useState<TriageTicket[]>(INITIAL_TICKETS);
  const [feedbackScores, setFeedbackScores] = useState<{ type: string; score: number; timestamp: Date }[]>([]);
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
        t.id === id ? { ...t, level, status: "in-queue" as TriageStatus, estimatedWait: level === "red" ? 0 : level === "orange" ? 10 : level === "yellow" ? 60 : level === "green" ? 120 : 240 } : t
      )
    );
  }, []);

  const startServiceTicket = useCallback((id: string) => {
    setTriageTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "in-service" as TriageStatus } : t))
    );
  }, []);

  const completeTicket = useCallback((id: string, resolution: string) => {
    setTriageTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "completed" as TriageStatus, resolution } : t))
    );
  }, []);

  const changeSeverity = useCallback((id: string, newLevel: TriageLevel, justification: string, changedBy: string) => {
    setTriageTickets((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const change: SeverityChange = { from: t.level, to: newLevel, justification, changedBy, timestamp: new Date() };
        return {
          ...t,
          level: newLevel,
          severityChanges: [...(t.severityChanges || []), change],
          estimatedWait: newLevel === "red" ? 0 : newLevel === "orange" ? 10 : newLevel === "yellow" ? 60 : newLevel === "green" ? 120 : 240,
        };
      })
    );
  }, []);

  const addFeedback = useCallback((type: string, score: number) => {
    setFeedbackScores((prev) => [...prev, { type, score, timestamp: new Date() }]);
  }, []);

  return (
    <HospitalContext.Provider
      value={{
        role, setRole, currentPatient, patients: MOCK_PATIENTS,
        sosAlerts, triggerSOS, dismissSOS,
        lostAlerts, triggerLost, dismissLost, assignLost,
        triageTickets, addTriageTicket, approveTicket, startServiceTicket, completeTicket, changeSeverity,
        oncologyEvents: MOCK_ONCOLOGY_EVENTS,
        feedbackScores, addFeedback,
        pendingDestination, setPendingDestination,
        staffMembers: MOCK_STAFF,
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
