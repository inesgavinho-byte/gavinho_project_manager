# Guia de Deployment - GAVINHO Project Manager

Este documento fornece instruções detalhadas para fazer deployment da plataforma GAVINHO Project Manager em ambientes de produção.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Deployment em Manus Hosting](#deployment-em-manus-hosting)
3. [Deployment em Railway](#deployment-em-railway)
4. [Deployment em Render](#deployment-em-render)
5. [Deployment em Vercel](#deployment-em-vercel)
6. [Configuração de Domínios](#configuração-de-domínios)
7. [SSL/TLS e Segurança](#ssltls-e-segurança)
8. [Backup e Disaster Recovery](#backup-e-disaster-recovery)
9. [Monitoramento e Logs](#monitoramento-e-logs)
10. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

Antes de fazer deployment, certifique-se que tem:

- ✅ Repositório GitHub com código atualizado
- ✅ Variáveis de ambiente configuradas
- ✅ Base de dados MySQL/TiDB preparada
- ✅ Credenciais Manus OAuth
- ✅ Domínio customizado (opcional)
- ✅ Certificado SSL/TLS (para HTTPS)

---

## 🚀 Deployment em Manus Hosting (Recomendado)

**Manus Hosting é a forma mais simples e recomendada de fazer deployment.**

### Passos

1. **Aceda ao Management UI do Manus**
   - Abra a interface de controlo do projeto
   - Clique no botão **"Publicar"** (Publish) no canto superior direito

2. **Confirme a publicação**
   - Verifique que o checkpoint está atualizado
   - Clique em **"Publicar Agora"** (Publish Now)

3. **Aguarde o deployment**
   - O Manus fará build e deployment automático
   - Verá um indicador de progresso
   - Quando terminar, receberá um URL público

4. **Verifique o deployment**
   - Aceda ao URL público fornecido
   - Teste login com credenciais Manus OAuth
   - Verifique que todas as funcionalidades funcionam

### Vantagens do Manus Hosting

- ✅ **Automático:** Build e deployment com um clique
- ✅ **Seguro:** HTTPS automático, SSL gerido
- ✅ **Escalável:** Infraestrutura gerida automaticamente
- ✅ **Integrado:** Logs, monitoramento e backups inclusos
- ✅ **Suporte:** Equipa Manus disponível 24/7

---

## 🚂 Deployment em Railway

Railway é uma plataforma de hosting moderna com suporte a Node.js.

### Passos

1. **Crie uma conta em Railway**
   - Aceda a https://railway.app
   - Faça login com GitHub

2. **Crie um novo projeto**
   - Clique em **"New Project"**
   - Selecione **"Deploy from GitHub"**
   - Autorize o Railway a aceder ao seu GitHub

3. **Selecione o repositório**
   - Escolha `gavinho_project_manager`
   - Clique em **"Deploy"**

4. **Configure as variáveis de ambiente**
   - Vá para **"Variables"** no projeto
   - Adicione todas as variáveis do `.env.local`:
     ```
     DATABASE_URL=mysql://...
     JWT_SECRET=...
     VITE_APP_ID=...
     OAUTH_SERVER_URL=...
     VITE_OAUTH_PORTAL_URL=...
     ```

5. **Configure o banco de dados**
   - Adicione um plugin MySQL ao projeto
   - Ou use uma base de dados externa

6. **Deploy automático**
   - Railway fará deploy automático quando fizer push para GitHub
   - Aceda ao URL fornecido

### Configuração de Railway

```yaml
# railway.toml (opcional)
[build]
builder = "nixpacks"

[deploy]
startCommand = "pnpm start"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

---

## 🎨 Deployment em Render

Render oferece hosting gratuito com suporte a Node.js e PostgreSQL.

### Passos

1. **Crie uma conta em Render**
   - Aceda a https://render.com
   - Faça login com GitHub

2. **Crie um novo Web Service**
   - Clique em **"New +"**
   - Selecione **"Web Service"**
   - Conecte seu repositório GitHub

3. **Configure o serviço**
   - **Name:** `gavinho-project-manager`
   - **Environment:** `Node`
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`

4. **Configure as variáveis de ambiente**
   - Adicione todas as variáveis necessárias
   - Render fornecerá um URL público

5. **Deploy**
   - Render fará deploy automático
   - Aceda ao URL fornecido

---

## ⚡ Deployment em Vercel

Vercel é otimizado para aplicações React/Next.js.

### Passos

1. **Crie uma conta em Vercel**
   - Aceda a https://vercel.com
   - Faça login com GitHub

2. **Importe o projeto**
   - Clique em **"New Project"**
   - Selecione `gavinho_project_manager`
   - Clique em **"Import"**

3. **Configure as variáveis de ambiente**
   - Adicione todas as variáveis necessárias
   - Vercel as injetará automaticamente

4. **Deploy**
   - Vercel fará deploy automático
   - Aceda ao URL fornecido

### Nota sobre Vercel

Vercel é otimizado para aplicações estáticas/serverless. Para esta aplicação com backend Express, recomendamos **Manus Hosting**, **Railway** ou **Render**.

---

## 🌐 Configuração de Domínios

### Adicionar Domínio Customizado em Manus

1. **Aceda ao Management UI**
   - Vá para **Settings → Domains**

2. **Adicione um novo domínio**
   - Clique em **"Add Domain"**
   - Escolha entre:
     - **Comprar novo domínio** (Manus gerencia tudo)
     - **Usar domínio existente** (configure DNS manualmente)

3. **Configure DNS (se domínio existente)**
   - Adicione um record CNAME apontando para Manus
   - Aguarde propagação DNS (até 48 horas)

4. **Verifique o domínio**
   - Aceda ao seu domínio customizado
   - Verifique que HTTPS funciona

### Configurar Domínio em Railway/Render

1. **Obtenha o URL do serviço**
   - Railway/Render fornecerão um URL público

2. **Configure DNS no seu registrador**
   - Adicione um CNAME apontando para o URL do serviço
   - Exemplo: `gavinho.com CNAME service-url.railway.app`

3. **Aguarde propagação**
   - DNS pode levar até 48 horas para propagar

---

## 🔒 SSL/TLS e Segurança

### HTTPS Automático em Manus

- ✅ Manus fornece HTTPS automático
- ✅ Certificados SSL geridos automaticamente
- ✅ Renovação automática de certificados

### HTTPS em Railway/Render

- ✅ HTTPS automático incluído
- ✅ Certificados Let's Encrypt geridos automaticamente

### Boas Práticas de Segurança

1. **Variáveis de Ambiente**
   - Nunca commit de `.env` ou secrets
   - Use variáveis de ambiente do hosting

2. **Credenciais**
   - Rotacione JWT_SECRET regularmente
   - Use credenciais diferentes para dev/prod

3. **Firewall**
   - Configure firewall para aceitar apenas tráfego HTTPS
   - Restrinja acesso a base de dados

4. **Monitoramento**
   - Ative logs de auditoria
   - Monitore tentativas de acesso não autorizadas

---

## 💾 Backup e Disaster Recovery

### Backup da Base de Dados

#### Em Manus Hosting

- ✅ Backups automáticos diários
- ✅ Retenção de 30 dias
- ✅ Recuperação com um clique

#### Em Railway/Render

Implemente backup manual:

```bash
# Backup MySQL
mysqldump -u user -p database > backup.sql

# Restaurar backup
mysql -u user -p database < backup.sql
```

### Backup do Código

- ✅ GitHub é o backup do código
- ✅ Todos os commits são preservados
- ✅ Pode fazer rollback para qualquer commit anterior

### Plano de Disaster Recovery

1. **Backup diário** da base de dados
2. **Teste mensal** de recuperação
3. **Documentação** de procedimentos
4. **Contactos de emergência** definidos

---

## 📊 Monitoramento e Logs

### Monitoramento em Manus

- ✅ Dashboard de monitoramento integrado
- ✅ Alertas automáticos de erros
- ✅ Métricas de performance

### Logs em Manus

Aceda aos logs via Management UI:
- **Logs de aplicação:** Erros e eventos
- **Logs de acesso:** Requisições HTTP
- **Logs de banco de dados:** Queries e erros

### Monitoramento em Railway/Render

Ambas as plataformas fornecem:
- ✅ Logs em tempo real
- ✅ Alertas de erros
- ✅ Métricas de CPU/memória

### Configurar Alertas

Configure alertas para:
- ❌ Taxa de erro > 5%
- ❌ Tempo de resposta > 2s
- ❌ Uso de memória > 80%
- ❌ Falhas de banco de dados

---

## 🔧 Troubleshooting

### Problema: "Database connection failed"

**Solução:**
1. Verifique `DATABASE_URL` está correto
2. Confirme que base de dados está acessível
3. Verifique credenciais de acesso
4. Teste conexão: `mysql -u user -p -h host database`

### Problema: "OAuth login not working"

**Solução:**
1. Verifique `VITE_APP_ID` e `OAUTH_SERVER_URL`
2. Confirme que URL de callback está registrado em Manus
3. Verifique que domínio está correto

### Problema: "Build fails"

**Solução:**
1. Verifique `pnpm install` sem erros localmente
2. Confirme que todas as dependências estão em `package.json`
3. Verifique Node.js version compatível
4. Limpe cache: `pnpm install --force`

### Problema: "Aplicação lenta em produção"

**Solução:**
1. Verifique logs de performance
2. Otimize queries de banco de dados
3. Ative caching de assets
4. Considere upgrade de recursos

### Problema: "SSL certificate error"

**Solução:**
1. Verifique que domínio está correto
2. Aguarde propagação DNS (até 48 horas)
3. Limpe cache do navegador
4. Teste em navegador privado

---

## 📞 Suporte

Para questões sobre deployment:

1. **Documentação Manus:** https://help.manus.im
2. **Documentação Railway:** https://docs.railway.app
3. **Documentação Render:** https://render.com/docs
4. **GitHub Issues:** https://github.com/inesgavinho-byte/gavinho_project_manager/issues

---

**Última atualização:** 17 de Janeiro de 2026

**Versão:** 1.0.0
