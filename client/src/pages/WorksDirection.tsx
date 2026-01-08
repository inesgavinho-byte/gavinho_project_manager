import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ClipboardCheck, FileText, AlertTriangle, TrendingUp, Calendar } from "lucide-react";

export default function WorksDirection() {
  const { data: constructions } = trpc.constructions.list.useQuery();

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Direção de Obra</h1>
        <p className="text-muted-foreground">
          Acompanhamento e gestão pela direção de obra
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="inspections">Inspeções</TabsTrigger>
          <TabsTrigger value="decisions">Decisões</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Obras Ativas</p>
                  <p className="text-3xl font-bold">{constructions?.length || 0}</p>
                </div>
                <ClipboardCheck className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inspeções Pendentes</p>
                  <p className="text-3xl font-bold">12</p>
                </div>
                <FileText className="h-8 w-8 text-yellow-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Não Conformidades</p>
                  <p className="text-3xl font-bold">5</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Progresso</p>
                  <p className="text-3xl font-bold">87%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Obras Sob Direção</h3>
            <div className="space-y-3">
              {constructions?.map(work => (
                <div key={work.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">{work.code}</p>
                    <p className="text-sm text-muted-foreground">{work.name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">
                      {work.status === 'in_progress' ? 'Em Execução' : 'Planeada'}
                    </Badge>
                    <Button variant="outline" size="sm">Ver Detalhes</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports">
          <Card className="p-6">
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Relatórios de direção de obra</p>
            </div>
          </Card>
        </TabsContent>

        {/* Inspections */}
        <TabsContent value="inspections">
          <Card className="p-6">
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Inspeções e vistorias</p>
            </div>
          </Card>
        </TabsContent>

        {/* Decisions */}
        <TabsContent value="decisions">
          <Card className="p-6">
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Decisões técnicas pendentes</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
