import { useState, useEffect } from "react";
import { useHospital } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Search, QrCode, ArrowUp, DoorOpen, Accessibility, AlertTriangle } from "lucide-react";
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
  { id: "recep", name: "Recepção Principal", floor: 0, block: "A", x: 60, y: 240 },
  { id: "farm", name: "Farmácia", floor: 0, block: "A", x: 180, y: 240 },
  { id: "cafe", name: "Cafeteria", floor: 0, block: "A", x: 300, y: 240 },
  { id: "lab", name: "Laboratório", floor: 0, block: "A", x: 180, y: 180 },
  { id: "emer", name: "Emergência", floor: 0, block: "D", x: 370, y: 180 },
  { id: "ambu", name: "Ambulatório", floor: 1, block: "A", x: 100, y: 100 },
  { id: "radio", name: "Radiologia", floor: 1, block: "C", x: 300, y: 100 },
  { id: "onco", name: "Oncologia", floor: 2, block: "B", x: 200, y: 50 },
  { id: "uti", name: "UTI", floor: 3, block: "B", x: 300, y: 50 },
];

const FLOOR_LABEL = ["Térreo", "1º Andar", "2º Andar", "3º Andar"];

interface RouteStep {
  instruction: string;
  icon: typeof MapPin;
  highlight?: boolean;
}

function getRouteSteps(origin: string, dest: string): RouteStep[] {
  const destLoc = LOCATIONS.find(l => l.name === dest);
  const originLoc = LOCATIONS.find(l => l.name === origin) || LOCATIONS[0];
  
  const steps: RouteStep[] = [
    { instruction: `Partindo de ${origin} (${FLOOR_LABEL[originLoc.floor]}, Bloco ${originLoc.block})`, icon: MapPin },
  ];

  if (originLoc.floor !== destLoc?.floor) {
    steps.push({ instruction: "Siga pelo corredor principal até o hall central", icon: Navigation });
    steps.push({ instruction: "🛗 Elevador • 🪜 Escada • ♿ Rampa acessível", icon: Accessibility, highlight: true });
    const direction = (destLoc?.floor ?? 0) > originLoc.floor ? "Suba" : "Desça";
    steps.push({ instruction: `${direction} para o ${FLOOR_LABEL[destLoc?.floor ?? 0]}`, icon: ArrowUp, highlight: true });
    steps.push({ instruction: `Ao sair, siga pela sinalização do ${destLoc?.block ? `Bloco ${destLoc.block}` : "corredor"}`, icon: Navigation });
  } else {
    steps.push({ instruction: "Siga reto pelo corredor do andar atual", icon: Navigation });
  }

  if (originLoc.block !== destLoc?.block) {
    steps.push({ instruction: `Passe pela recepção do Bloco ${destLoc?.block}`, icon: DoorOpen });
  }

  steps.push({ instruction: `Chegou: ${dest} (${FLOOR_LABEL[destLoc?.floor ?? 0]}, Bloco ${destLoc?.block})`, icon: DoorOpen, highlight: true });

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
    triggerLost(destination || "Localização desconhecida");
    setLostSent(true);
    setTimeout(() => {
      setShowLostDialog(false);
      setLostSent(false);
    }, 2000);
  };

  const destLoc = LOCATIONS.find(l => l.name === destination);
  const originLoc = LOCATIONS.find(l => l.name === origin);
  const routeSteps = destination ? getRouteSteps(origin, destination) : [];

  // Compute route path waypoints for SVG
  const getRoutePath = () => {
    if (!originLoc || !destLoc) return "";
    const midX = 210;
    const midY = 145;
    // Route through the central hub
    if (originLoc.floor !== destLoc.floor) {
      return `M${originLoc.x} ${originLoc.y} L${originLoc.x} ${midY} L${midX} ${midY} L${midX} ${destLoc.y} L${destLoc.x} ${destLoc.y}`;
    }
    return `M${originLoc.x} ${originLoc.y} L${originLoc.x} ${midY} L${destLoc.x} ${midY} L${destLoc.x} ${destLoc.y}`;
  };

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
          <Card className="overflow-hidden shadow-sm">
            <CardContent className="p-0">
              <svg viewBox="0 0 420 290" className="w-full bg-muted/30" style={{ minHeight: 220 }} aria-label={`Mapa de ${origin} até ${destination}`}>
                {/* Floor sections */}
                <rect x="5" y="30" width="410" height="55" rx="6" fill="hsl(var(--primary) / 0.04)" stroke="hsl(var(--primary) / 0.12)" strokeWidth="1" />
                <text x="15" y="22" fontSize="8" fontWeight="600" fill="hsl(var(--primary))">2º–3º Andar</text>

                <rect x="5" y="85" width="410" height="45" rx="6" fill="hsl(var(--secondary) / 0.04)" stroke="hsl(var(--secondary) / 0.12)" strokeWidth="1" />
                <text x="15" y="82" fontSize="8" fontWeight="600" fill="hsl(var(--secondary))">1º Andar</text>

                <rect x="5" y="155" width="410" height="105" rx="6" fill="hsl(var(--accent))" stroke="hsl(var(--border))" strokeWidth="1" />
                <text x="15" y="150" fontSize="8" fontWeight="600" fill="hsl(var(--muted-foreground))">Térreo</text>

                {/* Central hub (elevator/stairs/ramp) */}
                <rect x="185" y="130" width="50" height="30" rx="5" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="1.5" />
                <text x="195" y="147" fontSize="7" fill="hsl(var(--foreground))">🛗🪜♿</text>

                {/* Room labels with better positioning */}
                {LOCATIONS.map((loc) => {
                  const isOrigin = loc.name === origin;
                  const isDest = loc.name === destination;
                  const w = Math.max(loc.name.length * 5.5, 50);
                  return (
                    <g key={loc.id}>
                      <rect
                        x={loc.x - w / 2} y={loc.y - 10} width={w} height={20} rx="4"
                        fill={isDest ? "hsl(var(--primary))" : isOrigin ? "hsl(var(--secondary))" : "hsl(var(--card))"}
                        stroke={isDest ? "hsl(var(--primary))" : isOrigin ? "hsl(var(--secondary))" : "hsl(var(--border))"}
                        strokeWidth={isDest || isOrigin ? "2" : "1"}
                      />
                      <text
                        x={loc.x} y={loc.y + 3.5} textAnchor="middle"
                        fill={isDest || isOrigin ? "white" : "hsl(var(--foreground))"}
                        fontSize="7.5" fontWeight={isDest || isOrigin ? "700" : "500"}
                      >
                        {loc.name}
                      </text>
                    </g>
                  );
                })}

                {/* Route path */}
                <path
                  d={getRoutePath()}
                  fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeDasharray="6 3" strokeLinecap="round" opacity="0.8"
                />

                {/* Dots */}
                {originLoc && (
                  <circle cx={originLoc.x} cy={originLoc.y} r="4" fill="hsl(var(--secondary))" stroke="white" strokeWidth="1.5" />
                )}
                {destLoc && (
                  <circle cx={destLoc.x} cy={destLoc.y} r="4" fill="hsl(var(--primary))" stroke="white" strokeWidth="1.5" />
                )}

                {/* Legend */}
                <g transform="translate(10, 268)">
                  <rect width="160" height="16" rx="3" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="0.5" />
                  <text x="6" y="11" fontSize="6" fill="hsl(var(--muted-foreground))">🟢 Origem  🔵 Destino  🛗 Elevador  🪜 Escada  ♿ Rampa</text>
                </g>
              </svg>
            </CardContent>
          </Card>

          {/* Route steps */}
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Passo a passo</p>
              {routeSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className={`flex items-start gap-3 text-sm py-2 ${i < routeSteps.length - 1 ? "border-b border-border/50" : ""}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${step.highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <p className={`text-foreground ${step.highlight ? "font-medium" : ""}`}>{step.instruction}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 text-sm bg-primary/5 border border-primary/10 p-3 rounded-xl">
            <Navigation className="w-4 h-4 text-secondary" />
            <span className="text-foreground font-medium">{origin}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-primary font-medium">{destination}</span>
          </div>

          <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" onClick={handleFinish}>Finalizar Navegação</Button>
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
              <Card key={loc.id} className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all" onClick={() => handleNavigate(loc.name)}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{loc.name}</p>
                    <p className="text-xs text-muted-foreground">{FLOOR_LABEL[loc.floor]} · Bloco {loc.block}</p>
                  </div>
                  <Navigation className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>

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
