# Plano de Ação Detalhado - Resolução de Problemas GAVINHO

**Data:** 11 de Janeiro de 2026  
**Status:** Em Progresso  
**Prioridade:** Alta

---

## 📋 Sumário Executivo

A plataforma GAVINHO está funcionando corretamente, mas existem 3 problemas principais nos testes automatizados que precisam ser resolvidos:

1. **Schema de Notificações Desincronizado** - Coluna `link` não existe no banco
2. **Routers Não Registados** - Procedures de notifications e teamManagement não encontradas
3. **Duplicação de Router** - Router `phases` duplicado em projectsRouter.ts

---

## 🔍 Fase 1: Análise e Documentação dos Problemas

### Problema 1: Schema de Notificações Desincronizado

**Descrição:**
- O schema Drizzle define a coluna `link` na tabela notifications (linha 395 em schema.ts)
- O banco de dados não tem essa coluna criada
- Erro: `Unknown column 'link' in 'field list'`

**Localização:**
- Arquivo: `drizzle/schema.ts` (linhas 388-401)
- Tabela: `notifications`
- Coluna: `link` (varchar 500)

**Impacto:**
- 4 testes falhando em `autoNotifications.test.ts`
- Queries de notificações retornam erro SQL

**Solução:**
- Executar `pnpm db:push` para sincronizar schema com banco de dados

---

### Problema 2: Routers Não Registados

**Descrição:**
- Procedures de `notifications` e `teamManagement` não encontradas
- Erro: `No procedure found on path "notifications,create"`
- Erro: `No procedure found on path "teamManagement,getTimeSummary"`

**Localização:**
- Arquivo: `server/routers.ts`
- Routers faltantes:
  - `notificationRouter` (não importado)
  - `teamManagementRouter` (desativado temporariamente)

**Impacto:**
- 12 testes falhando em `integration.test.ts`
- Funcionalidades de notificações e gestão de equipa indisponíveis

**Solução:**
- Importar `notificationRouter` em `server/routers.ts`
- Reativar e registar `teamManagementRouter`
- Adicionar ambos ao router principal

---

### Problema 3: Duplicação de Router

**Descrição:**
- Router `phases` definido duas vezes em projectsRouter.ts
- Aviso Vite: `Duplicate key "phases" in object literal`

**Localização:**
- Arquivo: `server/projectsRouter.ts`
- Linhas: ~780 (primeira definição) e depois (segunda definição)

**Impacto:**
- Aviso de compilação
- Possível conflito de rotas

**Solução:**
- Localizar ambas as definições
- Manter apenas uma (verificar qual tem mais funcionalidades)
- Remover duplicação

---

## 🛠️ Fase 2: Corrigir Schema de Notificações

### Passos:

1. **Verificar estado atual do schema**
   ```bash
   cd /home/ubuntu/gavinho_project_manager
   pnpm drizzle-kit status
   ```

2. **Gerar migração**
   ```bash
   pnpm drizzle-kit generate:mysql
   ```

3. **Executar migração**
   ```bash
   pnpm db:push
   ```

4. **Validar coluna criada**
   ```bash
   mysql -u root -p -h $MYSQL_HOST -D $MYSQL_DATABASE -e "DESCRIBE notifications;"
   ```

### Resultado Esperado:
- Coluna `link` criada na tabela notifications
- Tipo: varchar(500)
- Nullable: Sim
- Queries de notificações funcionando

---

## 🔌 Fase 3: Registar Routers Faltantes

### 3.1 Registar notificationRouter

**Arquivo:** `server/routers.ts`

**Passos:**

1. **Verificar se arquivo existe**
   ```bash
   ls -la server/notificationRouter.ts
   ```

2. **Importar em routers.ts**
   ```typescript
   import { notificationRouter } from "./notificationRouter";
   ```

3. **Registar no router principal**
   ```typescript
   export const appRouter = router({
     // ... outros routers
     notifications: notificationRouter,
   });
   ```

### 3.2 Reativar teamManagementRouter

**Arquivo:** `server/teamManagementRouter.ts`

**Passos:**

1. **Verificar arquivo**
   ```bash
   ls -la server/teamManagementRouter.ts
   ```

2. **Reativar importação em routers.ts**
   ```typescript
   import { teamManagementRouter } from "./teamManagementRouter";
   ```

3. **Registar no router principal**
   ```typescript
   export const appRouter = router({
     // ... outros routers
     teamManagement: teamManagementRouter,
   });
   ```

### Resultado Esperado:
- Procedures de notifications disponíveis
- Procedures de teamManagement disponíveis
- Testes de integração passando

---

## 🧹 Fase 4: Remover Duplicações em projectsRouter.ts

### Passos:

1. **Localizar duplicações**
   ```bash
   grep -n "phases: router" server/projectsRouter.ts
   ```

2. **Analisar ambas as definições**
   - Verificar qual tem mais funcionalidades
   - Verificar se há conflitos

3. **Manter apenas uma definição**
   - Combinar funcionalidades se necessário
   - Remover duplicação

4. **Validar sintaxe**
   ```bash
   pnpm tsc --noEmit
   ```

### Resultado Esperado:
- Sem avisos de duplicação
- Todas as funcionalidades de fases disponíveis
- Compilação sem erros

---

## ✅ Fase 5: Executar Testes e Validar

### 5.1 Executar testes de notificações

```bash
cd /home/ubuntu/gavinho_project_manager
pnpm test -- server/autoNotifications.test.ts
```

**Esperado:** 5/5 testes passando

### 5.2 Executar testes de integração

```bash
pnpm test -- server/integration.test.ts
```

**Esperado:** 14/14 testes passando (ou maioria)

### 5.3 Executar todos os testes

```bash
pnpm test
```

**Esperado:** >90% dos testes passando

### 5.4 Verificar compilação TypeScript

```bash
pnpm tsc --noEmit
```

**Esperado:** 0 erros (exceto os pré-existentes em projectsRouter.ts)

### 5.5 Testar login e dashboard

1. Navegar para `/test-login`
2. Clicar em "Entrar com Teste"
3. Verificar se dashboard carrega
4. Validar que notificações funcionam

---

## 📊 Cronograma Estimado

| Fase | Tarefa | Tempo | Status |
|------|--------|-------|--------|
| 1 | Análise e Documentação | 30 min | ✅ Concluído |
| 2 | Corrigir Schema | 15 min | ⏳ Pendente |
| 3 | Registar Routers | 20 min | ⏳ Pendente |
| 4 | Remover Duplicações | 10 min | ⏳ Pendente |
| 5 | Executar Testes | 15 min | ⏳ Pendente |
| 6 | Documentar | 10 min | ⏳ Pendente |
| **Total** | | **100 min** | |

---

## ✨ Critérios de Sucesso

- ✅ Coluna `link` criada na tabela notifications
- ✅ Todos os routers registados e acessíveis
- ✅ Sem duplicações em projectsRouter.ts
- ✅ >90% dos testes passando
- ✅ Compilação TypeScript sem erros críticos
- ✅ Dashboard carregando corretamente
- ✅ Login de teste funcionando

---

## 🚀 Próximos Passos Após Resolução

1. **Deploy em Produção** - Publicar plataforma
2. **Integração Outlook** - Conectar com email corporativo
3. **Integração Google Sheets** - Importar dados de quantidades
4. **Testes de Carga** - Validar performance com múltiplos usuários
5. **Documentação de Usuário** - Criar guia de uso

---

**Fim do Documento**
