import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Calendar, Clock, HardHat, TrendingUp, Users } from "lucide-react";
import { Link } from "wouter";

export default function WorksDashboard() {
  // Fetch constructions data
  const { data: constructions, isLoading } = trpc.constructions.list.useQuery();
  
  // Calculate statistics
  const activeWorks = constructions?.filter(c => c.status === 'in_progress').length || 0;
  const totalWorkers = constructions?.reduce((acc, c) => acc + (c.totalWorkers || 0), 0) || 0;
  const pendingTasks = constructions?.reduce((acc, c) => acc + (c.pendingTasks || 0), 0) || 0;
  const criticalAlerts = constructions?.filter(c => c.hasAlerts).length || 0;

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Obras</h1>
        <p className="text-muted-foreground">
          Visão geral das obras em execução
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="blockers">Bloqueios & Decisões</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Obras Ativas</p>
                  <p className="text-3xl font-bold">{activeWorks}</p>
                </div>
                <HardHat className="h-8 w-8 text-orange-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Trabalhadores</p>
                  <p className="text-3xl font-bold">{totalWorkers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tarefas Pendentes</p>
                  <p className="text-3xl font-bold">{pendingTasks}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alertas Críticos</p>
                  <p className="text-3xl font-bold">{criticalAlerts}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </Card>
          </div>

          {/* Recent Works */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Obras Recentes</h2>
              <Link href="/works">
                <a className="text-sm text-primary hover:underline">Ver todas</a>
              </Link>
            </div>

            <div className="space-y-4">
              {constructions?.slice(0, 5).map(work => (
                <Link key={work.id} href={`/works/${work.id}`}>
                  <a className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                        <HardHat className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="font-medium">{work.code}</p>
                        <p className="text-sm text-muted-foreground">{work.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{work.progress}% concluído</p>
                        <p className="text-xs text-muted-foreground">{work.status}</p>
                      </div>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 transition-all"
                          style={{ width: `${work.progress}%` }}
                        />
                      </div>
                    </div>
                  </a>
                </Link>
              ))}

              {!constructions || constructions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <HardHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma obra encontrada</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Planning Tab */}
        <TabsContent value="planning" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Planning de Obras</h2>
            </div>
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Gantt chart e timeline de obras em desenvolvimento</p>
            </div>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Tarefas de Obra</h2>
            </div>
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Lista de tarefas pendentes por obra</p>
            </div>
          </Card>
        </TabsContent>

        {/* Blockers Tab */}
        <TabsContent value="blockers" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Bloqueios & Decisões</h2>
            </div>
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Bloqueios críticos e decisões pendentes</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
