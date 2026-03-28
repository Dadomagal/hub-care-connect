import { useHospital } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, User, Heart, Shield } from "lucide-react";
import hubLogo from "@/assets/hub-logo.png";

export default function Login() {
  const { setRole } = useHospital();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 hub-gradient-subtle">
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="w-24 h-24 mx-auto mb-5 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <img src={hubLogo} alt="UnB | HUB" className="h-14 object-contain brightness-0 invert" />
        </div>
        <h1 className="text-3xl font-display font-bold text-primary tracking-tight">HUB Saúde</h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto leading-relaxed">
          Hospital Universitário de Brasília<br />Gestão Hospitalar Inteligente
        </p>
      </div>

      {/* Features strip */}
      <div className="flex items-center gap-6 mb-8 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-secondary" />Teletriagem</span>
        <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-secondary" />SOS</span>
      </div>

      <div className="grid gap-4 w-full max-w-md">
        <Card
          className="cursor-pointer border-2 border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
          onClick={() => setRole("patient")}
          role="button"
          tabIndex={0}
          aria-label="Entrar como Paciente"
          onKeyDown={(e) => e.key === "Enter" && setRole("patient")}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 group-hover:bg-primary transition-colors">
              <User className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-foreground text-lg">Paciente</p>
              <p className="text-sm text-muted-foreground">Teletriagem, agendamentos, navegação e SOS</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-2 border-transparent hover:border-secondary/50 hover:shadow-lg hover:shadow-secondary/10 transition-all group"
          onClick={() => setRole("staff")}
          role="button"
          tabIndex={0}
          aria-label="Entrar como Equipe de Saúde"
          onKeyDown={(e) => e.key === "Enter" && setRole("staff")}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-secondary/10 group-hover:bg-secondary transition-colors">
              <Stethoscope className="w-7 h-7 text-secondary group-hover:text-secondary-foreground transition-colors" />
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-foreground text-lg">Equipe de Saúde</p>
              <p className="text-sm text-muted-foreground">Dashboard, Kanban, monitoramento SOS</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground mt-10 text-center max-w-xs opacity-60">
        Protótipo MVP — Dados simulados para demonstração. Conforme LGPD.
      </p>
    </div>
  );
}
