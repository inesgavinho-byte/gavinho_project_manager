import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, RotateCcw, AlertTriangle, FolderOpen, Building2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Trash() {
  const [, setLocation] = useLocation();
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: number; name: string; type: "project" | "construction" } | null>(null);

  const utils = trpc.useUtils();

  // Queries
  const { data: trashedProjects = [], isLoading: loadingProjects } = trpc.projects.trash.listProjects.useQuery();
  const { data: trashedConstructions = [], isLoading: loadingConstructions } = trpc.constructions.trash.listConstructions.useQuery();

  // Mutations
  const restoreProjectMutation = trpc.projects.trash.restore.useMutation({
    onSuccess: () => {
      toast.success("Projeto restaurado com sucesso!");
      utils.projects.trash.listProjects.invalidate();
      utils.projects.list.invalidate();
      setRestoreDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao restaurar projeto: ${error.message}`);
    },
  });

  const restoreConstructionMutation = trpc.constructions.trash.restore.useMutation({
    onSuccess: () => {
      toast.success("Obra restaurada com sucesso!");
      utils.constructions.trash.listConstructions.invalidate();
      utils.constructions.list.invalidate();
      setRestoreDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao restaurar obra: ${error.message}`);
    },
  });

  const permanentDeleteProjectMutation = trpc.projects.trash.permanentDelete.useMutation({
    onSuccess: () => {
      toast.success("Projeto apagado permanentemente!");
      utils.projects.trash.listProjects.invalidate();
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao apagar projeto: ${error.message}`);
    },
  });

  const permanentDeleteConstructionMutation = trpc.constructions.trash.permanentDelete.useMutation({
    onSuccess: () => {
      toast.success("Obra apagada permanentemente!");
      utils.constructions.trash.listConstructions.invalidate();
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao apagar obra: ${error.message}`);
    },
  });

  const handleRestore = () => {
    if (!selectedItem) return;
    
    if (selectedItem.type === "project") {
      restoreProjectMutation.mutate({ id: selectedItem.id });
    } else {
      restoreConstructionMutation.mutate({ id: selectedItem.id });
    }
  };

  const handlePermanentDelete = () => {
    if (!selectedItem) return;
    
    if (selectedItem.type === "project") {
      permanentDeleteProjectMutation.mutate({ id: selectedItem.id });
    } else {
      permanentDeleteConstructionMutation.mutate({ id: selectedItem.id });
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalItems = trashedProjects.length + trashedConstructions.length;
  const isLoading = loadingProjects || loadingConstructions;

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2C2C2C]">Lixeira</h1>
        <p className="text-[#6B6B6B] mt-2">
          Itens apagados são mantidos por 30 dias antes da remoção permanente
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 border-[#C9A882]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#EEEAE5] rounded-lg">
              <Trash2 className="w-6 h-6 text-[#C9A882]" />
            </div>
            <div>
              <p className="text-sm text-[#6B6B6B]">Total na Lixeira</p>
              <p className="text-2xl font-bold text-[#2C2C2C]">{totalItems}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-[#C9A882]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#EEEAE5] rounded-lg">
              <FolderOpen className="w-6 h-6 text-[#C9A882]" />
            </div>
            <div>
              <p className="text-sm text-[#6B6B6B]">Projetos</p>
              <p className="text-2xl font-bold text-[#2C2C2C]">{trashedProjects.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-[#C9A882]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#EEEAE5] rounded-lg">
              <Building2 className="w-6 h-6 text-[#C9A882]" />
            </div>
            <div>
              <p className="text-sm text-[#6B6B6B]">Obras</p>
              <p className="text-2xl font-bold text-[#2C2C2C]">{trashedConstructions.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-[#6B6B6B]">A carregar...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && totalItems === 0 && (
        <Card className="p-12 text-center border-[#C9A882]">
          <Trash2 className="w-16 h-16 text-[#C9A882] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">Lixeira Vazia</h3>
          <p className="text-[#6B6B6B]">Não há itens apagados no momento</p>
        </Card>
      )}

      {/* Trashed Projects */}
      {!isLoading && trashedProjects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4 flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-[#C9A882]" />
            Projetos ({trashedProjects.length})
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {trashedProjects.map((project) => (
              <Card key={project.id} className="p-6 border-[#C9A882]">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">{project.name}</h3>
                    <p className="text-sm text-[#6B6B6B] mb-2">{project.description || "Sem descrição"}</p>
                    <div className="flex items-center gap-4 text-sm text-[#6B6B6B]">
                      <span>Cliente: {project.clientName || "N/A"}</span>
                      <span>•</span>
                      <span>Apagado em: {formatDate(project.deletedAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedItem({ id: project.id, name: project.name, type: "project" });
                        setRestoreDialogOpen(true);
                      }}
                      className="border-[#C9A882] text-[#C9A882] hover:bg-[#EEEAE5]"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restaurar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedItem({ id: project.id, name: project.name, type: "project" });
                        setDeleteDialogOpen(true);
                      }}
                      className="border-red-500 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Apagar Permanentemente
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Trashed Constructions */}
      {!isLoading && trashedConstructions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#C9A882]" />
            Obras ({trashedConstructions.length})
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {trashedConstructions.map((construction) => (
              <Card key={construction.id} className="p-6 border-[#C9A882]">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">
                      {construction.code} - {construction.name}
                    </h3>
                    <p className="text-sm text-[#6B6B6B] mb-2">{construction.description || "Sem descrição"}</p>
                    <div className="flex items-center gap-4 text-sm text-[#6B6B6B]">
                      <span>Cliente: {construction.client || "N/A"}</span>
                      <span>•</span>
                      <span>Apagado em: {formatDate(construction.deletedAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedItem({ id: construction.id, name: `${construction.code} - ${construction.name}`, type: "construction" });
                        setRestoreDialogOpen(true);
                      }}
                      className="border-[#C9A882] text-[#C9A882] hover:bg-[#EEEAE5]"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restaurar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedItem({ id: construction.id, name: `${construction.code} - ${construction.name}`, type: "construction" });
                        setDeleteDialogOpen(true);
                      }}
                      className="border-red-500 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Apagar Permanentemente
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Restore Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar {selectedItem?.type === "project" ? "Projeto" : "Obra"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja restaurar "{selectedItem?.name}"? O item será movido de volta para a lista principal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} className="bg-[#C9A882] hover:bg-[#B89872]">
              Sim, Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Apagar Permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>Tem a certeza que deseja apagar permanentemente "{selectedItem?.name}"?</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <p className="text-red-800 font-semibold text-sm">⚠️ Esta ação é irreversível!</p>
                  <p className="text-red-700 text-sm mt-1">
                    Todos os dados relacionados serão apagados permanentemente e não poderão ser recuperados.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-red-600 hover:bg-red-700">
              Sim, Apagar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
