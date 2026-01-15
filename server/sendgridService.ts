import sgMail from "@sendgrid/mail";

// Configurar chave de API do SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@gavinho.com";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envia email via SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  try {
    if (!SENDGRID_API_KEY) {
      console.warn("SENDGRID_API_KEY não configurada. Email não será enviado.");
      return {
        success: false,
        error: "SendGrid API key não configurada",
      };
    }

    const msg = {
      to: options.to,
      from: options.from || SENDGRID_FROM_EMAIL,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
    };

    const response = await sgMail.send(msg);

    return {
      success: true,
      messageId: response[0].headers["x-message-id"],
    };
  } catch (error) {
    console.error("Erro ao enviar email via SendGrid:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao enviar email",
    };
  }
}

/**
 * Envia email de teste
 */
export async function sendTestEmail(
  recipients: string[],
  emailType: "daily" | "weekly" | "monthly"
): Promise<SendEmailResult> {
  const typeDescriptions = {
    daily: "Relatório Diário - BIA Insights",
    weekly: "Relatório Semanal - Performance & Insights",
    monthly: "Relatório Mensal - Análise Completa",
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Quattrocento Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #7a7667; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .header h2 { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; }
          .section { margin-bottom: 20px; }
          .section h3 { color: #7a7667; border-bottom: 2px solid #f2f0e7; padding-bottom: 10px; }
          .section ul { margin: 10px 0; padding-left: 20px; }
          .section li { margin: 5px 0; }
          .footer { background-color: #f2f0e7; padding: 15px; border-radius: 5px; text-align: center; font-size: 12px; color: #666; }
          .badge { display: inline-block; background-color: #8b8670; color: white; padding: 5px 10px; border-radius: 3px; margin-right: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${typeDescriptions[emailType]}</h2>
            <p style="margin: 10px 0 0 0;">Teste de Email - ${new Date().toLocaleDateString("pt-PT")}</p>
          </div>

          <p>Olá,</p>
          <p>Este é um <span class="badge">EMAIL DE TESTE</span> para validar suas configurações de envio automático.</p>

          <div class="section">
            <h3>🚧 Bloqueios Identificados</h3>
            <ul>
              <li>Atraso em aprovação de cliente - Projeto X</li>
              <li>Falta de recursos técnicos - Equipa de Desenvolvimento</li>
              <li>Mudança de escopo não prevista - Projeto Y</li>
            </ul>
          </div>

          <div class="section">
            <h3>✅ Wins da Equipa</h3>
            <ul>
              <li>Projeto X entregue 2 dias antes do prazo</li>
              <li>Novo cliente onboarded com sucesso</li>
              <li>Melhoria de 15% em produtividade</li>
            </ul>
          </div>

          <div class="section">
            <h3>😊 Análise de Sentimento</h3>
            <p>Sentimento geral da equipa: <strong>Positivo (78%)</strong></p>
            <p>A equipa está motivada e engajada com os projetos em andamento. Recomenda-se manter o ritmo atual e reconhecer os wins alcançados.</p>
          </div>

          <div class="footer">
            <p>Este é um email de teste enviado por <strong>BIA - Assistente de Gestão de Projetos</strong></p>
            <p>Se recebeu este email por engano, pode ignorá-lo com segurança.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipients,
    subject: `[TESTE] ${typeDescriptions[emailType]}`,
    html: htmlContent,
    text: `Este é um email de teste do tipo: ${emailType}`,
  });
}

/**
 * Envia relatório automático
 */
export async function sendAutomatedReport(
  recipients: string[],
  reportData: {
    blockers: string[];
    wins: string[];
    sentimentScore: number;
    date: Date;
  }
): Promise<SendEmailResult> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Quattrocento Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #7a7667; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .header h2 { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; }
          .section { margin-bottom: 20px; }
          .section h3 { color: #7a7667; border-bottom: 2px solid #f2f0e7; padding-bottom: 10px; }
          .section ul { margin: 10px 0; padding-left: 20px; }
          .section li { margin: 5px 0; }
          .footer { background-color: #f2f0e7; padding: 15px; border-radius: 5px; text-align: center; font-size: 12px; color: #666; }
          .metric { display: inline-block; background-color: #8b8670; color: white; padding: 10px 15px; border-radius: 3px; margin-right: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Relatório Diário - BIA Insights</h2>
            <p style="margin: 10px 0 0 0;">${reportData.date.toLocaleDateString("pt-PT")}</p>
          </div>

          <p>Olá,</p>
          <p>Segue abaixo o resumo do dia:</p>

          <div class="section">
            <h3>🚧 Bloqueios Identificados (${reportData.blockers.length})</h3>
            <ul>
              ${reportData.blockers.map((blocker) => `<li>${blocker}</li>`).join("")}
            </ul>
          </div>

          <div class="section">
            <h3>✅ Wins da Equipa (${reportData.wins.length})</h3>
            <ul>
              ${reportData.wins.map((win) => `<li>${win}</li>`).join("")}
            </ul>
          </div>

          <div class="section">
            <h3>😊 Análise de Sentimento</h3>
            <p>Sentimento geral da equipa: <span class="metric">${reportData.sentimentScore}%</span></p>
            <p>A equipa está ${reportData.sentimentScore >= 70 ? "muito motivada" : "motivada"} e engajada com os projetos em andamento.</p>
          </div>

          <div class="footer">
            <p>Relatório automático gerado por <strong>BIA - Assistente de Gestão de Projetos</strong></p>
            <p>Dúvidas? Contacte o administrador do sistema.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipients,
    subject: `Relatório Diário - BIA Insights (${reportData.date.toLocaleDateString("pt-PT")})`,
    html: htmlContent,
    text: `Relatório diário com ${reportData.blockers.length} bloqueios e ${reportData.wins.length} wins`,
  });
}
