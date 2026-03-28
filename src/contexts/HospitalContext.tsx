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

export interface TriageTicket {
  id: string;
  patientId: string;
  patientName: string;
  symptoms: string[];
  level: TriageLevel;
  status: TriageStatus;
  createdAt: Date;
  estimatedWait?: number;
}

export interface OncologyEvent {
  id: string;
  date: Date;
  type: "infusion" | "consult" | "exam" | "return";
  description: string;
}

interface HospitalState {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentPatient: Patient;
  patients: Patient[];
  sosAlerts: SOSAlert[];
  triggerSOS: (location: string) => void;
  dismissSOS: (id: string) => void;
  triageTickets: TriageTicket[];
  addTriageTicket: (ticket: Omit<TriageTicket, "id" | "createdAt">) => void;
  approveTicket: (id: string, level: TriageLevel) => void;
  oncologyEvents: OncologyEvent[];
  feedbackScores: { type: string; score: number; timestamp: Date }[];
  addFeedback: (type: string, score: number) => void;
}

const MOCK_PATIENTS: Patient[] = [
  { id: "p1", name: "Maria Silva", cpf: "***.***.***-01", avatar: "MS", age: 58, oncology: true },
  { id: "p2", name: "João Santos", cpf: "***.***.***-02", avatar: "JS", age: 34 },
  { id: "p3", name: "Ana Oliveira", cpf: "***.***.***-03", avatar: "AO", age: 72, oncology: true },
  { id: "p4", name: "Carlos Lima", cpf: "***.***.***-04", avatar: "CL", age: 45 },
  { id: "p5", name: "Beatriz Rocha", cpf: "***.***.***-05", avatar: "BR", age: 29 },
];

const MOCK_ONCOLOGY_EVENTS: OncologyEvent[] = [
  { id: "o1", date: new Date(2026, 2, 15), type: "infusion", description: "Ciclo 3 — Quimioterapia" },
  { id: "o2", date: new Date(2026, 3, 2), type: "consult", description: "Consulta Dr. Mendes" },
  { id: "o3", date: new Date(2026, 3, 10), type: "exam", description: "Hemograma completo" },
  { id: "o4", date: new Date(2026, 3, 22), type: "infusion", description: "Ciclo 4 — Quimioterapia" },
  { id: "o5", date: new Date(2026, 4, 5), type: "return", description: "Retorno oncologia" },
  { id: "o6", date: new Date(2026, 4, 20), type: "infusion", description: "Ciclo 5 — Quimioterapia" },
];

const INITIAL_TICKETS: TriageTicket[] = [
  { id: "t1", patientId: "p2", patientName: "João Santos", symptoms: ["Dor de cabeça", "Febre"], level: "yellow", status: "pending", createdAt: new Date(Date.now() - 1200000) },
  { id: "t2", patientId: "p4", patientName: "Carlos Lima", symptoms: ["Dor torácica", "Dispneia"], level: "red", status: "approved", createdAt: new Date(Date.now() - 600000), estimatedWait: 0 },
  { id: "t3", patientId: "p5", patientName: "Beatriz Rocha", symptoms: ["Dor de garganta"], level: "green", status: "in-queue", createdAt: new Date(Date.now() - 3600000), estimatedWait: 45 },
];

const HospitalContext = createContext<HospitalState | null>(null);

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [sosAlerts, setSOSAlerts] = useState<SOSAlert[]>([]);
  const [triageTickets, setTriageTickets] = useState<TriageTicket[]>(INITIAL_TICKETS);
  const [feedbackScores, setFeedbackScores] = useState<{ type: string; score: number; timestamp: Date }[]>([]);

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

  const addTriageTicket = useCallback((ticket: Omit<TriageTicket, "id" | "createdAt">) => {
    setTriageTickets((prev) => [
      { ...ticket, id: `t-${Date.now()}`, createdAt: new Date() },
      ...prev,
    ]);
  }, []);

  const approveTicket = useCallback((id: string, level: TriageLevel) => {
    setTriageTickets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, level, status: "approved" as TriageStatus, estimatedWait: level === "red" ? 0 : level === "orange" ? 10 : level === "yellow" ? 30 : 60 } : t
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
        triageTickets, addTriageTicket, approveTicket,
        oncologyEvents: MOCK_ONCOLOGY_EVENTS,
        feedbackScores, addFeedback,
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
