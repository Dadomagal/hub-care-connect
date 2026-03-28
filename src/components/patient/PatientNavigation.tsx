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

type FloorId = "terreo" | "1" | "2" | "3";

const FLOOR_LABELS: Record<FloorId, string> = {
  terreo: "Térreo",
  "1": "1º Andar",
  "2": "2º Andar",
  "3": "3º Andar",
};

const ROOM_WIDTH = 90;
const ROOM_HEIGHT = 30;

const FLOOR_ANCHORS: Record<FloorId, { corridorY: number; elevator: { x: number; y: number } }> = {
  terreo: { corridorY: 190, elevator: { x: 265, y: 190 } },
  "1": { corridorY: 185, elevator: { x: 265, y: 185 } },
  "2": { corridorY: 180, elevator: { x: 265, y: 180 } },
  "3": { corridorY: 175, elevator: { x: 265, y: 175 } },
};

type FloorZone = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  labelX?: number;
  labelY?: number;
  labelAnchor?: "start" | "middle" | "end";
};

const FLOOR_ZONES: Record<FloorId, FloorZone[]> = {
  terreo: [
    { id: "zona-a", x: 40, y: 40, width: 210, height: 130, label: "Bloco A" },
    { id: "zona-b", x: 270, y: 40, width: 200, height: 120, label: "Bloco B" },
    { id: "zona-d", x: 300, y: 230, width: 170, height: 90, label: "Bloco D" },
  ],
  "1": [
    { id: "zona-1-a", x: 40, y: 60, width: 230, height: 120, label: "Ambulatórios" },
    {
      id: "zona-1-c",
      x: 300,
      y: 160,
      width: 170,
      height: 120,
      label: "Diagnóstico",
      labelX: 460,
      labelY: 176,
      labelAnchor: "end",
    },
  ],
  "2": [
    { id: "zona-2-a", x: 60, y: 60, width: 220, height: 110, label: "Internação" },
    { id: "zona-2-b", x: 300, y: 90, width: 180, height: 140, label: "Oncologia" },
  ],
  "3": [
    { id: "zona-3-a", x: 80, y: 40, width: 200, height: 120, label: "Cuidados Intensivos" },
    {
      id: "zona-3-b",
      x: 300,
      y: 40,
      width: 170,
      height: 140,
      label: "UTI",
      labelX: 460,
      labelY: 56,
      labelAnchor: "end",
    },
  ],
};

const LOCATIONS = [
  { id: "recep", name: "Recepção Principal", floorId: "terreo" as FloorId, floorLabel: "Térreo", block: "Bloco A", x: 110, y: 95 },
  { id: "cafe", name: "Cafeteria", floorId: "terreo" as FloorId, floorLabel: "Térreo", block: "Bloco A", x: 270, y: 80 },
  { id: "farm", name: "Farmácia", floorId: "terreo" as FloorId, floorLabel: "Térreo", block: "Bloco A", x: 120, y: 235 },
  { id: "lab", name: "Laboratório", floorId: "terreo" as FloorId, floorLabel: "Térreo", block: "Bloco A", x: 230, y: 290 },
  { id: "emer", name: "Emergência", floorId: "terreo" as FloorId, floorLabel: "Térreo", block: "Bloco D", x: 420, y: 280 },
  { id: "ambu", name: "Ambulatório", floorId: "1" as FloorId, floorLabel: "1º Andar", block: "Bloco A", x: 170, y: 125 },
  { id: "radio", name: "Radiologia", floorId: "1" as FloorId, floorLabel: "1º Andar", block: "Bloco C", x: 390, y: 210 },
  { id: "onco", name: "Oncologia", floorId: "2" as FloorId, floorLabel: "2º Andar", block: "Bloco B", x: 390, y: 140 },
  { id: "uti", name: "UTI", floorId: "3" as FloorId, floorLabel: "3º Andar", block: "Bloco B", x: 340, y: 70 },
];

interface RouteStep {
  instruction: string;
  icon: typeof MapPin;
  highlight?: boolean;
}

function buildRoutePath(
  floorId: FloorId,
  originLoc?: (typeof LOCATIONS)[number],
  destLoc?: (typeof LOCATIONS)[number]
) {
  if (!originLoc || !destLoc) return "";
  if (originLoc.id === destLoc.id) return "";
  const anchor = FLOOR_ANCHORS[floorId];
  const corridorY = anchor.corridorY;
  const elevator = anchor.elevator;
  const roomExitOffset = 6;
  const originPoint = { x: originLoc.x, y: originLoc.y + ROOM_HEIGHT / 2 + roomExitOffset };
  const destPoint = { x: destLoc.x, y: destLoc.y + ROOM_HEIGHT / 2 };
  const iconClearance = 48;
  const detourOffset = 18;
  const handoffLeft = elevator.x - iconClearance;
  const handoffRight = elevator.x + iconClearance;
  const getHandoffX = (targetX: number) => (targetX <= elevator.x ? handoffLeft : handoffRight);
  const points: { x: number; y: number }[] = [];

  const addCorridorPath = (startX: number, endX: number) => {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const crossesIcons = minX < handoffRight && maxX > handoffLeft;
    if (!crossesIcons) {
      points.push({ x: endX, y: corridorY });
      return;
    }

    const goRight = endX > startX;
    const firstEdge = goRight ? handoffLeft : handoffRight;
    const secondEdge = goRight ? handoffRight : handoffLeft;

    points.push(
      { x: firstEdge, y: corridorY },
      { x: firstEdge, y: corridorY + detourOffset },
      { x: secondEdge, y: corridorY + detourOffset },
      { x: secondEdge, y: corridorY },
      { x: endX, y: corridorY },
    );
  };

  if (originLoc.floorId === destLoc.floorId && originLoc.floorId === floorId) {
    points.push(
      originPoint,
      { x: originLoc.x, y: corridorY },
    );
    addCorridorPath(originLoc.x, destLoc.x);
    points.push(
      destPoint,
    );
  } else if (originLoc.floorId === floorId) {
    const handoffX = getHandoffX(originLoc.x);
    points.push(
      originPoint,
      { x: originLoc.x, y: corridorY },
    );
    addCorridorPath(originLoc.x, handoffX);
  } else if (destLoc.floorId === floorId) {
    const handoffX = getHandoffX(destLoc.x);
    points.push(
      { x: handoffX, y: corridorY },
    );
    addCorridorPath(handoffX, destLoc.x);
    points.push(
      destPoint,
    );
  }

  if (points.length === 0) return "";
  return `M${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L${p.x} ${p.y}`).join(" ");
}

function getRouteSteps(origin: string, dest: string): RouteStep[] {
  const destLoc = LOCATIONS.find(l => l.name === dest);
  const originLoc = LOCATIONS.find(l => l.name === origin) || LOCATIONS[0];
  
  const steps: RouteStep[] = [
    { instruction: `Partindo de ${origin} (${originLoc?.floorLabel}, ${originLoc?.block})`, icon: MapPin },
  ];

  if (originLoc?.floorId !== destLoc?.floorId) {
    steps.push({ instruction: "Siga pelo corredor principal até o hall de elevadores", icon: Navigation });
    steps.push({ instruction: "Elevador disponível · Escada à direita · Rampa acessível à esquerda", icon: Accessibility, highlight: true });
    steps.push({ instruction: `Suba para o ${destLoc?.floorLabel}`, icon: ArrowUp, highlight: true });
    steps.push({ instruction: `Ao sair do elevador, vire à direita`, icon: Navigation });
  } else {
    steps.push({ instruction: "Siga reto pelo corredor", icon: Navigation });
  }

  if (originLoc?.block !== destLoc?.block) {
    steps.push({ instruction: `Passe pela recepção do ${destLoc?.block}`, icon: DoorOpen });
  }

  steps.push({ instruction: `Entre na sala: ${dest} (${destLoc?.floorLabel}, ${destLoc?.block})`, icon: DoorOpen, highlight: true });

  return steps;
}

export default function PatientNavigation() {
  const { pendingDestination, setPendingDestination, triggerLost } = useHospital();
  const [search, setSearch] = useState("");
  const [origin] = useState("Recepção Principal");
  const [destination, setDestination] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [activeFloor, setActiveFloor] = useState<FloorId>("terreo");
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
  const routePath = buildRoutePath(activeFloor, originLoc, destLoc);
  const activeZones = FLOOR_ZONES[activeFloor];
  const activeRooms = LOCATIONS.filter((loc) => loc.floorId === activeFloor);
  const activeAnchor = FLOOR_ANCHORS[activeFloor];

  useEffect(() => {
    if (navigating && originLoc?.floorId) {
      setActiveFloor(originLoc.floorId);
    }
  }, [navigating, originLoc?.floorId]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground">Navegação Indoor</h2>
        <p className="text-sm text-muted-foreground mt-1">
          <QrCode className="w-3.5 h-3.5 inline mr-1" />
          Origem: {origin} {originLoc?.floorLabel ? `· ${originLoc.floorLabel}` : ""}
        </p>
      </div>

      {navigating && destination ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FLOOR_LABELS) as FloorId[]).map((floorId) => (
                <button
                  key={floorId}
                  onClick={() => setActiveFloor(floorId)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    activeFloor === floorId
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {FLOOR_LABELS[floorId]}
                </button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-3">
              {originLoc?.floorLabel && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success" /> Origem: {originLoc.floorLabel}
                </span>
              )}
              {destLoc?.floorLabel && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Destino: {destLoc.floorLabel}
                </span>
              )}
            </div>
          </div>
          {/* SVG Map */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <svg viewBox="0 0 520 360" className="w-full h-72 sm:h-80 lg:h-96 bg-muted/40" aria-label={`Mapa de ${origin} até ${destination}`}>
                {/* Background grid */}
                {Array.from({ length: 11 }).map((_, i) => (
                  <line key={`v${i}`} x1={i * 45 + 10} y1="10" x2={i * 45 + 10} y2="350" stroke="hsl(var(--border))" strokeWidth="0.3" />
                ))}
                {Array.from({ length: 8 }).map((_, i) => (
                  <line key={`h${i}`} x1="10" y1={i * 45 + 10} x2="510" y2={i * 45 + 10} stroke="hsl(var(--border))" strokeWidth="0.3" />
                ))}

                {/* Floor zones */}
                {activeZones.map((zone) => (
                  <g key={zone.id} opacity="0.5">
                    <rect x={zone.x} y={zone.y} width={zone.width} height={zone.height} rx="10" fill="hsl(var(--accent))" />
                    <text
                      x={zone.labelX ?? zone.x + 10}
                      y={zone.labelY ?? zone.y + 16}
                      textAnchor={zone.labelAnchor ?? "start"}
                      fill="hsl(var(--muted-foreground))"
                      fontSize="7"
                      fontWeight="600"
                    >
                      {zone.label}
                    </text>
                  </g>
                ))}

                {/* Corridor */}

                {/* Route path */}
                {routePath && (
                  <path
                    d={routePath}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeDasharray="9 6"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                )}

                {/* Rooms */}
                {activeRooms.map((loc) => {
                  const isDestination = loc.name === destination;
                  const isOrigin = loc.name === origin;
                  return (
                    <g key={loc.id}>
                      <rect
                        x={loc.x - ROOM_WIDTH / 2}
                        y={loc.y - ROOM_HEIGHT / 2}
                        width={ROOM_WIDTH}
                        height={ROOM_HEIGHT}
                        rx="8"
                        fill="hsl(var(--card))"
                        stroke="hsl(var(--border))"
                        strokeWidth="1"
                      />
                      {(isDestination || isOrigin) && (
                        <rect
                          x={loc.x - ROOM_WIDTH / 2}
                          y={loc.y - ROOM_HEIGHT / 2}
                          width={ROOM_WIDTH}
                          height={ROOM_HEIGHT}
                          rx="8"
                          fill={isDestination ? "hsl(var(--primary) / 0.18)" : "hsl(var(--success) / 0.18)"}
                          stroke={isDestination ? "hsl(var(--primary))" : "hsl(var(--success))"}
                          strokeWidth="2"
                        />
                      )}
                      <text x={loc.x} y={loc.y + 4} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="8.5" fontWeight="600">
                        {loc.name}
                      </text>
                    </g>
                  );
                })}

                {/* Landmarks */}
                <g>
                  <rect
                    x={activeAnchor.elevator.x - 16}
                    y={activeAnchor.elevator.y - 12}
                    width="32"
                    height="24"
                    rx="4"
                    fill="hsl(var(--card))"
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                  />
                  <text x={activeAnchor.elevator.x} y={activeAnchor.elevator.y + 5} textAnchor="middle" fill="hsl(var(--primary))" fontSize="7" fontWeight="700">🛗</text>

                  <rect
                    x={activeAnchor.elevator.x + 22}
                    y={activeAnchor.elevator.y - 12}
                    width="32"
                    height="24"
                    rx="4"
                    fill="hsl(var(--card))"
                    stroke="hsl(var(--warning))"
                    strokeWidth="1"
                  />
                  <text x={activeAnchor.elevator.x + 38} y={activeAnchor.elevator.y + 5} textAnchor="middle" fill="hsl(var(--warning))" fontSize="7" fontWeight="700">🪜</text>

                  <rect
                    x={activeAnchor.elevator.x - 54}
                    y={activeAnchor.elevator.y - 12}
                    width="32"
                    height="24"
                    rx="4"
                    fill="hsl(var(--card))"
                    stroke="hsl(var(--success))"
                    strokeWidth="1"
                  />
                  <text x={activeAnchor.elevator.x - 38} y={activeAnchor.elevator.y + 5} textAnchor="middle" fill="hsl(var(--success))" fontSize="7" fontWeight="700">♿</text>
                </g>

                {/* Origin dot */}
                {originLoc?.floorId === activeFloor && (
                  <>
                    <circle cx={originLoc.x} cy={originLoc.y} r="6" fill="hsl(var(--success))" />
                    <circle cx={originLoc.x} cy={originLoc.y} r="3" fill="white" />
                  </>
                )}
                {/* Dest dot */}
                {destLoc?.floorId === activeFloor && (
                  <>
                    <circle cx={destLoc.x} cy={destLoc.y} r="6" fill="hsl(var(--primary))" />
                    <circle cx={destLoc.x} cy={destLoc.y} r="3" fill="white" />
                  </>
                )}

                {/* Floor label */}
                <text x="500" y="26" textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize="9" fontWeight="700">
                  {FLOOR_LABELS[activeFloor]}
                </text>

                {/* Legend */}
                <g transform="translate(10, 310)">
                  <rect width="140" height="32" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
                  <text x="8" y="13" fontSize="6.5" fill="hsl(var(--muted-foreground))">🛗 Elevador  🪜 Escada  ♿ Rampa</text>
                  <text x="8" y="24" fontSize="6.5" fill="hsl(var(--muted-foreground))">🟢 Origem  🔵 Destino</text>
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
                    <p className="text-xs text-muted-foreground">{loc.floorLabel} · {loc.block}</p>
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
