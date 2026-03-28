import { useState } from "react";
import { useHospital } from "@/contexts/HospitalContext";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SOSButton() {
  const { triggerSOS } = useHospital();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const handleConfirm = () => {
    triggerSOS("Bloco A — Corredor 3");
    setSent(true);
    setTimeout(() => {
      setOpen(false);
      setSent(false);
    }, 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 sm:bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-emergency text-emergency-foreground flex items-center justify-center shadow-xl animate-sos-pulse focus:outline-none focus:ring-4 focus:ring-emergency/40"
        aria-label="Emergência SOS"
      >
        <AlertTriangle className="w-7 h-7" />
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emergency flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Emergência SOS
            </AlertDialogTitle>
            <AlertDialogDescription>
              {sent
                ? "✅ Alerta enviado com sucesso! A equipe foi notificada."
                : "Ao confirmar, sua identidade e localização serão enviadas imediatamente para a equipe de saúde do HUB."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!sent && (
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className="bg-emergency text-emergency-foreground hover:bg-emergency/90"
              >
                Confirmar SOS
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
