/**
 * Ativação controlada — Fase 2: criar assinatura de teste
 * Uso: npx tsx scripts/billing-activation-test.ts
 */
import { PrismaClient, BillingSubscriptionStatus } from '@prisma/client';
import { billingService } from '../src/modules/billing/application/services/billing.service';

const DEMO_TENANT = '1030c59f-503a-4dfc-ad8b-66c802060cd0';
const prisma = new PrismaClient();

async function main() {
  console.log('=== FASE 2 — ATIVAÇÃO CONTROLADA ===\n');

  const existing = await prisma.billingSubscription.findFirst({
    where: { tenantId: DEMO_TENANT, status: { not: BillingSubscriptionStatus.CANCELLED } },
    include: { plan: true, licenses: true },
  });

  if (existing) {
    console.log(`Assinatura existente: ${existing.plan.name} (${existing.status})`);
  } else {
    const sub = await billingService.createManualSubscription(DEMO_TENANT, 'pro');
    console.log(`✅ Assinatura criada: ${sub.id}`);
  }

  const updated = await billingService.getTenantSubscription(DEMO_TENANT);
  console.log('\nEstado atual:');
  console.log(`  Plano: ${updated?.plan?.name}`);
  console.log(`  Status: ${updated?.status}`);
  console.log(`  Licenças: ${updated?.licenses?.length ?? 0}`);

  console.log('\n--- Teste alteração de plano ---');
  const premium = await prisma.billingPlan.findFirst({ where: { slug: 'premium' } });
  if (updated && premium) {
    await billingService.changePlan(updated.id, premium.id, 'activation-test');
    console.log('✅ Plano alterado para Premium');
  }

  console.log('\n--- Teste cancelamento ---');
  const current = await billingService.getTenantSubscription(DEMO_TENANT);
  if (current) {
    await billingService.cancelSubscription(current.id);
    console.log('✅ Assinatura cancelada');
  }

  console.log('\n--- Recriar assinatura Pro para produção ---');
  await billingService.createManualSubscription(DEMO_TENANT, 'pro');
  console.log('✅ Assinatura Pro reativada para demo');

  const dash = await billingService.dashboard();
  console.log('\nDashboard:');
  console.log(`  MRR: R$ ${Number(dash.mrr).toFixed(2)}`);
  console.log(`  Ativas: ${dash.activeSubscriptions}`);
  console.log(`  Trials: ${dash.activeTrials}`);

  console.log('\n=== FASE 2 CONCLUÍDA ✅ ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
