import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Trash2, Calendar, User } from "lucide-react";
import { CreatePhaseDialog } from "./CreatePhaseDialog";
import { EditPhaseDialog } from "./EditPhaseDialog";
import { useToast } from "@/hooks/use-toast";

interface ProjectPhasesSectionProps {
  projectId: number;
}

export function ProjectPhasesSection({ projectId }: ProjectPhasesSectionProps) {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);

  const { data: phases, isLoading, refetch } = trpc.projects.phases.list.useQuery({ projectId });
  
  const deleteMutation = trpc.projects.phases.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Fase eliminada com sucesso!" });
      refetch();
    },
    onError: (error) => {
      toast({ title: "Erro ao eliminar fase", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      not_started: { label: "Não Iniciado", className: "bg-gray-500" },
      in_progress: { label: "Em Andamento", className: "bg-blue-500" },
      completed: { label: "Concluído", className: "bg-green-500" },
      on_hold: { label: "Pausado", className: "bg-yellow-500" },
    };
    const variant = variants[status] || variants.not_started;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Não definida";
    return new Date(date).toLocaleDateString("pt-PT");
  };

  const handleEdit = (phaseId: number) => {
    setSelectedPhaseId(phaseId);
    setEditDialogOpen(true);
  };

  const handleDelete = (phaseId: number) => {
    if (confirm("Tem a certeza que deseja eliminar esta fase?")) {
      deleteMutation.mutate({ id: phaseId });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">A carregar fases...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Fases do Projeto</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Fase
        </Button>
      </div>

      {phases && phases.length > 0 ? (
        <div className="space-y-4">
          {phases.map((phase) => (
            <Card key={phase.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{phase.name}</CardTitle>
                    {phase.description && (
                      <p className="text-sm text-muted-foreground">{phase.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(phase.status)}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(phase.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(phase.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(phase.startDate)} - {formatDate(phase.endDate)}</span>
                  </div>
                  {phase.assignedTo && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>Responsável: {phase.assignedTo}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progresso</span>
                    <span className="font-medium">{phase.progress}%</span>
                  </div>
                  <Progress value={phase.progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma fase criada ainda. Clique em "Nova Fase" para começar.
          </CardContent>
        </Card>
      )}

      <CreatePhaseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        onSuccess={() => {
          refetch();
          setCreateDialogOpen(false);
        }}
      />

      {selectedPhaseId && (
        <EditPhaseDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          phaseId={selectedPhaseId}
          projectId={projectId}
          onSuccess={() => {
            refetch();
            setEditDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
