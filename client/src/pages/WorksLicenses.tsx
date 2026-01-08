import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Plus, Calendar, AlertCircle } from "lucide-react";

export default function WorksLicenses() {
  // Mock licenses data
  const licenses = [
    { id: 1, work: "GA00466", type: "Licença de Construção", status: "active", expiry: "2025-06-15", authority: "Câmara Municipal de Lisboa" },
    { id: 2, work: "GA00469", type: "Alvará de Obras", status: "pending", expiry: "2024-12-31", authority: "Câmara Municipal do Porto" },
    { id: 3, work: "GA00470", type: "Licença Ambiental", status: "expired", expiry: "2024-01-01", authority: "APA" },
  ];

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Licenças</h1>
          <p className="text-muted-foreground">
            Gestão de licenças e autorizações de obra
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Licença
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Licenças</p>
              <p className="text-3xl font-bold">{licenses.length}</p>
            </div>
            <FileCheck className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ativas</p>
              <p className="text-3xl font-bold">
                {licenses.filter(l => l.status === 'active').length}
              </p>
            </div>
            <FileCheck className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
              <p className="text-3xl font-bold">
                {licenses.filter(l => l.status === 'pending').length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Expiradas</p>
              <p className="text-3xl font-bold">
                {licenses.filter(l => l.status === 'expired').length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Licenses List */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Licenças Registadas</h3>
        <div className="space-y-3">
          {licenses.map(license => (
            <div key={license.id} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  license.status === 'active' ? 'bg-green-100 dark:bg-green-900/20' :
                  license.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                  'bg-red-100 dark:bg-red-900/20'
                }`}>
                  <FileCheck className={`h-6 w-6 ${
                    license.status === 'active' ? 'text-green-600 dark:text-green-400' :
                    license.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`} />
                </div>
                <div>
                  <p className="font-medium">{license.work} - {license.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {license.authority} • Validade: {new Date(license.expiry).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={
                  license.status === 'active' ? 'default' :
                  license.status === 'pending' ? 'secondary' :
                  'destructive'
                }>
                  {license.status === 'active' ? 'Ativa' :
                   license.status === 'pending' ? 'Pendente' :
                   'Expirada'}
                </Badge>
                <Button variant="outline" size="sm">Ver Detalhes</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Expiring Soon Alert */}
      <Card className="p-6 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
              Licenças a Expirar
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              1 licença expira nos próximos 30 dias. Verifique e renove atempadamente.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
