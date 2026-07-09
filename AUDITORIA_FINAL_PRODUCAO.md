# AUDITORIA FINAL DE PRODUÇÃO — SysContabel SaaS

**Data:** 09/07/2026  
**Escopo:** Segurança, banco, billing, infraestrutura e prontidão comercial  
**Método:** Análise estática do código + verificação remota não destrutiva da API em produção  
**Ambiente analisado:** `https://api-sysjuros.appdeploy.site` / `https://sysjuros.appdeploy.site`  
**Código:** repositório local `d:\sysjuros` (sem alterações nesta auditoria)

---

## Sumário executivo

| Área | Nota | Situação |
|------|------|----------|
| Segurança | ⚠️ 6/10 | Webhooks parcialmente protegidos; faltam rate limit, Helmet e hardening geral |
| Banco de dados | ✅ 7/10 | Migrations e índices bem modelados; **sem backup automatizado** |
| Billing | ⚠️ 6/10 | Lógica completa em código; **produção com falha no webhook (HTTP 500)** |
| Infraestrutura | ✅ 7/10 | Docker sólido; SSL via NPM; logs e monitoramento básicos |
| Comercial / LGPD | ❌ 3/10 | Planos definidos; **sem termos, privacidade nem landing comercial** |

**Veredito:** O produto está **funcional como ERP de cobranças**, mas **não está pronto para venda SaaS em escala** sem corrigir itens críticos e altos listados abaixo.

---

## 1. Segurança

### 1.1 Webhooks Kiwify / Hotmart

| Item | Status | Detalhe |
|------|--------|---------|
| Rotas públicas | ⚠️ | `POST /billing/webhooks/kiwify` e `/hotmart` sempre expostas |
| Validação HMAC (Kiwify) | ⚠️ | `HMAC-SHA256` em `x-kiwify-signature` — implementado |
| Validação Hotmart | ⚠️ | `x-hotmart-hottok` comparado ao secret — implementado |
| Rejeição em produção sem secret | ✅ | `verifySignature()` retorna `false` se `NODE_ENV=production` e secret ausente → **401** |
| Raw body para HMAC | ❌ | Usa `JSON.stringify(req.body)` em vez do corpo bruto — **pode invalidar assinaturas reais** |
| Produção (teste remoto) | ❌ | `POST /billing/webhooks/kiwify` retornou **HTTP 500** (erro interno), não 401 |

**Interpretação do HTTP 500 em produção:** indica que o endpoint existe, mas falha no processamento — cenários prováveis:
- Migration `billing_*` não aplicada na VPS
- `KIWIFY_WEBHOOK_SECRET` configurado com assinatura inválida + erro não tratado
- Falha Prisma ao gravar em tabelas inexistentes

### 1.2 HMAC e autenticação

| Controle | Implementado | Observação |
|----------|--------------|------------|
| JWT tenant | ✅ | `authMiddleware` + `JWT_SECRET` |
| JWT master | ✅ | Token separado + validação de e-mail master |
| Bcrypt senhas | ✅ | `bcryptjs` no cadastro/login |
| Webhook HMAC | ⚠️ | Parcial; raw body incorreto |
| `licenseGuard` | ❌ | Existe mas **não está montado** em nenhuma rota |
| `BILLING_ENFORCE_ACCESS` | ❌ | Padrão `false` — sem bloqueio por inadimplência |

### 1.3 Idempotência

| Mecanismo | Status |
|-----------|--------|
| `billing_payments` UNIQUE `(provider, external_id)` | ✅ |
| `billing_webhook_logs` índice `(provider, external_id)` | ⚠️ Índice, **não UNIQUE** — race condition possível |
| Reenvio com mesmo `externalId` | ✅ Retorna `{ duplicate: true }` se `processed=true` |
| Payload sem `id` | ⚠️ Gera `kiwify_<timestamp>` — cada request é “único”, permite spam de logs |

### 1.4 Rate limit

| Item | Status |
|------|--------|
| `express-rate-limit` ou similar | ❌ **Não implementado** |
| Limite em `/auth/login` | ❌ |
| Limite em webhooks | ❌ |
| Limite em rotas master | ❌ |

**Risco:** brute force em login master/tenant, flood de webhooks e DoS por requisições JSON grandes.

### 1.5 Helmet e headers HTTP

| Item | Status |
|------|--------|
| `helmet` no Express | ❌ **Não instalado** |
| `X-Powered-By: Express` | ⚠️ Exposto em produção |
| HSTS / CSP / X-Frame-Options | ⚠️ Não visíveis na API (podem estar no Nginx Proxy Manager) |
| SSL | ✅ HTTPS ativo (`openresty` / NPM) |

### 1.6 Variáveis de ambiente

| Variável | Validação | Risco |
|----------|-----------|-------|
| `JWT_SECRET` | `min(1)` apenas | **Alto** — aceita secret fraco |
| `MASTER_PASSWORD` | Opcional, min 8 no bootstrap | Médio |
| `KIWIFY_WEBHOOK_SECRET` | Opcional | Crítico se ausente em prod (rejeita) ou se vazado |
| `DATABASE_URL` | Obrigatória | OK |
| `FRONTEND_URL` | Opcional | **Alto** — se ausente em prod, CORS aceita **qualquer origem** (`return true`) |
| `.env` / `.env.prod` | No `.gitignore` | ✅ |
| Credenciais em scripts versionados | ❌ | `vps-deploy.js` e `vps-diagnose.js` **commitados no Git** com senha SSH e master |

```19:26:backend/src/app.ts
function corsOrigins(): boolean | string[] {
  if (env.FRONTEND_URL) {
    return env.FRONTEND_URL.split(',').map((origin) => origin.trim());
  }
  if (env.NODE_ENV === 'development') {
    return ['http://localhost:5173', 'http://127.0.0.1:5173'];
  }
  return true;  // ← qualquer origem em produção se FRONTEND_URL vazio
}
```

---

## 2. Banco de dados

### 2.1 Migrations

| Migration | Conteúdo |
|-----------|----------|
| `20260705055833_init` | Schema core |
| `20260705072238_add_notificacoes` | Notificações |
| `20260707153331_cliente_cpf_opcional_juros_30` | Ajustes cliente/juros |
| `20260708191513_master_panel` | Master inicial |
| `20260708192451_notificacao_whatsapp_lembrete` | WhatsApp lembretes |
| `20260709055746_usuario_deve_alterar_senha` | Troca senha obrigatória |
| `20260709062353_master_panel_completo` | Master 6 seções |
| `20260709071206_add_billing_platform` | **14 tabelas billing_*** |

**Produção:** entrypoint executa `prisma migrate deploy` no start — ✅ se container sobe corretamente. O HTTP 500 no webhook sugere que **a migration billing pode não ter sido aplicada** ou falhou silenciosamente em deploy anterior.

### 2.2 Índices (principais)

**Core:** `empresaId` em parcelas, pagamentos, clientes — ✅  
**Billing:**
- `billing_payments (provider, external_id)` UNIQUE — ✅ idempotência pagamentos
- `billing_subscriptions (tenant_id, product_id)` — ✅
- `billing_webhook_logs (provider, external_id)` — ⚠️ sem UNIQUE
- `billing_licenses (tenant_id, status)` — ✅

### 2.3 Integridade referencial

| Relação | Status |
|---------|--------|
| Billing interno (plan → product, license → subscription) | ✅ FKs corretas |
| `billing_subscriptions.tenant_id` → `empresas.id` | ❌ **Sem FK** — integridade só na aplicação |
| Core multi-tenant (`empresaId` em todas as tabelas) | ✅ |

**Risco médio:** assinatura pode referenciar `tenant_id` inexistente se webhook receber UUID inválido (não cria subscription se empresa não existe — validado em `createManualSubscription`, mas não no webhook automático).

### 2.4 Backups

| Item | Status |
|------|--------|
| Script de backup PostgreSQL | ❌ **Não existe** |
| Volume Docker `sysjuros_postgres_data` | ✅ Persistente |
| Backup off-site / cron | ❌ |
| Point-in-time recovery | ❌ |
| Teste de restore documentado | ❌ |

**Risco crítico operacional:** perda do volume = perda total dos dados.

---

## 3. Billing

### 3.1 Fluxos implementados (código)

| Fluxo | Implementado | Testado local |
|-------|--------------|---------------|
| Compra aprovada (webhook) | ✅ Provisiona subscription + license + payment | ✅ `billing-sale-flow-test.ts` |
| Renovação | ✅ Estende `expiresAt` + payment | ✅ |
| Cancelamento | ✅ `CANCELLED` + license suspended | ✅ |
| Reembolso / chargeback | ✅ Payment status + subscription `SUSPENDED` | ✅ |
| Trial | ✅ `startTrial` + job 03:00 | ✅ |
| Licença | ✅ Criada com features/limits do plano | ✅ |
| Checkout Kiwify/Hotmart real | ⚠️ URL template apenas — sem API REST dos gateways | — |
| `licenseGuard` ativo | ❌ Não montado | — |

### 3.2 Estado em produção

| Verificação | Resultado |
|-------------|-----------|
| `GET /health` | ✅ 200 |
| `GET /billing/webhooks/kiwify` | 404 (esperado — só POST) |
| `POST /billing/webhooks/kiwify` (payload teste) | ❌ **500** |
| Domínio `api-syscontabel.appdeploy.site` | ❌ Não resolve (DNS inexistente) |
| Domínio correto | `api-sysjuros.appdeploy.site` |

### 3.3 Flags em produção (inferido do `.env.prod.example` e docker-compose)

| Flag | Padrão deploy | Efeito |
|------|---------------|--------|
| `BILLING_ENABLED` | `false` | Rotas master/tenant billing **não registradas** no boot |
| `BILLING_ENFORCE_ACCESS` | `false` | Sem bloqueio por licença |
| Webhooks | Sempre registrados | Independentes da flag |

**Problema de design:** se `BILLING_ENABLED=false` no boot, rotas master/tenant não existem; webhooks existem mas dependem de tabelas billing.

### 3.4 Planos comerciais (seed)

| Plano | Preço | Status |
|-------|-------|--------|
| Básico | R$ 49,90 | ✅ No seed |
| Pro | R$ 99,90 | ✅ |
| Premium | R$ 149,90 | ✅ |
| Trial | R$ 0,00 | ✅ |

---

## 4. Infraestrutura

### 4.1 Docker

| Item | Status |
|------|--------|
| Multi-stage build backend/frontend | ✅ |
| Healthchecks em todos os serviços | ✅ |
| `depends_on` com condition healthy | ✅ |
| PostgreSQL sem porta exposta no host | ✅ |
| Rede `proxy-network` externa (NPM) | ✅ |
| `restart: always` | ✅ |
| Variáveis billing no compose | ⚠️ Faltam `KIWIFY_CHECKOUT_URL`, `HOTMART_CHECKOUT_URL` |

### 4.2 VPS

| Item | Valor |
|------|-------|
| IP | 157.173.119.168 |
| Pasta | `/root/sysjuros` |
| Deploy | `vps-deploy.js` (SSH automatizado) |
| Frontend | `sysjuros.appdeploy.site` — ✅ 200 |
| API | `api-sysjuros.appdeploy.site` — ✅ 200 |

### 4.3 SSL

| Item | Status |
|------|--------|
| HTTPS frontend + API | ✅ |
| Certificado | Via Nginx Proxy Manager (`openresty`) |
| HSTS na API | ⚠️ Não confirmado nos headers da API |
| Renovação automática Let's Encrypt | ⚠️ Depende da config NPM (não verificável no código) |

### 4.4 Logs

| Tipo | Implementação |
|------|---------------|
| Aplicação | `console.log` / `console.error` |
| Auditoria tenant | `log_auditoria` (middleware em rotas CRUD) |
| Auditoria master | `master_audit_logs` |
| Auditoria billing | `billing_audit_logs` |
| Agregação (ELK, Loki, Datadog) | ❌ |
| Alertas | ❌ |
| Rotação de logs Docker | ⚠️ Padrão Docker (não configurado) |

### 4.5 Performance

| Item | Observação |
|------|------------|
| Puppeteer/Chromium no backend (PDF) | Alto consumo de RAM — risco em VPS pequena |
| Prisma connection pool | Padrão — sem tuning |
| Cache (Redis) | ❌ |
| CDN para frontend | ⚠️ Apenas cache nginx local de assets |
| Bundle frontend | ⚠️ ~876 KB JS (alerta Vite > 500 KB) |
| Job cron notificações 08h + billing 03h | ✅ |

---

## 5. Comercial / SaaS / LGPD

### 5.1 Checklist SaaS

| Item | Status |
|------|--------|
| Planos e preços definidos | ✅ |
| Checkout integrado (Kiwify/Hotmart) | ⚠️ Estrutura pronta, links manuais |
| Webhook de ativação automática | ⚠️ Código OK, produção com erro 500 |
| Página "Minha Assinatura" | ✅ |
| Painel Master Billing | ✅ |
| Landing page de venda | ❌ |
| Onboarding pós-compra | ❌ |
| Bloqueio por inadimplência | ❌ (`BILLING_ENFORCE_ACCESS=false`) |
| Faturas PDF para cliente SaaS | ❌ (`billing_invoices` existe, sem emissão) |
| Suporte / SLA documentado | ❌ |
| Status page / uptime público | ❌ |

### 5.2 LGPD

| Requisito | Status |
|-----------|--------|
| Política de Privacidade | ❌ Não existe no frontend |
| Termos de Uso | ❌ |
| Consentimento / cookies | ❌ |
| Base legal documentada | ❌ |
| DPO / canal de privacidade | ❌ |
| Exportação / exclusão de dados do titular | ❌ Endpoint dedicado |
| Registro de tratamento | ❌ |
| Dados em servidor (VPS BR/EUA?) | ⚠️ Não documentado |
| WhatsApp (Evolution API) — dados de terceiros | ⚠️ Sem política específica |

### 5.3 Termos e suporte

| Item | Status |
|------|--------|
| Termos de uso SaaS | ❌ |
| Política de reembolso | ❌ |
| Canal de suporte (e-mail, chat) | ❌ Não integrado ao produto |
| Documentação do usuário | ❌ |
| FAQ comercial | ❌ |

---

## 6. Matriz de riscos e correções sugeridas

### 🔴 CRÍTICO (corrigir antes de vender)

| # | Problema | Correção sugerida |
|---|----------|-------------------|
| C1 | **Credenciais SSH e master hardcoded** em `vps-deploy.js` / `vps-diagnose.js` versionados no Git | Remover do repo, rotacionar senha VPS e master, usar chave SSH + secrets do CI |
| C2 | **Webhook billing retorna HTTP 500 em produção** | SSH na VPS: `prisma migrate deploy`, verificar logs do container, aplicar seed billing, testar com payload válido |
| C3 | **Sem backup automatizado do PostgreSQL** | Cron diário `pg_dump` + cópia off-site (S3, outro servidor) + teste de restore mensal |
| C4 | **`BILLING_ENABLED` provavelmente `false` em produção** | Ativar após C2 resolvido; validar painel master e tenant |
| C5 | **CORS aberto em produção** se `FRONTEND_URL` vazio | Garantir `FRONTEND_URL` no `.env.prod`; tornar obrigatório em `NODE_ENV=production` no código |

### 🟠 ALTO

| # | Problema | Correção sugerida |
|---|----------|-------------------|
| A1 | Sem **rate limiting** (login, webhooks, API) | `express-rate-limit` — 5/min login, 100/min API, 30/min webhooks por IP |
| A2 | Sem **Helmet** | Adicionar `helmet()` no `app.ts` |
| A3 | **HMAC usa `JSON.stringify(req.body)`** — assinatura Kiwify pode falhar sempre | Middleware `express.raw()` na rota webhook + validar bytes originais |
| A4 | **`JWT_SECRET` sem exigência de entropia** | Validar min 32 caracteres em produção |
| A5 | **`licenseGuard` não aplicado** — SaaS vendido sem enforcement | Montar nas rotas tenant quando estável; ativar `BILLING_ENFORCE_ACCESS=true` |
| A6 | **Sem termos de uso e política de privacidade** | Páginas `/termos` e `/privacidade` + aceite no cadastro/checkout |
| A7 | **`billing_webhook_logs` sem UNIQUE** em `(provider, external_id)` | Migration com constraint UNIQUE + tratar conflito |

### 🟡 MÉDIO

| # | Problema | Correção sugerida |
|---|----------|-------------------|
| M1 | `X-Powered-By: Express` exposto | `app.disable('x-powered-by')` ou Helmet |
| M2 | Webhook sem `tenant_id` ainda grava logs/eventos | Rejeitar com 400 se `payment.approved` sem `tenant_id` |
| M3 | Sem FK `billing_subscriptions.tenant_id` → `empresas` | FK opcional ou validação obrigatória no webhook |
| M4 | Checkout Kiwify/Hotmart — só URL template | Integrar links reais por plano; documentar mapeamento UTMs |
| M5 | Logs apenas em stdout | Driver de log Docker com rotação; ou Loki/Promtail |
| M6 | Bundle frontend grande (876 KB) | Code splitting por rota (master, billing, dashboard) |
| M7 | Domínio `api-syscontabel` inexistente | Configurar DNS alias ou documentar URL correta |
| M8 | `docker-compose.prod.yml` sem `KIWIFY_CHECKOUT_URL` | Adicionar variáveis ao compose |

### 🟢 BAIXO

| # | Problema | Correção sugerida |
|---|----------|-------------------|
| B1 | Cupons no seed sem UI de aplicação no checkout | Implementar aplicação de cupom no fluxo |
| B2 | `billing_invoices` sem geração de PDF | Fase 2 comercial |
| B3 | Alerta Vite chunk size | Otimização de build |
| B4 | Falta status page pública | Better Uptime / Instatus |
| B5 | Documentação de usuário | Help center ou Notion público |

---

## 7. Plano de ação recomendado (ordem)

```
Semana 1 (bloqueadores)
├── C1 Rotacionar credenciais vazadas
├── C2 Corrigir webhook 500 (migrate + seed + logs)
├── C3 Implementar backup pg_dump diário
└── C5 Validar FRONTEND_URL na VPS

Semana 2 (segurança)
├── A1 Rate limiting
├── A2 Helmet
├── A3 Raw body webhooks
└── A4 JWT_SECRET forte

Semana 3 (comercial)
├── C4 BILLING_ENABLED=true em produção
├── A5 licenseGuard gradual
├── A6 Termos + Privacidade + LGPD
└── Configurar Kiwify/Hotmart com secrets

Semana 4 (observabilidade)
├── M5 Logs estruturados
├── Teste de restore de backup
└── Monitoramento uptime
```

---

## 8. Comandos de verificação na VPS

```bash
# Status containers
docker ps

# Logs do backend (webhook errors)
docker logs syscontabel-backend --tail 100

# Migrations aplicadas
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate status

# Tabelas billing existem?
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U $POSTGRES_USER -d $POSTGRES_DB -c "\dt billing_*"

# Variáveis billing
docker compose -f docker-compose.prod.yml exec backend env | grep BILLING
```

---

## 9. Conclusão

O **SysContabel** tem uma base técnica sólida para SaaS: multi-tenant, billing modelado, webhooks com idempotência de pagamentos, Docker em produção com SSL, e separação correta entre cobrança de clientes finais (core) e assinatura da plataforma (billing).

Porém, para **produção comercial segura**, os bloqueadores críticos são:

1. Credenciais expostas no repositório  
2. Webhook billing falhando com HTTP 500  
3. Ausência de backups  
4. Falta de documentação legal (LGPD/termos)  
5. Hardening de API (rate limit, Helmet, CORS estrito)

**Recomendação:** resolver itens **C1–C5** antes de abrir vendas públicas. Após isso, ativar billing e gateways com monitoramento.

---

*Auditoria gerada por análise de código e verificação remota. Nenhum arquivo foi alterado durante esta auditoria.*
