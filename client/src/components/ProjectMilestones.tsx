import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Milestone {
  id: number;
  name: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface ProjectMilestonesProps {
  projectId: number;
  milestones?: Milestone[];
  onAddMilestone?: (milestone: Omit<Milestone, 'id'>) => void;
  onDeleteMilestone?: (id: number) => void;
}

export function ProjectMilestones({
  projectId,
  milestones = [],
  onAddMilestone,
  onDeleteMilestone,
}: ProjectMilestonesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'pending' as const,
    priority: 'medium' as const,
  });

  const handleAdd = () => {
    if (newMilestone.name.trim()) {
      onAddMilestone?.(newMilestone);
      setNewMilestone({
        name: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        priority: 'medium',
      });
      setIsAdding(false);
      toast.success('Marco adicionado!');
    }
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-4 h-4 text-gray-500" />,
    completed: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    overdue: <AlertCircle className="w-4 h-4 text-red-600" />,
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    completed: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  const overdueMilestones = milestones.filter(m => m.status === 'overdue');

  return (
    <div className="space-y-4">
      {overdueMilestones.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">{overdueMilestones.length} marco(s) atrasado(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Marcos do Projeto</CardTitle>
            <CardDescription>Gerencie datas importantes</CardDescription>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Marco
          </Button>
        </CardHeader>
      </Card>

      {isAdding && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 space-y-4">
            <Input
              placeholder="Nome do marco"
              value={newMilestone.name}
              onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
            />
            <Input
              type="date"
              value={newMilestone.dueDate}
              onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} className="bg-amber-600 hover:bg-amber-700">
                Criar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {milestones.map((milestone) => (
          <Card key={milestone.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusIcons[milestone.status]}
                  <div>
                    <p className="font-semibold">{milestone.name}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(milestone.dueDate).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[milestone.status]}>
                    {milestone.status === 'pending' ? 'Pendente' : milestone.status === 'completed' ? 'Concluído' : 'Atrasado'}
                  </Badge>
                  <Badge className={priorityColors[milestone.priority]}>
                    {milestone.priority === 'low' ? 'Baixa' : milestone.priority === 'medium' ? 'Média' : milestone.priority === 'high' ? 'Alta' : 'Crítica'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteMilestone?.(milestone.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
