# RELATÓRIO DE HARDENING DE PRODUÇÃO — SysContabel SaaS

**Data:** 09/07/2026  
**Base:** Itens críticos de `AUDITORIA_FINAL_PRODUCAO.md`  
**Status:** Correções implementadas e testadas localmente

---

## Resumo por item

| # | Item | Status | Teste |
|---|------|--------|-------|
| 1 | Remover credenciais hardcoded | ✅ Concluído | Grep no repo |
| 2 | Webhook Kiwify/Hotmart (raw body, idempotência, erros) | ✅ Concluído | 25 testes + sale-flow |
| 3 | Backup PostgreSQL | ✅ Concluído | Script + documentação |
| 4 | Segurança (CORS, JWT, Helmet, rate-limit) | ✅ Concluído | Build OK |
| 5 | Testes webhook | ✅ Concluído | `webhook-hardening.test.ts` |

---

## Item 1 — Credenciais hardcoded

### Problema (C1)
`vps-deploy.js` e `vps-diagnose.js` continham senha SSH, e-mail master e senha master em texto claro.

### Correção
- Scripts reescritos para ler `vps.env.local` (gitignored)
- Template: `backend/scripts/vps.env.example`
- Deploy remoto **não injeta mais** senhas master
- Valida presença de `.env.prod` na VPS antes do deploy
- `.gitignore` atualizado: `vps.env.local`, `backups/`

### Arquivos alterados
- `backend/scripts/vps-deploy.js`
- `backend/scripts/vps-diagnose.js`
- `backend/scripts/vps.env.example` (novo)
- `.gitignore`

### Teste
```bash
# Nenhuma credencial nos scripts
rg -i "motogp|password.*=" backend/scripts/vps-deploy.js backend/scripts/vps-diagnose.js
# → sem matches
```

### ⚠️ Ação manual obrigatória
1. **Rotacionar** senha SSH da VPS e senha master (credenciais estiveram no histórico Git)
2. Criar `backend/scripts/vps.env.local` a partir do example
3. Preferir `VPS_SSH_KEY_PATH` em vez de `VPS_PASSWORD`

---

## Item 2 — Webhooks Kiwify/Hotmart

### Problemas (C2, A3, A7)
- HMAC calculado sobre `JSON.stringify(req.body)` (incorreto)
- HTTP 500 em produção sem tratamento
- `billing_webhook_logs` sem UNIQUE — race em idempotência
- Payload `approved` sem `tenant_id` gravava logs desnecessários

### Correções
1. **`express.raw()`** em `/billing/webhooks` antes de `express.json()` — corpo bruto para HMAC
2. **`webhook.util.ts`** — `getWebhookRawBody`, `parseWebhookJson`, `normalizeHeaders`
3. **Controller** — `handleWebhook()` com catch Prisma P2021/P2022 → HTTP 503
4. **HMAC** — validação de comprimento antes de `timingSafeEqual`
5. **Idempotência** — `@@unique([provider, externalId])` em `billing_webhook_logs`
6. **Validação** — `tenant_id` obrigatório em eventos `approved`/`renewed` → HTTP 400
7. Migration: `20260709075300_webhook_log_unique_hardening`

### Arquivos alterados
- `backend/src/app.ts`
- `backend/src/modules/billing/presentation/utils/webhook.util.ts` (novo)
- `backend/src/modules/billing/presentation/controllers/billing.controller.ts`
- `backend/src/modules/billing/application/services/billing.service.ts`
- `backend/src/modules/billing/infrastructure/providers/payment.providers.ts`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260709075300_webhook_log_unique_hardening/`

### Testes
```bash
npm run test                    # 25/25 ✅
npm run billing:sale-test       # fluxo completo ✅
```

### Resposta HTTP esperada após deploy

| Cenário | HTTP | Body |
|---------|------|------|
| Sem assinatura (prod + secret) | 401 | `Assinatura webhook inválida` |
| JSON inválido | 400 | `JSON do webhook inválido` |
| Approved sem tenant_id | 400 | `tenant_id obrigatório...` |
| Tabelas billing ausentes | 503 | `Módulo billing não migrado...` |
| Webhook duplicado | 200 | `{ duplicate: true }` |
| Compra válida | 200 | `{ ok: true, duplicate: false }` |

---

## Item 3 — Backup PostgreSQL

### Problema (C3)
Nenhum backup automatizado documentado.

### Correção
- Script: `backend/scripts/postgres-backup.sh` (pg_dump + gzip + retenção 14 dias)
- Documentação: `docs/BACKUP_RESTORE.md` (cron VPS, restore, validação)

### Uso
```bash
export DATABASE_URL="postgresql://..."
./backend/scripts/postgres-backup.sh
```

### Cron VPS (recomendado)
```
30 3 * * * ... pg_dump ... | gzip > /var/backups/syscontabel/syscontabel_$(date +\%Y\%m\%d).sql.gz
```

---

## Item 4 — Segurança API

### Problemas (C5, A1, A2, A4)
- CORS aberto se `FRONTEND_URL` vazio
- `JWT_SECRET` sem mínimo de entropia
- Sem Helmet e rate limiting
- `X-Powered-By` exposto

### Correções

| Controle | Implementação |
|----------|---------------|
| `FRONTEND_URL` obrigatório em produção | `env.ts` superRefine |
| CORS fechado | `config/cors.ts` — lista explícita; dev/test: localhost |
| `JWT_SECRET` ≥ 32 chars em produção | `env.ts` superRefine |
| Helmet | `app.use(helmet())` |
| Rate limit | `express-rate-limit`: auth 20/15min, webhooks 60/min, API 300/min |
| `X-Powered-By` | `app.disable('x-powered-by')` |
| JSON body limit | `express.json({ limit: '1mb' })` |

### Dependências adicionadas
- `helmet@^8.1.0`
- `express-rate-limit@^7.5.0`

### Arquivos alterados
- `backend/src/config/env.ts`
- `backend/src/config/cors.ts` (novo)
- `backend/src/app.ts`
- `backend/src/middlewares/rateLimit.middleware.ts` (novo)
- `backend/package.json`
- `.env.prod.example`

### Teste
```bash
npm run build   # ✅
```

### ⚠️ VPS — antes do próximo deploy
Garantir no `.env.prod`:
```env
FRONTEND_URL=https://sysjuros.appdeploy.site
JWT_SECRET=<mínimo 32 caracteres — openssl rand -base64 32>
KIWIFY_WEBHOOK_SECRET=<secret da Kiwify>
```

---

## Item 5 — Testes de webhook

### Novo arquivo: `webhook-hardening.test.ts`

| Cenário | Cobertura |
|---------|-----------|
| Raw body Buffer | ✅ |
| JSON inválido | ✅ |
| Headers normalizados | ✅ |
| HMAC SHA256 | ✅ |
| Compra aprovada | ✅ |
| Cancelamento | ✅ |
| Reembolso Hotmart | ✅ |
| Webhook sem tenant_id | ✅ |
| Idempotência chave | ✅ |

**Total:** 25 testes passando (6 arquivos)

---

## Migrations aplicadas neste hardening

```
20260709075300_webhook_log_unique_hardening
  - UNIQUE (provider, external_id) em billing_webhook_logs
```

---

## Deploy na VPS — checklist

```bash
cd /root/sysjuros
git pull origin main

# Atualizar .env.prod (JWT 32+, FRONTEND_URL, webhook secrets)
nano .env.prod

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Migrations (automático no entrypoint, ou manual):
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Validar webhook (deve retornar 401 sem assinatura):
curl -X POST https://api-sysjuros.appdeploy.site/billing/webhooks/kiwify \
  -H "Content-Type: application/json" \
  -d '{"order":{"id":"test1","status":"approved","tenant_id":"UUID"}}'

# Configurar backup cron (ver docs/BACKUP_RESTORE.md)
```

---

## Itens ainda pendentes (pós-hardening)

| Prioridade | Item |
|------------|------|
| Alto | Rotacionar credenciais vazadas no histórico Git |
| Alto | Deploy deste hardening na VPS |
| Alto | Configurar `KIWIFY_WEBHOOK_SECRET` em produção |
| Médio | `BILLING_ENFORCE_ACCESS=true` + montar `licenseGuard` |
| Médio | Termos de uso + Política de privacidade (LGPD) |
| Baixo | Copiar backups off-site (rsync/S3) |

---

## Conclusão

Os **5 itens críticos de hardening** foram implementados no código com testes locais aprovados. O sistema está preparado para deploy seguro após:

1. Rotação de credenciais comprometidas  
2. Deploy na VPS com `.env.prod` atualizado  
3. Configuração de backup cron  

**Próximo passo recomendado:** deploy imediato na VPS e teste do webhook com `401` (sem assinatura) seguido de teste com assinatura HMAC válida da Kiwify.
