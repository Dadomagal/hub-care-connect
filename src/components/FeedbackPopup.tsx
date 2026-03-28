import { useState } from "react";
import { useHospital } from "@/contexts/HospitalContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { X, Star } from "lucide-react";

interface FeedbackPopupProps {
  type: "CES" | "CSAT" | "NPS";
  question: string;
  onClose: () => void;
}

export default function FeedbackPopup({ type, question, onClose }: FeedbackPopupProps) {
  const { addFeedback, currentPatient } = useHospital();
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const maxScore = type === "NPS" ? 10 : 5;

  const handleSubmit = () => {
    if (score !== null) {
      addFeedback(currentPatient.id, type, score, comment.trim() || undefined);
      setSubmitted(true);
      setTimeout(onClose, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-foreground/20 backdrop-blur-sm">
      <Card className="w-full max-w-sm shadow-xl animate-in slide-in-from-bottom-4">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-foreground pr-4">{submitted ? "Obrigado! 🎉" : question}</p>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!submitted && (
            <>
              <div className="flex gap-1 justify-center">
                {Array.from({ length: maxScore }).map((_, i) => (
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
                <span>Muito difícil</span>
                <span>Muito fácil</span>
              </div>
              <Textarea
                placeholder="Deixe um comentário"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className="min-h-[90px]"
              />
              <Button className="w-full" disabled={score === null} onClick={handleSubmit}>
                Enviar
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
