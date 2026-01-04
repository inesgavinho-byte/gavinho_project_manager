import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface NewProjectModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function NewProjectModal({ trigger, onSuccess }: NewProjectModalProps) {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    location: "",
    startDate: "",
    endDate: "",
    budget: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    status: "planning" as "planning" | "in_progress" | "on_hold" | "completed" | "cancelled",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createProject = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success("Projeto criado com sucesso!");
      setIsOpen(false);
      resetForm();
      if (onSuccess) {
        onSuccess();
      }
      // Redirect to project details page
      setLocation(`/projects/${data.id}`);
    },
    onError: (error) => {
      toast.error("Erro ao criar projeto: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      clientName: "",
      location: "",
      startDate: "",
      endDate: "",
      budget: "",
      priority: "medium",
      status: "planning",
      description: "",
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = "Nome do projeto é obrigatório";
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = "Nome do cliente é obrigatório";
    }

    // Date validation
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = "Data de fim deve ser posterior à data de início";
      }
    }

    // Budget validation
    if (formData.budget) {
      const budgetValue = parseFloat(formData.budget);
      if (isNaN(budgetValue) || budgetValue <= 0) {
        newErrors.budget = "Orçamento deve ser um valor positivo";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    createProject.mutate({
      name: formData.name,
      clientName: formData.clientName,
      location: formData.location || undefined,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      budget: formData.budget || undefined,
      priority: formData.priority,
      status: formData.status,
      description: formData.description || undefined,
    });
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      urgent: "Urgente",
    };
    return labels[priority] || priority;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planning: "Planeamento",
      in_progress: "Em Andamento",
      on_hold: "Em Pausa",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Novo Projeto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#5F5C59]">Criar Novo Projeto</DialogTitle>
          <DialogDescription className="text-[#5F5C59]/60">
            Preencha as informações do projeto. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome do Projeto */}
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-[#5F5C59]">
              Nome do Projeto *
            </Label>
            <Input
              id="project-name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              placeholder="Ex: Moradia Unifamiliar em Cascais"
              className={`border-[#C3BAAF]/20 focus:border-[#C9A882] ${
                errors.name ? "border-red-500" : ""
              }`}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="client-name" className="text-[#5F5C59]">
              Cliente *
            </Label>
            <Input
              id="client-name"
              value={formData.clientName}
              onChange={(e) => {
                setFormData({ ...formData, clientName: e.target.value });
                if (errors.clientName) setErrors({ ...errors, clientName: "" });
              }}
              placeholder="Nome do cliente"
              className={`border-[#C3BAAF]/20 focus:border-[#C9A882] ${
                errors.clientName ? "border-red-500" : ""
              }`}
            />
            {errors.clientName && <p className="text-sm text-red-600">{errors.clientName}</p>}
          </div>

          {/* Localização */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-[#5F5C59]">
              Localização
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Cascais, Portugal"
              className="border-[#C3BAAF]/20 focus:border-[#C9A882]"
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-[#5F5C59]">
                Data de Início
              </Label>
              <Input
                id="start-date"
                type="date"
                value={formData.startDate}
                onChange={(e) => {
                  setFormData({ ...formData, startDate: e.target.value });
                  if (errors.endDate) setErrors({ ...errors, endDate: "" });
                }}
                className="border-[#C3BAAF]/20 focus:border-[#C9A882]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-[#5F5C59]">
                Data de Fim
              </Label>
              <Input
                id="end-date"
                type="date"
                value={formData.endDate}
                onChange={(e) => {
                  setFormData({ ...formData, endDate: e.target.value });
                  if (errors.endDate) setErrors({ ...errors, endDate: "" });
                }}
                className={`border-[#C3BAAF]/20 focus:border-[#C9A882] ${
                  errors.endDate ? "border-red-500" : ""
                }`}
              />
              {errors.endDate && <p className="text-sm text-red-600">{errors.endDate}</p>}
            </div>
          </div>

          {/* Orçamento */}
          <div className="space-y-2">
            <Label htmlFor="budget" className="text-[#5F5C59]">
              Orçamento (€)
            </Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              min="0"
              value={formData.budget}
              onChange={(e) => {
                setFormData({ ...formData, budget: e.target.value });
                if (errors.budget) setErrors({ ...errors, budget: "" });
              }}
              placeholder="Ex: 250000"
              className={`border-[#C3BAAF]/20 focus:border-[#C9A882] ${
                errors.budget ? "border-red-500" : ""
              }`}
            />
            {errors.budget && <p className="text-sm text-red-600">{errors.budget}</p>}
          </div>

          {/* Prioridade e Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-[#5F5C59]">
                Prioridade
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="border-[#C3BAAF]/20 focus:border-[#C9A882]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{getPriorityLabel("low")}</SelectItem>
                  <SelectItem value="medium">{getPriorityLabel("medium")}</SelectItem>
                  <SelectItem value="high">{getPriorityLabel("high")}</SelectItem>
                  <SelectItem value="urgent">{getPriorityLabel("urgent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-[#5F5C59]">
                Status Inicial
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="border-[#C3BAAF]/20 focus:border-[#C9A882]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">{getStatusLabel("planning")}</SelectItem>
                  <SelectItem value="in_progress">{getStatusLabel("in_progress")}</SelectItem>
                  <SelectItem value="on_hold">{getStatusLabel("on_hold")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[#5F5C59]">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição detalhada do projeto..."
              rows={4}
              className="border-[#C3BAAF]/20 focus:border-[#C9A882] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              resetForm();
            }}
            className="border-[#C3BAAF]/20"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createProject.isPending}
            className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white"
          >
            {createProject.isPending ? "A criar..." : "Criar Projeto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
