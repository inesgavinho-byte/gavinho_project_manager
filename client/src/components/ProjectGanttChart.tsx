import { useState, useEffect, useMemo } from "react";
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { trpc } from "@/lib/trpc";
import { Calendar, ChevronDown, ChevronUp, Filter, ZoomIn, ZoomOut, List, BarChart3, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ProjectGanttChartProps {
  projectId: number;
}

export function ProjectGanttChart({ projectId }: ProjectGanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showGantt, setShowGantt] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    type: 'phase' | 'milestone';
    id: number;
    name: string;
    startDate?: Date;
    endDate?: Date;
    dueDate?: Date;
  } | null>(null);

  // Fetch timeline data
  const { data: timelineData, isLoading, refetch } = trpc.projects.timeline.get.useQuery({
    projectId,
  });

  // Fetch critical path
  const { data: criticalPath } = trpc.projects.timeline.criticalPath.useQuery({
    projectId,
  }, {
    enabled: showCriticalPath,
  });

  // Convert phases and milestones to Gantt tasks
  const tasks: Task[] = useMemo(() => {
    if (!timelineData) return [];

    const ganttTasks: Task[] = [];

    // Add phases as tasks
    timelineData.phases.forEach((phase) => {
      const startDate = phase.startDate ? new Date(phase.startDate) : new Date();
      const endDate = phase.endDate ? new Date(phase.endDate) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Determine color based on status
      let progressColor = "#C9A882"; // Gold (default)
      if (phase.status === "completed") progressColor = "#10b981"; // Green
      else if (phase.status === "in_progress") progressColor = "#3b82f6"; // Blue
      else if (phase.status === "on_hold") progressColor = "#f59e0b"; // Orange

      ganttTasks.push({
        id: `phase-${phase.id}`,
        name: phase.name,
        start: startDate,
        end: endDate,
        progress: phase.progress || 0,
        type: "task",
        styles: {
          progressColor,
          progressSelectedColor: progressColor,
          backgroundColor: `${progressColor}33`, // 20% opacity
          backgroundSelectedColor: `${progressColor}66`, // 40% opacity
        },
        isDisabled: false,
      });
    });

    // Add milestones as milestones
    timelineData.milestones.forEach((milestone) => {
      const dueDate = new Date(milestone.dueDate);
      const isCritical = criticalPath?.includes(milestone.id);

      // Determine color based on status
      let progressColor = "#8B0000"; // GAVINHO red (default)
      if (milestone.status === "completed") progressColor = "#10b981"; // Green
      else if (milestone.status === "overdue") progressColor = "#ef4444"; // Red
      else if (isCritical) progressColor = "#f59e0b"; // Orange for critical

      ganttTasks.push({
        id: `milestone-${milestone.id}`,
        name: milestone.name,
        start: dueDate,
        end: dueDate,
        progress: milestone.status === "completed" ? 100 : 0,
        type: "milestone",
        styles: {
          progressColor,
          progressSelectedColor: progressColor,
          backgroundColor: progressColor,
          backgroundSelectedColor: progressColor,
        },
        isDisabled: false,
        dependencies: milestone.dependencies && Array.isArray(milestone.dependencies)
          ? (milestone.dependencies as number[]).map(depId => `milestone-${depId}`)
          : undefined,
      });
    });

    return ganttTasks;
  }, [timelineData, criticalPath]);

  // Handle task change (drag & drop)
  const handleTaskChange = async (task: Task) => {
    try {
      if (task.id.startsWith("phase-")) {
        const phaseId = parseInt(task.id.replace("phase-", ""));
        // Note: gantt-task-react doesn't support phase date updates easily
        // We'll implement this in the next phase
        console.log("Phase date change:", phaseId, task.start, task.end);
      } else if (task.id.startsWith("milestone-")) {
        const milestoneId = parseInt(task.id.replace("milestone-", ""));
        // Note: gantt-task-react doesn't support milestone date updates easily
        // We'll implement this in the next phase
        console.log("Milestone date change:", milestoneId, task.start);
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Handle task selection
  const handleTaskSelect = (task: Task, isSelected: boolean) => {
    setSelectedTask(isSelected ? task.id : null);
  };

  // Handle task double click to open edit dialog
  const handleTaskDoubleClick = (task: Task) => {
    if (task.id.startsWith("phase-")) {
      const phaseId = parseInt(task.id.replace("phase-", ""));
      const phase = timelineData?.phases.find(p => p.id === phaseId);
      if (phase) {
        setEditingItem({
          type: 'phase',
          id: phase.id,
          name: phase.name,
          startDate: phase.startDate ? new Date(phase.startDate) : undefined,
          endDate: phase.endDate ? new Date(phase.endDate) : undefined,
        });
        setEditDialogOpen(true);
      }
    } else if (task.id.startsWith("milestone-")) {
      const milestoneId = parseInt(task.id.replace("milestone-", ""));
      const milestone = timelineData?.milestones.find(m => m.id === milestoneId);
      if (milestone) {
        setEditingItem({
          type: 'milestone',
          id: milestone.id,
          name: milestone.name,
          dueDate: new Date(milestone.dueDate),
        });
        setEditDialogOpen(true);
      }
    }
  };

  // Mutations
  const updatePhaseDatesMutation = trpc.projects.timeline.updatePhaseDates.useMutation({
    onSuccess: () => {
      toast.success("Datas da fase atualizadas com sucesso!");
      refetch();
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar datas da fase: " + error.message);
    },
  });

  const updateMilestoneDatesMutation = trpc.projects.timeline.updateMilestoneDates.useMutation({
    onSuccess: () => {
      toast.success("Data do marco atualizada com sucesso!");
      refetch();
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar data do marco: " + error.message);
    },
  });

  // Handle save edit
  const handleSaveEdit = () => {
    if (!editingItem) return;

    if (editingItem.type === 'phase') {
      if (!editingItem.startDate || !editingItem.endDate) {
        toast.error("Por favor, preencha todas as datas");
        return;
      }
      updatePhaseDatesMutation.mutate({
        phaseId: editingItem.id,
        startDate: editingItem.startDate,
        endDate: editingItem.endDate,
      });
    } else {
      if (!editingItem.dueDate) {
        toast.error("Por favor, preencha a data");
        return;
      }
      updateMilestoneDatesMutation.mutate({
        milestoneId: editingItem.id,
        dueDate: editingItem.dueDate,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A882]"></div>
      </div>
    );
  }

  if (!timelineData || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Calendar className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-serif text-gray-600 mb-2">
          Nenhuma fase ou marco encontrado
        </h3>
        <p className="text-sm text-gray-500">
          Adicione fases e marcos ao projeto para visualizar a timeline
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-lg border border-gray-200 flex-wrap">
        {/* View Mode */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs md:text-sm font-medium text-gray-700">Vista:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode(ViewMode.Day)}
              className={`px-3 py-1.5 text-xs rounded ${
                viewMode === ViewMode.Day
                  ? "bg-[#C9A882] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode(ViewMode.Week)}
              className={`px-3 py-1.5 text-xs rounded ${
                viewMode === ViewMode.Week
                  ? "bg-[#C9A882] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode(ViewMode.Month)}
              className={`px-3 py-1.5 text-xs rounded ${
                viewMode === ViewMode.Month
                  ? "bg-[#C9A882] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Mês
            </button>
          </div>
        </div>

        {/* Critical Path Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCriticalPath}
            onChange={(e) => setShowCriticalPath(e.target.checked)}
            className="w-4 h-4 text-[#C9A882] border-gray-300 rounded focus:ring-[#C9A882]"
          />
          <span className="text-xs md:text-sm text-gray-700">Caminho Crítico</span>
        </label>

        {/* View Toggle */}
        <button
          onClick={() => setShowGantt(!showGantt)}
          className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 whitespace-nowrap"
        >
          {showGantt ? (
            <>
              <List className="w-4 h-4" />
              Vista Lista
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4" />
              Vista Gantt
            </>
          )}
        </button>
      </div>

      {/* Gantt Chart or List View */}
      {showGantt ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto touch-pan-x">
          <Gantt
            tasks={tasks}
            viewMode={viewMode}
            onDateChange={handleTaskChange}
            onSelect={handleTaskSelect}
            onDoubleClick={handleTaskDoubleClick}
            locale="pt"
            listCellWidth="180px"
            columnWidth={viewMode === ViewMode.Month ? 50 : viewMode === ViewMode.Week ? 70 : 35}
            rowHeight={36}
            barCornerRadius={3}
            todayColor="rgba(201, 168, 130, 0.2)"
            arrowColor="#C9A882"
            arrowIndent={15}
            fontSize="11px"
            fontFamily="Inter, sans-serif"
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-serif text-gray-800 mb-4">
            Fases e Marcos (Vista Lista)
          </h3>
          <div className="space-y-4">
            {timelineData.phases.map((phase) => (
              <div key={phase.id} className="border-l-4 border-[#C9A882] pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">{phase.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded ${
                    phase.status === "completed" ? "bg-green-100 text-green-700" :
                    phase.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                    phase.status === "on_hold" ? "bg-orange-100 text-orange-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {phase.status === "completed" ? "Concluída" :
                     phase.status === "in_progress" ? "Em Andamento" :
                     phase.status === "on_hold" ? "Em Pausa" :
                     "Não Iniciada"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{phase.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    {phase.startDate ? new Date(phase.startDate).toLocaleDateString("pt-PT") : "N/A"} →{" "}
                    {phase.endDate ? new Date(phase.endDate).toLocaleDateString("pt-PT") : "N/A"}
                  </span>
                  <span>Progresso: {phase.progress}%</span>
                </div>

                {/* Milestones in this phase */}
                <div className="mt-3 ml-4 space-y-2">
                  {timelineData.milestones
                    .filter((m) => m.phaseId === phase.id)
                    .map((milestone) => (
                      <div key={milestone.id} className="flex items-center gap-3 text-sm">
                        <div className={`w-2 h-2 rounded-full ${
                          milestone.status === "completed" ? "bg-green-500" :
                          milestone.status === "overdue" ? "bg-red-500" :
                          "bg-gray-400"
                        }`} />
                        <span className="text-gray-700">{milestone.name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(milestone.dueDate).toLocaleDateString("pt-PT")}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Legenda</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6" }} />
            <span className="text-gray-600">Em Andamento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#10b981" }} />
            <span className="text-gray-600">Concluída</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#f59e0b" }} />
            <span className="text-gray-600">Em Pausa / Crítico</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ef4444" }} />
            <span className="text-gray-600">Atrasado</span>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.type === 'phase' ? 'Editar Datas da Fase' : 'Editar Data do Marco'}
            </DialogTitle>
            <DialogDescription>
              {editingItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingItem?.type === 'phase' ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={editingItem.startDate ? editingItem.startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      startDate: e.target.value ? new Date(e.target.value) : undefined,
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">Data de Fim</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={editingItem.endDate ? editingItem.endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      endDate: e.target.value ? new Date(e.target.value) : undefined,
                    })}
                  />
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Data de Entrega</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={editingItem?.dueDate ? editingItem.dueDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingItem(editingItem ? {
                    ...editingItem,
                    dueDate: e.target.value ? new Date(e.target.value) : undefined,
                  } : null)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={updatePhaseDatesMutation.isPending || updateMilestoneDatesMutation.isPending}
              className="bg-[#C9A882] hover:bg-[#C9A882]/90"
            >
              {updatePhaseDatesMutation.isPending || updateMilestoneDatesMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
