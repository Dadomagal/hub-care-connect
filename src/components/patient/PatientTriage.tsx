import { useState } from "react";
import { useHospital, type TriageLevel } from "@/contexts/HospitalContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

const SYMPTOM_GROUPS = [
  {
    title: "Como você se sente agora?",
    options: [
      { label: "Dor intensa ou grave", weight: 4 },
      { label: "Dor moderada", weight: 2 },
      { label: "Desconforto leve", weight: 1 },
    ],
  },
  {
    title: "Algum destes sintomas?",
    options: [
      { label: "Febre alta (>39°C)", weight: 3 },
      { label: "Dificuldade para respirar", weight: 4 },
      { label: "Náusea / Vômito", weight: 2 },
      { label: "Tontura / Desmaio", weight: 3 },
      { label: "Nenhum dos acima", weight: 0 },
    ],
  },
  {
    title: "Há quanto tempo os sintomas começaram?",
    options: [
      { label: "Menos de 1 hora", weight: 3 },
      { label: "1 a 6 horas", weight: 2 },
      { label: "6 a 24 horas", weight: 1 },
      { label: "Mais de 24 horas", weight: 0 },
    ],
  },
];

function calculateLevel(score: number): TriageLevel {
  if (score >= 9) return "red";
  if (score >= 7) return "orange";
  if (score >= 4) return "yellow";
  if (score >= 2) return "green";
  return "blue";
}

const LEVEL_LABELS: Record<TriageLevel, { label: string; desc: string }> = {
  red: { label: "Emergência", desc: "Atendimento imediato" },
  orange: { label: "Muito Urgente", desc: "Atendimento em até 10 min" },
  yellow: { label: "Urgente", desc: "Atendimento em até 60 min" },
  green: { label: "Pouco Urgente", desc: "Atendimento em até 120 min" },
  blue: { label: "Não Urgente", desc: "Atendimento por ordem de chegada" },
};

export default function PatientTriage() {
  const { addTriageTicket, currentPatient } = useHospital();
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<TriageLevel | null>(null);

  const isWizard = step < SYMPTOM_GROUPS.length;

  const toggleOption = (weight: number) => {
    setSelections((prev) =>
      prev.includes(weight) ? prev.filter((w) => w !== weight) : [...prev, weight]
    );
  };

  const handleNext = () => {
    if (step < SYMPTOM_GROUPS.length - 1) {
      setStep(step + 1);
    } else {
      const score = selections.reduce((a, b) => a + b, 0);
      const level = calculateLevel(score);
      setResult(level);
      setStep(SYMPTOM_GROUPS.length);
    }
  };

  const handleSubmit = () => {
    if (!result) return;
    addTriageTicket({
      patientId: currentPatient.id,
      patientName: currentPatient.name,
      symptoms: selections.map(String),
      level: result,
      status: "pending",
      estimatedWait: result === "red" ? 0 : result === "orange" ? 10 : result === "yellow" ? 30 : 60,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 className="w-16 h-16 text-success mb-4" />
        <h2 className="text-xl font-display font-bold text-foreground">Triagem Enviada!</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Sua pré-classificação foi enviada à equipe. Acompanhe na aba "Fila".
        </p>
        <Button className="mt-6" onClick={() => { setStep(0); setSelections([]); setSubmitted(false); setResult(null); }}>
          Nova Triagem
        </Button>
      </div>
    );
  }

  if (!isWizard && result) {
    const info = LEVEL_LABELS[result];
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-display font-bold text-foreground">Resultado Preliminar</h2>
        <Card className={`border-2 border-triage-${result}`}>
          <CardContent className="p-5 text-center">
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-3 bg-triage-${result}/15 text-triage-${result}`}>
              {info.label}
            </div>
            <p className="text-muted-foreground text-sm">{info.desc}</p>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          Esta é uma pré-classificação baseada no Protocolo de Manchester. A equipe médica validará presencialmente.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => { setStep(0); setSelections([]); setResult(null); }}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Refazer
          </Button>
          <Button className="flex-1" onClick={handleSubmit}>
            Enviar à Equipe
          </Button>
        </div>
      </div>
    );
  }

  const group = SYMPTOM_GROUPS[step];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-foreground">Teletriagem</h2>
        <span className="text-xs text-muted-foreground">Etapa {step + 1}/{SYMPTOM_GROUPS.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((step + 1) / SYMPTOM_GROUPS.length) * 100}%` }} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{group.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {group.options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => toggleOption(opt.weight)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                selections.includes(opt.weight)
                  ? "border-primary bg-accent text-accent-foreground font-medium"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        <Button className="flex-1" onClick={handleNext}>
          {step < SYMPTOM_GROUPS.length - 1 ? (
            <>Próximo <ChevronRight className="w-4 h-4 ml-1" /></>
          ) : (
            "Ver Resultado"
          )}
        </Button>
      </div>
    </div>
  );
}
