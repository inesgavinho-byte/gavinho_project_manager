import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ArchVizEditModalProps {
  render: any;
  compartments: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ArchVizEditModal({
  render,
  compartments,
  open,
  onOpenChange,
  onSuccess,
}: ArchVizEditModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState(render.name);
  const [description, setDescription] = useState(render.description || "");
  const [compartmentId, setCompartmentId] = useState(render.compartmentId.toString());
  const [status, setStatus] = useState(render.status);

  useEffect(() => {
    setName(render.name);
    setDescription(render.description || "");
    setCompartmentId(render.compartmentId.toString());
    setStatus(render.status);
  }, [render]);

  const updateMutation = trpc.archviz.renders.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Render atualizado",
        description: "As alterações foram guardadas com sucesso.",
      });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!name) {
      toast({
        title: "Campo obrigatório",
        description: "O nome do render é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      id: render.id,
      name,
      description,
      compartmentId: parseInt(compartmentId),
      status: status as "pending" | "approved_dc" | "approved_client",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#5F5C59" }}>Editar Render</DialogTitle>
          <DialogDescription style={{ color: "#5F5C59" }}>
            Atualize as informações do render v{render.version}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nome */}
          <div>
            <Label style={{ color: "#5F5C59" }}>Nome *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Vista Sala de Estar"
              style={{ borderColor: "#C3BAAF" }}
            />
          </div>

          {/* Descrição */}
          <div>
            <Label style={{ color: "#5F5C59" }}>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional do render..."
              rows={3}
              style={{ borderColor: "#C3BAAF" }}
            />
          </div>

          {/* Compartimento */}
          <div>
            <Label style={{ color: "#5F5C59" }}>Compartimento *</Label>
            <Select value={compartmentId} onValueChange={setCompartmentId}>
              <SelectTrigger style={{ borderColor: "#C3BAAF" }}>
                <SelectValue placeholder="Selecione o compartimento" />
              </SelectTrigger>
              <SelectContent>
                {compartments.map((comp) => (
                  <SelectItem key={comp.id} value={comp.id.toString()}>
                    {comp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <Label style={{ color: "#5F5C59" }}>Status *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger style={{ borderColor: "#C3BAAF" }}>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved_dc">Aprovada DC</SelectItem>
                <SelectItem value="approved_client">Aprovada DC + Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
              style={{ borderColor: "#C3BAAF", color: "#5F5C59" }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              style={{ backgroundColor: "#C9A882", color: "white" }}
              className="hover:opacity-90"
            >
              {updateMutation.isPending ? "A guardar..." : "Guardar Alterações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
