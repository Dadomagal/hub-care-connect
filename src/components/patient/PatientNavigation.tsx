import { useState, useEffect } from "react";
import { useHospital } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Search, QrCode, Stairs, ArrowUp, DoorOpen, Accessibility, AlertTriangle } from "lucide-react";
import FeedbackPopup from "@/components/FeedbackPopup";
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

const LOCATIONS = [
  { id: "onco", name: "Oncologia", floor: "2º Andar", block: "Bloco B", x: 320, y: 80 },
  { id: "lab", name: "Laboratório", floor: "Térreo", block: "Bloco A", x: 160, y: 220 },
  { id: "radio", name: "Radiologia", floor: "1º Andar", block: "Bloco C", x: 320, y: 180 },
  { id: "farm", name: "Farmácia", floor: "Térreo", block: "Bloco A", x: 100, y: 140 },
  { id: "emer", name: "Emergência", floor: "Térreo", block: "Bloco D", x: 360, y: 260 },
  { id: "uti", name: "UTI", floor: "3º Andar", block: "Bloco B", x: 280, y: 40 },
  { id: "recep", name: "Recepção Principal", floor: "Térreo", block: "Bloco A", x: 80, y: 60 },
  { id: "cafe", name: "Cafeteria", floor: "Térreo", block: "Bloco A", x: 200, y: 60 },
  { id: "ambu", name: "Ambulatório", floor: "1º Andar", block: "Bloco A", x: 140, y: 120 },
];

interface RouteStep {
  instruction: string;
  icon: typeof MapPin;
  highlight?: boolean;
}

function getRouteSteps(origin: string, dest: string): RouteStep[] {
  const destLoc = LOCATIONS.find(l => l.name === dest);
  const originLoc = LOCATIONS.find(l => l.name === origin) || LOCATIONS[6];
  
  const steps: RouteStep[] = [
    { instruction: `Partindo de ${origin} (${originLoc?.floor}, ${originLoc?.block})`, icon: MapPin },
  ];

  if (originLoc?.floor !== destLoc?.floor) {
    steps.push({ instruction: "Siga pelo corredor principal até o hall de elevadores", icon: Navigation });
    steps.push({ instruction: "Elevador disponível · Escada à direita · Rampa acessível à esquerda", icon: Accessibility, highlight: true });
    steps.push({ instruction: `Suba para o ${destLoc?.floor}`, icon: ArrowUp, highlight: true });
    steps.push({ instruction: `Ao sair do elevador, vire à direita`, icon: Navigation });
  } else {
    steps.push({ instruction: "Siga reto pelo corredor", icon: Navigation });
  }

  if (originLoc?.block !== destLoc?.block) {
    steps.push({ instruction: `Passe pela recepção do ${destLoc?.block}`, icon: DoorOpen });
  }

  steps.push({ instruction: `Entre na sala: ${dest} (${destLoc?.floor}, ${destLoc?.block})`, icon: DoorOpen, highlight: true });

  return steps;
}

export default function PatientNavigation() {
  const { pendingDestination, setPendingDestination, triggerLost } = useHospital();
  const [search, setSearch] = useState("");
  const [origin] = useState("Recepção Principal");
  const [destination, setDestination] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [lostSent, setLostSent] = useState(false);

  useEffect(() => {
    if (pendingDestination) {
      setDestination(pendingDestination);
      setNavigating(true);
      setPendingDestination(null);
    }
  }, [pendingDestination, setPendingDestination]);

  const filtered = LOCATIONS.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleNavigate = (name: string) => {
    setDestination(name);
    setNavigating(true);
  };

  const handleFinish = () => {
    setNavigating(false);
    setShowFeedback(true);
  };

  const handleLostConfirm = () => {
    triggerLost("Localização desconhecida");
    setLostSent(true);
    setTimeout(() => {
      setShowLostDialog(false);
      setLostSent(false);
    }, 2000);
  };

  const destLoc = LOCATIONS.find(l => l.name === destination);
  const originLoc = LOCATIONS.find(l => l.name === origin);
  const routeSteps = destination ? getRouteSteps(origin, destination) : [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground">Navegação Indoor</h2>
        <p className="text-sm text-muted-foreground mt-1">
          <QrCode className="w-3.5 h-3.5 inline mr-1" />
          Origem: {origin}
        </p>
      </div>

      {navigating && destination ? (
        <div className="space-y-4">
          {/* SVG Map */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <svg viewBox="0 0 420 320" className="w-full h-60 bg-muted/50" aria-label={`Mapa de ${origin} até ${destination}`}>
                {/* Background grid */}
                {Array.from({ length: 9 }).map((_, i) => (
                  <line key={`v${i}`} x1={i * 50 + 10} y1="10" x2={i * 50 + 10} y2="310" stroke="hsl(var(--border))" strokeWidth="0.3" />
                ))}
                {Array.from({ length: 7 }).map((_, i) => (
                  <line key={`h${i}`} x1="10" y1={i * 50 + 10} x2="410" y2={i * 50 + 10} stroke="hsl(var(--border))" strokeWidth="0.3" />
                ))}

                {/* Rooms */}
                {LOCATIONS.map((loc) => (
                  <g key={loc.id}>
                    <rect
                      x={loc.x - 35} y={loc.y - 12} width="70" height="24" rx="4"
                      fill={loc.name === destination ? "hsl(var(--primary) / 0.15)" : loc.name === origin ? "hsl(var(--success) / 0.15)" : "hsl(var(--accent))"}
                      stroke={loc.name === destination ? "hsl(var(--primary))" : loc.name === origin ? "hsl(var(--success))" : "hsl(var(--border))"}
                      strokeWidth={loc.name === destination || loc.name === origin ? "2" : "1"}
                    />
                    <text x={loc.x} y={loc.y + 4} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="8" fontWeight="500">{loc.name}</text>
                  </g>
                ))}

                {/* Landmarks */}
                <g>
                  {/* Elevator */}
                  <rect x="195" y="130" width="30" height="20" rx="3" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth="1" />
                  <text x="210" y="144" textAnchor="middle" fill="hsl(var(--primary))" fontSize="7" fontWeight="bold">🛗</text>
                  
                  {/* Stairs */}
                  <rect x="235" y="130" width="30" height="20" rx="3" fill="hsl(var(--warning) / 0.2)" stroke="hsl(var(--warning))" strokeWidth="1" />
                  <text x="250" y="144" textAnchor="middle" fill="hsl(var(--warning))" fontSize="7" fontWeight="bold">🪜</text>
                  
                  {/* Ramp */}
                  <rect x="155" y="130" width="30" height="20" rx="3" fill="hsl(var(--success) / 0.2)" stroke="hsl(var(--success))" strokeWidth="1" />
                  <text x="170" y="144" textAnchor="middle" fill="hsl(var(--success))" fontSize="7" fontWeight="bold">♿</text>
                </g>

                {/* Route path */}
                {originLoc && destLoc && (
                  <path
                    d={`M${originLoc.x} ${originLoc.y + 12} L${originLoc.x} 140 L210 140 L210 ${destLoc.y + 12} L${destLoc.x} ${destLoc.y + 12}`}
                    fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="8 4" strokeLinecap="round"
                  />
                )}

                {/* Origin dot */}
                {originLoc && (
                  <>
                    <circle cx={originLoc.x} cy={originLoc.y} r="6" fill="hsl(var(--success))" />
                    <circle cx={originLoc.x} cy={originLoc.y} r="3" fill="white" />
                  </>
                )}
                {/* Dest dot */}
                {destLoc && (
                  <>
                    <circle cx={destLoc.x} cy={destLoc.y} r="6" fill="hsl(var(--primary))" />
                    <circle cx={destLoc.x} cy={destLoc.y} r="3" fill="white" />
                  </>
                )}

                {/* Legend */}
                <g transform="translate(10, 280)">
                  <rect width="120" height="28" rx="4" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
                  <text x="8" y="12" fontSize="6" fill="hsl(var(--muted-foreground))">🛗 Elevador  🪜 Escada  ♿ Rampa</text>
                  <text x="8" y="22" fontSize="6" fill="hsl(var(--muted-foreground))">🟢 Origem  🔵 Destino</text>
                </g>
              </svg>
            </CardContent>
          </Card>

          {/* Route steps */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Passo a passo</p>
              {routeSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className={`flex items-start gap-3 text-sm py-2 ${i < routeSteps.length - 1 ? "border-b border-border" : ""}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${step.highlight ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <p className={`text-foreground ${step.highlight ? "font-medium" : ""}`}>{step.instruction}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 text-sm bg-accent/50 p-3 rounded-lg">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="text-foreground font-medium">{origin}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-primary font-medium">{destination}</span>
          </div>

          <Button className="w-full" onClick={handleFinish}>Finalizar Navegação</Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setNavigating(false); setDestination(null); }}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-warning text-warning hover:bg-warning hover:text-warning-foreground"
              onClick={() => setShowLostDialog(true)}
            >
              <AlertTriangle className="w-4 h-4 mr-1" /> Me perdi
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar departamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Buscar departamento"
            />
          </div>

          <div className="space-y-2">
            {filtered.map((loc) => (
              <Card key={loc.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => handleNavigate(loc.name)}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{loc.name}</p>
                    <p className="text-xs text-muted-foreground">{loc.floor} · {loc.block}</p>
                  </div>
                  <Navigation className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Me perdi button when not navigating */}
          <Button
            variant="outline"
            className="w-full border-warning text-warning hover:bg-warning hover:text-warning-foreground"
            onClick={() => setShowLostDialog(true)}
          >
            <AlertTriangle className="w-4 h-4 mr-1" /> Me perdi
          </Button>
        </>
      )}

      {showFeedback && (
        <FeedbackPopup type="CES" question="Quão fácil foi navegar até o destino?" onClose={() => setShowFeedback(false)} />
      )}

      <AlertDialog open={showLostDialog} onOpenChange={setShowLostDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-warning flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Me perdi
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lostSent
                ? "✅ Alerta enviado! A equipe de enfermagem foi notificada e enviará auxílio."
                : "Ao confirmar, a equipe de enfermagem será notificada para ajudá-lo a encontrar seu caminho."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!lostSent && (
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLostConfirm}
                className="bg-warning text-warning-foreground hover:bg-warning/90"
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
