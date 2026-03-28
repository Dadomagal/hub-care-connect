import { useHospital } from "@/contexts/HospitalContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, User, ShieldCheck } from "lucide-react";

export default function Login() {
  const { setRole } = useHospital();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-6">
          <ShieldCheck className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground">HUB Saúde</h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
          Hospital Universitário de Brasília — Gestão Hospitalar Inteligente
        </p>
      </div>

      <div className="grid gap-4 w-full max-w-sm">
        <Card
          className="cursor-pointer border-2 border-transparent hover:border-primary transition-all group"
          onClick={() => setRole("patient")}
          role="button"
          tabIndex={0}
          aria-label="Entrar como Paciente"
          onKeyDown={(e) => e.key === "Enter" && setRole("patient")}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-accent group-hover:bg-primary transition-colors">
              <User className="w-7 h-7 text-accent-foreground group-hover:text-primary-foreground transition-colors" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">Paciente</p>
              <p className="text-sm text-muted-foreground">Teletriagem, agendamentos, navegação e SOS</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-2 border-transparent hover:border-secondary transition-all group"
          onClick={() => setRole("staff")}
          role="button"
          tabIndex={0}
          aria-label="Entrar como Equipe de Saúde"
          onKeyDown={(e) => e.key === "Enter" && setRole("staff")}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-accent group-hover:bg-secondary transition-colors">
              <Stethoscope className="w-7 h-7 text-accent-foreground group-hover:text-secondary-foreground transition-colors" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">Equipe de Saúde</p>
              <p className="text-sm text-muted-foreground">Dashboard, Kanban, monitoramento SOS</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground mt-10 text-center max-w-xs">
        Protótipo MVP — Dados simulados para demonstração. Conforme LGPD.
      </p>
    </div>
  );
}
