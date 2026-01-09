# Plano de Testes - Plataforma Gavinho

**Versão:** 1.0  
**Data:** 09 de Janeiro de 2026  
**Autor:** Manus AI  
**Projeto:** Plataforma Gavinho - Project Manager

---

## 1. Introdução

Este documento apresenta o plano de testes abrangente para as três funcionalidades avançadas recentemente implementadas na Plataforma Gavinho. O objetivo é garantir a qualidade, estabilidade e usabilidade das novas funcionalidades através de uma combinação de testes automatizados e manuais.

### 1.1 Âmbito do Plano

O presente plano de testes cobre as seguintes funcionalidades:

1. **Dashboard de KPIs Financeiros** - Sistema de análise financeira com gráficos interativos e alertas de orçamento
2. **Sistema de Notificações em Tempo Real** - Infraestrutura WebSocket para notificações instantâneas
3. **Módulo de Gestão de Equipa** - Sistema completo de atribuição de tarefas, calendário e tracking de horas

### 1.2 Objetivos dos Testes

Os testes visam verificar os seguintes aspetos críticos:

- **Funcionalidade** - Todas as funcionalidades operam conforme especificado
- **Desempenho** - Tempos de resposta adequados para queries complexas e conexões WebSocket
- **Usabilidade** - Interface intuitiva e experiência de utilizador fluida
- **Integração** - Interação correta com módulos existentes da plataforma
- **Segurança** - Controlo de acesso e validação de dados adequados
- **Estabilidade** - Comportamento consistente sob diferentes condições de uso

---

## 2. Estratégia de Testes

A estratégia de testes combina múltiplas abordagens para garantir cobertura completa das funcionalidades implementadas.

### 2.1 Níveis de Teste

A pirâmide de testes adotada inclui os seguintes níveis:

| Nível | Tipo | Ferramenta | Cobertura |
|-------|------|------------|-----------|
| **Unitário** | Testes de funções e componentes isolados | Vitest | 70% |
| **Integração** | Testes de interação entre módulos | Vitest + tRPC | 20% |
| **Sistema** | Testes end-to-end de fluxos completos | Manual + Browser | 8% |
| **Aceitação** | Validação com utilizadores reais | Manual | 2% |

### 2.2 Tipos de Teste

Os testes implementados abrangem as seguintes categorias:

**Testes Funcionais** - Verificam se cada funcionalidade opera conforme especificado, incluindo casos normais e excecionais.

**Testes de Integração** - Validam a comunicação entre frontend React, backend tRPC, base de dados MySQL e servidor WebSocket.

**Testes de Desempenho** - Medem tempos de resposta de queries financeiras complexas e latência de notificações WebSocket.

**Testes de Usabilidade** - Avaliam a experiência do utilizador através de cenários de uso real e feedback qualitativo.

**Testes de Segurança** - Verificam autenticação, autorização e validação de inputs para prevenir vulnerabilidades.

---

## 3. Dashboard de KPIs Financeiros

O Dashboard Financeiro é uma funcionalidade crítica que processa grandes volumes de dados financeiros e apresenta análises visuais complexas.

### 3.1 Testes Automatizados (Backend)

Os testes unitários criados em `server/financial.test.ts` cobrem os seguintes endpoints tRPC:

#### 3.1.1 Teste: Obter KPIs Financeiros

**Endpoint:** `financial.getFinancialKPIs`

**Objetivo:** Verificar cálculo correto dos indicadores financeiros principais.

**Dados de Entrada:** Nenhum (calcula sobre todos os projetos ativos)

**Resultado Esperado:** Objeto contendo:
- `totalBudget` - Soma de todos os orçamentos (tipo: number ou string decimal)
- `totalSpent` - Soma de todas as despesas realizadas
- `budgetUtilization` - Percentagem de utilização do orçamento (0-100)
- `averageProfitMargin` - Margem de lucro média entre projetos

**Critérios de Sucesso:**
- Resposta retornada em menos de 500ms
- Todos os campos definidos (não undefined/null)
- Valores numéricos válidos (não NaN ou Infinity)
- Percentagens dentro do intervalo esperado

#### 3.1.2 Teste: Evolução de Orçamento

**Endpoint:** `financial.getBudgetEvolution`

**Objetivo:** Validar agregação mensal de dados orçamentais.

**Resultado Esperado:** Array de objetos com estrutura:
```typescript
{
  month: string,        // "2025-01"
  budgeted: number,     // Valor orçamentado
  spent: number,        // Valor gasto
  variance: number      // Diferença (budgeted - spent)
}
```

**Critérios de Sucesso:**
- Array ordenado cronologicamente
- Meses no formato ISO (YYYY-MM)
- Variance calculada corretamente
- Sem meses duplicados

#### 3.1.3 Teste: Comparação Custos Reais vs Previstos

**Endpoint:** `financial.getCostComparison`

**Objetivo:** Verificar comparação por projeto entre valores orçamentados e gastos.

**Resultado Esperado:** Array com dados por projeto incluindo nome, orçamento, custo real e variação.

**Critérios de Sucesso:**
- Todos os projetos ativos incluídos
- Cálculos de variação corretos
- Ordenação por variação (projetos com maior desvio primeiro)

#### 3.1.4 Teste: Rentabilidade por Projeto

**Endpoint:** `financial.getProjectProfitability`

**Objetivo:** Calcular margem de lucro e ROI para cada projeto.

**Resultado Esperado:** Métricas de rentabilidade com:
- Receita estimada
- Custos totais
- Lucro líquido
- Margem de lucro (%)
- ROI (Return on Investment)

**Critérios de Sucesso:**
- Fórmulas financeiras aplicadas corretamente
- Valores negativos permitidos (prejuízo)
- Percentagens calculadas com precisão decimal

#### 3.1.5 Teste: Alertas de Orçamento

**Endpoint:** `financial.getBudgetAlerts`

**Objetivo:** Identificar projetos com orçamento excedido ou próximo do limite.

**Resultado Esperado:** Lista de alertas com:
- Projetos acima de 90% do orçamento (warning)
- Projetos acima de 100% do orçamento (critical)
- Informação de quanto foi excedido

**Critérios de Sucesso:**
- Apenas projetos relevantes incluídos
- Níveis de alerta corretos (warning/critical)
- Ordenação por severidade

#### 3.1.6 Teste: Tendências de Despesas

**Endpoint:** `financial.getExpenseTrends`

**Objetivo:** Agregar despesas por categoria ao longo do tempo.

**Resultado Esperado:** Série temporal de despesas por categoria.

**Critérios de Sucesso:**
- Categorias agrupadas corretamente
- Agregação temporal precisa
- Dados ordenados cronologicamente

### 3.2 Testes Manuais (Frontend)

Os seguintes cenários devem ser testados manualmente na interface do Dashboard Financeiro:

#### Cenário 1: Visualização de Gráficos

**Passos:**
1. Aceder ao menu lateral → GESTÃO → Dashboard Financeiro
2. Aguardar carregamento completo da página
3. Verificar renderização de todos os gráficos Recharts

**Resultado Esperado:**
- 4 cards de KPIs principais visíveis no topo
- Gráfico de linha "Evolução de Orçamento" renderizado
- Gráfico de barras "Custos Reais vs Previstos" renderizado
- Gráfico de barras "Rentabilidade por Projeto" renderizado
- Gráfico de área "Tendências de Despesas" renderizado
- Sem erros de console JavaScript

**Critérios de Aceitação:**
- Todos os gráficos carregam em menos de 3 segundos
- Cores consistentes com paleta Gavinho (#C9A882, #9A6B5B)
- Tooltips aparecem ao passar o rato sobre dados
- Legendas visíveis e legíveis

#### Cenário 2: Interatividade dos Gráficos

**Passos:**
1. Passar o rato sobre pontos de dados nos gráficos
2. Clicar em legendas para mostrar/ocultar séries
3. Redimensionar janela do browser

**Resultado Esperado:**
- Tooltips exibem valores formatados corretamente (€, %)
- Séries podem ser ocultadas/mostradas via legenda
- Gráficos são responsivos e adaptam-se ao tamanho da janela
- Sem quebras de layout em dispositivos móveis

#### Cenário 3: Filtros e Período

**Passos:**
1. Localizar controlos de filtro (se implementados)
2. Alterar período de análise (mês, trimestre, ano)
3. Filtrar por projeto específico

**Resultado Esperado:**
- Gráficos atualizam-se dinamicamente
- Dados filtrados refletem seleção correta
- Loading state visível durante atualização
- KPIs recalculados para período selecionado

#### Cenário 4: Alertas de Orçamento

**Passos:**
1. Localizar secção de "Alertas de Orçamento"
2. Verificar lista de projetos com orçamento excedido
3. Clicar em alerta para ver detalhes

**Resultado Esperado:**
- Alertas ordenados por severidade (crítico primeiro)
- Ícones visuais indicam nível de alerta
- Percentagem de utilização exibida
- Link para projeto funcional

### 3.3 Testes de Desempenho

Os seguintes testes de desempenho devem ser executados para garantir tempos de resposta adequados:

| Teste | Métrica | Objetivo | Método |
|-------|---------|----------|--------|
| Query KPIs | Tempo de resposta | < 500ms | Browser DevTools Network |
| Evolução Orçamento | Tempo de resposta | < 800ms | Browser DevTools Network |
| Renderização Gráficos | First Paint | < 2s | Lighthouse Performance |
| Interatividade | Time to Interactive | < 3s | Lighthouse Performance |
| Carga de Dados | Payload Size | < 100KB | Browser DevTools Network |

**Procedimento de Teste:**

Para medir o desempenho das queries financeiras, deve-se utilizar as ferramentas de desenvolvimento do browser (F12) e seguir os seguintes passos:

1. Abrir DevTools → Network tab
2. Limpar cache e recarregar página
3. Filtrar por "trpc" para ver apenas chamadas API
4. Registar tempo de resposta de cada endpoint
5. Verificar tamanho do payload JSON
6. Executar Lighthouse audit para métricas gerais

**Critérios de Aceitação:**
- Todas as queries completam em menos de 1 segundo
- Página atinge score Lighthouse Performance > 80
- Sem memory leaks após 5 minutos de uso
- Gráficos renderizam suavemente (60 FPS)

### 3.4 Testes de Integração

Os testes de integração verificam a comunicação entre componentes do sistema:

#### Teste: Fluxo Completo de Análise Financeira

**Cenário:** Utilizador cria novo projeto com orçamento e despesas, depois visualiza no dashboard.

**Passos:**
1. Criar novo projeto via interface de projetos
2. Definir orçamento de €50.000
3. Adicionar 3 despesas totalizando €35.000
4. Navegar para Dashboard Financeiro
5. Verificar dados aparecem nos gráficos

**Resultado Esperado:**
- Projeto aparece em "Custos Reais vs Previstos"
- Utilização de orçamento mostra 70%
- Tendências incluem novas despesas
- KPIs atualizados com novo projeto

**Critérios de Sucesso:**
- Dados sincronizados em tempo real
- Cálculos refletem valores corretos
- Sem necessidade de refresh manual

---

## 4. Sistema de Notificações WebSocket

O sistema de notificações em tempo real é crítico para alertar utilizadores sobre eventos importantes de forma instantânea.

### 4.1 Testes Automatizados (Backend)

Os testes para o sistema de notificações verificam a criação, entrega e gestão de notificações.

#### 4.1.1 Teste: Criar Notificação

**Endpoint:** `notifications.create`

**Objetivo:** Verificar criação de notificação na base de dados.

**Dados de Entrada:**
```typescript
{
  userId: 1,
  type: "deadline",
  title: "Prazo Próximo",
  message: "Projeto X tem prazo em 3 dias",
  priority: "high"
}
```

**Resultado Esperado:**
- Notificação inserida na tabela `notifications`
- ID gerado automaticamente
- `isRead` definido como `false`
- `createdAt` timestamp atual

**Critérios de Sucesso:**
- Inserção bem-sucedida sem erros
- Todos os campos obrigatórios preenchidos
- Validação de tipos correta

#### 4.1.2 Teste: Listar Notificações Não Lidas

**Endpoint:** `notifications.getUnread`

**Objetivo:** Retornar apenas notificações não lidas do utilizador.

**Resultado Esperado:** Array de notificações com `isRead = false` ordenadas por data (mais recentes primeiro).

**Critérios de Sucesso:**
- Apenas notificações do utilizador atual
- Ordenação cronológica correta
- Notificações lidas excluídas

#### 4.1.3 Teste: Marcar Como Lida

**Endpoint:** `notifications.markAsRead`

**Objetivo:** Atualizar status de notificação para lida.

**Dados de Entrada:** `{ notificationId: 123 }`

**Resultado Esperado:**
- Campo `isRead` atualizado para `true`
- Campo `readAt` preenchido com timestamp atual

**Critérios de Sucesso:**
- Update executado com sucesso
- Apenas notificação especificada afetada
- Timestamp correto registado

#### 4.1.4 Teste: Marcar Todas Como Lidas

**Endpoint:** `notifications.markAllAsRead`

**Objetivo:** Marcar todas as notificações do utilizador como lidas.

**Resultado Esperado:** Todas as notificações não lidas do utilizador atualizadas.

**Critérios de Sucesso:**
- Apenas notificações do utilizador atual afetadas
- Todas atualizadas numa única transação
- Contador de não lidas zerado

#### 4.1.5 Teste: Verificação Automática de Prazos

**Endpoint:** `notifications.checkDeadlines`

**Objetivo:** Criar notificações para tarefas/projetos com prazo próximo.

**Lógica:** Identificar itens com prazo nos próximos 7 dias e criar notificação se não existir.

**Resultado Esperado:**
- Notificações criadas para prazos em 7 dias
- Sem duplicação de notificações
- Apenas itens não concluídos considerados

**Critérios de Sucesso:**
- Query eficiente (< 200ms)
- Lógica de deduplicação funcional
- Notificações criadas com prioridade correta

### 4.2 Testes de WebSocket

Os testes de WebSocket verificam a comunicação em tempo real entre servidor e clientes.

#### 4.2.1 Teste: Conexão WebSocket

**Objetivo:** Verificar estabelecimento de conexão WebSocket.

**Procedimento:**
1. Abrir aplicação no browser
2. Verificar console para mensagem "[NotificationCenter] WebSocket connected"
3. Inspecionar DevTools → Network → WS

**Resultado Esperado:**
- Conexão WebSocket estabelecida automaticamente
- URL correto: `ws://localhost:3000/ws/notifications`
- Status: 101 Switching Protocols
- Sem erros de autenticação

**Critérios de Sucesso:**
- Conexão estabelecida em menos de 1 segundo
- Sem tentativas de reconexão desnecessárias
- Token de autenticação enviado corretamente

#### 4.2.2 Teste: Receber Notificação em Tempo Real

**Objetivo:** Verificar entrega instantânea de notificações via WebSocket.

**Procedimento:**
1. Abrir aplicação em duas abas do browser (Utilizador A e B)
2. Na aba do Utilizador A, criar tarefa e atribuir ao Utilizador B
3. Observar aba do Utilizador B

**Resultado Esperado:**
- Toast notification aparece instantaneamente na aba do Utilizador B
- Badge de contador no ícone de sino incrementa
- Notificação aparece na lista do popover
- Sem necessidade de refresh da página

**Critérios de Sucesso:**
- Latência < 500ms entre ação e notificação
- Conteúdo da notificação correto
- Toast auto-dismiss após 5 segundos
- Contador atualizado corretamente

#### 4.2.3 Teste: Reconexão Automática

**Objetivo:** Verificar reconexão automática após perda de conexão.

**Procedimento:**
1. Estabelecer conexão WebSocket
2. Simular perda de rede (DevTools → Network → Offline)
3. Aguardar 5 segundos
4. Restaurar conexão (Online)

**Resultado Esperado:**
- Hook `useWebSocket` detecta desconexão
- Tentativas de reconexão automáticas
- Conexão restaurada quando rede volta
- Notificações perdidas sincronizadas

**Critérios de Sucesso:**
- Reconexão bem-sucedida em menos de 3 segundos
- Sem perda de notificações durante desconexão
- Utilizador notificado sobre status de conexão

#### 4.2.4 Teste: Múltiplas Conexões Simultâneas

**Objetivo:** Verificar que servidor suporta múltiplos clientes conectados.

**Procedimento:**
1. Abrir aplicação em 10 abas diferentes
2. Criar notificação que afeta todos os utilizadores
3. Verificar entrega em todas as abas

**Resultado Esperado:**
- Todas as abas recebem notificação
- Sem degradação de performance
- Servidor mantém lista de conexões ativas

**Critérios de Sucesso:**
- Todas as 10 abas recebem notificação
- Latência consistente (< 500ms)
- Sem erros de servidor ou memory leaks

### 4.3 Testes Manuais (Frontend)

Os seguintes cenários devem ser testados manualmente na interface de notificações:

#### Cenário 1: Visualizar Notificações

**Passos:**
1. Clicar no ícone de sino no header
2. Observar popover de notificações
3. Verificar lista de notificações não lidas

**Resultado Esperado:**
- Popover abre suavemente com animação
- Lista de notificações visível
- Badge mostra número correto de não lidas
- Scroll funciona se lista for longa (> 5 itens)

**Critérios de Aceitação:**
- Layout responsivo e bem formatado
- Timestamps relativos ("5m atrás", "2h atrás")
- Ícones apropriados por tipo de notificação
- Botão "Ver todas" visível no rodapé

#### Cenário 2: Marcar Como Lida

**Passos:**
1. Abrir popover de notificações
2. Passar rato sobre notificação
3. Clicar no ícone de check (✓)

**Resultado Esperado:**
- Notificação removida da lista instantaneamente
- Badge de contador decrementa
- Animação suave de remoção
- Lista atualiza sem flicker

**Critérios de Aceitação:**
- Ação executada em menos de 500ms
- Feedback visual claro (loading state)
- Sem erros de console

#### Cenário 3: Marcar Todas Como Lidas

**Passos:**
1. Abrir popover com múltiplas notificações não lidas
2. Clicar em "Marcar todas como lidas"
3. Observar comportamento

**Resultado Esperado:**
- Todas as notificações removidas
- Badge zerado
- Mensagem "Sem notificações" exibida
- Toast de confirmação aparece

**Critérios de Aceitação:**
- Operação completa em menos de 1 segundo
- Confirmação visual clara
- Estado consistente após ação

#### Cenário 4: Receber Notificação em Tempo Real

**Passos:**
1. Manter aplicação aberta
2. Aguardar evento que gera notificação (prazo próximo, menção, etc.)
3. Observar comportamento

**Resultado Esperado:**
- Toast notification aparece no canto da tela
- Badge incrementa automaticamente
- Som de notificação (se implementado)
- Notificação adicionada ao popover

**Critérios de Aceitação:**
- Aparece instantaneamente (< 500ms após evento)
- Não interrompe trabalho do utilizador
- Toast auto-dismiss configurável
- Conteúdo legível e informativo

### 4.4 Testes de Tipos de Notificação

Cada tipo de notificação deve ser testado individualmente:

| Tipo | Trigger | Mensagem Esperada | Prioridade |
|------|---------|-------------------|------------|
| **deadline** | Prazo em 7 dias | "Projeto X tem prazo em 7 dias" | high |
| **status_change** | Status de projeto muda | "Projeto X mudou para Em Progresso" | medium |
| **mention** | Utilizador mencionado em comentário | "@você foi mencionado em Projeto X" | medium |
| **budget_alert** | Orçamento excede 90% | "Projeto X excedeu 90% do orçamento" | high |
| **task_assigned** | Tarefa atribuída | "Nova tarefa atribuída: Tarefa X" | medium |

**Procedimento de Teste:**

Para cada tipo de notificação, deve-se:

1. Criar condição que dispara a notificação
2. Verificar criação na base de dados
3. Confirmar entrega via WebSocket
4. Validar conteúdo e formatação
5. Testar ação associada (link para projeto/tarefa)

**Critérios de Sucesso:**
- Notificação criada com tipo correto
- Prioridade adequada ao contexto
- Mensagem clara e acionável
- Link funcional para contexto relevante

### 4.5 Testes de Segurança

Os testes de segurança garantem que notificações são entregues apenas aos utilizadores autorizados:

#### Teste: Isolamento de Notificações por Utilizador

**Objetivo:** Verificar que utilizadores só recebem suas próprias notificações.

**Procedimento:**
1. Criar notificação para Utilizador A
2. Fazer login como Utilizador B
3. Verificar lista de notificações

**Resultado Esperado:**
- Utilizador B não vê notificações do Utilizador A
- Query filtra por `userId` corretamente
- WebSocket entrega apenas para conexões do utilizador correto

**Critérios de Sucesso:**
- Zero vazamento de notificações entre utilizadores
- Validação de autenticação em todos os endpoints
- WebSocket rejeita conexões não autenticadas

#### Teste: Validação de Input

**Objetivo:** Prevenir injeção de código malicioso em notificações.

**Procedimento:**
1. Tentar criar notificação com HTML/JavaScript no título
2. Tentar criar notificação com SQL injection no conteúdo
3. Verificar sanitização

**Resultado Esperado:**
- HTML escapado e renderizado como texto
- SQL injection bloqueada por prepared statements
- XSS prevention ativo

**Critérios de Sucesso:**
- Sem execução de código malicioso
- Conteúdo sanitizado antes de renderização
- Validação de schema Zod funcional

---

## 5. Módulo de Gestão de Equipa

O módulo de gestão de equipa integra atribuição de tarefas, calendário de disponibilidade e tracking de horas trabalhadas.

### 5.1 Testes Automatizados (Backend)

Os testes unitários em `server/teamManagement.test.ts` cobrem os seguintes endpoints:

#### 5.1.1 Teste: Listar Tarefas Atribuídas

**Endpoint:** `teamManagement.getMyAssignments`

**Objetivo:** Retornar todas as tarefas atribuídas ao utilizador atual.

**Resultado Esperado:** Array de objetos com:
- ID da tarefa
- Título da tarefa
- Status (todo/in_progress/done)
- Data de atribuição
- Função do utilizador na tarefa
- Horas estimadas

**Critérios de Sucesso:**
- Apenas tarefas do utilizador atual
- Ordenação por data de atribuição (mais recentes primeiro)
- Informação completa de cada tarefa

#### 5.1.2 Teste: Atribuir Tarefa

**Endpoint:** `teamManagement.assignTask`

**Objetivo:** Atribuir tarefa existente a um membro da equipa.

**Dados de Entrada:**
```typescript
{
  taskId: 123,
  userId: 456,
  role: "Desenvolvedor",
  estimatedHours: 8
}
```

**Resultado Esperado:**
- Registo criado em `taskAssignments`
- Campo `assignedBy` preenchido com ID do utilizador atual
- Timestamp de atribuição registado

**Critérios de Sucesses:**
- Atribuição bem-sucedida
- Validação de existência de tarefa e utilizador
- Prevenção de atribuições duplicadas

#### 5.1.3 Teste: Registar Horas Trabalhadas

**Endpoint:** `teamManagement.logTime`

**Objetivo:** Criar registo de horas trabalhadas.

**Dados de Entrada:**
```typescript
{
  taskId: 123,
  description: "Desenvolvimento de funcionalidade X",
  hours: 6.5,
  date: "2026-01-09"
}
```

**Resultado Esperado:**
- Registo inserido em `timeTracking`
- Campo `userId` preenchido automaticamente
- Data e horas armazenadas corretamente

**Critérios de Sucesso:**
- Inserção bem-sucedida
- Validação de horas (> 0, <= 24)
- Associação correta com tarefa/projeto

#### 5.1.4 Teste: Obter Sumário de Horas

**Endpoint:** `teamManagement.getTimeSummary`

**Objetivo:** Calcular métricas agregadas de horas trabalhadas.

**Dados de Entrada:**
```typescript
{
  startDate: "2026-01-01",
  endDate: "2026-01-31"
}
```

**Resultado Esperado:** Objeto com:
- `totalHours` - Total de horas trabalhadas
- `daysWorked` - Número de dias com registos
- `tasksWorked` - Número de tarefas distintas
- `averageHoursPerDay` - Média de horas por dia

**Critérios de Sucesso:**
- Cálculos corretos
- Agregação por período funcional
- Tipos de dados consistentes (aceitar string ou number para decimais)

#### 5.1.5 Teste: Definir Disponibilidade

**Endpoint:** `teamManagement.setAvailability`

**Objetivo:** Registar disponibilidade do utilizador para uma data.

**Dados de Entrada:**
```typescript
{
  date: "2026-01-15",
  status: "vacation",
  notes: "Férias de Inverno"
}
```

**Resultado Esperado:**
- Registo criado ou atualizado em `userAvailability`
- Status válido (available/busy/off/vacation)
- Constraint de unicidade respeitada (um registo por utilizador por data)

**Critérios de Sucesso:**
- Upsert funcional (insert ou update conforme necessário)
- Validação de enum de status
- Notas opcionais armazenadas

#### 5.1.6 Teste: Obter Disponibilidade da Equipa

**Endpoint:** `teamManagement.getTeamAvailability`

**Objetivo:** Retornar disponibilidade de todos os membros da equipa para um período.

**Dados de Entrada:**
```typescript
{
  startDate: "2026-01-01",
  endDate: "2026-01-07"
}
```

**Resultado Esperado:** Array com disponibilidade de cada utilizador incluindo nome, email, data e status.

**Critérios de Sucesso:**
- Todos os membros da equipa incluídos
- Ordenação por data e nome
- Join com tabela `users` funcional

#### 5.1.7 Teste: Relatório de Produtividade

**Endpoint:** `teamManagement.getProductivityReport`

**Objetivo:** Gerar relatório de produtividade para um utilizador.

**Dados de Entrada:**
```typescript
{
  userId: 123,
  startDate: "2026-01-01",
  endDate: "2026-01-31"
}
```

**Resultado Esperado:** Objeto com métricas:
- Total de horas trabalhadas
- Dias trabalhados
- Tarefas concluídas
- Média de horas por dia

**Critérios de Sucesso:**
- Queries otimizadas (< 300ms)
- Cálculos precisos
- Dados de múltiplas tabelas agregados corretamente

### 5.2 Testes Manuais (Frontend)

Os seguintes cenários devem ser testados manualmente na interface de Gestão de Equipa:

#### Cenário 1: Visualizar Minhas Tarefas

**Passos:**
1. Aceder ao menu lateral → GESTÃO → Gestão de Equipa
2. Verificar tab "Minhas Tarefas" (ativo por padrão)
3. Observar lista de tarefas atribuídas

**Resultado Esperado:**
- Cards de sumário no topo (Tarefas Atribuídas, Horas, etc.)
- Lista de tarefas com informação completa
- Status visual de cada tarefa (cores diferentes)
- Função e horas estimadas visíveis
- Prazo destacado se próximo

**Critérios de Aceitação:**
- Layout limpo e organizado
- Informação legível e bem formatada
- Loading state durante carregamento
- Empty state se sem tarefas

#### Cenário 2: Registar Horas Trabalhadas

**Passos:**
1. Navegar para tab "Tracking de Horas"
2. Clicar em "Registar Horas"
3. Preencher formulário:
   - Data: hoje
   - Horas: 7.5
   - Descrição: "Desenvolvimento de testes"
4. Submeter formulário

**Resultado Esperado:**
- Dialog abre com formulário
- Campos validados (horas > 0)
- Submissão bem-sucedida
- Toast de confirmação
- Novo registo aparece na lista
- Sumário atualizado automaticamente

**Critérios de Aceitação:**
- Formulário intuitivo e responsivo
- Validação em tempo real
- Feedback visual claro
- Lista atualiza sem refresh

#### Cenário 3: Editar Registo de Horas

**Passos:**
1. Localizar registo de horas existente
2. Clicar em botão de editar (se implementado)
3. Alterar descrição ou horas
4. Guardar alterações

**Resultado Esperado:**
- Dialog de edição abre com dados preenchidos
- Alterações guardadas na base de dados
- Lista atualizada imediatamente
- Toast de confirmação

**Critérios de Aceitação:**
- Apenas próprios registos editáveis
- Validação mantida
- Sem perda de dados

#### Cenário 4: Definir Disponibilidade

**Passos:**
1. Navegar para tab "Disponibilidade"
2. Clicar em "Definir"
3. Preencher formulário:
   - Data: próxima segunda-feira
   - Status: Férias
   - Notas: "Férias anuais"
4. Guardar

**Resultado Esperado:**
- Dialog abre com formulário
- Dropdown de status com 4 opções
- Submissão bem-sucedida
- Novo registo aparece na lista "Minha Disponibilidade"
- Badge de cor apropriada ao status

**Critérios de Aceitação:**
- Formulário simples e direto
- Validação de data (não permitir passado)
- Cores consistentes por status
- Atualização automática

#### Cenário 5: Visualizar Disponibilidade da Equipa

**Passos:**
1. Permanecer no tab "Disponibilidade"
2. Observar card "Disponibilidade da Equipa"
3. Verificar lista de membros e seus status

**Resultado Esperado:**
- Lista de todos os membros da equipa
- Status de cada membro para a semana atual
- Cores visuais por status
- Notas visíveis se existirem

**Critérios de Aceitação:**
- Apenas semana atual mostrada
- Informação clara e legível
- Útil para planeamento de equipa

#### Cenário 6: Ver Relatório de Produtividade

**Passos:**
1. Navegar para tab "Produtividade"
2. Observar métricas do mês corrente

**Resultado Esperado:**
- 4 cards com métricas principais:
  - Total de Horas
  - Dias Trabalhados
  - Tarefas Concluídas
  - Média Horas/Dia
- Valores numéricos grandes e legíveis
- Ícones apropriados para cada métrica

**Critérios de Aceitação:**
- Cálculos corretos
- Formatação numérica adequada
- Layout responsivo
- Atualização automática quando novos dados

### 5.3 Testes de Integração

Os testes de integração verificam fluxos completos envolvendo múltiplos componentes:

#### Teste: Fluxo Completo de Atribuição e Tracking

**Cenário:** Gestor atribui tarefa a membro da equipa, que regista horas trabalhadas.

**Passos:**
1. Login como Gestor
2. Criar nova tarefa em projeto
3. Atribuir tarefa ao Utilizador A com 8h estimadas
4. Logout e login como Utilizador A
5. Verificar tarefa aparece em "Minhas Tarefas"
6. Registar 4 horas trabalhadas na tarefa
7. Verificar sumário atualizado
8. Logout e login como Gestor
9. Ver relatório de produtividade do Utilizador A

**Resultado Esperado:**
- Tarefa atribuída com sucesso
- Notificação enviada ao Utilizador A
- Utilizador A vê tarefa na sua lista
- Registo de horas associado à tarefa
- Sumário reflete 4 horas trabalhadas
- Gestor vê 4 horas no relatório do Utilizador A

**Critérios de Sucesso:**
- Dados consistentes em todas as etapas
- Notificações entregues em tempo real
- Cálculos corretos em relatórios
- Sem necessidade de refresh manual

#### Teste: Planeamento de Equipa com Disponibilidade

**Cenário:** Gestor verifica disponibilidade antes de atribuir tarefas.

**Passos:**
1. Utilizador A define disponibilidade como "Férias" para próxima semana
2. Utilizador B define disponibilidade como "Disponível"
3. Login como Gestor
4. Aceder a Gestão de Equipa → Disponibilidade
5. Verificar disponibilidade da equipa
6. Atribuir nova tarefa apenas ao Utilizador B

**Resultado Esperado:**
- Gestor vê claramente que Utilizador A está de férias
- Utilizador B marcado como disponível
- Decisão de atribuição informada pela disponibilidade
- Sistema não bloqueia atribuição ao Utilizador A (apenas informa)

**Critérios de Sucesso:**
- Informação de disponibilidade visível e clara
- Ajuda no planeamento de equipa
- Não cria barreiras desnecessárias

### 5.4 Testes de Usabilidade

Os testes de usabilidade avaliam a experiência do utilizador:

#### Teste: Facilidade de Registo de Horas

**Objetivo:** Medir tempo e esforço para registar horas trabalhadas.

**Procedimento:**
1. Pedir a 5 utilizadores para registar horas trabalhadas
2. Medir tempo desde abertura da página até confirmação
3. Contar número de cliques necessários
4. Recolher feedback qualitativo

**Métricas:**
- Tempo médio: < 30 segundos
- Cliques necessários: < 5
- Taxa de sucesso: 100%
- Satisfação: > 4/5

**Critérios de Aceitação:**
- Processo intuitivo sem necessidade de instruções
- Formulário simples e direto
- Feedback positivo dos utilizadores

#### Teste: Compreensão de Métricas de Produtividade

**Objetivo:** Verificar se utilizadores compreendem os relatórios.

**Procedimento:**
1. Mostrar relatório de produtividade a utilizadores
2. Perguntar o que cada métrica significa
3. Pedir para identificar tendências
4. Avaliar compreensão

**Resultado Esperado:**
- Utilizadores compreendem "Total de Horas"
- Entendem "Média Horas/Dia"
- Conseguem interpretar dados
- Identificam se estão acima/abaixo da média

**Critérios de Aceitação:**
- > 80% compreensão correta
- Métricas consideradas úteis
- Visualização clara e informativa

---

## 6. Testes de Regressão

Os testes de regressão garantem que as novas funcionalidades não quebraram funcionalidades existentes.

### 6.1 Áreas Críticas a Verificar

As seguintes áreas da plataforma devem ser testadas para garantir que continuam funcionais:

| Módulo | Funcionalidade | Teste |
|--------|----------------|-------|
| **Projetos** | Criar projeto | Criar novo projeto e verificar aparece na lista |
| **Projetos** | Editar projeto | Alterar nome e orçamento, verificar atualização |
| **Projetos** | Dashboard | Verificar métricas e gráficos carregam |
| **Tarefas** | Criar tarefa | Adicionar tarefa a projeto |
| **Tarefas** | Kanban | Arrastar tarefa entre colunas |
| **Orçamentos** | Adicionar despesa | Criar despesa e associar a projeto |
| **Biblioteca** | Adicionar material | Upload de material para biblioteca |
| **Obras** | Gestão de obra | Aceder a módulo de obras |
| **RH** | Gestão de ausências | Registar ausência |

### 6.2 Procedimento de Teste de Regressão

Para cada funcionalidade crítica, deve-se:

1. Executar teste funcional básico
2. Verificar ausência de erros de console
3. Confirmar dados persistidos corretamente
4. Validar performance não degradada

**Critérios de Aceitação:**
- Todas as funcionalidades críticas operacionais
- Sem novos erros introduzidos
- Performance mantida ou melhorada

---

## 7. Testes de Acessibilidade

Os testes de acessibilidade garantem que a plataforma é utilizável por todos os utilizadores.

### 7.1 Checklist de Acessibilidade

Os seguintes aspetos devem ser verificados:

**Navegação por Teclado:**
- [ ] Todos os botões acessíveis via Tab
- [ ] Ordem de foco lógica
- [ ] Atalhos de teclado funcionais
- [ ] Escape fecha dialogs e popovers

**Leitores de Ecrã:**
- [ ] Labels apropriados em todos os campos
- [ ] ARIA attributes corretos
- [ ] Mensagens de erro anunciadas
- [ ] Estados dinâmicos comunicados

**Contraste de Cores:**
- [ ] Texto tem contraste mínimo 4.5:1
- [ ] Botões visíveis contra fundo
- [ ] Estados de foco claramente visíveis
- [ ] Gráficos usam cores distinguíveis

**Responsividade:**
- [ ] Funcional em mobile (< 768px)
- [ ] Funcional em tablet (768px - 1024px)
- [ ] Funcional em desktop (> 1024px)
- [ ] Zoom até 200% mantém usabilidade

### 7.2 Ferramentas de Teste

As seguintes ferramentas devem ser utilizadas para validar acessibilidade:

- **axe DevTools** - Extensão browser para auditoria automática
- **WAVE** - Web Accessibility Evaluation Tool
- **Lighthouse** - Audit de acessibilidade integrado no Chrome
- **NVDA/JAWS** - Testes com leitores de ecrã reais

**Critérios de Aceitação:**
- Score Lighthouse Accessibility > 90
- Zero erros críticos no axe
- Navegação completa por teclado possível
- Compatibilidade com leitores de ecrã

---

## 8. Testes de Segurança

Os testes de segurança identificam vulnerabilidades e garantem proteção de dados.

### 8.1 Autenticação e Autorização

Os seguintes testes devem ser executados:

#### Teste: Acesso Não Autenticado

**Objetivo:** Verificar que endpoints protegidos rejeitam requisições sem autenticação.

**Procedimento:**
1. Fazer logout da aplicação
2. Tentar aceder diretamente a `/financial-dashboard`
3. Tentar chamar endpoint tRPC sem token

**Resultado Esperado:**
- Redirecionamento para página de login
- Erro 401 Unauthorized em chamadas API
- Dados sensíveis não expostos

**Critérios de Sucesso:**
- Zero acesso sem autenticação
- Mensagens de erro apropriadas
- Sem vazamento de informação

#### Teste: Controlo de Acesso por Função

**Objetivo:** Verificar que utilizadores só acedem a dados autorizados.

**Procedimento:**
1. Login como utilizador normal (não admin)
2. Tentar aceder a relatórios de outros utilizadores
3. Tentar modificar dados de outros utilizadores

**Resultado Esperado:**
- Acesso negado a dados de outros utilizadores
- Erro 403 Forbidden
- Apenas próprios dados visíveis

**Critérios de Sucesso:**
- Isolamento completo entre utilizadores
- Validação de autorização em todos os endpoints
- Sem bypass de controlos de acesso

### 8.2 Validação de Inputs

Os seguintes testes verificam validação adequada de inputs:

| Input | Teste | Resultado Esperado |
|-------|-------|-------------------|
| **Horas** | Valor negativo | Rejeitado com erro |
| **Horas** | Valor > 24 | Rejeitado com erro |
| **Data** | Formato inválido | Rejeitado com erro |
| **Descrição** | HTML/JavaScript | Sanitizado antes de armazenar |
| **Status** | Valor fora do enum | Rejeitado com erro |
| **ID** | String em vez de número | Rejeitado com erro de tipo |

**Procedimento de Teste:**

Para cada input, deve-se:

1. Submeter valor inválido via formulário
2. Verificar mensagem de erro apropriada
3. Confirmar que dados não foram persistidos
4. Tentar bypass via DevTools (modificar request)
5. Verificar validação também no backend

**Critérios de Aceitação:**
- Validação em frontend e backend
- Mensagens de erro claras e úteis
- Sem possibilidade de bypass
- Dados sempre consistentes

### 8.3 Proteção Contra Ataques Comuns

Os seguintes ataques devem ser testados:

**SQL Injection:**
- Tentar injetar SQL em campos de texto
- Verificar uso de prepared statements
- Confirmar que nenhuma query é executada

**XSS (Cross-Site Scripting):**
- Tentar injetar `<script>alert('XSS')</script>` em campos
- Verificar sanitização de HTML
- Confirmar que código não é executado

**CSRF (Cross-Site Request Forgery):**
- Verificar tokens CSRF em formulários
- Tentar submeter request de origem externa
- Confirmar rejeição de requests não autorizadas

**Critérios de Aceitação:**
- Zero vulnerabilidades críticas
- Proteções implementadas em todas as camadas
- Testes de penetração bem-sucedidos

---

## 9. Testes de Performance

Os testes de performance garantem que a plataforma mantém tempos de resposta adequados sob carga.

### 9.1 Métricas de Performance

As seguintes métricas devem ser monitorizadas:

| Métrica | Objetivo | Ferramenta |
|---------|----------|------------|
| **Time to First Byte (TTFB)** | < 200ms | Browser DevTools |
| **First Contentful Paint (FCP)** | < 1.5s | Lighthouse |
| **Largest Contentful Paint (LCP)** | < 2.5s | Lighthouse |
| **Time to Interactive (TTI)** | < 3.5s | Lighthouse |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Lighthouse |
| **Total Blocking Time (TBT)** | < 300ms | Lighthouse |

### 9.2 Testes de Carga

Os seguintes cenários de carga devem ser testados:

#### Teste: Múltiplos Utilizadores Simultâneos

**Objetivo:** Verificar comportamento com 50 utilizadores simultâneos.

**Procedimento:**
1. Usar ferramenta de load testing (k6, Artillery, JMeter)
2. Simular 50 utilizadores acedendo dashboard financeiro
3. Medir tempos de resposta e taxa de erro
4. Monitorizar uso de CPU e memória do servidor

**Resultado Esperado:**
- Tempos de resposta < 1s para 95% das requisições
- Taxa de erro < 1%
- CPU < 80%
- Memória estável (sem leaks)

**Critérios de Aceitação:**
- Sistema mantém performance sob carga
- Sem degradação significativa
- Recuperação rápida após pico

#### Teste: WebSocket com Múltiplas Conexões

**Objetivo:** Verificar escalabilidade do servidor WebSocket.

**Procedimento:**
1. Estabelecer 100 conexões WebSocket simultâneas
2. Enviar notificação broadcast para todas
3. Medir latência de entrega
4. Monitorizar uso de recursos

**Resultado Esperado:**
- Todas as conexões mantidas
- Latência < 500ms para 95% das mensagens
- Sem perda de mensagens
- Uso de memória proporcional ao número de conexões

**Critérios de Aceitação:**
- Servidor suporta 100+ conexões simultâneas
- Performance consistente
- Sem crashes ou memory leaks

### 9.3 Testes de Queries de Base de Dados

Os seguintes testes verificam performance de queries críticas:

| Query | Objetivo | Método |
|-------|----------|--------|
| `getFinancialKPIs` | < 500ms | EXPLAIN ANALYZE |
| `getBudgetEvolution` | < 800ms | EXPLAIN ANALYZE |
| `getTimeEntriesByUser` | < 300ms | EXPLAIN ANALYZE |
| `getTeamAvailability` | < 400ms | EXPLAIN ANALYZE |

**Procedimento de Teste:**

Para cada query, deve-se:

1. Executar `EXPLAIN ANALYZE` no MySQL
2. Verificar uso de índices
3. Identificar full table scans
4. Otimizar queries lentas
5. Re-testar após otimização

**Critérios de Aceitação:**
- Todas as queries usam índices apropriados
- Sem full table scans em tabelas grandes
- Tempos de resposta dentro dos objetivos
- Planos de execução eficientes

---

## 10. Ambiente de Testes

Esta secção descreve o ambiente necessário para executar os testes.

### 10.1 Requisitos de Hardware

**Servidor de Desenvolvimento:**
- CPU: 4 cores mínimo
- RAM: 8GB mínimo
- Disco: 20GB espaço livre
- Rede: Conexão estável (> 10 Mbps)

**Estação de Teste:**
- CPU: 2 cores mínimo
- RAM: 4GB mínimo
- Browsers: Chrome, Firefox, Safari, Edge (versões recentes)

### 10.2 Requisitos de Software

**Backend:**
- Node.js 22.13.0
- MySQL 8.0+
- pnpm 9.x

**Frontend:**
- Browsers modernos (últimas 2 versões)
- DevTools habilitado
- Extensões de teste (axe, WAVE)

**Ferramentas de Teste:**
- Vitest (testes unitários)
- Lighthouse (performance e acessibilidade)
- k6 ou Artillery (load testing)
- Postman ou Insomnia (testes de API)

### 10.3 Dados de Teste

Os seguintes dados devem estar disponíveis no ambiente de teste:

**Utilizadores:**
- Admin: `admin@gavinho.com` / senha de teste
- Gestor: `gestor@gavinho.com` / senha de teste
- Utilizador: `user@gavinho.com` / senha de teste

**Projetos:**
- 10 projetos ativos com orçamentos variados
- 5 projetos concluídos
- 3 projetos com orçamento excedido

**Tarefas:**
- 50 tarefas distribuídas pelos projetos
- Tarefas em diferentes estados (todo, in_progress, done)
- Tarefas atribuídas a diferentes utilizadores

**Dados Financeiros:**
- Despesas registadas nos últimos 12 meses
- Orçamentos definidos para todos os projetos
- Variação entre valores orçamentados e reais

**Dados de Tempo:**
- Registos de horas dos últimos 3 meses
- Múltiplos utilizadores com registos
- Disponibilidade definida para próximas 2 semanas

### 10.4 Configuração do Ambiente

**Passos para preparar ambiente de teste:**

1. Clonar repositório do projeto
2. Instalar dependências: `pnpm install`
3. Configurar variáveis de ambiente (`.env`)
4. Executar migrações: `pnpm db:push`
5. Popular base de dados com dados de teste (seed script)
6. Iniciar servidor de desenvolvimento: `pnpm dev`
7. Verificar acesso em `http://localhost:3000`

**Validação do Ambiente:**

Antes de iniciar testes, verificar:
- [ ] Servidor inicia sem erros
- [ ] Base de dados acessível
- [ ] Dados de teste carregados
- [ ] WebSocket funcional
- [ ] Todos os módulos acessíveis

---

## 11. Execução dos Testes

Esta secção descreve como executar os diferentes tipos de testes.

### 11.1 Testes Automatizados

**Executar todos os testes unitários:**

```bash
cd /home/ubuntu/gavinho_project_manager
pnpm test
```

**Executar testes específicos:**

```bash
# Apenas testes financeiros
pnpm test server/financial.test.ts

# Apenas testes de gestão de equipa
pnpm test server/teamManagement.test.ts

# Testes com coverage
pnpm test --coverage
```

**Interpretar resultados:**

- ✓ (verde) - Teste passou
- × (vermelho) - Teste falhou
- ○ (amarelo) - Teste ignorado/skip

**Critérios de Aceitação:**
- 100% dos testes passam
- Coverage > 70% em novos módulos
- Sem testes ignorados sem justificação

### 11.2 Testes Manuais

**Procedimento geral:**

1. Abrir checklist de testes manuais (Secção 12)
2. Para cada cenário:
   - Executar passos descritos
   - Verificar resultado esperado
   - Marcar como ✓ (passou) ou × (falhou)
   - Registar observações se falhou
3. Calcular taxa de sucesso
4. Reportar falhas para correção

**Documentação de Falhas:**

Para cada falha, registar:
- ID do teste
- Descrição do problema
- Passos para reproduzir
- Resultado esperado vs obtido
- Screenshots se aplicável
- Prioridade (crítica/alta/média/baixa)

### 11.3 Testes de Performance

**Executar audit Lighthouse:**

1. Abrir Chrome DevTools (F12)
2. Navegar para tab "Lighthouse"
3. Selecionar categorias: Performance, Accessibility, Best Practices
4. Clicar "Generate report"
5. Analisar resultados e recomendações

**Executar load test com k6:**

```bash
# Instalar k6
brew install k6  # macOS
# ou
sudo apt install k6  # Linux

# Criar script de teste (load-test.js)
# Executar teste
k6 run load-test.js
```

**Exemplo de script k6:**

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
};

export default function () {
  let res = http.get('http://localhost:3000/api/trpc/financial.getFinancialKPIs');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

### 11.4 Testes de Segurança

**Scan de vulnerabilidades com npm audit:**

```bash
cd /home/ubuntu/gavinho_project_manager
pnpm audit
```

**Teste manual de autenticação:**

1. Fazer logout
2. Tentar aceder URL protegida diretamente
3. Verificar redirecionamento para login
4. Tentar chamar API sem token (via Postman)
5. Verificar erro 401

**Teste de validação de inputs:**

1. Abrir formulário de registo de horas
2. Inspecionar elemento (F12)
3. Modificar atributo `type="number"` para `type="text"`
4. Tentar submeter valor inválido (texto, negativo, etc.)
5. Verificar que backend rejeita

---

## 12. Checklist de Testes Manuais

Esta secção fornece uma checklist completa para testes manuais das três funcionalidades.

### 12.1 Dashboard Financeiro

| ID | Teste | Status | Observações |
|----|-------|--------|-------------|
| DF-01 | Aceder ao Dashboard Financeiro via menu | ☐ | |
| DF-02 | Verificar carregamento de 4 cards de KPIs | ☐ | |
| DF-03 | Verificar valores numéricos nos KPIs | ☐ | |
| DF-04 | Verificar gráfico "Evolução de Orçamento" renderiza | ☐ | |
| DF-05 | Verificar gráfico "Custos Reais vs Previstos" renderiza | ☐ | |
| DF-06 | Verificar gráfico "Rentabilidade por Projeto" renderiza | ☐ | |
| DF-07 | Verificar gráfico "Tendências de Despesas" renderiza | ☐ | |
| DF-08 | Passar rato sobre gráfico e verificar tooltip | ☐ | |
| DF-09 | Verificar formatação de valores monetários (€) | ☐ | |
| DF-10 | Verificar formatação de percentagens (%) | ☐ | |
| DF-11 | Redimensionar janela e verificar responsividade | ☐ | |
| DF-12 | Verificar secção de "Alertas de Orçamento" | ☐ | |
| DF-13 | Clicar em alerta e verificar navegação para projeto | ☐ | |
| DF-14 | Verificar cores consistentes com tema Gavinho | ☐ | |
| DF-15 | Verificar ausência de erros no console | ☐ | |

### 12.2 Sistema de Notificações

| ID | Teste | Status | Observações |
|----|-------|--------|-------------|
| NT-01 | Verificar ícone de sino no header | ☐ | |
| NT-02 | Verificar badge de contador (se houver não lidas) | ☐ | |
| NT-03 | Clicar no ícone e verificar popover abre | ☐ | |
| NT-04 | Verificar lista de notificações não lidas | ☐ | |
| NT-05 | Verificar timestamps relativos ("5m atrás") | ☐ | |
| NT-06 | Verificar ícones por tipo de notificação | ☐ | |
| NT-07 | Passar rato sobre notificação e ver botão check | ☐ | |
| NT-08 | Clicar em check e marcar como lida | ☐ | |
| NT-09 | Verificar notificação removida da lista | ☐ | |
| NT-10 | Verificar badge decrementa | ☐ | |
| NT-11 | Clicar em "Marcar todas como lidas" | ☐ | |
| NT-12 | Verificar todas removidas e badge zerado | ☐ | |
| NT-13 | Verificar mensagem "Sem notificações" | ☐ | |
| NT-14 | Criar evento que gera notificação (ex: prazo próximo) | ☐ | |
| NT-15 | Verificar toast notification aparece | ☐ | |
| NT-16 | Verificar badge incrementa automaticamente | ☐ | |
| NT-17 | Verificar notificação adicionada ao popover | ☐ | |
| NT-18 | Clicar em notificação e verificar navegação | ☐ | |
| NT-19 | Verificar scroll funciona se lista longa | ☐ | |
| NT-20 | Verificar botão "Ver todas as notificações" | ☐ | |

### 12.3 Gestão de Equipa

| ID | Teste | Status | Observações |
|----|-------|--------|-------------|
| GE-01 | Aceder a Gestão de Equipa via menu | ☐ | |
| GE-02 | Verificar 4 cards de sumário no topo | ☐ | |
| GE-03 | Verificar valores nos cards | ☐ | |
| GE-04 | Verificar tab "Minhas Tarefas" ativo por padrão | ☐ | |
| GE-05 | Verificar lista de tarefas atribuídas | ☐ | |
| GE-06 | Verificar informação completa de cada tarefa | ☐ | |
| GE-07 | Verificar status visual (cores) das tarefas | ☐ | |
| GE-08 | Navegar para tab "Tracking de Horas" | ☐ | |
| GE-09 | Clicar em "Registar Horas" | ☐ | |
| GE-10 | Preencher formulário de horas | ☐ | |
| GE-11 | Submeter e verificar toast de confirmação | ☐ | |
| GE-12 | Verificar novo registo aparece na lista | ☐ | |
| GE-13 | Verificar sumário atualizado | ☐ | |
| GE-14 | Navegar para tab "Disponibilidade" | ☐ | |
| GE-15 | Clicar em "Definir" disponibilidade | ☐ | |
| GE-16 | Preencher formulário de disponibilidade | ☐ | |
| GE-17 | Submeter e verificar confirmação | ☐ | |
| GE-18 | Verificar novo registo em "Minha Disponibilidade" | ☐ | |
| GE-19 | Verificar badge de cor por status | ☐ | |
| GE-20 | Verificar "Disponibilidade da Equipa" | ☐ | |
| GE-21 | Verificar lista de membros e status | ☐ | |
| GE-22 | Navegar para tab "Produtividade" | ☐ | |
| GE-23 | Verificar 4 cards de métricas | ☐ | |
| GE-24 | Verificar valores calculados corretamente | ☐ | |
| GE-25 | Verificar layout responsivo em mobile | ☐ | |

---

## 13. Critérios de Aceitação

Esta secção define os critérios gerais de aceitação para considerar as funcionalidades prontas para produção.

### 13.1 Critérios Funcionais

As funcionalidades são consideradas completas quando:

- **Todos os requisitos funcionais implementados** - Cada funcionalidade especificada está operacional
- **Testes automatizados passam** - 100% dos testes unitários e integração passam
- **Testes manuais passam** - Mínimo 95% dos testes manuais passam
- **Sem bugs críticos** - Zero bugs que impedem uso normal da funcionalidade
- **Bugs não-críticos documentados** - Bugs menores registados para correção futura

### 13.2 Critérios de Performance

As funcionalidades atendem aos requisitos de performance quando:

- **Tempos de resposta adequados** - 95% das requisições completam em < 1s
- **Score Lighthouse > 80** - Performance, Acessibilidade, Best Practices
- **Suporta carga esperada** - Funciona com 50+ utilizadores simultâneos
- **Sem memory leaks** - Uso de memória estável após uso prolongado
- **WebSocket estável** - Conexões mantidas por horas sem problemas

### 13.3 Critérios de Usabilidade

As funcionalidades são consideradas usáveis quando:

- **Interface intuitiva** - Utilizadores completam tarefas sem instruções
- **Feedback claro** - Estados de loading, sucesso e erro bem comunicados
- **Mensagens de erro úteis** - Erros explicam problema e sugerem solução
- **Navegação lógica** - Fluxos fazem sentido e são eficientes
- **Acessibilidade adequada** - Navegação por teclado e leitores de ecrã funcionais

### 13.4 Critérios de Segurança

As funcionalidades são consideradas seguras quando:

- **Autenticação obrigatória** - Todos os endpoints protegidos requerem login
- **Autorização correta** - Utilizadores só acedem a dados autorizados
- **Validação completa** - Inputs validados em frontend e backend
- **Sem vulnerabilidades conhecidas** - Testes de segurança passam
- **Dados sensíveis protegidos** - Sem exposição de informação confidencial

### 13.5 Critérios de Qualidade de Código

O código é considerado de qualidade quando:

- **TypeScript sem erros** - Compilação sem erros de tipo
- **Linting passa** - Sem violações de regras ESLint
- **Código documentado** - Funções complexas têm comentários
- **Testes com coverage adequado** - Mínimo 70% coverage em novos módulos
- **Padrões consistentes** - Segue convenções do projeto

---

## 14. Relatório de Testes

Esta secção descreve o formato do relatório de testes a ser produzido após execução.

### 14.1 Estrutura do Relatório

O relatório de testes deve incluir as seguintes secções:

**1. Sumário Executivo**
- Visão geral dos testes executados
- Taxa de sucesso global
- Principais descobertas
- Recomendações

**2. Resultados por Funcionalidade**
- Dashboard Financeiro: X% testes passaram
- Sistema de Notificações: Y% testes passaram
- Gestão de Equipa: Z% testes passaram

**3. Testes Automatizados**
- Número total de testes
- Testes passados / falhados
- Coverage de código
- Tempo de execução

**4. Testes Manuais**
- Checklist completa com status
- Observações e notas
- Screenshots de problemas

**5. Testes de Performance**
- Métricas Lighthouse
- Tempos de resposta de queries
- Resultados de load testing
- Gráficos de performance

**6. Testes de Segurança**
- Vulnerabilidades identificadas
- Testes de autenticação/autorização
- Validação de inputs
- Recomendações de segurança

**7. Bugs Identificados**
- Lista de bugs por prioridade
- Descrição e passos para reproduzir
- Status (aberto/em progresso/resolvido)

**8. Conclusão**
- Avaliação geral de qualidade
- Recomendação de release
- Próximos passos

### 14.2 Métricas de Qualidade

As seguintes métricas devem ser incluídas no relatório:

| Métrica | Objetivo | Resultado |
|---------|----------|-----------|
| **Taxa de Sucesso de Testes** | > 95% | ___ % |
| **Coverage de Código** | > 70% | ___ % |
| **Score Lighthouse Performance** | > 80 | ___ |
| **Score Lighthouse Accessibility** | > 90 | ___ |
| **Bugs Críticos** | 0 | ___ |
| **Bugs Alta Prioridade** | < 5 | ___ |
| **Tempo Médio de Resposta** | < 500ms | ___ ms |
| **Taxa de Erro sob Carga** | < 1% | ___ % |

### 14.3 Recomendação de Release

Com base nos resultados dos testes, o relatório deve incluir uma recomendação clara:

**✅ APROVADO PARA PRODUÇÃO** - Quando:
- Taxa de sucesso > 95%
- Zero bugs críticos
- Performance adequada
- Segurança validada

**⚠️ APROVADO COM RESSALVAS** - Quando:
- Taxa de sucesso 90-95%
- Bugs não-críticos conhecidos
- Performance aceitável mas não ideal
- Requer monitorização próxima

**❌ NÃO APROVADO** - Quando:
- Taxa de sucesso < 90%
- Bugs críticos presentes
- Performance inadequada
- Vulnerabilidades de segurança

---

## 15. Manutenção e Evolução

Esta secção descreve como manter e evoluir o plano de testes.

### 15.1 Atualização do Plano

O plano de testes deve ser atualizado quando:

- **Novas funcionalidades adicionadas** - Criar novos casos de teste
- **Funcionalidades modificadas** - Atualizar testes existentes
- **Bugs descobertos** - Adicionar testes de regressão
- **Feedback de utilizadores** - Incorporar cenários reais
- **Mudanças de tecnologia** - Adaptar ferramentas e procedimentos

### 15.2 Automação Contínua

Para garantir qualidade contínua, deve-se:

- **Integrar testes em CI/CD** - Executar testes automaticamente em cada commit
- **Monitorizar performance em produção** - Alertas para degradação
- **Testes de fumo diários** - Verificar funcionalidades críticas
- **Revisão semanal de bugs** - Triagem e priorização
- **Retrospectivas mensais** - Melhorar processo de testes

### 15.3 Responsabilidades

As seguintes responsabilidades devem ser atribuídas:

| Papel | Responsabilidade |
|-------|------------------|
| **Desenvolvedor** | Criar testes unitários, corrigir bugs |
| **QA Engineer** | Executar testes manuais, reportar bugs |
| **Tech Lead** | Revisar cobertura de testes, aprovar releases |
| **Product Owner** | Definir critérios de aceitação, priorizar bugs |
| **DevOps** | Configurar CI/CD, monitorizar produção |

---

## 16. Conclusão

Este plano de testes fornece uma abordagem abrangente e estruturada para garantir a qualidade das três funcionalidades avançadas implementadas na Plataforma Gavinho. A combinação de testes automatizados, manuais, de performance e segurança assegura que as funcionalidades são robustas, usáveis e seguras.

A execução rigorosa deste plano de testes permitirá identificar e corrigir problemas antes do release para produção, garantindo uma experiência de utilizador de alta qualidade e minimizando riscos operacionais.

### 16.1 Próximos Passos Recomendados

Para implementar este plano de testes, recomenda-se:

1. **Preparar ambiente de teste** conforme Secção 10
2. **Executar testes automatizados** e verificar 100% passam
3. **Executar testes manuais** usando checklist da Secção 12
4. **Realizar testes de performance** e validar métricas
5. **Executar testes de segurança** e corrigir vulnerabilidades
6. **Compilar relatório de testes** conforme Secção 14
7. **Obter aprovação** para release em produção
8. **Monitorizar** funcionalidades após deploy
9. **Recolher feedback** de utilizadores reais
10. **Iterar** e melhorar continuamente

### 16.2 Recursos Adicionais

Para aprofundar conhecimentos sobre testes de software, consultar:

- **Vitest Documentation** - https://vitest.dev/
- **Testing Library** - https://testing-library.com/
- **Lighthouse Documentation** - https://developer.chrome.com/docs/lighthouse/
- **OWASP Testing Guide** - https://owasp.org/www-project-web-security-testing-guide/
- **Web.dev Performance** - https://web.dev/performance/

---

**Documento preparado por:** Manus AI  
**Data:** 09 de Janeiro de 2026  
**Versão:** 1.0  
**Projeto:** Plataforma Gavinho - Project Manager
