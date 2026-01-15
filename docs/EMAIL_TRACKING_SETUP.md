# Email Tracking Setup - SendGrid Webhooks

## Visão Geral

Este documento descreve como configurar e testar o sistema de rastreamento de emails do SendGrid integrado com a plataforma GAVINHO.

## Arquitetura

O sistema é composto por:

1. **Serviço de Rastreamento** (`server/emailTrackingService.ts`) - Processa eventos de email
2. **Endpoint de Webhook** (`server/webhooks/sendgridWebhook.ts`) - Recebe eventos do SendGrid
3. **Router tRPC** (`server/routers/emailTracking.ts`) - Expõe dados de rastreamento
4. **Dashboard React** (`client/src/components/EmailTrackingDashboard.tsx`) - Visualiza métricas

## Configuração do SendGrid

### 1. Ativar Event Webhooks

1. Aceda a [SendGrid Dashboard](https://app.sendgrid.com)
2. Navegue para **Settings → Event Webhooks**
3. Clique em **Create New Event Webhook**
4. Configure:
   - **Webhook URL**: `https://seu-dominio.com/api/webhooks/sendgrid`
   - **Events**: Selecione todos os eventos desejados:
     - Processed
     - Dropped
     - Delivered
     - Deferred
     - Bounce
     - Open
     - Click
     - Unsubscribe
     - Group Unsubscribe
     - Spam Report

### 2. Validação de Assinatura (Opcional)

Para adicionar segurança, SendGrid pode assinar webhooks:

1. Gere uma chave pública em SendGrid
2. Defina a variável de ambiente: `SENDGRID_WEBHOOK_PUBLIC_KEY`
3. O serviço validará automaticamente

## Endpoints da API

### Obter Eventos de um Email

```bash
curl -X GET "http://localhost:3000/api/trpc/emailTracking.getEmailEvents?input={\"messageId\":\"msg-123\",\"limit\":100}"
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "evt-1",
      "messageId": "msg-123",
      "email": "user@example.com",
      "eventType": "open",
      "timestamp": "2024-01-15T10:30:00Z",
      "url": null,
      "userAgent": "Mozilla/5.0...",
      "ip": "192.168.1.1"
    }
  ],
  "count": 1
}
```

### Obter Métricas de um Email

```bash
curl -X GET "http://localhost:3000/api/trpc/emailTracking.getEmailMetrics?input={\"messageId\":\"msg-123\"}"
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "messageId": "msg-123",
    "email": "user@example.com",
    "opens": 2,
    "clicks": 1,
    "bounces": 0,
    "delivered": 1,
    "firstEventAt": "2024-01-15T10:00:00Z",
    "lastEventAt": "2024-01-15T10:30:00Z"
  }
}
```

### Obter Métricas de um Relatório

```bash
curl -X GET "http://localhost:3000/api/trpc/emailTracking.getReportMetrics?input={\"reportId\":1,\"startDate\":\"2024-01-01T00:00:00Z\",\"endDate\":\"2024-01-31T23:59:59Z\"}"
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "totalSent": 1000,
    "totalOpens": 350,
    "totalClicks": 85,
    "totalBounces": 12,
    "totalDropped": 5,
    "openRate": 35.0,
    "clickRate": 8.5,
    "bounceRate": 1.2,
    "uniqueOpens": 320,
    "uniqueClicks": 75
  }
}
```

## Testes

### 1. Teste Local com Ngrok

Para testar webhooks localmente:

```bash
# Terminal 1: Inicie o servidor
npm run dev

# Terminal 2: Exponha o servidor com ngrok
ngrok http 3000

# Configure o webhook URL em SendGrid com a URL do ngrok
# https://seu-ngrok-url.ngrok.io/api/webhooks/sendgrid
```

### 2. Teste com Eventos de Teste do SendGrid

1. Aceda a SendGrid → Event Webhooks
2. Clique no webhook criado
3. Clique em **Send Test Event**
4. Verifique os logs do servidor para confirmar recebimento

### 3. Teste com Email Real

```bash
# Envie um email de teste
curl -X POST "https://api.sendgrid.com/v3/mail/send" \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{"to": [{"email": "test@example.com"}]}],
    "from": {"email": "noreply@gavinho.com"},
    "subject": "Test Email",
    "content": [{"type": "text/plain", "value": "Test"}]
  }'
```

## Banco de Dados

### Tabelas Necessárias

O sistema espera as seguintes tabelas:

```sql
-- Eventos de rastreamento
CREATE TABLE emailTrackingEvents (
  id VARCHAR(36) PRIMARY KEY,
  messageId VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  eventType VARCHAR(50) NOT NULL,
  timestamp DATETIME NOT NULL,
  url VARCHAR(500),
  userAgent VARCHAR(500),
  ip VARCHAR(45),
  reason VARCHAR(255),
  status VARCHAR(50),
  response VARCHAR(500),
  attempt INT,
  metadata JSON,
  INDEX idx_messageId (messageId),
  INDEX idx_email (email),
  INDEX idx_eventType (eventType),
  INDEX idx_timestamp (timestamp)
);

-- Métricas agregadas
CREATE TABLE emailMetrics (
  id VARCHAR(36) PRIMARY KEY,
  messageId VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  opens INT DEFAULT 0,
  clicks INT DEFAULT 0,
  bounces INT DEFAULT 0,
  dropped INT DEFAULT 0,
  delivered INT DEFAULT 0,
  deferred INT DEFAULT 0,
  unsubscribes INT DEFAULT 0,
  spamReports INT DEFAULT 0,
  firstEventAt DATETIME,
  lastEventAt DATETIME,
  lastEventType VARCHAR(50),
  INDEX idx_messageId (messageId),
  INDEX idx_email (email)
);
```

## Troubleshooting

### Webhook não recebe eventos

1. Verifique se o URL é acessível publicamente
2. Confirme que SendGrid consegue fazer POST para o endpoint
3. Verifique os logs do SendGrid em **Activity Feed**

### Eventos não são processados

1. Verifique os logs do servidor
2. Confirme que o banco de dados está acessível
3. Valide o formato JSON dos eventos

### Taxa de rastreamento baixa

1. Confirme que os eventos estão ativados em SendGrid
2. Verifique se os emails têm tracking habilitado
3. Analise a qualidade dos endereços de email

## Performance

- **Processamento de eventos**: ~50ms por evento
- **Consultas de métricas**: ~100ms para 10k eventos
- **Agregações**: Executadas em tempo real durante inserção

## Segurança

1. **Validação de assinatura**: Implementada (opcional)
2. **Rate limiting**: Recomendado em produção
3. **Autenticação**: Apenas utilizadores autenticados podem consultar dados
4. **Encriptação**: Use HTTPS para webhooks

## Próximos Passos

1. Integrar alertas automáticos para baixas taxas de abertura
2. Adicionar segmentação por tipo de relatório
3. Implementar análise de tendências
4. Criar relatórios exportáveis (PDF, CSV)
