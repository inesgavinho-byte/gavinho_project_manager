# Guia de Execução de Testes - Plataforma Gavinho

Este guia fornece instruções práticas para executar todos os testes das novas funcionalidades implementadas.

## 📋 Índice

- [Testes Automatizados](#testes-automatizados)
- [Testes de Load](#testes-de-load)
- [Testes Manuais](#testes-manuais)
- [Interpretação de Resultados](#interpretação-de-resultados)

---

## Testes Automatizados

### Executar Todos os Testes

```bash
cd /home/ubuntu/gavinho_project_manager
pnpm test
```

### Executar Testes Específicos

```bash
# Dashboard Financeiro
pnpm test server/financial.test.ts

# Sistema de Notificações
pnpm test server/notifications.test.ts

# Gestão de Equipa
pnpm test server/teamManagement.test.ts

# Testes de Integração
pnpm test server/integration.test.ts
```

### Executar com Coverage

```bash
pnpm test --coverage
```

O relatório de coverage será gerado em `coverage/index.html`.

### Executar em Modo Watch

```bash
pnpm test --watch
```

Útil durante desenvolvimento - os testes re-executam automaticamente quando ficheiros são alterados.

---

## Testes de Load

### Pré-requisitos

Instalar k6:

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```bash
choco install k6
```

### Executar Load Test

```bash
cd /home/ubuntu/gavinho_project_manager
k6 run tests/load-test.js
```

### Configurar Variáveis de Ambiente

```bash
# URL do servidor (padrão: http://localhost:3000)
export BASE_URL=https://your-domain.com

# Token de autenticação (obter do browser após login)
export AUTH_TOKEN=your-auth-token

# Executar teste
k6 run tests/load-test.js
```

### Interpretar Resultados do k6

O k6 exibe métricas em tempo real:

- **http_req_duration** - Tempo de resposta das requisições
  - `p(95)` - 95% das requisições completaram em X ms
  - Objetivo: < 1000ms

- **http_req_failed** - Taxa de erro
  - Objetivo: < 1%

- **iterations** - Número total de iterações completadas

- **vus** - Virtual Users (utilizadores simultâneos)

**Exemplo de saída:**

```
     ✓ Financial KPIs: status 200
     ✓ Financial KPIs: response time < 500ms
     ✓ Budget Evolution: status 200
     
     checks.........................: 98.5% ✓ 2950 ✗ 45
     http_req_duration..............: avg=324ms min=120ms med=280ms max=980ms p(95)=650ms
     http_req_failed................: 0.8%  ✓ 24   ✗ 2976
     iterations.....................: 1000  16.6/s
```

---

## Testes Manuais

### Checklist de Testes Manuais

Consultar o ficheiro `PLANO_TESTES.md` secção 12 para checklist completa.

### Dashboard Financeiro

1. **Aceder ao Dashboard**
   - Menu lateral → GESTÃO → Dashboard Financeiro
   - Verificar carregamento sem erros

2. **Verificar KPIs**
   - 4 cards no topo com valores numéricos
   - Formatação correta (€, %)

3. **Interagir com Gráficos**
   - Passar rato sobre pontos de dados
   - Verificar tooltips aparecem
   - Redimensionar janela (responsividade)

4. **Verificar Alertas**
   - Secção de alertas de orçamento
   - Clicar em alerta e navegar para projeto

### Sistema de Notificações

1. **Verificar Ícone de Notificações**
   - Ícone de sino no header
   - Badge com número de não lidas

2. **Abrir Popover**
   - Clicar no ícone
   - Verificar lista de notificações

3. **Marcar Como Lida**
   - Passar rato sobre notificação
   - Clicar no check (✓)
   - Verificar remoção da lista

4. **Testar Notificação em Tempo Real**
   - Abrir aplicação em duas abas
   - Criar evento numa aba (ex: atribuir tarefa)
   - Verificar notificação aparece na outra aba

### Gestão de Equipa

1. **Visualizar Minhas Tarefas**
   - Menu lateral → GESTÃO → Gestão de Equipa
   - Tab "Minhas Tarefas"
   - Verificar lista de tarefas

2. **Registar Horas**
   - Tab "Tracking de Horas"
   - Clicar "Registar Horas"
   - Preencher formulário
   - Verificar confirmação e atualização de sumário

3. **Definir Disponibilidade**
   - Tab "Disponibilidade"
   - Clicar "Definir"
   - Escolher status (disponível/ocupado/folga/férias)
   - Verificar aparece na lista

4. **Ver Produtividade**
   - Tab "Produtividade"
   - Verificar 4 cards de métricas
   - Validar cálculos

---

## Interpretação de Resultados

### Testes Unitários (Vitest)

**Saída de Sucesso:**
```
✓ server/financial.test.ts (6 tests) 245ms
✓ server/teamManagement.test.ts (9 tests) 312ms
✓ server/integration.test.ts (12 tests) 567ms

Test Files  3 passed (3)
Tests  27 passed (27)
Duration  1.2s
```

**Saída com Falhas:**
```
× server/financial.test.ts (6 tests | 1 failed) 245ms
  × Financial Dashboard > KPIs > should get financial KPIs
    → expected 'string' to be 'number'
```

**Ações:**
- Investigar falha no teste indicado
- Verificar logs de erro detalhados
- Corrigir código ou teste conforme necessário

### Coverage Report

**Bom Coverage (> 70%):**
```
File                    | % Stmts | % Branch | % Funcs | % Lines
------------------------|---------|----------|---------|--------
financialDb.ts          |   85.2  |   78.3   |   92.1  |   86.4
teamManagementDb.ts     |   78.9  |   71.2   |   85.7  |   79.8
```

**Coverage Insuficiente (< 70%):**
```
File                    | % Stmts | % Branch | % Funcs | % Lines
------------------------|---------|----------|---------|--------
someModule.ts           |   45.2  |   38.1   |   52.3  |   46.7
```

**Ações:**
- Adicionar testes para linhas não cobertas
- Focar em branches (if/else) não testados
- Priorizar funções críticas

### Load Test (k6)

**Resultados Bons:**
- ✅ `http_req_duration p(95) < 1000ms`
- ✅ `http_req_failed < 1%`
- ✅ `checks > 95%`

**Resultados Problemáticos:**
- ❌ `http_req_duration p(95) > 2000ms` - Performance inadequada
- ❌ `http_req_failed > 5%` - Taxa de erro alta
- ❌ `checks < 90%` - Muitas validações falhando

**Ações:**
- Identificar queries lentas (> 1s)
- Otimizar índices de base de dados
- Aumentar recursos do servidor se necessário
- Implementar caching para queries frequentes

---

## Troubleshooting

### Testes Falhando por Timeout

**Problema:** Testes excedem timeout padrão (30s)

**Solução:**
```typescript
it("slow test", async () => {
  // ...
}, { timeout: 60000 }); // 60 segundos
```

### Erros de Conexão à Base de Dados

**Problema:** `Failed query: ...`

**Soluções:**
1. Verificar servidor MySQL está a correr
2. Verificar variáveis de ambiente (`.env`)
3. Executar migrações: `pnpm db:push`
4. Popular dados de teste

### Load Test Falhando com 401 Unauthorized

**Problema:** Requisições rejeitadas por falta de autenticação

**Solução:**
1. Fazer login na aplicação
2. Abrir DevTools → Application → Cookies
3. Copiar valor do cookie de sessão
4. Exportar como variável: `export AUTH_TOKEN=cookie-value`

### k6 Não Instalado

**Problema:** `command not found: k6`

**Solução:**
Seguir instruções de instalação na secção "Testes de Load" acima.

---

## Relatório de Testes

Após executar todos os testes, compilar relatório com:

- Taxa de sucesso de testes automatizados
- Coverage de código
- Resultados de load testing
- Checklist de testes manuais
- Bugs identificados
- Recomendação de release

Ver template de relatório em `PLANO_TESTES.md` secção 14.

---

## Recursos Adicionais

- **Vitest Documentation:** https://vitest.dev/
- **k6 Documentation:** https://k6.io/docs/
- **tRPC Testing:** https://trpc.io/docs/server/testing
- **Plano de Testes Completo:** `PLANO_TESTES.md`

---

**Última Atualização:** 09 de Janeiro de 2026  
**Versão:** 1.0
