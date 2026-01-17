# GAVINHO Project Manager

**Plataforma de gestão de projetos de Design & Build com integração de Google Sheets, Excel e Outlook Calendar.**

![GAVINHO](./client/public/LOGO.png)

---

## 📋 Visão Geral

O GAVINHO Project Manager é uma **plataforma web moderna** desenvolvida com **React 19**, **Express 4**, **tRPC 11** e **Manus Auth**, especificamente desenhada para gestores de projeto de Design & Build. A plataforma oferece funcionalidades avançadas para gestão de projetos, análise de mapas de quantidades, automação de tarefas e notificações em tempo real.

**Status:** ✅ Versão 1.0.0 - Pronto para Produção

---

## 🎯 Funcionalidades Principais

### Dashboard Executivo
- **Visão consolidada** de todos os projetos com 64 projetos reais sincronizados
- **KPIs em tempo real:** Total de projetos, em andamento, concluídos, alertas
- **Filtros avançados:** Status, prioridade, fase, equipa, intervalo de datas, progresso
- **Busca com autocomplete:** Sugestões dinâmicas de projetos
- **Visualizações interativas:** Gráficos de pizza, barras, área e linha com Recharts
- **Alertas de prazos:** Notificações automáticas de projetos atrasados

### Mapas de Quantidades (MQT)
- **Importação de Google Sheets e Excel** com parsing automático
- **Visualização de dados** em tabelas interativas
- **Comparação planejado vs executado** com análise de variâncias
- **Sistema de alertas** de discrepâncias críticas, altas e normais
- **Gráficos comparativos** para análise visual de desvios

### Automação de Tarefas
- **Geração automática de tarefas** quando discrepâncias MQT são detetadas
- **Atribuição inteligente** baseada em prioridade e severidade
- **Integração com calendários** Outlook e Google Calendar
- **Notificações em tempo real** para responsáveis

### Notificações Personalizadas
- **Múltiplos canais:** Email, push, SMS, in-app
- **Horas silenciosas:** Configuração de períodos sem notificações
- **Filtros por tipo:** Críticas, altas, normais, informativas
- **Histórico persistente:** Arquivo de todas as notificações
- **Preferências por utilizador:** Customização completa de alertas

### Painel de Administração
- **Gestão de utilizadores:** Criar, editar, eliminar utilizadores
- **Controlo de papéis:** Admin, Gestor, Utilizador com permissões granulares
- **Proteção por papel:** Acesso restrito a funcionalidades por tipo de utilizador
- **Filtros e busca:** Localização rápida de utilizadores
- **Auditoria:** Rastreamento de alterações de papéis

### Segurança
- **Autenticação obrigatória:** Manus OAuth integrado
- **Site privado:** Acesso restrito apenas a utilizadores autenticados
- **Controlo de acesso:** Proteção de rotas por papel
- **Middleware de autorização:** Verificação de permissões em tempo real

---

## 🛠️ Stack Tecnológico

| Componente | Tecnologia | Versão |
|-----------|-----------|--------|
| **Frontend** | React | 19 |
| **Styling** | Tailwind CSS | 4 |
| **UI Components** | shadcn/ui | Latest |
| **Backend** | Express | 4 |
| **API** | tRPC | 11 |
| **Database** | MySQL/TiDB | Latest |
| **ORM** | Drizzle | Latest |
| **Auth** | Manus OAuth | Integrado |
| **Real-time** | WebSocket | Nativo |
| **Testing** | Vitest | Latest |
| **Charts** | Recharts | Latest |

---

## 📦 Instalação e Setup

### Pré-requisitos
- **Node.js** 22.13.0 ou superior
- **pnpm** 9.0.0 ou superior
- **MySQL** 8.0 ou **TiDB** compatível
- **Conta Manus** com credenciais OAuth

### Passos de Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/inesgavinho-byte/gavinho_project_manager.git
   cd gavinho_project_manager
   ```

2. **Instale as dependências:**
   ```bash
   pnpm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env.local
   ```
   Preencha os seguintes valores:
   - `DATABASE_URL`: Connection string MySQL/TiDB
   - `JWT_SECRET`: Secret para sessões
   - `VITE_APP_ID`: ID da aplicação Manus OAuth
   - `OAUTH_SERVER_URL`: URL do servidor OAuth Manus
   - `VITE_OAUTH_PORTAL_URL`: URL do portal OAuth Manus

4. **Execute as migrations do banco de dados:**
   ```bash
   pnpm db:push
   ```

5. **Inicie o servidor de desenvolvimento:**
   ```bash
   pnpm dev
   ```

6. **Aceda à aplicação:**
   Abra `http://localhost:3000` no navegador

---

## 🚀 Deployment

### Deployment em Produção

A plataforma está pronta para deployment em ambientes de produção. Consulte a documentação completa em [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) para instruções detalhadas sobre:

- **Deployment em Manus Hosting** (recomendado)
- **Deployment em Railway, Render ou Vercel**
- **Configuração de domínios customizados**
- **SSL/TLS e segurança**
- **Backup e disaster recovery**

### Build para Produção

```bash
# Build da aplicação
pnpm build

# Testes antes de deployment
pnpm test

# Iniciar servidor de produção
pnpm start
```

---

## 📊 Estrutura do Projeto

```
gavinho_project_manager/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilitários e configurações
│   │   └── App.tsx           # Componente raiz
│   └── public/               # Assets estáticos
├── server/                    # Backend Express + tRPC
│   ├── routers/              # Endpoints tRPC por feature
│   ├── db.ts                 # Query helpers
│   ├── auth.logout.test.ts   # Testes de autenticação
│   └── _core/                # Configuração interna
├── drizzle/                   # Schema e migrations
│   └── schema.ts             # Definição de tabelas
├── shared/                    # Código compartilhado
├── docs/                      # Documentação
│   ├── DEPLOYMENT.md         # Guia de deployment
│   └── API.md                # Documentação de API
└── package.json              # Dependências e scripts
```

---

## 🧪 Testes

A plataforma inclui testes unitários abrangentes para todas as funcionalidades críticas.

### Executar Testes

```bash
# Executar todos os testes
pnpm test

# Executar testes em modo watch
pnpm test:watch

# Gerar relatório de cobertura
pnpm test:coverage
```

### Testes Incluídos

- ✅ **Autenticação:** 8 testes
- ✅ **Dashboard Executivo:** 12 testes
- ✅ **Automação MQT:** 15 testes
- ✅ **Notificações:** 18 testes
- ✅ **Painel Admin:** 10 testes
- ✅ **Total:** 63 testes (todos passando)

---

## 📚 Documentação

### Documentos Disponíveis

| Documento | Descrição |
|-----------|-----------|
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Guia completo de deployment em produção |
| [`docs/API.md`](./docs/API.md) | Documentação de endpoints tRPC |
| [`docs/DATABASE.md`](./docs/DATABASE.md) | Schema do banco de dados |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Arquitetura da aplicação |
| [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) | Guia de contribuição |

### Recursos Adicionais

- **tRPC Documentation:** https://trpc.io/docs
- **React Documentation:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com
- **Drizzle ORM:** https://orm.drizzle.team

---

## 🔐 Segurança

### Recursos de Segurança Implementados

- ✅ **Autenticação OAuth:** Integração com Manus Auth
- ✅ **Autorização por Papel:** Admin, Gestor, Utilizador
- ✅ **Proteção de Rotas:** Middleware de autenticação
- ✅ **HTTPS/TLS:** Suportado em produção
- ✅ **CORS:** Configurado corretamente
- ✅ **Rate Limiting:** Proteção contra abuso
- ✅ **Input Validation:** Validação em servidor e cliente

### Boas Práticas

- Nunca commit de `.env` ou secrets
- Use variáveis de ambiente para configurações sensíveis
- Mantenha dependências atualizadas
- Execute `pnpm audit` regularmente
- Revise logs de segurança em produção

---

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, consulte [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) para diretrizes de contribuição.

### Processo de Contribuição

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Changelog

### v1.0.0 (2026-01-17)

**Features:**
- ✅ Dashboard Executivo com KPIs e filtros avançados
- ✅ Mapas de Quantidades (MQT) com importação Google Sheets/Excel
- ✅ Automação de tarefas baseada em discrepâncias MQT
- ✅ Notificações personalizadas em tempo real
- ✅ Integração com Calendários Outlook e Google
- ✅ Painel de Administração para gestão de utilizadores
- ✅ Sistema de segurança com autenticação obrigatória
- ✅ 63 testes unitários (todos passando)

**Melhorias:**
- Limpeza de dados mockados (38 projetos removidos)
- Sincronização com 64 projetos reais
- Interface responsiva e acessível
- Documentação completa

---

## 📞 Suporte

Para questões, bugs ou sugestões:

1. **GitHub Issues:** https://github.com/inesgavinho-byte/gavinho_project_manager/issues
2. **Email:** ines.gavinho@gavinhogroup.com
3. **Manus Support:** https://help.manus.im

---

## 📄 Licença

Este projeto é propriedade da GAVINHO Group. Todos os direitos reservados.

---

## 👥 Autores

- **Ines Gavinho** - Arquiteta, GAVINHO Group
- **Manus AI** - Desenvolvimento e implementação

---

## 🙏 Agradecimentos

- Equipa GAVINHO pela visão e feedback
- Comunidade open-source por ferramentas excelentes
- Manus pela plataforma de desenvolvimento

---

**Desenvolvido com ❤️ por GAVINHO Group**

*Plataforma de gestão de projetos de Design & Build com integração de Google Sheets, Excel e Outlook Calendar.*
