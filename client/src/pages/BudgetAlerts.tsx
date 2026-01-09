import { useState } from "react";
import { trpc } from "../lib/trpc";
import { AlertCircle, CheckCircle, Clock, Mail, RefreshCw } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function BudgetAlerts() {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState<number | null>(null);

  // Query unread alerts
  const { data: unreadAlerts, isLoading: loadingAlerts, refetch: refetchAlerts } = trpc.financial.getUnreadBudgetAlerts.useQuery();

  // Query threshold checks
  const { data: thresholdChecks, isLoading: loadingChecks, refetch: refetchChecks } = trpc.financial.checkBudgetThresholds.useQuery();

  // Mutations
  const markAsReadMutation = trpc.financial.markBudgetAlertAsRead.useMutation({
    onSuccess: () => {
      toast({
        title: "Alerta marcado como lido",
        description: "O alerta foi marcado como lido com sucesso.",
      });
      refetchAlerts();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendAlertMutation = trpc.financial.sendBudgetAlert.useMutation({
    onSuccess: () => {
      toast({
        title: "Alerta enviado",
        description: "O alerta de orçamento foi enviado por email com sucesso.",
      });
      refetchAlerts();
      refetchChecks();
      setIsSending(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar alerta",
        description: error.message,
        variant: "destructive",
      });
      setIsSending(null);
    },
  });

  const handleCheckThresholds = async () => {
    setIsChecking(true);
    await refetchChecks();
    setIsChecking(false);
    toast({
      title: "Verificação concluída",
      description: `Encontrados ${thresholdChecks?.filter((c) => c.shouldAlert).length || 0} alertas pendentes.`,
    });
  };

  const handleSendAlert = (check: any) => {
    setIsSending(check.budgetId);
    sendAlertMutation.mutate({
      budgetId: check.budgetId,
      projectId: check.projectId,
      projectName: check.projectName,
      budgetTotal: check.budgetTotal,
      actualCost: check.actualCost,
      percentage: check.percentage,
      alertType: check.alertType,
      threshold: check.threshold,
    });
  };

  const handleMarkAsRead = (alertId: number) => {
    markAsReadMutation.mutate({ alertId });
  };

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case "warning":
        return "border-yellow-500 bg-yellow-50";
      case "critical":
        return "border-orange-500 bg-orange-50";
      case "exceeded":
        return "border-red-500 bg-red-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case "warning":
        return <Clock className="w-6 h-6 text-yellow-600" />;
      case "critical":
        return <AlertCircle className="w-6 h-6 text-orange-600" />;
      case "exceeded":
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getAlertTitle = (alertType: string) => {
    switch (alertType) {
      case "warning":
        return "⚠️ Aviso de Orçamento - 80% Atingido";
      case "critical":
        return "🚨 Alerta Crítico - 90% Atingido";
      case "exceeded":
        return "❌ Orçamento Excedido - 100% Ultrapassado";
      default:
        return "Alerta de Orçamento";
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F2F0E7" }}>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#5F5C59" }}>
              Alertas de Orçamento
            </h1>
            <p className="text-gray-600">Monitoramento automático de thresholds de orçamento</p>
          </div>
          <button
            onClick={handleCheckThresholds}
            disabled={isChecking}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: "#C9A882", color: "#FFFFFF" }}
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
            {isChecking ? "Verificando..." : "Verificar Agora"}
          </button>
        </div>

        {/* Threshold Checks */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#5F5C59" }}>
            Verificação de Thresholds
          </h2>

          {loadingChecks ? (
            <div className="text-center py-8">
              <p className="text-gray-500">A carregar verificações...</p>
            </div>
          ) : thresholdChecks && thresholdChecks.length > 0 ? (
            <div className="grid gap-4">
              {thresholdChecks.map((check, index) => (
                <div
                  key={index}
                  className={`border-l-4 rounded-lg p-6 ${getAlertColor(check.alertType)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {getAlertIcon(check.alertType)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2" style={{ color: "#5F5C59" }}>
                          {check.projectName}
                        </h3>
                        <p className="text-sm text-gray-700 mb-3">
                          {getAlertTitle(check.alertType)}
                        </p>
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Orçamento Total</p>
                            <p className="font-semibold" style={{ color: "#5F5C59" }}>
                              €{check.budgetTotal.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Custo Atual</p>
                            <p className="font-semibold" style={{ color: "#5F5C59" }}>
                              €{check.actualCost.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Percentual</p>
                            <p className="font-semibold text-lg" style={{ color: check.percentage > 100 ? "#DC2626" : check.percentage > 90 ? "#F59E0B" : "#10B981" }}>
                              {check.percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${Math.min(check.percentage, 100)}%`,
                              backgroundColor: check.percentage > 100 ? "#DC2626" : check.percentage > 90 ? "#F59E0B" : "#10B981",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {check.shouldAlert ? (
                        <button
                          onClick={() => handleSendAlert(check)}
                          disabled={isSending === check.budgetId}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                          style={{ backgroundColor: "#C9A882", color: "#FFFFFF" }}
                        >
                          <Mail className="w-4 h-4" />
                          {isSending === check.budgetId ? "Enviando..." : "Enviar Alerta"}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: "#E5E7EB", color: "#6B7280" }}>
                          <CheckCircle className="w-4 h-4" />
                          Já Enviado
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="text-gray-600 font-medium">Nenhum alerta pendente</p>
              <p className="text-gray-500 text-sm mt-2">Todos os orçamentos estão dentro dos limites configurados</p>
            </div>
          )}
        </div>

        {/* Unread Alerts */}
        <div>
          <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#5F5C59" }}>
            Alertas Não Lidos
          </h2>

          {loadingAlerts ? (
            <div className="text-center py-8">
              <p className="text-gray-500">A carregar alertas...</p>
            </div>
          ) : unreadAlerts && unreadAlerts.length > 0 ? (
            <div className="grid gap-4">
              {unreadAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border-l-4 rounded-lg p-6 ${getAlertColor(alert.alertType)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {getAlertIcon(alert.alertType)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2" style={{ color: "#5F5C59" }}>
                          {alert.projectName}
                        </h3>
                        <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(alert.createdAt).toLocaleString("pt-PT", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{ backgroundColor: "#C9A882", color: "#FFFFFF" }}
                    >
                      Marcar como Lido
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="text-gray-600 font-medium">Nenhum alerta não lido</p>
              <p className="text-gray-500 text-sm mt-2">Todos os alertas foram marcados como lidos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
