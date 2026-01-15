import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, GripVertical, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Phase {
  id: number;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  startDate: string;
  endDate: string;
  progress: number;
  order: number;
}

interface ProjectPhasesProps {
  projectId: number;
  phases?: Phase[];
  onAddPhase?: (phase: Omit<Phase, 'id'>) => void;
  onUpdatePhase?: (id: number, phase: Partial<Phase>) => void;
  onDeletePhase?: (id: number) => void;
  onReorderPhases?: (phases: Phase[]) => void;
}

export function ProjectPhases({
  projectId,
  phases = [],
  onAddPhase,
  onUpdatePhase,
  onDeletePhase,
  onReorderPhases,
}: ProjectPhasesProps) {
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<number | null>(null);
  const [draggedPhase, setDraggedPhase] = useState<number | null>(null);
  const [newPhase, setNewPhase] = useState<Omit<Phase, 'id'>>({
    name: '',
    description: '',
    status: 'planning',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: 0,
    order: phases.length,
  });

  const handleAddPhase = () => {
    if (newPhase.name.trim()) {
      onAddPhase?.(newPhase);
      setNewPhase({
        name: '',
        description: '',
        status: 'planning',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        progress: 0,
        order: phases.length,
      });
      setIsAddingPhase(false);
    }
  };

  const handleDragStart = (phaseId: number) => {
    setDraggedPhase(phaseId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetPhaseId: number) => {
    if (draggedPhase && draggedPhase !== targetPhaseId) {
      const draggedIndex = phases.findIndex(p => p.id === draggedPhase);
      const targetIndex = phases.findIndex(p => p.id === targetPhaseId);

      const newPhases = [...phases];
      const [draggedItem] = newPhases.splice(draggedIndex, 1);
      newPhases.splice(targetIndex, 0, draggedItem);

      // Atualizar ordem
      const reorderedPhases = newPhases.map((p, idx) => ({ ...p, order: idx }));
      onReorderPhases?.(reorderedPhases);
    }
    setDraggedPhase(null);
  };

  const statusIcons: Record<string, React.ReactNode> = {
    planning: <Clock className="w-4 h-4 text-blue-500" />,
    in_progress: <Clock className="w-4 h-4 text-yellow-500" />,
    completed: <CheckCircle className="w-4 h-4 text-green-500" />,
    on_hold: <AlertCircle className="w-4 h-4 text-orange-500" />,
  };

  const statusColors: Record<string, string> = {
    planning: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    on_hold: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Fases do Projeto</CardTitle>
            <CardDescription>Gerencie as fases do projeto com drag-and-drop</CardDescription>
          </div>
          <Button
            onClick={() => setIsAddingPhase(!isAddingPhase)}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Fase
          </Button>
        </CardHeader>
      </Card>

      {/* Adicionar Nova Fase */}
      {isAddingPhase && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-lg">Nova Fase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Fase</label>
              <Input
                value={newPhase.name}
                onChange={(e) => setNewPhase({ ...newPhase, name: e.target.value })}
                placeholder="Ex: Projeto, Execução, Acabamentos"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={newPhase.description}
                onChange={(e) => setNewPhase({ ...newPhase, description: e.target.value })}
                placeholder="Descrição da fase..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data de Início</label>
                <Input
                  type="date"
                  value={newPhase.startDate}
                  onChange={(e) => setNewPhase({ ...newPhase, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data de Fim</label>
                <Input
                  type="date"
                  value={newPhase.endDate}
                  onChange={(e) => setNewPhase({ ...newPhase, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsAddingPhase(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddPhase} className="bg-amber-600 hover:bg-amber-700">
                Criar Fase
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Fases */}
      <div className="space-y-3">
        {phases.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <p>Nenhuma fase definida. Clique em "Nova Fase" para começar.</p>
            </CardContent>
          </Card>
        ) : (
          phases.map((phase) => (
            <Card
              key={phase.id}
              draggable
              onDragStart={() => handleDragStart(phase.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(phase.id)}
              className={`cursor-move transition-all ${draggedPhase === phase.id ? 'opacity-50' : ''}`}
            >
              <CardContent className="pt-6">
                {editingPhaseId === phase.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Nome</label>
                        <Input
                          value={phase.name}
                          onChange={(e) => onUpdatePhase?.(phase.id, { name: e.target.value })}
                          placeholder="Nome da fase"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <Select
                          value={phase.status}
                          onValueChange={(value) =>
                            onUpdatePhase?.(phase.id, { status: value as Phase['status'] })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planning">Planejamento</SelectItem>
                            <SelectItem value="in_progress">Em Progresso</SelectItem>
                            <SelectItem value="completed">Concluída</SelectItem>
                            <SelectItem value="on_hold">Suspensa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Descrição</label>
                      <Textarea
                        value={phase.description}
                        onChange={(e) => onUpdatePhase?.(phase.id, { description: e.target.value })}
                        placeholder="Descrição da fase..."
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Data de Início</label>
                        <Input
                          type="date"
                          value={phase.startDate}
                          onChange={(e) => onUpdatePhase?.(phase.id, { startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Data de Fim</label>
                        <Input
                          type="date"
                          value={phase.endDate}
                          onChange={(e) => onUpdatePhase?.(phase.id, { endDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Progresso (%)</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={phase.progress}
                          onChange={(e) =>
                            onUpdatePhase?.(phase.id, { progress: parseInt(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setEditingPhaseId(null)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => setEditingPhaseId(null)} className="bg-amber-600 hover:bg-amber-700">
                        Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <GripVertical className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {statusIcons[phase.status]}
                          <h3 className="font-semibold text-lg">{phase.name}</h3>
                          <Badge className={statusColors[phase.status]}>
                            {phase.status === 'planning' && 'Planejamento'}
                            {phase.status === 'in_progress' && 'Em Progresso'}
                            {phase.status === 'completed' && 'Concluída'}
                            {phase.status === 'on_hold' && 'Suspensa'}
                          </Badge>
                        </div>
                        {phase.description && (
                          <p className="text-sm text-gray-600 mb-3">{phase.description}</p>
                        )}
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Início</p>
                            <p className="font-medium">
                              {new Date(phase.startDate).toLocaleDateString('pt-PT')}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Fim</p>
                            <p className="font-medium">
                              {new Date(phase.endDate).toLocaleDateString('pt-PT')}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Progresso</p>
                            <p className="font-medium">{phase.progress}%</p>
                          </div>
                          <div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-amber-600 h-2 rounded-full transition-all"
                                style={{ width: `${phase.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPhaseId(phase.id)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeletePhase?.(phase.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
