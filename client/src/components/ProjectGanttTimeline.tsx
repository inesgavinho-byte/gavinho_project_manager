import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Phase {
  id: number;
  name: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  startDate: string;
  endDate: string;
  progress: number;
}

interface Milestone {
  id: number;
  name: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  phaseId?: number;
}

interface ProjectGanttTimelineProps {
  phases: Phase[];
  milestones?: Milestone[];
  projectStartDate?: string;
  projectEndDate?: string;
}

export function ProjectGanttTimeline({
  phases,
  milestones = [],
  projectStartDate,
  projectEndDate,
}: ProjectGanttTimelineProps) {
  // Calcular datas min/max
  const dateRange = useMemo(() => {
    const allDates = [
      projectStartDate,
      projectEndDate,
      ...phases.map(p => p.startDate),
      ...phases.map(p => p.endDate),
      ...milestones.map(m => m.dueDate),
    ].filter(Boolean);

    if (allDates.length === 0) {
      return {
        minDate: new Date(),
        maxDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      };
    }

    const dates = allDates.map(d => new Date(d));
    return {
      minDate: new Date(Math.min(...dates.map(d => d.getTime()))),
      maxDate: new Date(Math.max(...dates.map(d => d.getTime()))),
    };
  }, [phases, milestones, projectStartDate, projectEndDate]);

  // Calcular posição horizontal baseada em data
  const getPosition = (date: string) => {
    const d = new Date(date).getTime();
    const min = dateRange.minDate.getTime();
    const max = dateRange.maxDate.getTime();
    return ((d - min) / (max - min)) * 100;
  };

  // Calcular largura da barra
  const getWidth = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const min = dateRange.minDate.getTime();
    const max = dateRange.maxDate.getTime();
    return ((end - start) / (max - min)) * 100;
  };

  const statusColors: Record<string, string> = {
    planning: 'bg-blue-200',
    in_progress: 'bg-yellow-200',
    completed: 'bg-green-200',
    on_hold: 'bg-orange-200',
  };

  const statusBorderColors: Record<string, string> = {
    planning: 'border-blue-400',
    in_progress: 'border-yellow-400',
    completed: 'border-green-400',
    on_hold: 'border-orange-400',
  };

  const milestoneStatusColors: Record<string, string> = {
    pending: 'text-gray-500',
    completed: 'text-green-600',
    overdue: 'text-red-600',
  };

  const totalDays = Math.ceil(
    (dateRange.maxDate.getTime() - dateRange.minDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Timeline do Projeto (Gantt)</CardTitle>
          <CardDescription>
            Visualização de fases e marcos ({totalDays} dias)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timeline Header */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Months/Quarters Header */}
              <div className="flex h-8 bg-gray-50 border-b border-gray-200 mb-4">
                {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 text-xs text-gray-600 border-r border-gray-200 px-2 py-1"
                  >
                    {new Date(
                      dateRange.minDate.getTime() + i * 7 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString('pt-PT', { month: 'short', day: 'numeric' })}
                  </div>
                ))}
              </div>

              {/* Phases */}
              <div className="space-y-3">
                {phases.map((phase) => (
                  <div key={phase.id} className="flex items-center gap-4">
                    <div className="w-40 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-300" />
                        <span className="text-sm font-medium truncate">{phase.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-6">{phase.progress}%</p>
                    </div>

                    <div className="flex-1 relative h-8 bg-gray-50 border border-gray-200 rounded">
                      {/* Progress Bar */}
                      <div
                        className={`absolute h-full ${statusColors[phase.status]} ${statusBorderColors[phase.status]} border rounded transition-all`}
                        style={{
                          left: `${getPosition(phase.startDate)}%`,
                          width: `${getWidth(phase.startDate, phase.endDate)}%`,
                          opacity: 0.7,
                        }}
                      >
                        {/* Inner Progress */}
                        <div
                          className="h-full bg-opacity-100 rounded"
                          style={{
                            width: `${phase.progress}%`,
                            backgroundColor:
                              phase.status === 'completed'
                                ? '#10b981'
                                : phase.status === 'in_progress'
                                  ? '#f59e0b'
                                  : phase.status === 'on_hold'
                                    ? '#ef6f3c'
                                    : '#3b82f6',
                          }}
                        />
                      </div>

                      {/* Milestone Markers */}
                      {milestones
                        .filter(m => m.phaseId === phase.id)
                        .map(milestone => (
                          <div
                            key={milestone.id}
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 -translate-x-2"
                            style={{ left: `${getPosition(milestone.dueDate)}%` }}
                            title={milestone.name}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border-2 ${
                                milestone.status === 'completed'
                                  ? 'bg-green-500 border-green-600'
                                  : milestone.status === 'overdue'
                                    ? 'bg-red-500 border-red-600'
                                    : 'bg-white border-gray-400'
                              }`}
                            />
                          </div>
                        ))}
                    </div>

                    <div className="w-32 flex-shrink-0 text-right">
                      <p className="text-xs text-gray-600">
                        {new Date(phase.startDate).toLocaleDateString('pt-PT')} -{' '}
                        {new Date(phase.endDate).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Milestones without Phase */}
              {milestones.filter(m => !m.phaseId).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Marcos Gerais</h4>
                  {milestones
                    .filter(m => !m.phaseId)
                    .map(milestone => (
                      <div key={milestone.id} className="flex items-center gap-4">
                        <div className="w-40 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            {milestone.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : milestone.status === 'overdue' ? (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            ) : (
                              <Calendar className="w-4 h-4 text-gray-500" />
                            )}
                            <span className="text-sm font-medium truncate">{milestone.name}</span>
                          </div>
                        </div>

                        <div className="flex-1 relative h-6 bg-gray-50 border border-gray-200 rounded">
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 -translate-x-1.5 rounded-full"
                            style={{
                              left: `${getPosition(milestone.dueDate)}%`,
                              backgroundColor:
                                milestone.status === 'completed'
                                  ? '#10b981'
                                  : milestone.status === 'overdue'
                                    ? '#ef4444'
                                    : '#9ca3af',
                            }}
                          />
                        </div>

                        <div className="w-32 flex-shrink-0 text-right">
                          <p className="text-xs text-gray-600">
                            {new Date(milestone.dueDate).toLocaleDateString('pt-PT')}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-300 rounded border border-blue-400" />
              <span className="text-xs text-gray-600">Planejamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-300 rounded border border-yellow-400" />
              <span className="text-xs text-gray-600">Em Progresso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-300 rounded border border-green-400" />
              <span className="text-xs text-gray-600">Concluída</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-300 rounded border border-orange-400" />
              <span className="text-xs text-gray-600">Suspensa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-xs text-gray-600">Marco Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-xs text-gray-600">Marco Atrasado</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
