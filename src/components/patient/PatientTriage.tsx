import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useHospital, type TriageLevel } from "@/contexts/HospitalContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

const TOTAL_STEPS = SYMPTOM_GROUPS.length + 1; // +1 for step 4 (details)

function calculateLevel(score: number): TriageLevel {
  if (score >= 9) return "red";
  if (score >= 7) return "orange";
  if (score >= 4) return "yellow";
  if (score >= 2) return "green";
  return "blue";
}

const LEVEL_LABELS: Record<TriageLevel, { label: string; desc: string; wait: string }> = {
  red: { label: "Emergência", desc: "Muito grave. Risco de perder a vida.", wait: "Imediato" },
  orange: { label: "Muito Urgente", desc: "Grave. Risco significativo de piora do quadro.", wait: "10 min" },
  yellow: { label: "Urgente", desc: "Gravidade moderada. Necessidade de atendimento médico. Sem risco imediato.", wait: "60 min" },
  green: { label: "Pouco Urgente", desc: "Necessidade de atendimento médico. Pode aguardar. Sem risco imediato.", wait: "120 min" },
  blue: { label: "Não Urgente", desc: "Caso para atendimento em ESF ou UBS em dias úteis.", wait: "240 min" },
};

export default function PatientTriage() {
  const { addTriageTicket, currentPatient } = useHospital();
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  // Independent selections per step
  const [stepSelections, setStepSelections] = useState<Record<number, string[]>>({});
  const [otherTexts, setOtherTexts] = useState<Record<number, string>>({});
  const [detailText, setDetailText] = useState("");
  const [result, setResult] = useState<TriageLevel | null>(null);

  const isDetailStep = step === SYMPTOM_GROUPS.length;
  const isResult = step === TOTAL_STEPS;

  const setTabParam = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next);
  };

  const toggleOption = (stepIdx: number, label: string) => {
    setStepSelections((prev) => {
      const current = prev[stepIdx] || [];
      const updated = current.includes(label)
        ? current.filter((l) => l !== label)
        : [...current, label];
      return { ...prev, [stepIdx]: updated };
    });
  };

  const getScore = () => {
    let score = 0;
    SYMPTOM_GROUPS.forEach((group, idx) => {
      const selected = stepSelections[idx] || [];
      group.options.forEach((opt) => {
        if (selected.includes(opt.label)) {
          score += opt.weight;
        }
      });
    });
    return score;
  };

  const getAllSymptoms = () => {
    const symptoms: string[] = [];
    SYMPTOM_GROUPS.forEach((group, idx) => {
      const selected = stepSelections[idx] || [];
      symptoms.push(...selected.filter(s => s !== "Nenhum dos acima"));
      const otherText = otherTexts[idx];
      if (otherText) symptoms.push(`Outro: ${otherText}`);
    });
    return symptoms;
  };

  const handleNext = (canProceed = true) => {
    if (!canProceed) return;
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      // After detail step, show result
      const score = getScore();
      const level = calculateLevel(score);
      setResult(level);
      setStep(TOTAL_STEPS);
    }
  };

  const getTelemedicineEta = (level: TriageLevel) => {
    if (level === "red") return 5;
    if (level === "orange") return 15;
    if (level === "yellow") return 25;
    if (level === "green") return 40;
    return 55;
  };

  const resetForm = () => {
    setStep(0);
    setStepSelections({});
    setOtherTexts({});
    setDetailText("");
    setResult(null);
  };

  const handleSubmit = (telemedicineRequested: boolean) => {
    if (!result) return;
    const symptoms = getAllSymptoms();
    addTriageTicket({
      patientId: currentPatient.id,
      patientName: currentPatient.name,
      symptoms,
      symptomsDescription: detailText || symptoms.join(", "),
      level: result,
      status: "pending",
      estimatedWait: result === "red" ? 0 : result === "orange" ? 10 : result === "yellow" ? 60 : result === "green" ? 120 : 240,
      location: "Recepção Principal",
      telemedicineRequested,
      telemedicineEta: telemedicineRequested ? getTelemedicineEta(result) : undefined,
      telemedicineStatus: telemedicineRequested ? "waiting" : undefined,
    });
    resetForm();
    setTabParam("queue");
  };

  if (isResult && result) {
    const info = LEVEL_LABELS[result];
    const telemedicineEta = getTelemedicineEta(result);
    const triageColorClass = {
      red: "border-triage-red bg-triage-red/10 text-triage-red",
      orange: "border-triage-orange bg-triage-orange/10 text-triage-orange",
      yellow: "border-triage-yellow bg-triage-yellow/10 text-triage-yellow",
      green: "border-triage-green bg-triage-green/10 text-triage-green",
      blue: "border-triage-blue bg-triage-blue/10 text-triage-blue",
    }[result];

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-display font-bold text-foreground">Resultado Preliminar</h2>
        <Card className={`border-2 ${triageColorClass.split(" ")[0]}`}>
          <CardContent className="p-5 text-center">
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-3 ${triageColorClass}`}>
              {info.label}
            </div>
            <p className="text-muted-foreground text-sm">{info.desc}</p>
            <p className="text-xs text-muted-foreground mt-2">Previsão de atendimento: <span className="font-semibold">{info.wait}</span></p>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          Esta é uma pré-classificação baseada no Protocolo de Manchester. A equipe médica validará presencialmente.
        </p>
        <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
          Atendimento médico disponível à distância. Tempo estimado: <span className="font-semibold text-foreground">{telemedicineEta} min</span>.
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={resetForm}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Refazer
          </Button>
          <Button className="flex-1" onClick={() => handleSubmit(true)}>
            Solicitar atendimento médico
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => handleSubmit(false)}>
            Enviar triagem
          </Button>
        </div>
      </div>
    );
  }

  // Detail step (step 4)
  if (isDetailStep) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-foreground">Teletriagem</h2>
          <span className="text-xs text-muted-foreground">Etapa {step + 1}/{TOTAL_STEPS}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} />
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Descreva com mais detalhes o que você sente</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ex: Estou sentindo dor no peito há 2 horas, com dificuldade para respirar quando deito..."
              value={detailText}
              onChange={(e) => setDetailText(e.target.value)}
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button className="flex-1" onClick={handleNext}>
            Ver Resultado
          </Button>
        </div>
      </div>
    );
  }

  // Symptom selection steps
  const group = SYMPTOM_GROUPS[step];
  const currentSelections = stepSelections[step] || [];
  const showOtherInput = currentSelections.includes("Outros");
  const otherTextValid = !showOtherInput || Boolean(otherTexts[step]?.trim());
  const canProceed = currentSelections.length > 0 && otherTextValid;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-foreground">Teletriagem</h2>
        <span className="text-xs text-muted-foreground">Etapa {step + 1}/{TOTAL_STEPS}</span>
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{group.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {group.options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => toggleOption(step, opt.label)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                currentSelections.includes(opt.label)
                  ? "border-primary bg-accent text-accent-foreground font-medium"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
          {/* Outros option */}
          <button
            onClick={() => toggleOption(step, "Outros")}
            className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
              showOtherInput
                ? "border-primary bg-accent text-accent-foreground font-medium"
                : "border-border bg-card text-foreground hover:border-primary/40"
            }`}
          >
            Outros
          </button>
          {showOtherInput && (
            <Textarea
              placeholder="Descreva seus sintomas..."
              value={otherTexts[step] || ""}
              onChange={(e) => setOtherTexts((prev) => ({ ...prev, [step]: e.target.value }))}
              className="min-h-[60px] mt-1"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        <Button className="flex-1" onClick={() => handleNext(canProceed)} disabled={!canProceed}>
          {step < TOTAL_STEPS - 1 ? (
            <>Próximo <ChevronRight className="w-4 h-4 ml-1" /></>
          ) : (
            "Ver Resultado"
          )}
        </Button>
      </div>
      {!canProceed && (
        <p className="text-xs text-warning">Selecione ao menos uma opção para continuar.</p>
      )}
    </div>
  );
}
