import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Clock, CheckCircle, AlertCircle, User } from "lucide-react";

interface StatusHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renderId: number;
  renderName: string;
}

const statusConfig = {
  pending: {
    label: "Pendente",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    icon: Clock,
  },
  approved_dc: {
    label: "Aprovada DC",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    icon: CheckCircle,
  },
  approved_client: {
    label: "Aprovada DC + Cliente",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
    icon: CheckCircle,
  },
};

export function StatusHistoryModal({
  open,
  onOpenChange,
  renderId,
  renderName,
}: StatusHistoryModalProps) {
  const { data: history, isLoading } = trpc.archviz.getStatusHistory.useQuery(
    { renderId },
    { enabled: open }
  );

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Histórico de Aprovações
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{renderName}</p>
        </DialogHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum histórico de mudanças disponível</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>

              <div className="space-y-6">
                {history.map((entry, index) => {
                  const config = statusConfig[entry.newStatus];
                  const Icon = config.icon;
                  const oldConfig = entry.oldStatus
                    ? statusConfig[entry.oldStatus]
                    : null;

                  return (
                    <div key={entry.id} className="relative flex gap-4">
                      {/* Timeline dot */}
                      <div
                        className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full ${config.bg} flex items-center justify-center`}
                      >
                        <Icon className={`w-6 h-6 ${config.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <div className="bg-card border rounded-lg p-4 shadow-sm">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {oldConfig && (
                                  <>
                                    <span
                                      className={`text-sm font-medium ${oldConfig.color}`}
                                    >
                                      {oldConfig.label}
                                    </span>
                                    <span className="text-muted-foreground">→</span>
                                  </>
                                )}
                                <span
                                  className={`text-sm font-semibold ${config.color}`}
                                >
                                  {config.label}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="w-3.5 h-3.5" />
                                <span>
                                  {entry.changedByName || entry.changedByEmail || "Utilizador"}
                                </span>
                              </div>
                            </div>

                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(entry.createdAt)}
                            </div>
                          </div>

                          {/* Notes */}
                          {entry.notes && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm text-foreground">{entry.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
