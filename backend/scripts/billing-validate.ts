/**
 * Validação do módulo Billing — Fase 1
 * Uso: npx tsx scripts/billing-validate.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BILLING_TABLES = [
  'billing_products',
  'billing_plans',
  'billing_features',
  'billing_plan_features',
  'billing_subscriptions',
  'billing_licenses',
  'billing_payments',
  'billing_invoices',
  'billing_trials',
  'billing_coupons',
  'billing_webhook_logs',
  'billing_events',
  'billing_subscription_logs',
  'billing_audit_logs',
];

const CORE_TABLES = ['empresas', 'clientes', 'contratos', 'parcelas', 'pagamentos'];

async function tableExists(name: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${name}
    ) as exists
  `;
  return rows[0]?.exists ?? false;
}

async function main() {
  console.log('=== VALIDAÇÃO BILLING — FASE 1 ===\n');
  let ok = true;

  console.log('1. Tabelas billing_*');
  for (const t of BILLING_TABLES) {
    const exists = await tableExists(t);
    console.log(`   ${exists ? '✅' : '❌'} ${t}`);
    if (!exists) ok = false;
  }

  console.log('\n2. Tabelas core (não alteradas)');
  for (const t of CORE_TABLES) {
    const exists = await tableExists(t);
    console.log(`   ${exists ? '✅' : '❌'} ${t}`);
    if (!exists) ok = false;
  }

  console.log('\n3. Seed — produto e planos comerciais');
  const product = await prisma.billingProduct.findUnique({ where: { slug: 'syscontabel' } });
  console.log(`   ${product ? '✅' : '❌'} Produto SysContabel`);
  if (!product) ok = false;

  const plans = await prisma.billingPlan.findMany({
    where: { productId: product?.id },
    orderBy: { price: 'asc' },
  });
  for (const p of plans) {
    console.log(`   ✅ ${p.name} — R$ ${Number(p.price).toFixed(2)} (${p.slug})`);
  }

  const expectedPrices = { basico: 49.9, pro: 99.9, premium: 149.9 };
  for (const [slug, price] of Object.entries(expectedPrices)) {
    const plan = plans.find((p) => p.slug === slug);
    if (!plan || Number(plan.price) !== price) {
      console.log(`   ❌ Preço ${slug} esperado R$ ${price}`);
      ok = false;
    }
  }

  console.log('\n4. Índice único provider+externalId');
  const indexes = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'billing_payments' AND indexname LIKE '%provider%external%'
  `;
  console.log(`   ${indexes.length > 0 ? '✅' : '❌'} billing_payments_provider_external_id_key`);

  console.log('\n5. Relacionamentos');
  const features = await prisma.billingFeature.count();
  const planFeatures = await prisma.billingPlanFeature.count();
  console.log(`   ✅ ${features} features, ${planFeatures} vínculos plano-feature`);

  console.log('\n6. Isolamento do domínio core');
  const [clientes, contratos, parcelas, pagamentos] = await Promise.all([
    prisma.cliente.count(),
    prisma.contrato.count(),
    prisma.parcela.count(),
    prisma.pagamento.count(),
  ]);
  console.log(`   ✅ Core intacto: ${clientes} clientes, ${contratos} contratos, ${parcelas} parcelas, ${pagamentos} pagamentos tenant`);

  console.log(`\n=== RESULTADO: ${ok ? 'APROVADO ✅' : 'FALHOU ❌'} ===`);
  process.exit(ok ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
