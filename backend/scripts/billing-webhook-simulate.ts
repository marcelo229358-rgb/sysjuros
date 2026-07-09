/**
 * Simulação de webhooks Kiwify/Hotmart — Fases 3 e 5
 * Uso: npx tsx scripts/billing-webhook-simulate.ts [approved|renew|cancel|refund]
 */
import axios from 'axios';

const API = process.env.API_URL ?? 'http://localhost:3333';
const TENANT_ID = process.env.TENANT_ID ?? '1030c59f-503a-4dfc-ad8b-66c802060cd0';
const scenario = process.argv[2] ?? 'approved';

const SCENARIOS: Record<string, { provider: string; path: string; body: object }> = {
  approved: {
    provider: 'kiwify',
    path: '/billing/webhooks/kiwify',
    body: {
      order: {
        id: `sim_approved_${Date.now()}`,
        status: 'approved',
        tenant_id: TENANT_ID,
        plan_slug: 'pro',
        amount: 99.9,
        currency: 'BRL',
      },
    },
  },
  renew: {
    provider: 'hotmart',
    path: '/billing/webhooks/hotmart',
    body: {
      event: 'SUBSCRIPTION_RENEW',
      data: {
        transaction: `sim_renew_${Date.now()}`,
        tenant_id: TENANT_ID,
        plan_slug: 'pro',
        price: 99.9,
      },
    },
  },
  cancel: {
    provider: 'kiwify',
    path: '/billing/webhooks/kiwify',
    body: {
      order: {
        id: `sim_cancel_${Date.now()}`,
        status: 'cancelled',
        tenant_id: TENANT_ID,
      },
    },
  },
  refund: {
    provider: 'hotmart',
    path: '/billing/webhooks/hotmart',
    body: {
      event: 'PURCHASE_REFUNDED',
      data: {
        transaction: `sim_refund_${Date.now()}`,
        tenant_id: TENANT_ID,
        price: 99.9,
      },
    },
  },
};

async function main() {
  const cfg = SCENARIOS[scenario];
  if (!cfg) {
    console.error('Cenários: approved, renew, cancel, refund');
    process.exit(1);
  }

  console.log(`Simulando webhook: ${scenario} → ${API}${cfg.path}`);
  const res = await axios.post(`${API}${cfg.path}`, cfg.body, {
    headers: { 'Content-Type': 'application/json' },
  });
  console.log('Resposta:', JSON.stringify(res.data, null, 2));

  if (scenario === 'approved') {
    const dup = await axios.post(`${API}${cfg.path}`, cfg.body, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('\nIdempotência (2º envio):', dup.data.duplicate === true ? '✅ duplicado detectado' : '⚠️ verificar');
  }
}

main().catch((e) => {
  console.error(e.response?.data ?? e.message);
  process.exit(1);
});
