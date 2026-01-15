/**
 * SendGrid Webhook Handler
 * 
 * Endpoint para receber eventos de email do SendGrid
 * POST /api/webhooks/sendgrid
 */

import { Router, Request, Response } from 'express';
import { processEmailEvent, SendGridEvent } from '../emailTrackingService';

const router = Router();

/**
 * Validar assinatura do webhook do SendGrid
 * 
 * SendGrid envia um header X-Twilio-Email-Event-Webhook-Signature
 * que deve ser validado para garantir que o webhook vem do SendGrid
 */
function validateSendGridSignature(
  req: Request,
  publicKey: string
): boolean {
  try {
    // Nota: A validação completa requer a biblioteca @sendgrid/mail
    // Por enquanto, fazemos uma validação básica
    const signature = req.headers['x-twilio-email-event-webhook-signature'];
    const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'];

    if (!signature || !timestamp) {
      console.warn('[SendGrid] Webhook sem assinatura ou timestamp');
      return false;
    }

    // TODO: Implementar validação completa com crypto
    // usando a chave pública do SendGrid
    return true;
  } catch (error) {
    console.error('[SendGrid] Erro ao validar assinatura:', error);
    return false;
  }
}

/**
 * POST /api/webhooks/sendgrid
 * 
 * Recebe eventos de email do SendGrid
 * SendGrid envia um array de eventos em cada request
 */
router.post('/sendgrid', async (req: Request, res: Response) => {
  try {
    // Validar assinatura (opcional, pode ser configurado no SendGrid)
    const sendgridPublicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;
    if (sendgridPublicKey && !validateSendGridSignature(req, sendgridPublicKey)) {
      console.warn('[SendGrid] Assinatura inválida');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const events: SendGridEvent[] = req.body;

    if (!Array.isArray(events)) {
      console.warn('[SendGrid] Payload não é um array de eventos');
      return res.status(400).json({ error: 'Invalid payload format' });
    }

    console.log(`[SendGrid] Recebidos ${events.length} eventos`);

    // Processar cada evento
    const results = await Promise.allSettled(
      events.map(event => processEmailEvent(event))
    );

    // Contar sucessos e falhas
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    if (failed > 0) {
      console.warn(`[SendGrid] ${failed} eventos falharam ao processar`);
    }

    // Retornar sucesso (SendGrid espera 200 OK)
    res.status(200).json({
      message: `Processed ${successful} events, ${failed} failed`,
      processed: successful,
      failed,
    });
  } catch (error) {
    console.error('[SendGrid] Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/webhooks/sendgrid/health
 * 
 * Health check para o webhook
 */
router.get('/sendgrid/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'SendGrid Webhook',
    timestamp: new Date().toISOString(),
  });
});

export default router;
