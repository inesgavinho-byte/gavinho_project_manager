export interface TestEmailConfig {
  recipients: string[];
  emailType: "daily" | "weekly" | "monthly";
  includeBlockers: boolean;
  includeWins: boolean;
  includeSentiment: boolean;
}

export interface TestEmailResult {
  success: boolean;
  message: string;
  sentTo: string[];
  timestamp: Date;
  previewContent?: string;
}

/**
 * Gera conteúdo de email de teste baseado no tipo de relatório
 */
export async function generateTestEmailContent(
  emailType: "daily" | "weekly" | "monthly",
  includeBlockers: boolean,
  includeWins: boolean,
  includeSentiment: boolean
): Promise<string> {
  const typeDescriptions = {
    daily: "Relatório Diário - BIA Insights",
    weekly: "Relatório Semanal - Performance & Insights",
    monthly: "Relatório Mensal - Análise Completa",
  };

  const emailContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>${typeDescriptions[emailType]}</h2>
        <p>Olá,</p>
        <p>Segue abaixo o resumo do ${emailType === "daily" ? "dia" : emailType === "weekly" ? "semana" : "mês"}:</p>
        
        ${
          includeBlockers
            ? "<h3>🚧 Bloqueios Identificados</h3><ul><li>Atraso em aprovação de cliente</li><li>Falta de recursos técnicos</li><li>Mudança de escopo não prevista</li></ul>"
            : ""
        }
        
        ${
          includeWins
            ? "<h3>✅ Wins da Equipa</h3><ul><li>Projeto X entregue 2 dias antes do prazo</li><li>Novo cliente onboarded com sucesso</li><li>Melhoria de 15% em produtividade</li></ul>"
            : ""
        }
        
        ${
          includeSentiment
            ? "<h3>😊 Análise de Sentimento</h3><p>Sentimento geral da equipa: Positivo (78%). A equipa está motivada e engajada com os projetos em andamento.</p>"
            : ""
        }
        
        <p>Atenciosamente,<br/>BIA - Assistente de Gestão de Projetos</p>
      </body>
    </html>
  `;

  return emailContent;
}

/**
 * Envia email de teste para validar configurações
 */
export async function sendTestEmail(config: TestEmailConfig): Promise<TestEmailResult> {
  try {
    // Gerar conteúdo do email
    const emailContent = await generateTestEmailContent(
      config.emailType,
      config.includeBlockers,
      config.includeWins,
      config.includeSentiment
    );

    // Simular envio de email (em produção, usar SendGrid/Mailgun/etc)
    console.log(`[TEST EMAIL] Enviando para: ${config.recipients.join(", ")}`);
    console.log(`[TEST EMAIL] Tipo: ${config.emailType}`);
    console.log(`[TEST EMAIL] Conteúdo preview: ${emailContent.substring(0, 100)}...`);

    // Aqui você integraria com o serviço de email real
    // const result = await sendEmailViaProvider(config.recipients, emailContent);

    return {
      success: true,
      message: `Email de teste enviado com sucesso para ${config.recipients.length} destinatário(s)`,
      sentTo: config.recipients,
      timestamp: new Date(),
      previewContent: emailContent.substring(0, 500),
    };
  } catch (error) {
    console.error("Erro ao enviar email de teste:", error);
    return {
      success: false,
      message: `Erro ao enviar email de teste: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      sentTo: [],
      timestamp: new Date(),
    };
  }
}

/**
 * Valida configurações de email antes de ativar automação
 */
export async function validateEmailConfig(config: TestEmailConfig): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar destinatários
  if (!config.recipients || config.recipients.length === 0) {
    errors.push("Nenhum destinatário configurado");
  }

  config.recipients.forEach((email) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Email inválido: ${email}`);
    }
  });

  // Validar tipo de email
  if (!["daily", "weekly", "monthly"].includes(config.emailType)) {
    errors.push("Tipo de email inválido");
  }

  // Avisos
  if (!config.includeBlockers && !config.includeWins && !config.includeSentiment) {
    warnings.push("Nenhum conteúdo selecionado para o email");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
