import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, DollarSign, MapPin, User } from "lucide-react";
import { Link } from "wouter";

interface ProjectDetailProps {
  projectId: number;
}

export default function ProjectDetail({ projectId }: ProjectDetailProps) {
  const { data: project, isLoading } = trpc.projects.getById.useQuery({ id: projectId });
  const { data: quantityMaps } = trpc.quantityMaps.listByProject.useQuery({ projectId });
  const { data: orders } = trpc.orders.listByProject.useQuery({ projectId });
  const { data: tasks } = trpc.tasks.listByProject.useQuery({ projectId });
  const { data: budgets } = trpc.budgets.listByProject.useQuery({ projectId });

  if (isLoading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  if (!project) {
    return <div className="text-center py-12">Projeto não encontrado</div>;
  }

  const getStatusClass = (status: string) => {
    const classes: Record<string, string> = {
      planning: "status-planning",
      in_progress: "status-in-progress",
      on_hold: "status-on-hold",
      completed: "status-completed",
      cancelled: "status-cancelled",
    };
    return classes[status] || "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full ${getStatusClass(project.status)}`}>
          {project.status === "planning" && "Planejamento"}
          {project.status === "in_progress" && "Em Andamento"}
          {project.status === "on_hold" && "Pausado"}
          {project.status === "completed" && "Concluído"}
          {project.status === "cancelled" && "Cancelado"}
        </span>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliente</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{project.clientName || "Não definido"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Localização</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{project.location || "Não definido"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {project.budget ? `R$ ${parseFloat(project.budget).toLocaleString("pt-BR")}` : "Não definido"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{project.progress}%</div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="quantities">Quantidades</TabsTrigger>
          <TabsTrigger value="orders">Encomendas</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="budget">Orçamento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                <p className="mt-1">{project.description || "Sem descrição"}</p>
              </div>
              {project.startDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Início</p>
                  <p className="mt-1">{new Date(project.startDate).toLocaleDateString("pt-BR")}</p>
                </div>
              )}
              {project.endDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Conclusão Prevista</p>
                  <p className="mt-1">{new Date(project.endDate).toLocaleDateString("pt-BR")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quantities">
          <Card>
            <CardHeader>
              <CardTitle>Mapas de Quantidades</CardTitle>
            </CardHeader>
            <CardContent>
              {!quantityMaps || quantityMaps.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhum mapa de quantidades cadastrado
                </p>
              ) : (
                <div className="space-y-2">
                  {quantityMaps.map((map) => (
                    <div key={map.id} className="p-4 border rounded-lg">
                      <p className="font-medium">{map.description}</p>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Planejado</p>
                          <p className="font-medium">{map.plannedQuantity} {map.unit}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Executado</p>
                          <p className="font-medium">{map.executedQuantity} {map.unit}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Categoria</p>
                          <p className="font-medium">{map.category || "Geral"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Encomendas e Compras</CardTitle>
            </CardHeader>
            <CardContent>
              {!orders || orders.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhuma encomenda cadastrada
                </p>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{order.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            R$ {parseFloat(order.totalAmount).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${order.status === "delivered" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tarefas do Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              {!tasks || tasks.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhuma tarefa cadastrada
                </p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${task.status === "done" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle>Orçamento Detalhado</CardTitle>
            </CardHeader>
            <CardContent>
              {!budgets || budgets.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhum orçamento cadastrado
                </p>
              ) : (
                <div className="space-y-2">
                  {budgets.map((budget) => (
                    <div key={budget.id} className="p-4 border rounded-lg">
                      <p className="font-medium">{budget.category}</p>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Orçado</p>
                          <p className="font-medium">R$ {parseFloat(budget.budgetedAmount || "0").toLocaleString("pt-BR")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Realizado</p>
                          <p className="font-medium">R$ {parseFloat(budget.actualAmount || "0").toLocaleString("pt-BR")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Variação</p>
                          <p className={`font-medium ${parseFloat(budget.variance || "0") > 0 ? "text-red-600" : "text-green-600"}`}>
                            {parseFloat(budget.variance || "0") > 0 ? "+" : ""}
                            R$ {parseFloat(budget.variance || "0").toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
