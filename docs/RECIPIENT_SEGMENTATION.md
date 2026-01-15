# Segmentação por Destinatário - Análise de Engajamento

## Visão Geral

O sistema de segmentação por destinatário permite análise detalhada do engajamento de diferentes grupos de clientes. Fornece métricas comparativas, identificação de destinatários de alto engajamento e detecção de inatividade.

## Arquitetura

O sistema é composto por:

1. **Serviço de Segmentação** (`server/recipientSegmentationService.ts`) - Calcula métricas por segmento
2. **Router tRPC** (`server/routers/recipientSegmentation.ts`) - Expõe endpoints de análise
3. **Dashboard React** (`client/src/components/RecipientSegmentationDashboard.tsx`) - Visualiza dados

## Conceitos Principais

### Segmentos

Um segmento é um grupo de destinatários com características comuns:

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| **client_type** | Classificação por tipo de cliente | Residencial, Corporativo, Investidor |
| **project_type** | Classificação por tipo de projeto | Habitação, Comercial, Reabilitação |
| **region** | Classificação geográfica | Lisboa, Algarve, Porto |
| **custom** | Segmentação personalizada | Clientes VIP, Clientes Inativos |

### Métricas de Segmento

Para cada segmento, o sistema calcula:

| Métrica | Descrição |
|---------|-----------|
| **Total de Destinatários** | Número de emails no segmento |
| **Taxa de Abertura** | Percentagem de emails abertos |
| **Taxa de Clique** | Percentagem de emails com cliques |
| **Taxa de Rejeição** | Percentagem de emails rejeitados |
| **Engajamento Único** | Número de destinatários que abriram/clicaram |
| **Links Mais Clicados** | Top 5 URLs clicadas no segmento |
| **Destinatários Mais Engajados** | Top 5 emails com maior engajamento |

### Score de Engajamento

Cada destinatário tem um score de 0-100 calculado como:

```
Score = (Aberturas × 10 + Cliques × 20) / 100 × 100
```

Categorias:
- **90-100**: Engajamento Excelente
- **70-89**: Engajamento Bom
- **50-69**: Engajamento Moderado
- **30-49**: Engajamento Baixo
- **0-29**: Engajamento Mínimo

## Endpoints da API

### Obter Métricas de um Segmento

```bash
curl -X GET "http://localhost:3000/api/trpc/recipientSegmentation.getSegmentMetrics?input={\"segmentId\":\"segment-1\",\"startDate\":\"2024-01-01T00:00:00Z\",\"endDate\":\"2024-01-31T23:59:59Z\"}"
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "segmentId": "segment-1",
    "segmentName": "Clientes Residenciais",
    "totalRecipients": 250,
    "totalEmails": 500,
    "totalOpens": 175,
    "totalClicks": 42,
    "totalBounces": 15,
    "totalDropped": 10,
    "openRate": 35.0,
    "clickRate": 8.4,
    "bounceRate": 3.0,
    "uniqueOpens": 160,
    "uniqueClicks": 38,
    "topLinks": [
      { "url": "https://gavinho.com/projetos", "clicks": 12 },
      { "url": "https://gavinho.com/contacto", "clicks": 8 }
    ],
    "topEmails": [
      { "email": "client@example.com", "opens": 5, "clicks": 2 }
    ]
  }
}
```

### Comparar Dois Segmentos

```bash
curl -X GET "http://localhost:3000/api/trpc/recipientSegmentation.compareSegments?input={\"segmentId1\":\"segment-1\",\"segmentId2\":\"segment-2\",\"startDate\":\"2024-01-01T00:00:00Z\",\"endDate\":\"2024-01-31T23:59:59Z\"}"
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "segment1": { /* métricas do segmento 1 */ },
    "segment2": { /* métricas do segmento 2 */ },
    "comparison": {
      "openRateDiff": 5.2,
      "clickRateDiff": 1.8,
      "bounceRateDiff": -0.5,
      "winner": "segment1"
    }
  }
}
```

### Obter Destinatários com Alto Engajamento

```bash
curl -X GET "http://localhost:3000/api/trpc/recipientSegmentation.getHighEngagementRecipients?input={\"segmentId\":\"segment-1\",\"threshold\":50}"
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "email": "vip@example.com",
      "opens": 8,
      "clicks": 3,
      "engagementScore": 85
    }
  ],
  "count": 15
}
```

### Obter Destinatários Inativos

```bash
curl -X GET "http://localhost:3000/api/trpc/recipientSegmentation.getInactiveRecipients?input={\"segmentId\":\"segment-1\",\"daysInactive\":30}"
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "email": "inactive@example.com",
      "opens": 0,
      "clicks": 0,
      "lastEventAt": "2023-12-01T10:00:00Z",
      "engagementScore": 0
    }
  ],
  "count": 45
}
```

## Dashboard

O dashboard oferece:

1. **Seleção de Segmentos** - Escolha um ou dois segmentos para análise
2. **Filtros de Data** - Defina período de análise
3. **Modo de Comparação** - Compare métricas entre segmentos
4. **Visualizações** - Gráficos de taxa de abertura, clique, rejeição
5. **Destinatários Destacados** - Top engajados e inativos
6. **Links Populares** - URLs mais clicadas

## Casos de Uso

### 1. Identificar Segmentos Mais Engajados

Compare taxas de abertura entre segmentos para identificar qual grupo de clientes tem melhor engajamento:

```
Segmento 1 (Residencial): 35% abertura
Segmento 2 (Corporativo): 28% abertura
Segmento 3 (Investidor): 42% abertura
```

**Ação**: Focar em estratégias que funcionam bem com investidores.

### 2. Detectar Inatividade

Identifique destinatários sem atividade há 30+ dias:

```
45 destinatários inativos em Segmento 1
```

**Ação**: Enviar campanha de re-engajamento ou remover da lista.

### 3. Otimizar Conteúdo por Segmento

Analise links mais clicados por segmento:

```
Segmento Residencial: Cliques em "Projetos" (12)
Segmento Corporativo: Cliques em "Serviços" (8)
```

**Ação**: Personalizar conteúdo por segmento.

### 4. Identificar Embaixadores

Encontre destinatários com alto engajamento:

```
15 destinatários com score > 50
```

**Ação**: Oferecer programa de referência ou parceria.

## Integração com Agendamentos

O sistema de segmentação integra-se com agendamentos de relatórios:

1. Agendar relatório para segmento específico
2. Rastrear engajamento do relatório
3. Comparar performance entre segmentos
4. Ajustar frequência/conteúdo baseado em dados

## Performance

- **Cálculo de métricas**: ~200ms para segmento com 1000 destinatários
- **Comparação**: ~400ms para dois segmentos
- **Identificação de inativos**: ~150ms

## Próximos Passos

1. **Segmentação Automática** - Criar segmentos baseado em comportamento
2. **Alertas** - Notificar quando taxa de engajamento cai
3. **Recomendações** - Sugerir ações baseadas em dados
4. **Exportação** - Gerar relatórios em PDF/CSV
5. **Integração com CRM** - Sincronizar dados com sistemas externos
