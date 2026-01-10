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

interface AddSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddSkillDialog({ open, onOpenChange, onSuccess }: AddSkillDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    skillName: "",
    proficiencyLevel: "intermediate" as const,
    yearsOfExperience: 0,
    description: "",
  });

  const createSkillMutation = trpc.userSkills.createSkill.useMutation({
    onSuccess: () => {
      toast({
        title: "Competência adicionada",
        description: "A sua competência foi adicionada com sucesso.",
      });
      setFormData({
        skillName: "",
        proficiencyLevel: "intermediate",
        yearsOfExperience: 0,
        description: "",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.skillName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, introduza o nome da competência.",
        variant: "destructive",
      });
      return;
    }

    createSkillMutation.mutate(formData);
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
          <DialogTitle>Adicionar Competência</DialogTitle>
          <DialogDescription>
            Adicione uma nova competência profissional ao seu perfil
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skillName">Nome da Competência *</Label>
            <Input
              id="skillName"
              name="skillName"
              value={formData.skillName}
              onChange={handleChange}
              placeholder="Ex: Revit, AutoCAD, Gestão de Projetos"
              required
            />
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
              disabled={createSkillMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-brown hover:bg-brown/90"
              disabled={createSkillMutation.isPending}
            >
              {createSkillMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
