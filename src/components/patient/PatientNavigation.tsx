import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Search, QrCode } from "lucide-react";
import FeedbackPopup from "@/components/FeedbackPopup";

const LOCATIONS = [
  { id: "onco", name: "Oncologia", floor: "2º Andar", block: "Bloco B" },
  { id: "lab", name: "Laboratório", floor: "Térreo", block: "Bloco A" },
  { id: "radio", name: "Radiologia", floor: "1º Andar", block: "Bloco C" },
  { id: "farm", name: "Farmácia", floor: "Térreo", block: "Bloco A" },
  { id: "emer", name: "Emergência", floor: "Térreo", block: "Bloco D" },
  { id: "uti", name: "UTI", floor: "3º Andar", block: "Bloco B" },
  { id: "recep", name: "Recepção Principal", floor: "Térreo", block: "Bloco A" },
  { id: "cafe", name: "Cafeteria", floor: "Térreo", block: "Bloco A" },
];

export default function PatientNavigation() {
  const [search, setSearch] = useState("");
  const [origin] = useState("Recepção Principal");
  const [destination, setDestination] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

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
          {/* SVG Map Mock */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <svg viewBox="0 0 400 300" className="w-full h-56 bg-muted/50" aria-label={`Mapa de ${origin} até ${destination}`}>
                {/* Grid */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <line key={`v${i}`} x1={i * 50 + 25} y1="20" x2={i * 50 + 25} y2="280" stroke="hsl(var(--border))" strokeWidth="0.5" />
                ))}
                {Array.from({ length: 6 }).map((_, i) => (
                  <line key={`h${i}`} x1="20" y1={i * 50 + 25} x2="380" y2={i * 50 + 25} stroke="hsl(var(--border))" strokeWidth="0.5" />
                ))}
                {/* Rooms */}
                <rect x="30" y="30" width="100" height="60" rx="8" fill="hsl(var(--accent))" stroke="hsl(var(--border))" />
                <text x="80" y="65" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="11" fontWeight="600">Recepção</text>
                <rect x="270" y="200" width="100" height="60" rx="8" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="2" />
                <text x="320" y="235" textAnchor="middle" fill="hsl(var(--primary))" fontSize="11" fontWeight="600">{destination}</text>
                {/* Route path */}
                <path d="M130 60 L200 60 L200 150 L270 150 L270 230" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="8 4" strokeLinecap="round" />
                {/* Origin dot */}
                <circle cx="80" cy="60" r="8" fill="hsl(var(--success))" />
                <circle cx="80" cy="60" r="4" fill="hsl(var(--success-foreground))" />
                {/* Destination dot */}
                <circle cx="320" cy="230" r="8" fill="hsl(var(--primary))" />
                <circle cx="320" cy="230" r="4" fill="hsl(var(--primary-foreground))" />
              </svg>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 text-sm bg-accent/50 p-3 rounded-lg">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="text-foreground font-medium">{origin}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-primary font-medium">{destination}</span>
          </div>

          <Button className="w-full" onClick={handleFinish}>Finalizar Navegação</Button>
          <Button variant="outline" className="w-full" onClick={() => { setNavigating(false); setDestination(null); }}>
            Cancelar
          </Button>
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
        </>
      )}

      {showFeedback && (
        <FeedbackPopup type="CES" question="Quão fácil foi navegar até o destino?" onClose={() => setShowFeedback(false)} />
      )}
    </div>
  );
}
