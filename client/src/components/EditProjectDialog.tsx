import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface EditProjectDialogProps {
  project: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EditProjectDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
}: EditProjectDialogProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "planning",
    priority: "medium",
    startDate: "",
    endDate: "",
    budget: "",
    actualCost: "",
    clientName: "",
    location: "",
    progress: "0",
  });

  // Initialize form with project data
  useEffect(() => {
    if (project && open) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        status: project.status || "planning",
        priority: project.priority || "medium",
        startDate: project.startDate 
          ? new Date(project.startDate).toISOString().split("T")[0] 
          : "",
        endDate: project.endDate 
          ? new Date(project.endDate).toISOString().split("T")[0] 
          : "",
        budget: project.budget || "",
        actualCost: project.actualCost || "",
        clientName: project.clientName || "",
        location: project.location || "",
        progress: project.progress?.toString() || "0",
      });
    }
  }, [project, open]);

  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Projeto atualizado",
        description: "As alterações foram guardadas com sucesso",
      });
      utils.projects.list.invalidate();
      utils.projects.getById.invalidate({ id: project.id });
      utils.projects.getStats.invalidate({ id: project.id });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do projeto é obrigatório",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      id: project.id,
      name: formData.name,
      description: formData.description || undefined,
      status: formData.status as any,
      priority: formData.priority as any,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      budget: formData.budget || undefined,
      actualCost: formData.actualCost || undefined,
      clientName: formData.clientName || undefined,
      location: formData.location || undefined,
      progress: parseInt(formData.progress) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Projeto */}
          <div>
            <Label htmlFor="name">Nome do Projeto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Moradia Unifamiliar"
              required
            />
          </div>

          {/* Cliente */}
          <div>
            <Label htmlFor="clientName">Cliente</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Nome do cliente"
            />
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição detalhada do projeto"
              rows={3}
            />
          </div>

          {/* Localização */}
          <div>
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Lisboa, Portugal"
            />
          </div>

          {/* Status e Prioridade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planeamento</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="on_hold">Em Pausa</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
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

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Data de Conclusão</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Orçamento e Custo Real */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget">Orçamento (€)</Label>
              <Input
                id="budget"
                type="text"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="Ex: 250000"
              />
            </div>

            <div>
              <Label htmlFor="actualCost">Custo Real (€)</Label>
              <Input
                id="actualCost"
                type="text"
                value={formData.actualCost}
                onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })}
                placeholder="Ex: 235000"
              />
            </div>
          </div>

          {/* Progresso */}
          <div>
            <Label htmlFor="progress">Progresso (%)</Label>
            <Input
              id="progress"
              type="number"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Percentagem de conclusão do projeto (0-100)
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "A guardar..." : "Guardar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
