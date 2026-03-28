import { useMemo, useState } from "react";
import { useHospital } from "@/contexts/HospitalContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

export default function PatientFeedback() {
  const { currentPatient, feedbackScores, addFeedback } = useHospital();
  const { toast } = useToast();
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const myFeedbacks = useMemo(() => {
    return feedbackScores
      .filter((entry) => entry.patientId === currentPatient.id)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [feedbackScores, currentPatient.id]);

  const handleSubmit = () => {
    if (!score) return;
    addFeedback(currentPatient.id, "CSAT", score, comment.trim() || undefined);
    setScore(null);
    setComment("");
    toast({
      title: "Feedback enviado",
      description: "Obrigado por compartilhar sua avaliação.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground">Feedback</h2>
        <p className="text-sm text-muted-foreground mt-1">Avalie sua experiência no HUB</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Como foi o atendimento?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setScore(i + 1)}
                className="p-1 transition-transform hover:scale-110"
                aria-label={`Nota ${i + 1}`}
              >
                <Star
                  className={`w-7 h-7 ${score && i < score ? "fill-warning text-warning" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Ruim</span>
            <span>Excelente</span>
          </div>
          <Textarea
            placeholder="Deixe um comentário"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="min-h-[110px]"
          />
          <Button className="w-full" disabled={!score} onClick={handleSubmit}>
            Enviar avaliação
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Histórico de feedbacks</h3>
        {myFeedbacks.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum feedback enviado ainda.</p>
        ) : (
          <div className="grid gap-3">
            {myFeedbacks.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${getFeedbackTag(entry.score)}`}>
                      <Star className="w-3 h-3" /> {entry.score} estrela{entry.score > 1 ? "s" : ""}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {entry.timestamp.toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.comment || "Sem comentário"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
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
