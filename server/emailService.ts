import { notifyOwner } from "./_core/notification";

/**
 * Serviço de Email para Notificações de RH
 * Utiliza o helper notifyOwner() para enviar notificações ao owner do projeto
 */

interface AbsenceRequestNotification {
  employeeName: string;
  employeeEmail: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  daysCount: number;
}

interface AbsenceApprovalNotification {
  employeeName: string;
  employeeEmail: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "approved" | "rejected";
  approverName: string;
  comments?: string;
}

/**
 * Notifica administradores quando um novo pedido de ausência é criado
 */
export async function notifyAdminsNewAbsenceRequest(data: AbsenceRequestNotification): Promise<boolean> {
  const title = `🏖️ Novo Pedido de Ausência - ${data.employeeName}`;
  
  const content = `
**Colaborador:** ${data.employeeName} (${data.employeeEmail})
**Tipo:** ${translateAbsenceType(data.type)}
**Período:** ${data.startDate} até ${data.endDate} (${data.daysCount} dias)
**Motivo:** ${data.reason}

Por favor, aceda à página de Recursos Humanos para aprovar ou rejeitar este pedido.
  `.trim();

  return await notifyOwner({ title, content });
}

/**
 * Notifica colaborador quando seu pedido de ausência é aprovado
 */
export async function notifyEmployeeAbsenceApproved(data: AbsenceApprovalNotification): Promise<boolean> {
  const title = `✅ Pedido de Ausência Aprovado`;
  
  const content = `
Olá ${data.employeeName},

O seu pedido de ausência foi **aprovado** por ${data.approverName}.

**Tipo:** ${translateAbsenceType(data.type)}
**Período:** ${data.startDate} até ${data.endDate}
${data.comments ? `**Comentários:** ${data.comments}` : ''}

Boas férias!
  `.trim();

  return await notifyOwner({ title, content });
}

/**
 * Notifica colaborador quando seu pedido de ausência é rejeitado
 */
export async function notifyEmployeeAbsenceRejected(data: AbsenceApprovalNotification): Promise<boolean> {
  const title = `❌ Pedido de Ausência Rejeitado`;
  
  const content = `
Olá ${data.employeeName},

O seu pedido de ausência foi **rejeitado** por ${data.approverName}.

**Tipo:** ${translateAbsenceType(data.type)}
**Período:** ${data.startDate} até ${data.endDate}
${data.comments ? `**Motivo:** ${data.comments}` : ''}

Por favor, entre em contacto com o departamento de RH para mais informações.
  `.trim();

  return await notifyOwner({ title, content });
}

/**
 * Traduz tipo de ausência para português
 */
function translateAbsenceType(type: string): string {
  const translations: Record<string, string> = {
    vacation: "Férias",
    sick: "Doença",
    personal: "Assunto Pessoal",
    other: "Outro"
  };
  return translations[type] || type;
}
