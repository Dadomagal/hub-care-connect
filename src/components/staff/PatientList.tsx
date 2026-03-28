import { useHospital } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PatientList() {
  const { patients } = useHospital();

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Pacientes Cadastrados
      </h2>
      <div className="space-y-2">
        {patients.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {p.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.age} anos · {p.cpf}</p>
              </div>
              {p.oncology && (
                <Badge variant="secondary" className="text-[10px]">Onco</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
