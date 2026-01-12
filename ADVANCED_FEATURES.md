# Funcionalidades Avançadas Implementadas

Este documento descreve as três funcionalidades avançadas implementadas no Gavinho Project Manager.

## 1. Notificações Automáticas

### Descrição

O sistema de notificações automáticas dispara notificações automaticamente quando eventos importantes ocorrem no sistema, sem necessidade de intervenção manual.

### Arquivos Implementados

- **`server/automaticNotificationsService.ts`**: Serviço principal que gerencia a fila de notificações e processamento assíncrono
- **`server/supplierEvaluationsDb.ts`**: Integração com criação de avaliações de fornecedores

### Funcionalidades

#### Fila de Notificações Assíncrona

O sistema mantém uma fila em memória de notificações pendentes e as processa em background sem bloquear requisições HTTP.

```typescript
// Adicionar notificação à fila
await queueNotification({
  type: "supplier_evaluated",
  title: "Fornecedor Avaliado",
  content: "...",
  relatedId: 123,
  relatedType: "supplier"
});
```

#### Retry Automático com Backoff Exponencial

Notificações que falham são automaticamente retentadas com delays exponenciais (2s, 4s, 8s).

```typescript
// Configuração
const MAX_RETRIES = 3; // Máximo de tentativas
// Delays: 2^1 = 2s, 2^2 = 4s, 2^3 = 8s
```

#### Tipos de Notificações Suportadas

- **supplier_evaluated**: Quando um fornecedor recebe uma avaliação
- **project_status_changed**: Quando o status de um projeto muda
- **project_completed**: Quando um projeto é concluído

#### Endpoints tRPC

```typescript
// Obter estatísticas da fila
trpc.automaticNotifications.getQueueStats.useQuery()

// Processar fila manualmente
trpc.automaticNotifications.processQueue.useMutation()
```

### Integração com Fluxos Existentes

#### Ao Criar Avaliação de Fornecedor

```typescript
// Em supplierEvaluationsDb.ts
const result = await db.insert(supplierEvaluations).values({...});

// Dispara notificação automática
await automaticNotificationsService.notifyOnSupplierEvaluation(
  supplierId,
  supplierName,
  rating,
  evaluatedBy
);
```

---

## 2. Gráficos de Tendências de Fornecedores

### Descrição

Visualizações interativas que mostram a evolução dos ratings de fornecedores ao longo do tempo, ajudando a identificar tendências de desempenho.

### Arquivos Implementados

- **`server/supplierTrendService.ts`**: Serviço que calcula dados de tendência
- **`client/src/components/SupplierTrendChart.tsx`**: Componente React com Recharts

### Funcionalidades

#### Análise de Tendências

O sistema agrupa avaliações por semana e calcula:

- **Média de Rating**: Média ponderada das avaliações
- **Qualidade, Pontualidade, Comunicação**: Métricas específicas
- **Tendência**: Classificação em "up", "down" ou "stable"
- **Percentual de Mudança**: Variação entre períodos

```typescript
{
  currentAvg: 4.5,
  previousAvg: 4.2,
  trend: "up",
  trendPercentage: 7
}
```

#### Períodos Suportados

- **30d**: Últimos 30 dias
- **90d**: Últimos 90 dias (padrão)
- **1y**: Último ano
- **all**: Todos os dados disponíveis

#### Endpoints tRPC

```typescript
// Obter dados de tendência de um fornecedor
trpc.suppliers.getTrendData.useQuery({
  supplierId: 123,
  period: "90d"
})

// Comparar múltiplos fornecedores
trpc.suppliers.getComparisonTrendData.useQuery({
  supplierIds: [123, 456, 789],
  period: "90d"
})

// Obter estatísticas agregadas
trpc.suppliers.getTrendStats.useQuery({
  supplierId: 123
})
```

#### Componente SupplierTrendChart

O componente oferece visualizações com Recharts:

```typescript
<SupplierTrendChart
  data={trendData}
  supplierName="Fornecedor XYZ"
  trend="up"
  trendPercentage={7}
  currentAvg={4.5}
  previousAvg={4.2}
  chartType="line" // ou "composed"
/>
```

**Características:**

- Gráfico de linha com múltiplas séries (Rating, Qualidade, Pontualidade, Comunicação)
- Cards de estatísticas rápidas
- Badge de tendência com ícone visual (↑ ↓ →)
- Modo "composed" com gráfico de barras para contagem

---

## 3. Preferências de Notificação por Usuário

### Descrição

Painel completo que permite aos usuários personalizar quais tipos de notificações desejam receber, a frequência e os canais de entrega.

### Arquivos Implementados

- **`drizzle/schema.ts`**: Tabela `userNotificationPreferences`
- **`server/userNotificationPreferencesDb.ts`**: Funções de CRUD
- **`client/src/components/NotificationPreferencesPanel.tsx`**: Componente React

### Estrutura da Tabela

```sql
CREATE TABLE userNotificationPreferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL REFERENCES users(id),
  
  -- Tipos de notificações
  enabledSupplierEvaluated TINYINT DEFAULT 1,
  enabledProjectStatusChanged TINYINT DEFAULT 1,
  enabledProjectCompleted TINYINT DEFAULT 1,
  enabledDeadlineAlert TINYINT DEFAULT 1,
  enabledBudgetAlert TINYINT DEFAULT 1,
  enabledOrderUpdate TINYINT DEFAULT 1,
  enabledTaskAssigned TINYINT DEFAULT 1,
  
  -- Frequência
  frequency ENUM('immediate', 'daily', 'weekly') DEFAULT 'immediate',
  
  -- Canais
  enableEmailNotifications TINYINT DEFAULT 1,
  enablePushNotifications TINYINT DEFAULT 1,
  enableInAppNotifications TINYINT DEFAULT 1,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Funcionalidades

#### Tipos de Notificações Configuráveis

1. **Fornecedor Avaliado**: Quando um fornecedor recebe uma avaliação
2. **Status do Projeto**: Quando o status de um projeto muda
3. **Projeto Concluído**: Quando um projeto é marcado como concluído
4. **Alerta de Prazo**: Sobre prazos próximos ou vencidos
5. **Alerta de Orçamento**: Quando o orçamento é excedido
6. **Atualização de Encomenda**: Sobre atualizações de encomendas
7. **Tarefa Atribuída**: Quando uma tarefa é atribuída ao usuário

#### Frequências de Notificação

- **Imediato**: Notificações em tempo real (padrão)
- **Diário**: Resumo diário de notificações
- **Semanal**: Resumo semanal de notificações

#### Canais de Entrega

- **Notificações no App**: Dentro da aplicação
- **Email**: Por email
- **Push**: Notificações push no dispositivo

#### Endpoints tRPC

```typescript
// Obter preferências do usuário
trpc.notificationPreferences.get.useQuery()

// Atualizar múltiplas preferências
trpc.notificationPreferences.update.useMutation({
  enabledSupplierEvaluated: true,
  frequency: "daily"
})

// Alternar tipo específico de notificação
trpc.notificationPreferences.toggleNotificationType.useMutation({
  notificationType: "supplier_evaluated",
  enabled: false
})

// Definir frequência
trpc.notificationPreferences.setFrequency.useMutation({
  frequency: "weekly"
})

// Alternar canal
trpc.notificationPreferences.toggleChannel.useMutation({
  channel: "email",
  enabled: true
})

// Restaurar padrões
trpc.notificationPreferences.reset.useMutation()
```

#### Componente NotificationPreferencesPanel

Interface com abas para organizar preferências:

```typescript
<NotificationPreferencesPanel />
```

**Abas:**

1. **Tipos**: Toggles para cada tipo de notificação
2. **Frequência**: Radio buttons para escolher frequência
3. **Canais**: Toggles para cada canal de entrega

---

## Integração entre Funcionalidades

### Fluxo Completo

1. **Usuário cria avaliação de fornecedor**
   ↓
2. **Notificação automática é enfileirada**
   ↓
3. **Sistema verifica preferências do usuário**
   ↓
4. **Notificação é enviada se habilitada**
   ↓
5. **Dados são agregados para tendências**
   ↓
6. **Gráfico mostra evolução de ratings**

### Exemplo de Uso

```typescript
// 1. Criar avaliação
await trpc.suppliers.createEvaluation.mutate({
  supplierId: 123,
  rating: 4.5,
  quality: 4.5,
  timeliness: 4.5,
  communication: 4.5
});

// 2. Notificação automática é disparada
// (se o usuário tiver habilitado em preferências)

// 3. Visualizar tendências
const trendData = await trpc.suppliers.getTrendData.query({
  supplierId: 123,
  period: "90d"
});

// 4. Gerenciar preferências
await trpc.notificationPreferences.update.mutate({
  enabledSupplierEvaluated: true,
  frequency: "daily"
});
```

---

## Testes

### Testes Unitários Recomendados

#### Para Notificações Automáticas

```typescript
describe("automaticNotificationsService", () => {
  it("should queue notification", async () => {
    const result = await queueNotification({...});
    expect(result).toBeDefined();
  });

  it("should retry failed notifications", async () => {
    // Simular falha e verificar retry
  });

  it("should process queue", async () => {
    await processNotificationQueue();
    expect(getQueueStats().queueLength).toBe(0);
  });
});
```

#### Para Tendências

```typescript
describe("supplierTrendService", () => {
  it("should calculate trend data", async () => {
    const data = await getSupplierTrendData(123, "90d");
    expect(data.summary.trend).toMatch(/up|down|stable/);
  });

  it("should compare multiple suppliers", async () => {
    const comparison = await getComparisonTrendData([123, 456], "90d");
    expect(comparison.suppliers).toHaveLength(2);
  });
});
```

#### Para Preferências

```typescript
describe("userNotificationPreferencesDb", () => {
  it("should create default preferences", async () => {
    await createDefaultUserNotificationPreferences(userId);
    const prefs = await getUserNotificationPreferences(userId);
    expect(prefs.frequency).toBe("immediate");
  });

  it("should toggle notification type", async () => {
    await toggleNotificationType(userId, "supplier_evaluated", false);
    const prefs = await getUserNotificationPreferences(userId);
    expect(prefs.enabledSupplierEvaluated).toBe(0);
  });
});
```

---

## Próximos Passos

1. **Executar migrações do banco de dados**: `pnpm db:push`
2. **Integrar preferências no serviço de notificações**: Verificar preferências antes de enviar
3. **Adicionar testes unitários**: Implementar testes conforme recomendado
4. **Integrar gráficos na UI**: Adicionar componente `SupplierTrendChart` na página de avaliações
5. **Adicionar painel de preferências**: Integrar `NotificationPreferencesPanel` na página de perfil

---

## Notas Técnicas

### Performance

- Tendências são calculadas sob demanda (sem cache)
- Fila de notificações processa em background sem bloquear
- Agregação por semana reduz volume de dados para visualização

### Segurança

- Preferências são isoladas por usuário
- Endpoints tRPC usam `protectedProcedure`
- Validação de entrada com Zod

### Escalabilidade

- Fila em memória pode ser substituída por Redis em produção
- Tendências podem ser pré-calculadas e cacheadas
- Notificações podem ser processadas por worker jobs

---

## Referências

- **Recharts**: https://recharts.org/
- **Drizzle ORM**: https://orm.drizzle.team/
- **tRPC**: https://trpc.io/
- **React Hooks**: https://react.dev/reference/react/hooks
