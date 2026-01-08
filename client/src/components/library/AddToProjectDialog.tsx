import { useState } from "react";
import { trpc } from "../../lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { FolderPlus } from "lucide-react";

interface AddToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: "material" | "model" | "inspiration";
  itemId: number;
  itemName: string;
  onSuccess: () => void;
}

export function AddToProjectDialog({
  open,
  onOpenChange,
  itemType,
  itemId,
  itemName,
  onSuccess,
}: AddToProjectDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch projects list
  const { data: projects = [] } = trpc.projects.list.useQuery();

  // Mutations
  const addMaterial = trpc.library.projectMaterials.add.useMutation({
    onSuccess: () => {
      toast.success("Material adicionado ao projeto!");
      resetForm();
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar material: " + error.message);
    },
  });

  const addModel = trpc.library.projectModels.add.useMutation({
    onSuccess: () => {
      toast.success("Modelo 3D adicionado ao projeto!");
      resetForm();
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar modelo: " + error.message);
    },
  });

  const addInspiration = trpc.library.projectInspiration.add.useMutation({
    onSuccess: () => {
      toast.success("Inspiração adicionada ao projeto!");
      resetForm();
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar inspiração: " + error.message);
    },
  });

  const resetForm = () => {
    setSelectedProjectId("");
    setQuantity("1");
    setUnitPrice("");
    setLocation("");
    setNotes("");
  };

  const handleSubmit = () => {
    if (!selectedProjectId) {
      toast.error("Por favor selecione um projeto");
      return;
    }

    const projectId = parseInt(selectedProjectId);

    if (itemType === "material") {
      if (!quantity || parseFloat(quantity) <= 0) {
        toast.error("Por favor insira uma quantidade válida");
        return;
      }

      addMaterial.mutate({
        projectId,
        materialId: itemId,
        quantity,
        unitPrice: unitPrice || undefined,
        notes: notes || undefined,
      });
    } else if (itemType === "model") {
      addModel.mutate({
        projectId,
        modelId: itemId,
        location: location || undefined,
        notes: notes || undefined,
      });
    } else if (itemType === "inspiration") {
      addInspiration.mutate({
        projectId,
        inspirationId: itemId,
        notes: notes || undefined,
      });
    }
  };

  const isLoading = addMaterial.isPending || addModel.isPending || addInspiration.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#5F5C59]">
            Adicionar a Projeto
          </DialogTitle>
          <DialogDescription>
            Associar "{itemName}" a um projeto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Projeto *</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <div className="p-2 text-sm text-[#C3BAAF]">Nenhum projeto disponível</div>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {itemType === "material" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantidade *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="1.00"
                  />
                </div>
                <div>
                  <Label>Preço Unitário (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </>
          )}

          {itemType === "model" && (
            <div>
              <Label>Localização</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Sala de Estar, Quarto Principal"
              />
            </div>
          )}

          <div>
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Notas adicionais..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-[#C9A882] hover:bg-[#B8976F]"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            {isLoading ? "A adicionar..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
