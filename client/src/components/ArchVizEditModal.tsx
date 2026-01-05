import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

interface ArchVizEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  render: {
    id: number;
    name: string;
    description?: string | null;
    compartmentId: number;
    status: "pending" | "approved_dc" | "approved_client";
  };
  compartments: Array<{ id: number; name: string }>;
  onSuccess: () => void;
}

export function ArchVizEditModal({ open, onOpenChange, render, compartments, onSuccess }: ArchVizEditModalProps) {
  const [name, setName] = useState(render.name);
  const [description, setDescription] = useState(render.description || "");
  const [compartmentId, setCompartmentId] = useState(render.compartmentId);
  const [status, setStatus] = useState(render.status);

  const updateMutation = trpc.archviz.renders.update.useMutation({
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
    },
  });

  useEffect(() => {
    setName(render.name);
    setDescription(render.description || "");
    setCompartmentId(render.compartmentId);
    setStatus(render.status);
  }, [render]);

  const handleSave = () => {
    updateMutation.mutate({
      id: render.id,
      name,
      description,
      compartmentId,
      status,
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "approved_dc":
        return "Aprovada DC";
      case "approved_client":
        return "Aprovada DC + Cliente";
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Render</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do render, compartimento ou status de aprovação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da visualização"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="compartment">Compartimento</Label>
            <Select
              value={compartmentId.toString()}
              onValueChange={(value) => setCompartmentId(parseInt(value))}
            >
              <SelectTrigger id="compartment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {compartments.map(comp => (
                  <SelectItem key={comp.id} value={comp.id.toString()}>
                    {comp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status de Aprovação</Label>
            <Select
              value={status}
              onValueChange={(value: "pending" | "approved_dc" | "approved_client") => setStatus(value)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{getStatusLabel("pending")}</SelectItem>
                <SelectItem value="approved_dc">{getStatusLabel("approved_dc")}</SelectItem>
                <SelectItem value="approved_client">{getStatusLabel("approved_client")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            style={{ backgroundColor: "#C9A882", color: "white" }}
          >
            {updateMutation.isPending ? "A guardar..." : "Guardar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
