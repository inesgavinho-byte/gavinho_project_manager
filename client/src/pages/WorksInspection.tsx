import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Shield, Plus, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function WorksInspection() {
  const { data: constructions } = trpc.constructions.list.useQuery();

  // Mock inspection data
  const inspections = [
    { id: 1, work: "GA00466", type: "Estrutural", status: "approved", date: "2024-01-05", inspector: "Eng. Carlos Silva" },
    { id: 2, work: "GA00469", type: "Elétrica", status: "pending", date: "2024-01-06", inspector: "Eng. Ana Santos" },
    { id: 3, work: "GA00470", type: "Hidráulica", status: "rejected", date: "2024-01-04", inspector: "Eng. João Mendes" },
  ];

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fiscalização</h1>
          <p className="text-muted-foreground">
            Acompanhamento e relatórios de fiscalização
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Fiscalização
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Inspeções</p>
              <p className="text-3xl font-bold">{inspections.length}</p>
            </div>
            <Shield className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aprovadas</p>
              <p className="text-3xl font-bold">
                {inspections.filter(i => i.status === 'approved').length}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
              <p className="text-3xl font-bold">
                {inspections.filter(i => i.status === 'pending').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reprovadas</p>
              <p className="text-3xl font-bold">
                {inspections.filter(i => i.status === 'rejected').length}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Inspections List */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Fiscalizações Recentes</h3>
        <div className="space-y-3">
          {inspections.map(inspection => (
            <div key={inspection.id} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  inspection.status === 'approved' ? 'bg-green-100 dark:bg-green-900/20' :
                  inspection.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                  'bg-red-100 dark:bg-red-900/20'
                }`}>
                  {inspection.status === 'approved' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : inspection.status === 'pending' ? (
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{inspection.work} - {inspection.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {inspection.inspector} • {new Date(inspection.date).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={
                  inspection.status === 'approved' ? 'default' :
                  inspection.status === 'pending' ? 'secondary' :
                  'destructive'
                }>
                  {inspection.status === 'approved' ? 'Aprovada' :
                   inspection.status === 'pending' ? 'Pendente' :
                   'Reprovada'}
                </Badge>
                <Button variant="outline" size="sm">Ver Relatório</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
