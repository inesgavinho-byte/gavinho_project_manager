import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Clock, User, FileSpreadsheet, Sheet, CheckCircle, XCircle, AlertTriangle, RotateCcw } from "lucide-react";

interface MQTImportHistoryProps {
  constructionId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MQTImportHistory({ constructionId, open, onOpenChange }: MQTImportHistoryProps) {
  const [revertingId, setRevertingId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: history, isLoading } = trpc.mqt.getImportHistory.useQuery(
    { constructionId },
    { enabled: open }
  );

  const revertMutation = trpc.mqt.revertImport.useMutation({
    onSuccess: () => {
      utils.mqt.getImportHistory.invalidate({ constructionId });
      utils.mqt.getItems.invalidate({ constructionId });
      setRevertingId(null);
    },
  });

  const handleRevert = (importId: number) => {
    revertMutation.mutate({ importId });
  };

  const getSourceIcon = (source: string) => {
    return source === "excel" ? <FileSpreadsheet className="h-4 w-4" /> : <Sheet className="h-4 w-4" />;
  };

  const getSourceLabel = (source: string) => {
    return source === "excel" ? "Excel" : "Google Sheets";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#8B0000]">
              Histórico de Importações
            </DialogTitle>
            <DialogDescription>
              Visualize todas as importações de MQT realizadas e reverta se necessário
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B0000]" />
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma importação realizada ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#8B0000]/10 rounded-lg">
                          {getSourceIcon(item.source)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {getSourceLabel(item.source)}
                            </span>
                            {item.fileName && (
                              <Badge variant="outline" className="text-xs">
                                {item.fileName}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.importedAt).toLocaleString("pt-PT", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Utilizador #{item.userId}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Statistics */}
                      <div className="flex items-center gap-4 pl-14">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">
                            <strong>{item.itemsSuccess}</strong> sucesso
                          </span>
                        </div>
                        {item.itemsError > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-gray-700">
                              <strong>{item.itemsError}</strong> erros
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-blue-600" />
                          <span className="text-gray-700">
                            <strong>{item.itemsImported}</strong> total
                          </span>
                        </div>
                      </div>

                      {/* Google Sheets URL */}
                      {item.sheetsUrl && (
                        <div className="pl-14 text-sm text-gray-600">
                          <a
                            href={item.sheetsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#8B0000] hover:underline"
                          >
                            Ver Google Sheet →
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Revert Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRevertingId(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reverter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revert Confirmation Dialog */}
      <AlertDialog open={revertingId !== null} onOpenChange={() => setRevertingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverter Importação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá apagar todos os itens que foram adicionados nesta importação.
              Esta operação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revertingId && handleRevert(revertingId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Reverter Importação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
