import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Edit2, Save, X } from 'lucide-react';

interface ProjectBriefingProps {
  projectId: number;
  project?: {
    id: number;
    name: string;
    description: string;
    briefing: string;
    objectives: string;
    restrictions: string;
    projectType: string;
    status: string;
    priority: string;
    clientName: string;
    location: string;
    area: number;
    startDate: string;
    endDate: string;
    budget: number;
    progress: number;
  };
  onUpdate?: (data: any) => void;
}

export function ProjectBriefing({ projectId, project, onUpdate }: ProjectBriefingProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(project || {});

  const handleSave = () => {
    onUpdate?.(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(project || {});
    setIsEditing(false);
  };

  const statusColors: Record<string, string> = {
    planning: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    on_hold: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-2xl">{project?.name || 'Novo Projeto'}</CardTitle>
            <CardDescription>{project?.description}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            {isEditing ? 'Cancelar' : 'Editar'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Badge className={statusColors[project?.status || 'planning']}>
              {project?.status || 'planning'}
            </Badge>
            <Badge className={priorityColors[project?.priority || 'medium']}>
              {project?.priority || 'medium'}
            </Badge>
            {project?.projectType && <Badge variant="secondary">{project.projectType}</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome do Projeto</label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do projeto"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo de Projeto</label>
                  <Input
                    value={formData.projectType || ''}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    placeholder="Ex: Residencial, Comercial"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cliente</label>
                  <Input
                    value={formData.clientName || ''}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Localização</label>
                  <Input
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Localização do projeto"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Área (m²)</label>
                  <Input
                    type="number"
                    value={formData.area || ''}
                    onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Orçamento (€)</label>
                  <Input
                    type="number"
                    value={formData.budget || ''}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição geral do projeto"
                  rows={3}
                />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tipo de Projeto</p>
                <p className="font-medium">{project?.projectType || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-medium">{project?.clientName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Localização</p>
                <p className="font-medium">{project?.location || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Área</p>
                <p className="font-medium">{project?.area ? `${project.area} m²` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Orçamento</p>
                <p className="font-medium">{project?.budget ? `€ ${project.budget.toLocaleString()}` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Progresso</p>
                <p className="font-medium">{project?.progress || 0}%</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Briefing */}
      <Card>
        <CardHeader>
          <CardTitle>Briefing do Projeto</CardTitle>
          <CardDescription>Descrição detalhada do projeto e contexto</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={formData.briefing || ''}
              onChange={(e) => setFormData({ ...formData, briefing: e.target.value })}
              placeholder="Briefing do projeto..."
              rows={6}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{project?.briefing || 'Sem briefing definido'}</p>
          )}
        </CardContent>
      </Card>

      {/* Objetivos */}
      <Card>
        <CardHeader>
          <CardTitle>Objetivos</CardTitle>
          <CardDescription>Metas e objetivos do projeto</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={formData.objectives || ''}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              placeholder="Objetivos do projeto..."
              rows={4}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{project?.objectives || 'Sem objetivos definidos'}</p>
          )}
        </CardContent>
      </Card>

      {/* Restrições */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Restrições e Limitações
          </CardTitle>
          <CardDescription>Limitações técnicas, legais ou de recursos</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={formData.restrictions || ''}
              onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
              placeholder="Restrições do projeto..."
              rows={4}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{project?.restrictions || 'Sem restrições definidas'}</p>
          )}
        </CardContent>
      </Card>

      {/* Datas */}
      <Card>
        <CardHeader>
          <CardTitle>Cronograma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data de Início</label>
                <Input
                  type="date"
                  value={formData.startDate?.split('T')[0] || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data de Fim</label>
                <Input
                  type="date"
                  value={formData.endDate?.split('T')[0] || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Data de Início</p>
                <p className="font-medium">{project?.startDate ? new Date(project.startDate).toLocaleDateString('pt-PT') : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data de Fim</p>
                <p className="font-medium">{project?.endDate ? new Date(project.endDate).toLocaleDateString('pt-PT') : '-'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      {isEditing && (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">
            <Save className="w-4 h-4 mr-2" />
            Guardar Alterações
          </Button>
        </div>
      )}
    </div>
  );
}
