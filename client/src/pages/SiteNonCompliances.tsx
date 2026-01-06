import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, XCircle, Plus, Upload } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SiteNonCompliances() {
  const { constructionId } = useParams();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedNonCompliance, setSelectedNonCompliance] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Queries
  const { data: nonCompliances, isLoading, refetch } = trpc.siteManagement.nonCompliances.listByConstruction.useQuery(
    { constructionId: Number(constructionId) },
    { enabled: !!constructionId }
  );

  const { data: workers } = trpc.siteManagement.workers.listByConstruction.useQuery(
    { constructionId: Number(constructionId) },
    { enabled: !!constructionId }
  );

  // Mutations
  const createMutation = trpc.siteManagement.nonCompliances.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsCreateDialogOpen(false);
    },
  });

  const resolveMutation = trpc.siteManagement.nonCompliances.resolve.useMutation({
    onSuccess: () => refetch(),
  });

  const verifyMutation = trpc.siteManagement.nonCompliances.verify.useMutation({
    onSuccess: () => refetch(),
  });

  // Form state
  const [formData, setFormData] = useState({
    description: "",
    severity: "medium" as "low" | "medium" | "high" | "critical",
    category: "",
    location: "",
    responsibleId: "",
    deadline: "",
    photos: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!constructionId) return;

    createMutation.mutate({
      constructionId: Number(constructionId),
      description: formData.description,
      severity: formData.severity,
      category: formData.category,
      location: formData.location,
      responsibleId: formData.responsibleId ? Number(formData.responsibleId) : undefined,
      deadline: formData.deadline ? new Date(formData.deadline) : undefined,
    });
  };

  const handleResolve = (id: number, resolution: string) => {
    resolveMutation.mutate({ id, resolution });
  };

  const handleVerify = (id: number) => {
    verifyMutation.mutate({ id });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-blue-100 text-blue-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "resolved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "closed":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const filteredNonCompliances = nonCompliances?.filter((nc) => {
    if (filterStatus === "all") return true;
    return nc.status === filterStatus;
  });

  const stats = {
    total: nonCompliances?.length || 0,
    open: nonCompliances?.filter((nc) => nc.status === "open").length || 0,
    inProgress: nonCompliances?.filter((nc) => nc.status === "in_progress").length || 0,
    resolved: nonCompliances?.filter((nc) => nc.status === "resolved").length || 0,
    closed: nonCompliances?.filter((nc) => nc.status === "closed").length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">A carregar não conformidades...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Não Conformidades</h1>
          <p className="text-muted-foreground">
            Gestão e acompanhamento de não conformidades em obra
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registar Não Conformidade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Não Conformidade</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descreva a não conformidade encontrada..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="severity">Severidade *</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, severity: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="Ex: Segurança, Qualidade..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Ex: Piso 2, Sala A..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="responsibleId">Responsável</Label>
                  <Select
                    value={formData.responsibleId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, responsibleId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {workers?.map((worker) => (
                        <SelectItem key={worker.id} value={String(worker.id)}>
                          {worker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deadline">Prazo</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "A criar..." : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-sm text-red-600">Abertas</p>
          <p className="text-2xl font-bold text-red-600">{stats.open}</p>
        </Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <p className="text-sm text-yellow-600">Em Progresso</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50">
          <p className="text-sm text-green-600">Resolvidas</p>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </Card>
        <Card className="p-4 border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">Fechadas</p>
          <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filterStatus} onValueChange={setFilterStatus}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="open">Abertas</TabsTrigger>
          <TabsTrigger value="in_progress">Em Progresso</TabsTrigger>
          <TabsTrigger value="resolved">Resolvidas</TabsTrigger>
          <TabsTrigger value="closed">Fechadas</TabsTrigger>
        </TabsList>

        <TabsContent value={filterStatus} className="space-y-4 mt-4">
          {filteredNonCompliances && filteredNonCompliances.length > 0 ? (
            filteredNonCompliances.map((nc) => (
              <Card key={nc.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(nc.status)}
                      <Badge className={getSeverityColor(nc.severity)}>
                        {nc.severity === "low" && "Baixa"}
                        {nc.severity === "medium" && "Média"}
                        {nc.severity === "high" && "Alta"}
                        {nc.severity === "critical" && "Crítica"}
                      </Badge>
                      {nc.category && (
                        <Badge variant="outline">{nc.category}</Badge>
                      )}
                    </div>
                    <p className="text-lg font-semibold mb-2">{nc.description}</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {nc.location && <p>📍 {nc.location}</p>}
                      <p>
                        📅 Reportado em{" "}
                        {format(new Date(nc.reportedDate), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                      {nc.deadline && (
                        <p>
                          ⏰ Prazo:{" "}
                          {format(new Date(nc.deadline), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {nc.status === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          const resolution = prompt("Descreva a resolução:");
                          if (resolution) handleResolve(nc.id, resolution);
                        }}
                      >
                        Resolver
                      </Button>
                    )}
                    {nc.status === "resolved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerify(nc.id)}
                      >
                        Verificar e Fechar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                Nenhuma não conformidade encontrada
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
