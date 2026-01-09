import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, TrendingUp, HardHat } from "lucide-react";

// ============================================
// TIPOS
// ============================================

export type ConstructionCardVariant = 'default' | 'compact' | 'detailed';

export interface ConstructionCardProps {
  id: number;
  code: string;
  name: string;
  projectName?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  progress: number;
  status: string;
  priority: string;
  budget?: string | null;
  href?: string;
  onClick?: () => void;
  variant?: ConstructionCardVariant;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    low: "priority-baixa",
    medium: "priority-media",
    high: "priority-alta",
    urgent: "priority-urgente",
  };
  return colors[priority] || "priority-media";
};

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    urgent: "Urgente",
  };
  return labels[priority] || priority;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    planning: "bg-[#C9A882]/10 text-[#C9A882] border-[#C9A882]/20",
    in_progress: "bg-[#C3BAAF]/10 text-[#5F5C59] border-[#C3BAAF]/20",
    on_hold: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };
  return colors[status] || "bg-gray-50 text-gray-700 border-gray-200";
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    planning: "Planeamento",
    in_progress: "Em Andamento",
    on_hold: "Em Espera",
    completed: "Concluído",
    cancelled: "Cancelado",
  };
  return labels[status] || status;
};

const formatBudget = (budget: string | null | undefined): string | null => {
  if (!budget) return null;
  const value = parseFloat(budget);
  if (isNaN(value)) return null;
  return `€${value.toLocaleString('pt-PT')}`;
};

const formatDate = (date: string | null | undefined): string | null => {
  if (!date) return null;
  try {
    return new Date(date).toLocaleDateString('pt-PT');
  } catch {
    return null;
  }
};

// ============================================
// COMPONENTE: ConstructionCard
// ============================================

export default function ConstructionCard({
  id,
  code,
  name,
  projectName,
  location,
  startDate,
  endDate,
  progress,
  status,
  priority,
  budget,
  href,
  onClick,
  variant = 'default',
}: ConstructionCardProps) {
  const cardHref = href || `/constructions/${id}`;
  const formattedBudget = formatBudget(budget);
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  // Renderização condicional baseada na variante
  const CardContent = () => {
    // Variante COMPACT: apenas código, nome e prioridade
    if (variant === 'compact') {
      return (
        <Card className="gavinho-project-card group" style={{ padding: '10px' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1">
              <HardHat className="w-4 h-4 text-[#8B8670]" />
              <div>
                <h4 className="gavinho-text-code mb-0">{code}</h4>
                {projectName && (
                  <p className="gavinho-text-client mt-1">{projectName}</p>
                )}
              </div>
            </div>
            <span className={getPriorityColor(priority)} style={{ fontSize: '8px', padding: '2px 6px' }}>
              {getPriorityLabel(priority)}
            </span>
          </div>
        </Card>
      );
    }

    // Variante DETAILED: todos os campos incluindo descrição expandida
    if (variant === 'detailed') {
      return (
        <Card className="gavinho-project-card group">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <HardHat className="w-4 h-4 text-[#8B8670]" />
                <h3 className="gavinho-text-code mb-0">{code}</h3>
              </div>
              <p className="text-sm font-medium text-[#3D3D3D] mt-1">{name}</p>
              {projectName && (
                <p className="gavinho-text-client mt-2">Projeto: {projectName}</p>
              )}
            </div>
            <span className={getPriorityColor(priority)}>
              {getPriorityLabel(priority)}
            </span>
          </div>

          {/* Info */}
          <div className="space-y-2 mb-4">
            {location && (
              <div className="flex items-center gap-2 text-sm text-[#5F5C59]/60">
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
              </div>
            )}
            {formattedStartDate && (
              <div className="flex items-center gap-2 text-sm text-[#5F5C59]/60">
                <Calendar className="w-4 h-4" />
                <span>
                  {formattedStartDate}
                  {formattedEndDate && ` - ${formattedEndDate}`}
                </span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[#5F5C59]/60">Progresso</span>
              <span className="font-medium text-[#5F5C59]">{progress}%</span>
            </div>
            <div className="gavinho-progress-bar">
              <div
                className="gavinho-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[#C3BAAF]/10">
            <Badge className={`${getStatusColor(status)} border`}>
              {getStatusLabel(status)}
            </Badge>
            {formattedBudget && (
              <div className="flex items-center gap-1 text-sm text-[#5F5C59]/60">
                <TrendingUp className="w-4 h-4" />
                <span>{formattedBudget}</span>
              </div>
            )}
          </div>
        </Card>
      );
    }

    // Variante DEFAULT: layout padrão
    return (
      <Card className="gavinho-project-card group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <HardHat className="w-4 h-4 text-[#8B8670]" />
              <h3 className="gavinho-text-code mb-0">{code}</h3>
            </div>
            <p className="text-sm font-medium text-[#3D3D3D] mt-1">{name}</p>
            {projectName && (
              <p className="gavinho-text-client mt-2">Projeto: {projectName}</p>
            )}
          </div>
          <span className={getPriorityColor(priority)}>
            {getPriorityLabel(priority)}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-2 mb-4">
          {location && (
            <div className="flex items-center gap-2 text-sm text-[#5F5C59]/60">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          )}
          {formattedStartDate && (
            <div className="flex items-center gap-2 text-sm text-[#5F5C59]/60">
              <Calendar className="w-4 h-4" />
              <span>
                {formattedStartDate}
                {formattedEndDate && ` - ${formattedEndDate}`}
              </span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[#5F5C59]/60">Progresso</span>
            <span className="font-medium text-[#5F5C59]">{progress}%</span>
          </div>
          <div className="gavinho-progress-bar">
            <div
              className="gavinho-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#C3BAAF]/10">
          <Badge className={`${getStatusColor(status)} border`}>
            {getStatusLabel(status)}
          </Badge>
          {formattedBudget && (
            <div className="flex items-center gap-1 text-sm text-[#5F5C59]/60">
              <TrendingUp className="w-4 h-4" />
              <span>{formattedBudget}</span>
            </div>
          )}
        </div>
      </Card>
    );
  };

  // Se onClick for fornecido, usar div com onClick
  if (onClick) {
    return (
      <div onClick={onClick} style={{ cursor: 'pointer' }}>
        <CardContent />
      </div>
    );
  }

  // Caso contrário, usar Link
  return (
    <Link href={cardHref}>
      <CardContent />
    </Link>
  );
}
