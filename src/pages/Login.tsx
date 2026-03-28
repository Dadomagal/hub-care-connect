import { useSearchParams } from "react-router-dom";
import { useHospital, type UserRole } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, User } from "lucide-react";
import hubLogo from "@/assets/hub-logo.png";

export default function Login() {
  const { setRole } = useHospital();
  const [, setSearchParams] = useSearchParams();

  const handleSelectRole = (nextRole: Exclude<UserRole, null>) => {
    setRole(nextRole);
    const next = new URLSearchParams();
    next.set("role", nextRole);
    if (nextRole === "patient") {
      next.set("tab", "triage");
    }
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-card/85 backdrop-blur-xl border border-primary/10 shadow-xl rounded-3xl p-8 sm:p-10">
        <div className="mb-8 text-center">
          <img src={hubLogo} alt="UnB | HUB" className="h-16 mx-auto mb-6 object-contain" />
          <h1 className="text-3xl font-display font-bold text-foreground">HUB - Processos</h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
            Hospital Universitário de Brasília — Gestão Hospitalar Inteligente
          </p>
        </div>

        <div className="grid gap-4 w-full">
        <Card
          className="cursor-pointer border-2 border-transparent hover:border-primary transition-all group"
          onClick={() => handleSelectRole("patient")}
          role="button"
          tabIndex={0}
          aria-label="Entrar como Paciente"
          onKeyDown={(e) => e.key === "Enter" && handleSelectRole("patient")}
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
          onClick={() => handleSelectRole("staff")}
          role="button"
          tabIndex={0}
          aria-label="Entrar como Equipe de Saúde"
          onKeyDown={(e) => e.key === "Enter" && handleSelectRole("staff")}
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

        <p className="text-xs text-muted-foreground mt-8 text-center max-w-xs mx-auto">
          Protótipo MVP — Dados simulados para demonstração. Conforme LGPD.
        </p>
      </div>
    </div>
  );
}
