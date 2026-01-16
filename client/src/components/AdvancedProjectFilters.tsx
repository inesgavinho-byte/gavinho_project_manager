import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ChevronDown, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

// Brand colors GAVINHO
const BRAND_COLORS = {
  dark: '#7a7667',
  medium: '#8b8670',
  light: '#adaa96',
  cream: '#f2f0e7',
};

interface AdvancedFiltersProps {
  statuses: string[];
  priorities: string[];
  phases: string[];
  teamMembers: Array<{ id: string; name: string }>;
  onFiltersChange: (filters: FilterState) => void;
}

export interface FilterState {
  statuses: string[];
  priorities: string[];
  phases: string[];
  teamMembers: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  progressRange: {
    min: number;
    max: number;
  };
}

export function AdvancedProjectFilters({
  statuses,
  priorities,
  phases,
  teamMembers,
  onFiltersChange,
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    statuses: [],
    priorities: [],
    phases: [],
    teamMembers: [],
    dateRange: {},
    progressRange: { min: 0, max: 100 },
  });

  const [isOpen, setIsOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    
    const newFilters = { ...filters, statuses: newStatuses };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePriorityToggle = (priority: string) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority];
    
    const newFilters = { ...filters, priorities: newPriorities };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePhaseToggle = (phase: string) => {
    const newPhases = filters.phases.includes(phase)
      ? filters.phases.filter((p) => p !== phase)
      : [...filters.phases, phase];
    
    const newFilters = { ...filters, phases: newPhases };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleTeamMemberToggle = (memberId: string) => {
    const newMembers = filters.teamMembers.includes(memberId)
      ? filters.teamMembers.filter((m) => m !== memberId)
      : [...filters.teamMembers, memberId];
    
    const newFilters = { ...filters, teamMembers: newMembers };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    const newFilters = {
      ...filters,
      dateRange: { ...filters.dateRange, from: date },
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    const newFilters = {
      ...filters,
      dateRange: { ...filters.dateRange, to: date },
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleProgressChange = (min: number, max: number) => {
    const newFilters = {
      ...filters,
      progressRange: { min, max },
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const emptyFilters: FilterState = {
      statuses: [],
      priorities: [],
      phases: [],
      teamMembers: [],
      dateRange: {},
      progressRange: { min: 0, max: 100 },
    };
    setFilters(emptyFilters);
    setDateFrom(undefined);
    setDateTo(undefined);
    onFiltersChange(emptyFilters);
  };

  const activeFiltersCount =
    filters.statuses.length +
    filters.priorities.length +
    filters.phases.length +
    filters.teamMembers.length +
    (dateFrom || dateTo ? 1 : 0) +
    (filters.progressRange.min > 0 || filters.progressRange.max < 100 ? 1 : 0);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2"
          style={{
            borderColor: BRAND_COLORS.medium,
            color: BRAND_COLORS.dark,
          }}
        >
          <Filter className="w-4 h-4" />
          Filtros Avançados
          {activeFiltersCount > 0 && (
            <Badge
              style={{
                backgroundColor: BRAND_COLORS.medium,
                color: 'white',
              }}
            >
              {activeFiltersCount}
            </Badge>
          )}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-4" style={{ backgroundColor: BRAND_COLORS.cream }}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: BRAND_COLORS.dark }}>
              Filtros Avançados
            </h3>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Limpar Tudo
              </Button>
            )}
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="font-semibold" style={{ color: BRAND_COLORS.dark }}>
              Status
            </Label>
            <div className="space-y-2">
              {statuses.map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.statuses.includes(status)}
                    onCheckedChange={() => handleStatusToggle(status)}
                  />
                  <Label
                    htmlFor={`status-${status}`}
                    className="text-sm cursor-pointer"
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <Label className="font-semibold" style={{ color: BRAND_COLORS.dark }}>
              Prioridade
            </Label>
            <div className="space-y-2">
              {priorities.map((priority) => (
                <div key={priority} className="flex items-center gap-2">
                  <Checkbox
                    id={`priority-${priority}`}
                    checked={filters.priorities.includes(priority)}
                    onCheckedChange={() => handlePriorityToggle(priority)}
                  />
                  <Label
                    htmlFor={`priority-${priority}`}
                    className="text-sm cursor-pointer"
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Phase Filter */}
          <div className="space-y-2">
            <Label className="font-semibold" style={{ color: BRAND_COLORS.dark }}>
              Fase
            </Label>
            <div className="space-y-2">
              {phases.map((phase) => (
                <div key={phase} className="flex items-center gap-2">
                  <Checkbox
                    id={`phase-${phase}`}
                    checked={filters.phases.includes(phase)}
                    onCheckedChange={() => handlePhaseToggle(phase)}
                  />
                  <Label
                    htmlFor={`phase-${phase}`}
                    className="text-sm cursor-pointer"
                  >
                    {phase.charAt(0).toUpperCase() + phase.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Team Members Filter */}
          {teamMembers.length > 0 && (
            <div className="space-y-2">
              <Label className="font-semibold" style={{ color: BRAND_COLORS.dark }}>
                Membros da Equipa
              </Label>
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={filters.teamMembers.includes(member.id)}
                      onCheckedChange={() => handleTeamMemberToggle(member.id)}
                    />
                    <Label
                      htmlFor={`member-${member.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {member.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="font-semibold" style={{ color: BRAND_COLORS.dark }}>
              Intervalo de Datas
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: BRAND_COLORS.light,
                    }}
                  >
                    {dateFrom
                      ? format(dateFrom, 'dd/MM/yyyy', { locale: pt })
                      : 'De...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={handleDateFromChange}
                    locale={pt}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: BRAND_COLORS.light,
                    }}
                  >
                    {dateTo
                      ? format(dateTo, 'dd/MM/yyyy', { locale: pt })
                      : 'Até...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={handleDateToChange}
                    locale={pt}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Progress Range Filter */}
          <div className="space-y-2">
            <Label className="font-semibold" style={{ color: BRAND_COLORS.dark }}>
              Intervalo de Progresso
            </Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.progressRange.min}
                  onChange={(e) =>
                    handleProgressChange(
                      parseInt(e.target.value) || 0,
                      filters.progressRange.max
                    )
                  }
                  className="w-20 text-xs"
                />
                <span className="text-xs text-gray-600">a</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.progressRange.max}
                  onChange={(e) =>
                    handleProgressChange(
                      filters.progressRange.min,
                      parseInt(e.target.value) || 100
                    )
                  }
                  className="w-20 text-xs"
                />
                <span className="text-xs text-gray-600">%</span>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs font-semibold text-gray-600">
                Filtros Ativos:
              </Label>
              <div className="flex flex-wrap gap-1">
                {filters.statuses.map((status) => (
                  <Badge
                    key={`status-${status}`}
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer"
                    onClick={() => handleStatusToggle(status)}
                  >
                    {status}
                    <X className="w-3 h-3" />
                  </Badge>
                ))}
                {filters.priorities.map((priority) => (
                  <Badge
                    key={`priority-${priority}`}
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer"
                    onClick={() => handlePriorityToggle(priority)}
                  >
                    {priority}
                    <X className="w-3 h-3" />
                  </Badge>
                ))}
                {filters.phases.map((phase) => (
                  <Badge
                    key={`phase-${phase}`}
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer"
                    onClick={() => handlePhaseToggle(phase)}
                  >
                    {phase}
                    <X className="w-3 h-3" />
                  </Badge>
                ))}
                {dateFrom && (
                  <Badge
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer"
                    onClick={() => handleDateFromChange(undefined)}
                  >
                    De {format(dateFrom, 'dd/MM', { locale: pt })}
                    <X className="w-3 h-3" />
                  </Badge>
                )}
                {dateTo && (
                  <Badge
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer"
                    onClick={() => handleDateToChange(undefined)}
                  >
                    Até {format(dateTo, 'dd/MM', { locale: pt })}
                    <X className="w-3 h-3" />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
