import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, Clock, Mail, Trash2, Edit2, Play, Pause } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface ReportScheduleFormProps {
  projectId: number;
  onScheduleCreated?: () => void;
}

export function ReportScheduler({ projectId, onScheduleCreated }: ReportScheduleFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: '09:00',
    recipients: [''],
    includeMetrics: true,
    includeTrends: true,
    includeAlerts: true,
    includeInsights: true,
  });

  const { data: schedules, refetch: refetchSchedules } = trpc.reportScheduler.listSchedules.useQuery(
    { projectId },
    { enabled: true }
  );

  const createScheduleMutation = trpc.reportScheduler.createSchedule.useMutation({
    onSuccess: () => {
      toast.success('Agendamento criado com sucesso!');
      resetForm();
      setIsOpen(false);
      refetchSchedules();
      onScheduleCreated?.();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const updateScheduleMutation = trpc.reportScheduler.updateSchedule.useMutation({
    onSuccess: () => {
      toast.success('Agendamento atualizado com sucesso!');
      resetForm();
      setIsOpen(false);
      refetchSchedules();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteScheduleMutation = trpc.reportScheduler.deleteSchedule.useMutation({
    onSuccess: () => {
      toast.success('Agendamento deletado com sucesso!');
      refetchSchedules();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const toggleScheduleMutation = trpc.reportScheduler.toggleSchedule.useMutation({
    onSuccess: () => {
      refetchSchedules();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const { data: history } = trpc.reportScheduler.getScheduleHistory.useQuery(
    { reportId: editingId || 0, limit: 5 },
    { enabled: !!editingId }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      frequency: 'daily',
      dayOfWeek: 1,
      dayOfMonth: 1,
      time: '09:00',
      recipients: [''],
      includeMetrics: true,
      includeTrends: true,
      includeAlerts: true,
      includeInsights: true,
    });
    setEditingId(null);
  };

  const handleAddRecipient = () => {
    setFormData({
      ...formData,
      recipients: [...formData.recipients, ''],
    });
  };

  const handleRemoveRecipient = (index: number) => {
    setFormData({
      ...formData,
      recipients: formData.recipients.filter((_, i) => i !== index),
    });
  };

  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...formData.recipients];
    newRecipients[index] = value;
    setFormData({
      ...formData,
      recipients: newRecipients,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validRecipients = formData.recipients.filter(r => r.trim() !== '');
    if (validRecipients.length === 0) {
      toast.error('Adicione pelo menos um destinatário');
      return;
    }

    if (editingId) {
      updateScheduleMutation.mutate({
        reportId: editingId,
        ...formData,
        recipients: validRecipients,
      });
    } else {
      createScheduleMutation.mutate({
        projectId,
        ...formData,
        recipients: validRecipients,
      });
    }
  };

  const handleEdit = (schedule: any) => {
    setFormData({
      name: schedule.name,
      description: schedule.description || '',
      frequency: schedule.frequency,
      dayOfWeek: schedule.dayOfWeek || 1,
      dayOfMonth: schedule.dayOfMonth || 1,
      time: schedule.time,
      recipients: schedule.recipients || [''],
      includeMetrics: schedule.includeMetrics === 1,
      includeTrends: schedule.includeTrends === 1,
      includeAlerts: schedule.includeAlerts === 1,
      includeInsights: schedule.includeInsights === 1,
    });
    setEditingId(schedule.id);
    setIsOpen(true);
  };

  const frequencyLabels = {
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
    custom: 'Personalizado',
  };

  const dayOfWeekLabels = {
    0: 'Domingo',
    1: 'Segunda-feira',
    2: 'Terça-feira',
    3: 'Quarta-feira',
    4: 'Quinta-feira',
    5: 'Sexta-feira',
    6: 'Sábado',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Agendamento de Relatórios</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure relatórios automáticos para serem enviados em horários específicos
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>+ Novo Agendamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Agendamento' : 'Criar Novo Agendamento'}
              </DialogTitle>
              <DialogDescription>
                Configure um novo relatório automático para ser enviado regularmente
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Informações Básicas</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Relatório *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Relatório Diário de Progresso"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequência *</Label>
                    <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                      <SelectTrigger id="frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição opcional do relatório"
                  />
                </div>
              </div>

              {/* Agendamento */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Agendamento</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>

                  {formData.frequency === 'weekly' && (
                    <div className="space-y-2">
                      <Label htmlFor="dayOfWeek">Dia da Semana</Label>
                      <Select value={String(formData.dayOfWeek)} onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}>
                        <SelectTrigger id="dayOfWeek">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(dayOfWeekLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.frequency === 'monthly' && (
                    <div className="space-y-2">
                      <Label htmlFor="dayOfMonth">Dia do Mês</Label>
                      <Input
                        id="dayOfMonth"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.dayOfMonth}
                        onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Destinatários */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Destinatários *</h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddRecipient}>
                    + Adicionar
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.recipients.map((recipient, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="email"
                        value={recipient}
                        onChange={(e) => handleRecipientChange(index, e.target.value)}
                        placeholder="email@example.com"
                      />
                      {formData.recipients.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRecipient(index)}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Conteúdo do Relatório */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Conteúdo do Relatório</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <Label htmlFor="includeMetrics" className="cursor-pointer">Incluir Métricas</Label>
                    <Switch
                      id="includeMetrics"
                      checked={formData.includeMetrics}
                      onCheckedChange={(checked) => setFormData({ ...formData, includeMetrics: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <Label htmlFor="includeTrends" className="cursor-pointer">Incluir Tendências</Label>
                    <Switch
                      id="includeTrends"
                      checked={formData.includeTrends}
                      onCheckedChange={(checked) => setFormData({ ...formData, includeTrends: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <Label htmlFor="includeAlerts" className="cursor-pointer">Incluir Alertas</Label>
                    <Switch
                      id="includeAlerts"
                      checked={formData.includeAlerts}
                      onCheckedChange={(checked) => setFormData({ ...formData, includeAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <Label htmlFor="includeInsights" className="cursor-pointer">Incluir Insights</Label>
                    <Switch
                      id="includeInsights"
                      checked={formData.includeInsights}
                      onCheckedChange={(checked) => setFormData({ ...formData, includeInsights: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
                >
                  {editingId ? 'Atualizar' : 'Criar'} Agendamento
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Agendamentos */}
      <div className="grid gap-4">
        {!schedules || schedules.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum agendamento criado ainda</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Crie um novo agendamento para começar a enviar relatórios automáticos
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          schedules.map((schedule) => (
            <Card key={schedule.id} className={!schedule.isActive ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{schedule.name}</CardTitle>
                    {schedule.description && (
                      <CardDescription>{schedule.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleScheduleMutation.mutate({ reportId: schedule.id, isActive: !schedule.isActive })}
                    >
                      {schedule.isActive ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(schedule)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja deletar este agendamento?')) {
                          deleteScheduleMutation.mutate({ reportId: schedule.id });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Informações de Agendamento */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Frequência</p>
                    <p className="font-semibold">{frequencyLabels[schedule.frequency as keyof typeof frequencyLabels]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-semibold">{schedule.time}</p>
                  </div>
                  {schedule.frequency === 'weekly' && (
                    <div>
                      <p className="text-sm text-muted-foreground">Dia da Semana</p>
                      <p className="font-semibold">{dayOfWeekLabels[schedule.dayOfWeek as keyof typeof dayOfWeekLabels]}</p>
                    </div>
                  )}
                  {schedule.frequency === 'monthly' && (
                    <div>
                      <p className="text-sm text-muted-foreground">Dia do Mês</p>
                      <p className="font-semibold">Dia {schedule.dayOfMonth}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold">
                      {schedule.isActive ? (
                        <span className="text-green-600">Ativo</span>
                      ) : (
                        <span className="text-muted-foreground">Inativo</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Destinatários */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Destinatários</p>
                  <div className="flex flex-wrap gap-2">
                    {schedule.recipients.map((email, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-sm">
                        <Mail className="w-3 h-3" />
                        {email}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Último Envio */}
                {schedule.lastSentAt && (
                  <div className="text-xs text-muted-foreground">
                    Último envio: {new Date(schedule.lastSentAt).toLocaleString('pt-PT')}
                  </div>
                )}

                {/* Próximo Envio */}
                {schedule.nextSendAt && schedule.isActive && (
                  <div className="text-xs text-muted-foreground">
                    Próximo envio: {new Date(schedule.nextSendAt).toLocaleString('pt-PT')}
                  </div>
                )}

                {/* Histórico */}
                {editingId === schedule.id && history && history.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-semibold mb-2">Últimos Envios</p>
                    <div className="space-y-2">
                      {history.map((log, index) => (
                        <div key={index} className="text-xs text-muted-foreground flex items-center justify-between">
                          <span>{new Date(log.sentAt).toLocaleString('pt-PT')}</span>
                          <span className={log.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                            {log.status === 'success' ? '✓ Enviado' : '✗ Falha'}
                          </span>
                        </div>
                      ))}
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
