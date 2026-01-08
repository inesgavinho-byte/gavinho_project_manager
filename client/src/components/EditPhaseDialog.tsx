import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";

interface EditPhaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phaseId: number;
  projectId: number;
  onSuccess: () => void;
}

export function EditPhaseDialog({
  open,
  onOpenChange,
  phaseId,
  projectId,
  onSuccess,
}: EditPhaseDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "not_started" as const,
    startDate: "",
    endDate: "",
    progress: 0,
  });

  const { data: phases } = trpc.projects.phases.list.useQuery({ projectId });
  const currentPhase = phases?.find(p => p.id === phaseId);

  useEffect(() => {
    if (currentPhase) {
      setFormData({
        name: currentPhase.name,
        description: currentPhase.description || "",
        status: currentPhase.status as any,
        startDate: currentPhase.startDate ? new Date(currentPhase.startDate).toISOString().split('T')[0] : "",
        endDate: currentPhase.endDate ? new Date(currentPhase.endDate).toISOString().split('T')[0] : "",
        progress: currentPhase.progress,
      });
    }
  }, [currentPhase]);

  const updateMutation = trpc.projects.phases.update.useMutation({
    onSuccess: () => {
      toast({ title: "Fase atualizada com sucesso!" });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar fase",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: phaseId,
      ...formData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Fase</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Fase *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Estudo Prévio"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o âmbito desta fase..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Não Iniciado</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="on_hold">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="progress">Progresso (%)</Label>
            <Input
              id="progress"
              type="number"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "A atualizar..." : "Atualizar Fase"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
