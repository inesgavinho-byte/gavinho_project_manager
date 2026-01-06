import { notifyOwner } from "./_core/notification";

/**
 * Serviço de notificações para gestão de obra
 * Envia notificações para diferentes perfis de utilizadores
 */

export async function notifyMaterialRequestApproved(
  workerName: string,
  materialName: string,
  quantity: string,
  unit: string
): Promise<boolean> {
  return await notifyOwner({
    title: "✅ Requisição de Material Aprovada",
    content: `A requisição de ${quantity} ${unit} de ${materialName} solicitada por ${workerName} foi aprovada e está pronta para retirada.`,
  });
}

export async function notifyMaterialRequestRejected(
  workerName: string,
  materialName: string,
  reason?: string
): Promise<boolean> {
  return await notifyOwner({
    title: "❌ Requisição de Material Rejeitada",
    content: `A requisição de ${materialName} solicitada por ${workerName} foi rejeitada.${
      reason ? ` Motivo: ${reason}` : ""
    }`,
  });
}

export async function notifyNewMaterialRequest(
  workerName: string,
  materialName: string,
  quantity: string,
  unit: string,
  urgency: string
): Promise<boolean> {
  const urgencyEmoji = {
    low: "🟢",
    medium: "🟡",
    high: "🟠",
    urgent: "🔴",
  }[urgency] || "⚪";

  return await notifyOwner({
    title: `${urgencyEmoji} Nova Requisição de Material`,
    content: `${workerName} solicitou ${quantity} ${unit} de ${materialName}. Urgência: ${urgency}.`,
  });
}

export async function notifyCriticalNonCompliance(
  description: string,
  location?: string,
  reportedBy?: string
): Promise<boolean> {
  return await notifyOwner({
    title: "🚨 Não Conformidade Crítica Detectada",
    content: `Uma não conformidade crítica foi reportada${
      location ? ` em ${location}` : ""
    }: ${description}${reportedBy ? ` (Reportado por: ${reportedBy})` : ""}`,
  });
}

export async function notifyNonComplianceResolved(
  description: string,
  resolvedBy: string
): Promise<boolean> {
  return await notifyOwner({
    title: "✅ Não Conformidade Resolvida",
    content: `A não conformidade "${description}" foi resolvida por ${resolvedBy}.`,
  });
}

export async function notifyNonComplianceDeadlineApproaching(
  description: string,
  deadline: Date,
  responsibleName?: string
): Promise<boolean> {
  const daysUntilDeadline = Math.ceil(
    (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return await notifyOwner({
    title: "⏰ Prazo de Não Conformidade Aproximando",
    content: `A não conformidade "${description}" tem prazo em ${daysUntilDeadline} dias${
      responsibleName ? ` (Responsável: ${responsibleName})` : ""
    }.`,
  });
}

export async function notifyWorkerAbsent(
  workerName: string,
  expectedCheckIn: Date
): Promise<boolean> {
  return await notifyOwner({
    title: "⚠️ Trabalhador Ausente",
    content: `${workerName} não registou entrada às ${expectedCheckIn.toLocaleTimeString()}.`,
  });
}

export async function notifyDailyReportReady(
  constructionName: string,
  date: Date,
  reportUrl?: string
): Promise<boolean> {
  return await notifyOwner({
    title: "📊 Relatório Diário de Obra Disponível",
    content: `O relatório diário de ${constructionName} para ${date.toLocaleDateString()} está pronto${
      reportUrl ? `. Aceda em: ${reportUrl}` : ""
    }.`,
  });
}

export async function notifyLowMaterialStock(
  materialName: string,
  currentStock: string,
  unit: string
): Promise<boolean> {
  return await notifyOwner({
    title: "📦 Stock de Material Baixo",
    content: `O stock de ${materialName} está baixo: ${currentStock} ${unit} restantes.`,
  });
}

export async function notifyToolMaintenanceRequired(
  toolName: string,
  reason: string
): Promise<boolean> {
  return await notifyOwner({
    title: "🔧 Manutenção de Ferramenta Necessária",
    content: `A ferramenta ${toolName} requer manutenção: ${reason}.`,
  });
}
