import { notifyOwner } from "./_core/notification";

/**
 * Budget Email Service
 * Handles email notifications for budget alerts
 */

interface BudgetBreakdown {
  category: string;
  budgeted: number;
  actual: number;
  percentage: number;
  variance: number;
}

interface BudgetAlertEmailData {
  projectName: string;
  projectId: number;
  budgetTotal: number;
  actualCost: number;
  percentage: number;
  alertType: "warning" | "critical" | "exceeded";
  breakdown: BudgetBreakdown[];
}

/**
 * Generate HTML template for budget alert email
 */
function generateBudgetAlertEmailHTML(data: BudgetAlertEmailData): string {
  const alertColors = {
    warning: { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },
    critical: { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B" },
    exceeded: { bg: "#FECACA", border: "#DC2626", text: "#7F1D1D" },
  };

  const colors = alertColors[data.alertType];

  const alertTitles = {
    warning: "⚠️ Aviso de Orçamento - 80% Atingido",
    critical: "🚨 Alerta Crítico de Orçamento - 90% Atingido",
    exceeded: "❌ Orçamento Excedido - 100% Ultrapassado",
  };

  const breakdownRows = data.breakdown
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">${item.category}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">€${item.budgeted.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">€${item.actual.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: 600; color: ${item.percentage > 100 ? "#DC2626" : item.percentage > 90 ? "#F59E0B" : "#10B981"};">${item.percentage.toFixed(1)}%</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: 600; color: ${item.variance < 0 ? "#DC2626" : "#10B981"};">€${item.variance.toLocaleString("pt-PT", { minimumFractionDigits: 2, signDisplay: "always" })}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta de Orçamento - ${data.projectName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F9FAFB;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #C9A882 0%, #ADAA96 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 700; font-family: 'Cormorant Garamond', serif;">
                GAVINHO - Gestão de Projetos
              </h1>
              <p style="margin: 8px 0 0 0; color: #FFFFFF; font-size: 14px; opacity: 0.9;">
                Plataforma de Design & Build
              </p>
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="background-color: ${colors.bg}; border-left: 6px solid ${colors.border}; padding: 20px; margin: 0;">
              <h2 style="margin: 0 0 8px 0; color: ${colors.text}; font-size: 20px; font-weight: 700;">
                ${alertTitles[data.alertType]}
              </h2>
              <p style="margin: 0; color: ${colors.text}; font-size: 14px;">
                O projeto <strong>${data.projectName}</strong> atingiu ${data.percentage.toFixed(1)}% do orçamento previsto.
              </p>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding: 30px;">
              <h3 style="margin: 0 0 20px 0; color: #1F2937; font-size: 18px; font-weight: 600;">
                Resumo Financeiro
              </h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px; background-color: #F9FAFB; border-radius: 8px; width: 50%;">
                    <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Orçamento Total</p>
                    <p style="margin: 0; color: #1F2937; font-size: 24px; font-weight: 700;">€${data.budgetTotal.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</p>
                  </td>
                  <td style="width: 20px;"></td>
                  <td style="padding: 12px; background-color: #F9FAFB; border-radius: 8px; width: 50%;">
                    <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Custo Atual</p>
                    <p style="margin: 0; color: ${data.percentage > 100 ? "#DC2626" : "#1F2937"}; font-size: 24px; font-weight: 700;">€${data.actualCost.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</p>
                  </td>
                </tr>
              </table>

              <!-- Progress Bar -->
              <div style="margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="color: #6B7280; font-size: 14px; font-weight: 500;">Utilização do Orçamento</span>
                  <span style="color: ${data.percentage > 100 ? "#DC2626" : data.percentage > 90 ? "#F59E0B" : "#10B981"}; font-size: 16px; font-weight: 700;">${data.percentage.toFixed(1)}%</span>
                </div>
                <div style="width: 100%; height: 12px; background-color: #E5E7EB; border-radius: 6px; overflow: hidden;">
                  <div style="width: ${Math.min(data.percentage, 100)}%; height: 100%; background: linear-gradient(90deg, ${data.percentage > 100 ? "#DC2626" : data.percentage > 90 ? "#F59E0B" : "#10B981"} 0%, ${data.percentage > 100 ? "#B91C1C" : data.percentage > 90 ? "#D97706" : "#059669"} 100%); transition: width 0.3s ease;"></div>
                </div>
              </div>

              <!-- Breakdown Table -->
              <h3 style="margin: 0 0 16px 0; color: #1F2937; font-size: 18px; font-weight: 600;">
                Breakdown de Despesas por Categoria
              </h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #F9FAFB;">
                    <th style="padding: 12px; text-align: left; color: #6B7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E5E7EB;">Categoria</th>
                    <th style="padding: 12px; text-align: right; color: #6B7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E5E7EB;">Orçado</th>
                    <th style="padding: 12px; text-align: right; color: #6B7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E5E7EB;">Real</th>
                    <th style="padding: 12px; text-align: right; color: #6B7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E5E7EB;">%</th>
                    <th style="padding: 12px; text-align: right; color: #6B7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E5E7EB;">Variação</th>
                  </tr>
                </thead>
                <tbody>
                  ${breakdownRows}
                </tbody>
              </table>

              <!-- Recommendations -->
              <div style="margin-top: 24px; padding: 16px; background-color: #EFF6FF; border-left: 4px solid #3B82F6; border-radius: 8px;">
                <h4 style="margin: 0 0 8px 0; color: #1E40AF; font-size: 14px; font-weight: 600;">
                  💡 Recomendações
                </h4>
                <ul style="margin: 0; padding-left: 20px; color: #1E40AF; font-size: 14px; line-height: 1.6;">
                  ${data.alertType === "exceeded" ? `
                    <li>Reveja imediatamente os custos do projeto e identifique áreas de otimização</li>
                    <li>Considere renegociar contratos com fornecedores</li>
                    <li>Avalie a necessidade de ajuste do orçamento ou redução de escopo</li>
                  ` : data.alertType === "critical" ? `
                    <li>Monitore de perto as despesas restantes do projeto</li>
                    <li>Implemente controles adicionais de aprovação de gastos</li>
                    <li>Prepare um plano de contingência caso o orçamento seja ultrapassado</li>
                  ` : `
                    <li>Revise as despesas previstas para as próximas fases</li>
                    <li>Identifique oportunidades de economia sem comprometer a qualidade</li>
                    <li>Mantenha comunicação transparente com o cliente sobre o status financeiro</li>
                  `}
                </ul>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">
                Este é um alerta automático gerado pela Plataforma GAVINHO
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                © ${new Date().getFullYear()} GAVINHO - Arquitetura e Interiores Lda | NIF: 513 768 580
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send budget alert email to project owner
 */
export async function sendBudgetAlertEmail(data: BudgetAlertEmailData): Promise<boolean> {
  try {
    const htmlContent = generateBudgetAlertEmailHTML(data);

    // Use the built-in notification system to send email
    const title = `Alerta de Orçamento: ${data.projectName} (${data.percentage.toFixed(1)}%)`;
    const content = `O projeto ${data.projectName} atingiu ${data.percentage.toFixed(1)}% do orçamento previsto (€${data.actualCost.toLocaleString("pt-PT")} de €${data.budgetTotal.toLocaleString("pt-PT")}). Reveja o breakdown de despesas e tome as ações necessárias.`;

    const success = await notifyOwner({
      title,
      content,
    });

    console.log(`[BudgetEmailService] Email ${success ? "sent successfully" : "failed"} for project ${data.projectName}`);
    return success;
  } catch (error) {
    console.error("[BudgetEmailService] Error sending budget alert email:", error);
    return false;
  }
}

/**
 * Check if alert should be sent based on threshold
 */
export function shouldSendAlert(currentPercentage: number, threshold: number, lastAlertPercentage?: number): boolean {
  // Send alert if:
  // 1. Current percentage >= threshold
  // 2. No previous alert OR previous alert was for a lower threshold
  if (currentPercentage < threshold) {
    return false;
  }

  if (!lastAlertPercentage) {
    return true;
  }

  // Only send if we've crossed a new threshold
  return lastAlertPercentage < threshold;
}
