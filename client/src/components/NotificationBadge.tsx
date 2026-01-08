import { Badge } from "./ui/badge";
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Bell,
  Clock,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType = 
  | "ai_alert" 
  | "deadline_warning" 
  | "budget_exceeded" 
  | "project_delayed" 
  | "task_overdue" 
  | "order_pending" 
  | "system";

type NotificationPriority = "low" | "medium" | "high" | "critical";

interface NotificationBadgeProps {
  type: NotificationType;
  priority: NotificationPriority;
  showIcon?: boolean;
  className?: string;
}

const priorityConfig = {
  low: {
    color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    label: "Baixa",
  },
  medium: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
    label: "Média",
  },
  high: {
    color: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    label: "Alta",
  },
  critical: {
    color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    label: "Crítica",
  },
};

const typeConfig: Record<NotificationType, { icon: React.ElementType; label: string }> = {
  ai_alert: {
    icon: AlertCircle,
    label: "Alerta IA",
  },
  deadline_warning: {
    icon: Clock,
    label: "Aviso de Prazo",
  },
  budget_exceeded: {
    icon: DollarSign,
    label: "Orçamento Excedido",
  },
  project_delayed: {
    icon: TrendingDown,
    label: "Projeto Atrasado",
  },
  task_overdue: {
    icon: AlertTriangle,
    label: "Tarefa Atrasada",
  },
  order_pending: {
    icon: Package,
    label: "Pedido Pendente",
  },
  system: {
    icon: Bell,
    label: "Sistema",
  },
};

export function NotificationBadge({ 
  type, 
  priority, 
  showIcon = true, 
  className 
}: NotificationBadgeProps) {
  const priorityStyle = priorityConfig[priority];
  const typeInfo = typeConfig[type];
  const Icon = typeInfo.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1.5 font-medium border",
        priorityStyle.color,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      <span>{typeInfo.label}</span>
      <span className="text-xs opacity-70">({priorityStyle.label})</span>
    </Badge>
  );
}

interface NotificationPriorityIconProps {
  priority: NotificationPriority;
  className?: string;
}

export function NotificationPriorityIcon({ priority, className }: NotificationPriorityIconProps) {
  const icons = {
    low: Info,
    medium: Bell,
    high: AlertTriangle,
    critical: AlertCircle,
  };

  const colors = {
    low: "text-blue-500",
    medium: "text-yellow-500",
    high: "text-orange-500",
    critical: "text-red-500",
  };

  const Icon = icons[priority];

  return <Icon className={cn("h-5 w-5", colors[priority], className)} />;
}
