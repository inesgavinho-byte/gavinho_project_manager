import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";
import type { UserSkill } from "@shared/types";

interface EditSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: UserSkill;
  onSuccess?: () => void;
}

export function EditSkillDialog({
  open,
  onOpenChange,
  skill,
  onSuccess,
}: EditSkillDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    proficiencyLevel: skill.proficiencyLevel,
    yearsOfExperience: skill.yearsOfExperience,
    description: skill.description || "",
  });

  const updateSkillMutation = trpc.userSkills.updateSkill.useMutation({
    onSuccess: () => {
      toast({
        title: "Competência atualizada",
        description: "A sua competência foi atualizada com sucesso.",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateSkillMutation.mutate({
      skillId: skill.id,
      proficiencyLevel: formData.proficiencyLevel as any,
      yearsOfExperience: formData.yearsOfExperience,
      description: formData.description || undefined,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "yearsOfExperience" ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Competência</DialogTitle>
          <DialogDescription>
            Atualize os detalhes da sua competência
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Competência</Label>
            <div className="px-3 py-2 bg-muted rounded-md text-foreground">
              {skill.skillName}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proficiencyLevel">Nível de Proficiência *</Label>
            <Select
              value={formData.proficiencyLevel}
              onValueChange={(value: any) =>
                setFormData((prev) => ({ ...prev, proficiencyLevel: value }))
              }
            >
              <SelectTrigger id="proficiencyLevel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Iniciante</SelectItem>
                <SelectItem value="intermediate">Intermédio</SelectItem>
                <SelectItem value="advanced">Avançado</SelectItem>
                <SelectItem value="expert">Especialista</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearsOfExperience">Anos de Experiência</Label>
            <Input
              id="yearsOfExperience"
              name="yearsOfExperience"
              type="number"
              min="0"
              max="99"
              step="0.5"
              value={formData.yearsOfExperience}
              onChange={handleChange}
              placeholder="Ex: 5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descreva a sua experiência com esta competência..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateSkillMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-brown hover:bg-brown/90"
              disabled={updateSkillMutation.isPending}
            >
              {updateSkillMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Guardar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
