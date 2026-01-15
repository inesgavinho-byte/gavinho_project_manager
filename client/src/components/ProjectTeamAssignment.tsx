import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  id: number;
  name: string;
  role: string;
}

interface PhaseAssignment {
  id: number;
  phaseId: number;
  phaseName: string;
  memberId: number;
  memberName: string;
  hoursAllocated: number;
  hoursSpent: number;
}

interface ProjectTeamAssignmentProps {
  projectId: number;
  phases?: Array<{ id: number; name: string }>;
  teamMembers?: TeamMember[];
  assignments?: PhaseAssignment[];
  onAddAssignment?: (assignment: Omit<PhaseAssignment, 'id'>) => void;
  onDeleteAssignment?: (id: number) => void;
}

export function ProjectTeamAssignment({
  projectId,
  phases = [],
  teamMembers = [],
  assignments = [],
  onAddAssignment,
  onDeleteAssignment,
}: ProjectTeamAssignmentProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    phaseId: phases[0]?.id || 0,
    phaseName: phases[0]?.name || '',
    memberId: teamMembers[0]?.id || 0,
    memberName: teamMembers[0]?.name || '',
    hoursAllocated: 40,
    hoursSpent: 0,
  });

  const handleAdd = () => {
    if (newAssignment.memberId && newAssignment.phaseId) {
      onAddAssignment?.(newAssignment);
      setNewAssignment({
        phaseId: phases[0]?.id || 0,
        phaseName: phases[0]?.name || '',
        memberId: teamMembers[0]?.id || 0,
        memberName: teamMembers[0]?.name || '',
        hoursAllocated: 40,
        hoursSpent: 0,
      });
      setIsAdding(false);
      toast.success('Atribuição adicionada!');
    }
  };

  const memberHours = teamMembers.map(member => {
    const memberAssignments = assignments.filter(a => a.memberId === member.id);
    const totalHours = memberAssignments.reduce((sum, a) => sum + a.hoursAllocated, 0);
    const spentHours = memberAssignments.reduce((sum, a) => sum + a.hoursSpent, 0);
    return { member, totalHours, spentHours, utilization: totalHours > 0 ? (spentHours / totalHours) * 100 : 0 };
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Resumo da Equipa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberHours.map(({ member, totalHours, spentHours, utilization }) => (
              <Card key={member.id} className="border-amber-200">
                <CardContent className="pt-4">
                  <p className="font-semibold text-sm">{member.name}</p>
                  <p className="text-xs text-gray-600 mb-2">{member.role}</p>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Horas: {spentHours}h / {totalHours}h</span>
                      <span>{Math.round(utilization)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded h-2">
                      <div
                        className="bg-amber-600 h-2 rounded transition-all"
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Atribuições por Fase</CardTitle>
            <CardDescription>Gerencie membros por fase</CardDescription>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Atribuição
          </Button>
        </CardHeader>
      </Card>

      {isAdding && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 space-y-3">
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={newAssignment.phaseId}
              onChange={(e) => {
                const phase = phases.find(p => p.id === parseInt(e.target.value));
                setNewAssignment({
                  ...newAssignment,
                  phaseId: parseInt(e.target.value),
                  phaseName: phase?.name || '',
                });
              }}
            >
              {phases.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={newAssignment.memberId}
              onChange={(e) => {
                const member = teamMembers.find(m => m.id === parseInt(e.target.value));
                setNewAssignment({
                  ...newAssignment,
                  memberId: parseInt(e.target.value),
                  memberName: member?.name || '',
                });
              }}
            >
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Horas alocadas"
              value={newAssignment.hoursAllocated}
              onChange={(e) =>
                setNewAssignment({ ...newAssignment, hoursAllocated: parseInt(e.target.value) })
              }
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
        {phases.map(phase => (
          <Card key={phase.id}>
            <CardHeader>
              <CardTitle className="text-base">{phase.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.filter(a => a.phaseId === phase.id).length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum membro atribuído</p>
              ) : (
                <div className="space-y-2">
                  {assignments
                    .filter(a => a.phaseId === phase.id)
                    .map(assignment => (
                      <div key={assignment.id} className="flex items-center justify-between border rounded p-3">
                        <div>
                          <p className="font-semibold text-sm">{assignment.memberName}</p>
                          <p className="text-xs text-gray-600">
                            {assignment.hoursSpent}h / {assignment.hoursAllocated}h
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteAssignment?.(assignment.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
