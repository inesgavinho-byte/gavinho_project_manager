import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    clientName: "",
    location: "",
    status: "planning" as const,
    priority: "medium" as const,
  });

  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();
  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success("Projeto criado com sucesso!");
      setIsDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        clientName: "",
        location: "",
        status: "planning",
        priority: "medium",
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar projeto: " + error.message);
    },
  });

  const filteredProjects = projects?.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate(formData);
  };

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

  const getPriorityClass = (priority: string) => {
    const classes: Record<string, string> = {
      low: "priority-low",
      medium: "priority-medium",
      high: "priority-high",
      urgent: "priority-urgent",
    };
    return classes[priority] || "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projetos</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os projetos de construção</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Criar Novo Projeto</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo projeto de construção
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Projeto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Edifício Residencial Centro"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="clientName">Cliente</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Endereço ou localização"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição detalhada do projeto"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planejamento</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="on_hold">Pausado</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createProject.isPending}>
                  {createProject.isPending ? "Criando..." : "Criar Projeto"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar projetos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando projetos...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm ? "Nenhum projeto encontrado" : "Nenhum projeto cadastrado"}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="card-shadow hover:card-shadow-lg transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getPriorityClass(project.priority)}`}>
                      {project.priority}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.clientName && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Cliente:</span> {project.clientName}
                    </p>
                  )}
                  {project.location && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Local:</span> {project.location}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(project.status)}`}>
                      {project.status === "planning" && "Planejamento"}
                      {project.status === "in_progress" && "Em Andamento"}
                      {project.status === "on_hold" && "Pausado"}
                      {project.status === "completed" && "Concluído"}
                      {project.status === "cancelled" && "Cancelado"}
                    </span>
                    <span className="text-sm font-medium">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
