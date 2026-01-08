import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link2, X } from "lucide-react";
import { toast } from "sonner";

interface SupplierProjectsManagerProps {
  supplierId: number;
  supplierName: string;
}

export default function SupplierProjectsManager({ supplierId, supplierName }: SupplierProjectsManagerProps) {
  const [open, setOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);

  const { data: allProjects } = trpc.projects.list.useQuery();
  const { data: supplierProjects, refetch } = trpc.suppliers.getProjects.useQuery(
    { supplierId },
    { enabled: open }
  );

  const utils = trpc.useUtils();
  const associateProjects = trpc.suppliers.associateProjects.useMutation({
    onSuccess: () => {
      toast.success("Projetos associados com sucesso");
      setOpen(false);
      refetch();
      utils.suppliers.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && supplierProjects) {
      // Pre-select already associated projects
      setSelectedProjects(supplierProjects.map(sp => sp.projectId));
    }
  };

  const toggleProject = (projectId: number) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSave = () => {
    associateProjects.mutate({
      supplierId,
      projectIds: selectedProjects,
    });
  };

  const activeProjects = supplierProjects?.length || 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Link2 className="h-4 w-4 mr-2" />
          {activeProjects > 0 ? `${activeProjects} Projetos` : "Associar Projetos"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Projetos Associados - {supplierName}</DialogTitle>
          <DialogDescription>
            Selecione os projetos aos quais este fornecedor está associado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ScrollArea className="h-[400px] pr-4">
            {allProjects?.map((project) => {
              const isSelected = selectedProjects.includes(project.id);
              return (
                <div
                  key={project.id}
                  className="flex items-start space-x-3 py-3 border-b last:border-0"
                >
                  <Checkbox
                    id={`project-${project.id}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleProject(project.id)}
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={`project-${project.id}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {project.name}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={project.status === "in_progress" ? "default" : "secondary"}>
                        {project.status}
                      </Badge>
                      {project.clientName && (
                        <span className="text-xs text-muted-foreground">
                          Cliente: {project.clientName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </ScrollArea>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedProjects.length} projetos selecionados
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={associateProjects.isPending}>
                {associateProjects.isPending ? "A guardar..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
