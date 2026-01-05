import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Clock, User } from "lucide-react";

interface MqtItemHistoryModalProps {
  itemId: number;
  itemCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MqtItemHistoryModal({ itemId, itemCode, open, onOpenChange }: MqtItemHistoryModalProps) {
  const { data: history, isLoading } = trpc.constructions.items.getHistory.useQuery(
    { itemId },
    { enabled: open }
  );

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" style={{ backgroundColor: "#FAFAFA" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#5F5C59" }}>
            Histórico de Alterações - Item {itemCode}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: "#8B8581" }}>A carregar histórico...</p>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: "#8B8581" }}>Nenhuma alteração registada.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {history.map((entry, index) => {
                const oldVal = entry.oldValue ? parseFloat(entry.oldValue.toString()) : 0;
                const newVal = parseFloat(entry.newValue.toString());
                const diff = newVal - oldVal;
                const diffSign = diff > 0 ? '+' : '';
                const diffColor = diff > 0 ? '#10B981' : diff < 0 ? '#EF4444' : '#8B8581';

                return (
                  <div
                    key={entry.id}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: index === 0 ? "#EEEAE5" : "white",
                      borderColor: "#C3BAAF"
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4" style={{ color: "#C9A882" }} />
                          <span className="text-sm font-semibold" style={{ color: "#5F5C59" }}>
                            {formatDate(entry.changedAt)}
                          </span>
                          {index === 0 && (
                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={{ backgroundColor: "#C9A882", color: "white" }}
                            >
                              Mais recente
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span style={{ color: "#8B8581" }}>Valor anterior: </span>
                            <span className="font-semibold" style={{ color: "#5F5C59" }}>
                              {oldVal.toFixed(2)}
                            </span>
                          </div>
                          <span style={{ color: "#8B8581" }}>→</span>
                          <div>
                            <span style={{ color: "#8B8581" }}>Novo valor: </span>
                            <span className="font-semibold" style={{ color: "#5F5C59" }}>
                              {newVal.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span
                              className="text-xs font-semibold px-2 py-1 rounded"
                              style={{
                                backgroundColor: `${diffColor}20`,
                                color: diffColor
                              }}
                            >
                              {diffSign}{diff.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
