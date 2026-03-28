import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type UserRole = "patient" | "staff" | null;
export type TriageLevel = "red" | "orange" | "yellow" | "green" | "blue";
export type TriageStatus = "pending" | "approved" | "in-queue";

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
}

export interface OncologyEvent {
  id: string;
  date: Date;
  type: "infusion" | "consult" | "exam" | "return";
  description: string;
  location: string;
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
  oncologyEvents: OncologyEvent[];
  feedbackScores: { type: string; score: number; timestamp: Date }[];
  addFeedback: (type: string, score: number) => void;
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
  { id: "t2", ticketNumber: "A098", patientId: "p4", patientName: "Carlos Lima", symptoms: ["Dor torácica", "Dispneia"], symptomsDescription: "Dor no peito com falta de ar súbita", level: "red", status: "approved", createdAt: new Date(Date.now() - 600000), estimatedWait: 0, location: "Emergência" },
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
        t.id === id ? { ...t, level, status: "approved" as TriageStatus, estimatedWait: level === "red" ? 0 : level === "orange" ? 10 : level === "yellow" ? 60 : level === "green" ? 120 : 240 } : t
      )
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
        triageTickets, addTriageTicket, approveTicket,
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
