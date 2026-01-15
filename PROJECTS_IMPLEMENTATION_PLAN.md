# Plano de Implementação - Expansão de PROJETOS

## Análise de Estrutura Existente

### Tabelas Já Implementadas no Schema

| Funcionalidade | Tabelas Existentes | Status |
|---|---|---|
| **Ficha de Projeto** | `projects`, `clientProjects` | ✅ Existe |
| **Fases** | `projectPhases`, `phaseTemplates`, `phaseActivityLog` | ✅ Existe |
| **Marcos** | `projectMilestones`, `phaseMilestones` | ✅ Existe |
| **Equipa** | `projectTeam` | ✅ Existe |
| **Documentos** | `projectDocuments`, `clientDocuments`, `documentRevisions`, `documentAccessLog` | ✅ Existe |
| **Galeria** | `projectGallery` | ✅ Existe |
| **Materiais** | `projectMaterials` | ✅ Existe |
| **Modelos 3D** | `projectModels3D` | ✅ Existe |
| **Inspiração/Moodboards** | `projectInspirationLinks` | ✅ Existe |
| **Entrega** | `projectDeliveries` | ✅ Existe |
| **Acesso de Clientes** | `projectClientAccess` | ✅ Existe |

---

## Funcionalidades Solicitadas vs Implementação

### 1. Ficha Completa do Projeto (briefing, objetivos)
- **Status**: Parcialmente Implementado
- **O que falta**: Interface React para exibir/editar ficha completa
- **Tabelas**: `projects`, `clientProjects`
- **Próximos passos**: 
  - [ ] Criar componente `ProjectBriefing.tsx`
  - [ ] Criar endpoints tRPC para CRUD de briefing
  - [ ] Adicionar campos de briefing e objetivos na tabela `projects`

### 2. Fases Configuráveis
- **Status**: Implementado no Schema
- **O que falta**: Interface para gestão visual de fases
- **Tabelas**: `projectPhases`, `phaseTemplates`
- **Próximos passos**:
  - [ ] Criar componente `ProjectPhases.tsx` com drag-and-drop
  - [ ] Implementar endpoints tRPC para criar/editar/deletar fases
  - [ ] Adicionar status customizáveis por fase

### 3. Timeline Visual (Gantt Simplificado)
- **Status**: Não Implementado
- **O que falta**: Componente Gantt com visualização de fases e marcos
- **Tabelas**: `projectPhases`, `projectMilestones`
- **Próximos passos**:
  - [ ] Instalar biblioteca Gantt (gantt-task-react ou similar)
  - [ ] Criar componente `ProjectGantt.tsx`
  - [ ] Implementar sincronização com fases e marcos

### 4. Marcos/Milestones com Alertas
- **Status**: Schema Implementado, Interface Faltando
- **O que falta**: Componente de gestão de marcos com alertas
- **Tabelas**: `projectMilestones`, `phaseMilestones`
- **Próximos passos**:
  - [ ] Criar componente `ProjectMilestones.tsx`
  - [ ] Implementar alertas automáticos para marcos próximos
  - [ ] Adicionar notificações quando marcos são atingidos

### 5. Equipa Atribuída com Funções
- **Status**: Schema Implementado, Interface Faltando
- **O que falta**: Interface para gestão de equipa com permissões
- **Tabelas**: `projectTeam`
- **Próximos passos**:
  - [ ] Criar componente `ProjectTeam.tsx`
  - [ ] Implementar gestão de funções e permissões
  - [ ] Adicionar atribuição de tarefas por membro da equipa

### 6. Documentos Organizados por Categoria
- **Status**: Schema Implementado, Interface Faltando
- **O que falta**: Interface para organização e categorização de documentos
- **Tabelas**: `projectDocuments`, `documentRevisions`
- **Próximos passos**:
  - [ ] Criar componente `ProjectDocuments.tsx`
  - [ ] Implementar categorização (plantas, especificações, contratos, etc.)
  - [ ] Adicionar upload e gestão de versões

### 7. Histórico de Alterações ao Scope
- **Status**: Schema Implementado, Interface Faltando
- **O que falta**: Visualização de histórico com rastreamento de mudanças
- **Tabelas**: `phaseActivityLog`, `documentRevisions`
- **Próximos passos**:
  - [ ] Criar componente `ProjectHistory.tsx`
  - [ ] Implementar timeline de alterações
  - [ ] Adicionar comparação antes/depois de mudanças

### 8. Galeria de Imagens (antes/durante/depois)
- **Status**: Schema Implementado, Interface Faltando
- **O que falta**: Interface para upload e organização de imagens
- **Tabelas**: `projectGallery`
- **Próximos passos**:
  - [ ] Criar componente `ProjectGallery.tsx`
  - [ ] Implementar upload de imagens
  - [ ] Adicionar categorização (antes/durante/depois)
  - [ ] Integrar com S3 para armazenamento

### 9. Moodboards Digitais Integrados
- **Status**: Schema Implementado, Interface Faltando
- **O que falta**: Interface para criação e gestão de moodboards
- **Tabelas**: `projectInspirationLinks`
- **Próximos passos**:
  - [ ] Criar componente `ProjectMoodboards.tsx`
  - [ ] Integrar com Pinterest/Figma API
  - [ ] Adicionar criação de moodboards personalizados

### 10. Versionamento de Plantas e Desenhos
- **Status**: Schema Implementado, Interface Faltando
- **O que falta**: Interface para controle de versão de arquivos
- **Tabelas**: `projectDocuments`, `documentRevisions`, `projectModels3D`
- **Próximos passos**:
  - [ ] Criar componente `ProjectVersionControl.tsx`
  - [ ] Implementar comparação de versões
  - [ ] Adicionar rollback para versões anteriores

### 11. Comentários e Anotações em Imagens/PDFs
- **Status**: Parcialmente Implementado (para archviz)
- **O que falta**: Extensão para imagens e PDFs de projetos
- **Tabelas**: `archvizAnnotations`, `archvizComments` (modelo para expandir)
- **Próximos passos**:
  - [ ] Criar tabelas `projectImageAnnotations` e `projectPDFAnnotations`
  - [ ] Criar componente `ImageAnnotationViewer.tsx`
  - [ ] Implementar drawing tools para anotações

### 12. Link para Obra Associada
- **Status**: Schema Implementado, Interface Faltando
- **O que falta**: Interface para ligar projetos a obras
- **Tabelas**: `projects`, `constructions` (relacionamento)
- **Próximos passos**:
  - [ ] Adicionar campo `constructionId` na tabela `projects`
  - [ ] Criar componente `ProjectConstructionLink.tsx`
  - [ ] Implementar sincronização de dados entre projeto e obra

---

## Priorização de Implementação

### Fase 1 (Crítica) - Semana 1
1. Ficha completa do projeto (briefing, objetivos)
2. Fases configuráveis com interface visual
3. Marcos/milestones com alertas

### Fase 2 (Alta) - Semana 2
4. Timeline visual (Gantt)
5. Equipa atribuída com funções
6. Documentos organizados por categoria

### Fase 3 (Média) - Semana 3
7. Galeria de imagens
8. Histórico de alterações
9. Versionamento de plantas

### Fase 4 (Baixa) - Semana 4
10. Moodboards digitais
11. Anotações em imagens/PDFs
12. Link para obra associada

---

## Arquitetura de Componentes

```
ProjectDetails/
├── ProjectBriefing.tsx          (Ficha + objetivos)
├── ProjectPhases.tsx             (Fases configuráveis)
├── ProjectGantt.tsx              (Timeline visual)
├── ProjectMilestones.tsx         (Marcos + alertas)
├── ProjectTeam.tsx               (Equipa + funções)
├── ProjectDocuments.tsx          (Documentos + categorias)
├── ProjectGallery.tsx            (Galeria de imagens)
├── ProjectMoodboards.tsx         (Moodboards)
├── ProjectVersionControl.tsx     (Versionamento)
├── ImageAnnotationViewer.tsx     (Anotações)
├── ProjectHistory.tsx            (Histórico de alterações)
└── ProjectConstructionLink.tsx   (Link para obra)
```

---

## Endpoints tRPC Necessários

### Projects
- `projects.getById` - Obter detalhes completos do projeto
- `projects.update` - Atualizar informações do projeto
- `projects.getBriefing` - Obter briefing do projeto
- `projects.updateBriefing` - Atualizar briefing

### Phases
- `projectPhases.list` - Listar fases do projeto
- `projectPhases.create` - Criar nova fase
- `projectPhases.update` - Atualizar fase
- `projectPhases.delete` - Deletar fase
- `projectPhases.reorder` - Reordenar fases (drag-and-drop)

### Milestones
- `projectMilestones.list` - Listar marcos do projeto
- `projectMilestones.create` - Criar novo marco
- `projectMilestones.update` - Atualizar marco
- `projectMilestones.delete` - Deletar marco

### Team
- `projectTeam.list` - Listar membros da equipa
- `projectTeam.add` - Adicionar membro
- `projectTeam.updateRole` - Atualizar função
- `projectTeam.remove` - Remover membro

### Documents
- `projectDocuments.list` - Listar documentos
- `projectDocuments.upload` - Upload de documento
- `projectDocuments.delete` - Deletar documento
- `projectDocuments.getVersions` - Obter versões

### Gallery
- `projectGallery.list` - Listar imagens
- `projectGallery.upload` - Upload de imagem
- `projectGallery.delete` - Deletar imagem
- `projectGallery.updateCategory` - Atualizar categoria

### History
- `projectHistory.list` - Listar histórico de alterações
- `projectHistory.getChanges` - Obter detalhes de mudanças

---

## Tecnologias Recomendadas

| Funcionalidade | Biblioteca | Razão |
|---|---|---|
| Timeline Gantt | `gantt-task-react` ou `react-gantt-chart` | Visualização de fases e marcos |
| Upload de Arquivos | `react-dropzone` | UX melhorada para upload |
| Anotações em Imagens | `react-image-annotation` | Drawing tools para anotações |
| Versionamento | Controle nativo com timestamps | Já implementado no schema |
| Moodboards | Integração Pinterest API | Busca de inspiração visual |

---

## Próximas Ações

1. **Hoje**: Implementar Ficha de Projeto + Fases Configuráveis
2. **Amanhã**: Implementar Timeline Gantt + Marcos com Alertas
3. **Próxima semana**: Implementar Equipa, Documentos e Galeria
4. **Semana seguinte**: Implementar funcionalidades secundárias

