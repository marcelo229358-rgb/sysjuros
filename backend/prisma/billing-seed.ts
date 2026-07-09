import { PrismaClient, BillingPlanPeriod } from '@prisma/client';

const FEATURES = [
  { code: 'CLIENTES', name: 'Gestão de Clientes' },
  { code: 'CONTRATOS', name: 'Contratos' },
  { code: 'PARCELAS', name: 'Parcelas' },
  { code: 'JUROS', name: 'Juros e Multas' },
  { code: 'RELATORIOS_BASICOS', name: 'Relatórios Básicos' },
  { code: 'RELATORIOS_AVANCADOS', name: 'Relatórios Avançados' },
  { code: 'WHATSAPP', name: 'WhatsApp Cobrança' },
  { code: 'MULTIUSUARIO', name: 'Multi-usuário' },
  { code: 'API', name: 'API Externa' },
];

const PLANS = [
  {
    slug: 'basico',
    name: 'Básico',
    description: 'Ideal para escritórios iniciando com controle de cobranças',
    price: 49.9,
    period: BillingPlanPeriod.MONTHLY,
    limits: { maxUsuarios: 2, maxClientes: 200 },
    features: ['CLIENTES', 'CONTRATOS', 'PARCELAS', 'JUROS', 'RELATORIOS_BASICOS'],
  },
  {
    slug: 'pro',
    name: 'Pro',
    description: 'WhatsApp, mais usuários e relatórios avançados',
    price: 99.9,
    period: BillingPlanPeriod.MONTHLY,
    limits: { maxUsuarios: 8, maxClientes: 2000 },
    features: [
      'CLIENTES',
      'CONTRATOS',
      'PARCELAS',
      'JUROS',
      'RELATORIOS_BASICOS',
      'RELATORIOS_AVANCADOS',
      'WHATSAPP',
      'MULTIUSUARIO',
    ],
  },
  {
    slug: 'premium',
    name: 'Premium',
    description: 'Plano completo com API e recursos futuros',
    price: 149.9,
    period: BillingPlanPeriod.MONTHLY,
    limits: { maxUsuarios: 25, maxClientes: 99999 },
    features: [
      'CLIENTES',
      'CONTRATOS',
      'PARCELAS',
      'JUROS',
      'RELATORIOS_BASICOS',
      'RELATORIOS_AVANCADOS',
      'WHATSAPP',
      'MULTIUSUARIO',
      'API',
    ],
  },
  {
    slug: 'trial',
    name: 'Trial',
    description: 'Período de avaliação gratuita (7 dias)',
    price: 0,
    period: BillingPlanPeriod.MONTHLY,
    limits: { maxUsuarios: 1, maxClientes: 30 },
    features: ['CLIENTES', 'CONTRATOS', 'PARCELAS'],
  },
];

export async function seedBilling(prisma: PrismaClient) {
  const product = await prisma.billingProduct.upsert({
    where: { slug: 'syscontabel' },
    update: { name: 'SysContabel', active: true },
    create: { name: 'SysContabel', slug: 'syscontabel', active: true },
  });

  for (const f of FEATURES) {
    await prisma.billingFeature.upsert({
      where: { code: f.code },
      update: { name: f.name },
      create: f,
    });
  }

  const allFeatures = await prisma.billingFeature.findMany();
  const featureMap = Object.fromEntries(allFeatures.map((f) => [f.code, f.id]));

  for (const p of PLANS) {
    const plan = await prisma.billingPlan.upsert({
      where: { productId_slug: { productId: product.id, slug: p.slug } },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        period: p.period,
        limits: p.limits,
        active: true,
      },
      create: {
        productId: product.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        period: p.period,
        limits: p.limits,
        active: true,
      },
    });

    for (const code of p.features) {
      const featureId = featureMap[code];
      if (!featureId) continue;
      await prisma.billingPlanFeature.upsert({
        where: { planId_featureId: { planId: plan.id, featureId } },
        update: {},
        create: { planId: plan.id, featureId },
      });
    }
  }

  await prisma.billingCoupon.upsert({
    where: { code: 'BEMVINDO10' },
    update: { active: true },
    create: {
      code: 'BEMVINDO10',
      type: 'PERCENT',
      value: 10,
      maxUses: 1000,
      active: true,
    },
  });

  console.log('  Billing seed: SysContabel — Básico R$49,90 | Pro R$99,90 | Premium R$149,90');
  return product;
}
