import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  History,
  Download,
  Filter,
  X,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Bell,
  Calendar,
  DollarSign,
  Clock,
  Package,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const TYPE_ICONS: Record<string, any> = {
  ai_alert: Settings,
  deadline_warning: Calendar,
  budget_exceeded: DollarSign,
  project_delayed: AlertTriangle,
  task_overdue: Clock,
  order_pending: Package,
  system: Bell,
};

const TYPE_LABELS: Record<string, string> = {
  ai_alert: "Sugestão IA",
  deadline_warning: "Aviso de Prazo",
  budget_exceeded: "Orçamento Excedido",
  project_delayed: "Projeto Atrasado",
  task_overdue: "Tarefa Atrasada",
  order_pending: "Encomenda Pendente",
  system: "Sistema",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function NotificationHistory() {
  const { toast } = useToast();

  // Filters state
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | undefined>();
  const [readFilter, setReadFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Build filter object
  const filters = {
    type: selectedTypes.length > 0 ? selectedTypes : undefined,
    priority: selectedPriorities.length > 0 ? selectedPriorities : undefined,
    projectId: selectedProject,
    isRead: readFilter === "all" ? undefined : readFilter === "read",
    limit: pageSize,
    offset: page * pageSize,
    ...(periodFilter !== "all" && getPeriodDates(periodFilter)),
  };

  // Fetch data
  const { data: notifications, isLoading, refetch } = trpc.notifications.getHistory.useQuery(filters);
  const { data: stats } = trpc.notifications.getStats.useQuery(filters);
  const { data: projects } = trpc.projects.list.useQuery();

  const handleToggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setPage(0);
  };

  const handleTogglePriority = (priority: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
    setPage(0);
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSelectedPriorities([]);
    setSelectedProject(undefined);
    setReadFilter("all");
    setPeriodFilter("all");
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const csv = await trpc.notifications.exportCSV.query(filters);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `notificacoes_${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      toast({
        title: "Exportação concluída",
        description: "O ficheiro CSV foi descarregado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar as notificações.",
        variant: "destructive",
      });
    }
  };

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    selectedPriorities.length > 0 ||
    selectedProject ||
    readFilter !== "all" ||
    periodFilter !== "all";

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">A carregar histórico...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Histórico de Notificações</h1>
          <p className="text-muted-foreground">
            Consulte e analise todas as notificações recebidas com filtros avançados
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Não Lidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tipo Mais Comum</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {Object.entries(stats.byType).length > 0
                  ? TYPE_LABELS[
                      Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0][0]
                    ] || "N/A"
                  : "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projetos com Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byProject.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Type Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tipo de Notificação</Label>
              {Object.entries(TYPE_LABELS).map(([type, label]) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => handleToggleType(type)}
                  />
                  <label
                    htmlFor={`type-${type}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>

            {/* Priority Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Prioridade</Label>
              {["low", "medium", "high", "critical"].map((priority) => (
                <div key={priority} className="flex items-center space-x-2">
                  <Checkbox
                    id={`priority-${priority}`}
                    checked={selectedPriorities.includes(priority)}
                    onCheckedChange={() => handleTogglePriority(priority)}
                  />
                  <label
                    htmlFor={`priority-${priority}`}
                    className="text-sm font-normal cursor-pointer flex-1 capitalize"
                  >
                    {priority === "low"
                      ? "Baixa"
                      : priority === "medium"
                      ? "Média"
                      : priority === "high"
                      ? "Alta"
                      : "Crítica"}
                  </label>
                </div>
              ))}
            </div>

            {/* Project Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Projeto</Label>
              <Select
                value={selectedProject?.toString() || "all"}
                onValueChange={(value) => {
                  setSelectedProject(value === "all" ? undefined : parseInt(value));
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os projetos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os projetos</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Read Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Estado</Label>
              <Select value={readFilter} onValueChange={(value) => { setReadFilter(value); setPage(0); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="unread">Não lidas</SelectItem>
                  <SelectItem value="read">Lidas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Period Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Período</Label>
              <Select value={periodFilter} onValueChange={(value) => { setPeriodFilter(value); setPage(0); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o período</SelectItem>
                  <SelectItem value="last_week">Última semana</SelectItem>
                  <SelectItem value="last_month">Último mês</SelectItem>
                  <SelectItem value="last_quarter">Último trimestre</SelectItem>
                  <SelectItem value="last_year">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="lg:col-span-3 space-y-4">
          {notifications && notifications.length > 0 ? (
            <>
              {notifications.map((notif) => {
                const Icon = TYPE_ICONS[notif.type] || Bell;
                return (
                  <Card key={notif.id} className={notif.isRead ? "opacity-60" : ""}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            notif.isRead ? "bg-muted" : "bg-primary/10"
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              notif.isRead ? "text-muted-foreground" : "text-primary"
                            }`}
                          />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{notif.title}</h3>
                                {notif.isRead ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Circle className="h-4 w-4 text-orange-500" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{notif.message}</p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <Badge className={PRIORITY_COLORS[notif.priority]}>
                                {notif.priority === "low"
                                  ? "Baixa"
                                  : notif.priority === "medium"
                                  ? "Média"
                                  : notif.priority === "high"
                                  ? "Alta"
                                  : "Crítica"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(notif.createdAt), "dd/MM/yyyy HH:mm", {
                                  locale: pt,
                                })}
                              </span>
                            </div>
                          </div>

                          {notif.projectName && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <History className="h-3 w-3" />
                              <span>{notif.projectName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page + 1}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!notifications || notifications.length < pageSize}
                >
                  Seguinte
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma notificação encontrada</h3>
                <p className="text-sm text-muted-foreground">
                  Não existem notificações que correspondam aos filtros selecionados.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function getPeriodDates(period: string) {
  const now = new Date();
  const endDate = now;
  let startDate = new Date();

  switch (period) {
    case "last_week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "last_month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "last_quarter":
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "last_year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return {};
  }

  return { startDate, endDate };
}
