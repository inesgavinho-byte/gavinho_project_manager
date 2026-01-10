import { useState } from "react";
import { FileText, CheckCircle2, XCircle, Clock, RefreshCw, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ContractHistory() {
  const { toast } = useToast();
  const [reprocessingId, setReprocessingId] = useState<number | null>(null);
  
  // Fetch all contract history
  const { data: history, isLoading, refetch } = trpc.projects.contract.getAllHistory.useQuery();
  
  // Reprocess mutation
  const reprocessMutation = trpc.projects.contract.reprocess.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Contrato reprocessado com sucesso!",
        description: `Cliente ${data.result.clientCreated ? 'criado' : 'atualizado'}, ${data.result.phasesCreated} fases e ${data.result.deliverablesCreated} entregáveis adicionados.`,
      });
      setReprocessingId(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao reprocessar contrato",
        description: error.message,
        variant: "destructive",
      });
      setReprocessingId(null);
    },
  });
  
  const handleReprocess = async (historyId: number) => {
    if (confirm("Tem certeza que deseja reprocessar este contrato? Os dados extraídos serão aplicados novamente ao projeto.")) {
      setReprocessingId(historyId);
      await reprocessMutation.mutateAsync({ historyId });
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-600 animate-pulse" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Sucesso</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Erro</Badge>;
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Processando</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const formatDuration = (ms: number | null) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">A carregar histórico...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Histórico de Contratos</h1>
            <p className="text-muted-foreground mt-1">
              Todos os uploads e processamentos de contratos PDF
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
        
        {/* Statistics */}
        {history && history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{history.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {history.filter(h => h.status === "success").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Sucesso</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {history.filter(h => h.status === "error").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Erros</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {history.filter(h => h.isReprocessing === 1).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Reprocessados</div>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {/* History List */}
        {!history || history.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum contrato processado</h3>
              <p className="text-muted-foreground">
                Os contratos que fizer upload aparecerão aqui.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(item.status)}
                  </div>
                  
                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{item.fileName}</h3>
                          {getStatusBadge(item.status)}
                          {item.isReprocessing === 1 && (
                            <Badge variant="outline" className="text-xs">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Reprocessado
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(item.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          <span>{formatFileSize(item.fileSize)}</span>
                          {item.processingDurationMs && (
                            <span>Duração: {formatDuration(item.processingDurationMs)}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(item.fileUrl, "_blank")}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Ver PDF
                        </Button>
                        
                        {item.status !== "processing" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReprocess(item.id)}
                            disabled={reprocessingId === item.id}
                          >
                            {reprocessingId === item.id ? (
                              <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                A processar...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reprocessar
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Error Message */}
                    {item.status === "error" && item.errorMessage && (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md p-3 mt-3">
                        <div className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-red-800 dark:text-red-200">
                            <strong>Erro:</strong> {item.errorMessage}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Extracted Data Summary */}
                    {item.status === "success" && item.extractedData && (
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md p-3 mt-3">
                        <div className="text-sm text-green-800 dark:text-green-200">
                          <strong>Dados extraídos:</strong> Cliente, {(item.extractedData as any).phases?.length || 0} fases, {(item.extractedData as any).deliverables?.length || 0} entregáveis
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
