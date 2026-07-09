# Webhooks Billing — SysContabel / AppDeploy

## URLs de produção

| Gateway | URL |
|---------|-----|
| Kiwify | `https://api-sysjuros.appdeploy.site/billing/webhooks/kiwify` |
| Hotmart | `https://api-sysjuros.appdeploy.site/billing/webhooks/hotmart` |

## Variáveis de ambiente

```env
BILLING_ENABLED=true
BILLING_ENFORCE_ACCESS=false
KIWIFY_WEBHOOK_SECRET=seu_secret_kiwify
HOTMART_WEBHOOK_SECRET=seu_hottok_hotmart
KIWIFY_CHECKOUT_URL=https://pay.kiwify.com.br/SEU_LINK
HOTMART_CHECKOUT_URL=https://pay.hotmart.com/SEU_LINK
```

Em desenvolvimento, sem secrets configurados, a assinatura é ignorada (`NODE_ENV !== production`).

## Eventos aceitos

### Kiwify

| Status no payload | Evento interno | Ação |
|-------------------|----------------|------|
| `approved`, `paid` | `payment.approved` | Cria/ativa assinatura + pagamento |
| `cancelled` | `subscription.cancelled` | Cancela assinatura |
| `refund` | `payment.refunded` | Marca pagamento reembolsado |
| `chargeback` | `payment.chargeback` | Suspende assinatura |
| `renew` | `subscription.renewed` | Renova validade + pagamento |

**Payload esperado (exemplo compra aprovada):**

```json
{
  "order": {
    "id": "order_unique_id",
    "status": "approved",
    "tenant_id": "UUID_DA_EMPRESA",
    "plan_slug": "pro",
    "amount": 99.9,
    "currency": "BRL"
  }
}
```

### Hotmart

| Evento | Evento interno | Ação |
|--------|----------------|------|
| `PURCHASE_APPROVED` | `payment.approved` | Cria/ativa assinatura |
| `SUBSCRIPTION_RENEW` | `subscription.renewed` | Renova assinatura |
| `PURCHASE_REFUNDED` | `payment.refunded` | Reembolso |
| `CHARGEBACK` | `payment.chargeback` | Chargeback |
| `*CANCEL*` | `subscription.cancelled` | Cancelamento |

**Payload esperado:**

```json
{
  "event": "PURCHASE_APPROVED",
  "data": {
    "transaction": "TXN_UNIQUE_ID",
    "tenant_id": "UUID_DA_EMPRESA",
    "plan_slug": "pro",
    "price": 99.9
  }
}
```

## Idempotência

- Pagamentos: índice único `(provider, external_id)` em `billing_payments`
- Webhooks: log em `billing_webhook_logs` — reenvio com mesmo `externalId` retorna `{ duplicate: true }`

## Provisionamento automático

Se `tenant_id` + `plan_slug` chegam em compra aprovada e não há assinatura ativa:

1. Cria `billing_subscription`
2. Cria `billing_license`
3. Registra `billing_payment`
4. Sincroniza `Empresa.plano` via `LegacyPlanoAdapter`

## Testes locais

```bash
# Compra aprovada
npx tsx scripts/billing-webhook-simulate.ts approved

# Renovação
npx tsx scripts/billing-webhook-simulate.ts renew

# Cancelamento
npx tsx scripts/billing-webhook-simulate.ts cancel

# Reembolso
npx tsx scripts/billing-webhook-simulate.ts refund
```

## Checklist de configuração Kiwify

1. Criar produto com 3 ofertas (Básico, Pro, Premium)
2. Configurar webhook POST para URL acima
3. Copiar secret para `KIWIFY_WEBHOOK_SECRET`
4. No checkout, enviar `tenant_id` (UUID empresa) via UTMs ou custom fields
5. Mapear `plan_slug`: `basico`, `pro`, `premium`

## Checklist Hotmart

1. Criar produto assinatura
2. Webhook → URL acima
3. Configurar `x-hotmart-hottok` em `HOTMART_WEBHOOK_SECRET`
4. Custom data: `tenant_id`, `plan_slug`
