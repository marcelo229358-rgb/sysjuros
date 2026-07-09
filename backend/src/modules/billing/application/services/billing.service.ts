import {
  BillingLicenseStatus,
  BillingPaymentProvider,
  BillingPaymentStatus,
  BillingSubscriptionStatus,
  PlanoEmpresa,
  Prisma,
} from '@prisma/client';
import { prisma } from '../../../../config/database';
import { AppError } from '../../../../shared/errors/AppError';
import { BILLING_PRODUCT_SLUG, isBillingEnabled } from '../../billing.config';
import { LegacyPlanoAdapter } from '../../infrastructure/adapters/LegacyPlanoAdapter';
import { logBillingAudit } from '../../infrastructure/billingAudit.util';
import {
  getPaymentProvider,
  mapWebhookToPaymentStatus,
  mapWebhookToSubscriptionStatus,
} from '../../infrastructure/providers/payment.providers';

function addPeriod(date: Date, period: string): Date {
  const d = new Date(date);
  switch (period) {
    case 'ANNUAL':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'QUARTERLY':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'SEMIANNUAL':
      d.setMonth(d.getMonth() + 6);
      break;
    case 'LIFETIME':
      d.setFullYear(d.getFullYear() + 100);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export const billingService = {
  async getProductBySlug(slug: string) {
    return prisma.billingProduct.findUnique({ where: { slug } });
  },

  async dashboard() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      products,
      plans,
      subscriptions,
      payments,
      trials,
      webhooks,
      cancelled,
      activeTenants,
      monthlyPayments,
      planDistribution,
    ] = await Promise.all([
      prisma.billingProduct.count(),
      prisma.billingPlan.count({ where: { active: true } }),
      prisma.billingSubscription.groupBy({ by: ['status'], _count: true }),
      prisma.billingPayment.aggregate({
        where: { status: BillingPaymentStatus.APPROVED },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.billingTrial.count({ where: { active: true } }),
      prisma.billingWebhookLog.count({ where: { processed: false } }),
      prisma.billingSubscription.count({ where: { status: BillingSubscriptionStatus.CANCELLED } }),
      prisma.billingSubscription.count({
        where: { status: { in: [BillingSubscriptionStatus.ACTIVE, BillingSubscriptionStatus.TRIAL] } },
      }),
      prisma.billingPayment.findMany({
        where: { status: BillingPaymentStatus.APPROVED, paidAt: { gte: monthStart } },
        select: { amount: true, paidAt: true },
        orderBy: { paidAt: 'asc' },
      }),
      prisma.billingSubscription.groupBy({
        by: ['planId'],
        where: { status: { in: [BillingSubscriptionStatus.ACTIVE, BillingSubscriptionStatus.TRIAL] } },
        _count: true,
      }),
    ]);

    const mrrSubs = await prisma.billingSubscription.findMany({
      where: { status: { in: [BillingSubscriptionStatus.ACTIVE, BillingSubscriptionStatus.TRIAL] } },
      include: { plan: true },
    });
    const mrrTotal = mrrSubs.reduce((acc, s) => acc + Number(s.plan.price), 0);

    const planIds = planDistribution.map((p) => p.planId);
    const planNames = await prisma.billingPlan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true, slug: true },
    });
    const planNameMap = Object.fromEntries(planNames.map((p) => [p.id, p.name]));

    const revenueByDay: Record<string, number> = {};
    for (const p of monthlyPayments) {
      const day = (p.paidAt ?? now).toISOString().slice(0, 10);
      revenueByDay[day] = (revenueByDay[day] ?? 0) + Number(p.amount);
    }

    const revenueChart = Object.entries(revenueByDay).map(([date, value]) => ({ date, value }));
    const growthChart = await this.subscriberGrowthChart();
    const plansChart = planDistribution.map((p) => ({
      name: planNameMap[p.planId] ?? p.planId,
      value: p._count,
    }));

    return {
      products,
      activePlans: plans,
      subscriptionsByStatus: subscriptions,
      revenueTotal: payments._sum.amount ?? 0,
      paymentsCount: payments._count,
      activeTrials: trials,
      pendingWebhooks: webhooks,
      mrr: mrrTotal,
      activeSubscriptions: activeTenants,
      cancellations: cancelled,
      revenueChart,
      growthChart,
      plansChart,
    };
  },

  async subscriberGrowthChart() {
    const subs = await prisma.billingSubscription.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
    const byMonth: Record<string, number> = {};
    let cumulative = 0;
    return subs.map((s) => {
      const month = s.createdAt.toISOString().slice(0, 7);
      cumulative++;
      byMonth[month] = cumulative;
      return { month, subscribers: cumulative };
    }).filter((v, i, arr) => i === 0 || v.month !== arr[i - 1].month);
  },

  async listProducts() {
    return prisma.billingProduct.findMany({
      include: { plans: { where: { active: true }, orderBy: { price: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  },

  async listPlans(productId?: string) {
    return prisma.billingPlan.findMany({
      where: productId ? { productId } : undefined,
      include: { planFeatures: { include: { feature: true } }, product: true },
      orderBy: { price: 'asc' },
    });
  },

  async listFeatures() {
    return prisma.billingFeature.findMany({ orderBy: { code: 'asc' } });
  },

  async listSubscriptions(filters?: { tenantId?: string; status?: BillingSubscriptionStatus; search?: string }) {
    const subs = await prisma.billingSubscription.findMany({
      where: {
        tenantId: filters?.tenantId,
        status: filters?.status,
      },
      include: { plan: true, product: true, licenses: true, payments: { take: 5, orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });

    const tenantIds = [...new Set(subs.map((s) => s.tenantId))];
    const empresas = await prisma.empresa.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, nome: true, email: true, plano: true },
    });
    const empresaMap = Object.fromEntries(empresas.map((e) => [e.id, e]));

    const enriched = subs.map((s) => ({
      ...s,
      tenant: empresaMap[s.tenantId] ?? null,
    }));

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      return enriched.filter(
        (s) =>
          s.tenant?.nome.toLowerCase().includes(q) ||
          s.tenant?.email.toLowerCase().includes(q) ||
          s.plan.slug.includes(q)
      );
    }

    return enriched;
  },

  async createManualSubscription(tenantId: string, planSlug: string) {
    const product = await this.getProductBySlug(BILLING_PRODUCT_SLUG);
    if (!product) throw new AppError('Produto billing não configurado', 500);

    const plan = await prisma.billingPlan.findFirst({
      where: { productId: product.id, slug: planSlug },
    });
    if (!plan) throw new AppError('Plano não encontrado', 404);

    const empresa = await prisma.empresa.findUnique({ where: { id: tenantId } });
    if (!empresa) throw new AppError('Empresa (tenant) não encontrada', 404);

    return this.createSubscription(tenantId, plan.id, BillingSubscriptionStatus.ACTIVE);
  },

  async listPayments() {
    return prisma.billingPayment.findMany({
      include: { subscription: { include: { plan: true, product: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  },

  async listLicenses() {
    return prisma.billingLicense.findMany({
      include: { subscription: { include: { plan: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  },

  async listTrials() {
    return prisma.billingTrial.findMany({
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async listCoupons() {
    return prisma.billingCoupon.findMany({ orderBy: { createdAt: 'desc' } });
  },

  async listWebhookLogs() {
    return prisma.billingWebhookLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  },

  async listAuditLogs() {
    return prisma.billingAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  },

  async listEvents() {
    return prisma.billingEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  },

  async getTenantSubscription(tenantId: string) {
    const product = await this.getProductBySlug(BILLING_PRODUCT_SLUG);
    if (!product) return null;

    return prisma.billingSubscription.findFirst({
      where: { tenantId, productId: product.id },
      include: {
        plan: { include: { planFeatures: { include: { feature: true } } } },
        licenses: { where: { status: BillingLicenseStatus.ACTIVE }, orderBy: { createdAt: 'desc' }, take: 1 },
        payments: { orderBy: { createdAt: 'desc' }, take: 20 },
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async syncLegacyPlano(tenantId: string, plano: PlanoEmpresa) {
    if (!isBillingEnabled()) return;
    const product = await this.getProductBySlug(BILLING_PRODUCT_SLUG);
    if (!product) return;

    const slug = LegacyPlanoAdapter.toPlanSlug(plano);
    const plan = await prisma.billingPlan.findFirst({ where: { productId: product.id, slug } });
    if (!plan) return;

    const existing = await prisma.billingSubscription.findFirst({
      where: { tenantId, productId: product.id, status: { not: BillingSubscriptionStatus.CANCELLED } },
    });

    if (existing && existing.planId === plan.id) return existing;

    if (existing) {
      return this.changePlan(existing.id, plan.id, 'legacy_sync');
    }

    return this.createSubscription(tenantId, plan.id, BillingSubscriptionStatus.ACTIVE);
  },

  async createSubscription(
    tenantId: string,
    planId: string,
    status: BillingSubscriptionStatus = BillingSubscriptionStatus.ACTIVE
  ) {
    const plan = await prisma.billingPlan.findUnique({
      where: { id: planId },
      include: { planFeatures: { include: { feature: true } } },
    });
    if (!plan) throw new AppError('Plano não encontrado', 404);

    const expiresAt = status === BillingSubscriptionStatus.TRIAL
      ? addPeriod(new Date(), 'MONTHLY')
      : addPeriod(new Date(), plan.period);

    const subscription = await prisma.billingSubscription.create({
      data: {
        tenantId,
        productId: plan.productId,
        planId: plan.id,
        status,
        expiresAt,
      },
    });

    const features = plan.planFeatures.map((pf) => pf.feature.code);
    await prisma.billingLicense.create({
      data: {
        tenantId,
        subscriptionId: subscription.id,
        status: BillingLicenseStatus.ACTIVE,
        limits: plan.limits as Prisma.InputJsonValue,
        features: features as Prisma.InputJsonValue,
        expiresAt,
      },
    });

    await prisma.billingEvent.create({
      data: { type: 'subscription.created', tenantId, payload: { subscriptionId: subscription.id, planId } },
    });

    await logBillingAudit('subscription.created', 'subscription', { subscriptionId: subscription.id, planId }, { tenantId });

    const planoEmpresa = LegacyPlanoAdapter.toPlanoEmpresa(plan.slug);
    await prisma.empresa.update({ where: { id: tenantId }, data: { plano: planoEmpresa } }).catch(() => {});

    return subscription;
  },

  async changePlan(subscriptionId: string, planId: string, reason = 'manual') {
    const plan = await prisma.billingPlan.findUnique({
      where: { id: planId },
      include: { planFeatures: { include: { feature: true } } },
    });
    if (!plan) throw new AppError('Plano não encontrado', 404);

    const subscription = await prisma.billingSubscription.update({
      where: { id: subscriptionId },
      data: { planId, expiresAt: addPeriod(new Date(), plan.period) },
    });

    const features = plan.planFeatures.map((pf) => pf.feature.code);
    await prisma.billingLicense.updateMany({
      where: { subscriptionId, status: BillingLicenseStatus.ACTIVE },
      data: { status: BillingLicenseStatus.EXPIRED },
    });

    await prisma.billingLicense.create({
      data: {
        tenantId: subscription.tenantId,
        subscriptionId,
        status: BillingLicenseStatus.ACTIVE,
        limits: plan.limits as Prisma.InputJsonValue,
        features: features as Prisma.InputJsonValue,
        expiresAt: subscription.expiresAt,
      },
    });

    await logBillingAudit('plan.changed', 'subscription', { subscriptionId, planId, reason }, { tenantId: subscription.tenantId });

    const planoEmpresa = LegacyPlanoAdapter.toPlanoEmpresa(plan.slug);
    await prisma.empresa.update({ where: { id: subscription.tenantId }, data: { plano: planoEmpresa } }).catch(() => {});

    return subscription;
  },

  async cancelSubscription(subscriptionId: string) {
    const sub = await prisma.billingSubscription.update({
      where: { id: subscriptionId },
      data: { status: BillingSubscriptionStatus.CANCELLED, cancelledAt: new Date() },
    });
    await prisma.billingLicense.updateMany({
      where: { subscriptionId },
      data: { status: BillingLicenseStatus.SUSPENDED },
    });
    await logBillingAudit('subscription.cancelled', 'subscription', { subscriptionId }, { tenantId: sub.tenantId });
    return sub;
  },

  async startTrial(tenantId: string, days = 7) {
    const product = await this.getProductBySlug(BILLING_PRODUCT_SLUG);
    if (!product) throw new AppError('Produto billing não configurado', 500);

    const plan = await prisma.billingPlan.findFirst({
      where: { productId: product.id, slug: 'trial' },
    });
    if (!plan) throw new AppError('Plano trial não encontrado', 404);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    await prisma.billingTrial.create({
      data: { tenantId, productId: product.id, planId: plan.id, days, expiresAt },
    });

    return this.createSubscription(tenantId, plan.id, BillingSubscriptionStatus.TRIAL);
  },

  async createCheckout(tenantId: string, planSlug: string, provider: BillingPaymentProvider) {
    const product = await this.getProductBySlug(BILLING_PRODUCT_SLUG);
    if (!product) throw new AppError('Produto não encontrado', 404);

    const plan = await prisma.billingPlan.findFirst({
      where: { productId: product.id, slug: planSlug, active: true },
    });
    if (!plan) throw new AppError('Plano não encontrado', 404);

    let subscription = await prisma.billingSubscription.findFirst({
      where: { tenantId, productId: product.id, status: { not: BillingSubscriptionStatus.CANCELLED } },
    });

    if (!subscription) {
      subscription = await this.createSubscription(tenantId, plan.id);
    } else if (subscription.planId !== plan.id) {
      subscription = await this.changePlan(subscription.id, plan.id, 'checkout');
    }

    const paymentProvider = getPaymentProvider(provider);
    const checkout = await paymentProvider.createCheckout({
      subscriptionId: subscription.id,
      tenantId,
      planSlug,
      amount: Number(plan.price),
      currency: plan.currency,
    });

    return { checkout, subscription, plan };
  },

  async processWebhook(
    provider: BillingPaymentProvider,
    headers: Record<string, string>,
    body: unknown,
    rawBody: string
  ) {
    const paymentProvider = getPaymentProvider(provider);
    if (!paymentProvider.verifySignature(headers, rawBody)) {
      throw new AppError('Assinatura webhook inválida', 401);
    }

    const event = await paymentProvider.handleWebhook(headers, body);

    if (
      (event.type.includes('approved') || event.type.includes('renewed')) &&
      !event.tenantId
    ) {
      throw new AppError('tenant_id obrigatório para eventos de pagamento aprovado/renovação', 400);
    }

    let existingLog = await prisma.billingWebhookLog.findUnique({
      where: { provider_externalId: { provider, externalId: event.externalId } },
    });

    if (existingLog?.processed) {
      return { duplicate: true, event };
    }

    if (!existingLog) {
      try {
        existingLog = await prisma.billingWebhookLog.create({
          data: {
            provider,
            externalId: event.externalId,
            payload: body as Prisma.InputJsonValue,
            processed: false,
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          existingLog = await prisma.billingWebhookLog.findUnique({
            where: { provider_externalId: { provider, externalId: event.externalId } },
          });
          if (existingLog?.processed) return { duplicate: true, event };
        } else {
          throw err;
        }
      }
    }

    const paymentStatus = mapWebhookToPaymentStatus(event.type);
    const subStatus = mapWebhookToSubscriptionStatus(event.type);

    let subscriptionId: string | undefined = event.subscriptionId;

    if (event.tenantId && !subscriptionId) {
      const product = await this.getProductBySlug(BILLING_PRODUCT_SLUG);
      if (product) {
        let sub = await prisma.billingSubscription.findFirst({
          where: {
            tenantId: event.tenantId,
            productId: product.id,
            status: { not: BillingSubscriptionStatus.CANCELLED },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!sub && (event.type.includes('approved') || event.type.includes('renewed'))) {
          const planSlug = event.planSlug ?? 'pro';
          const plan = await prisma.billingPlan.findFirst({
            where: { productId: product.id, slug: planSlug },
          });
          if (plan) {
            sub = await this.createSubscription(event.tenantId, plan.id, BillingSubscriptionStatus.ACTIVE);
          }
        }

        subscriptionId = sub?.id;
      }
    }

    if (subscriptionId) {
      const existingPayment = await prisma.billingPayment.findUnique({
        where: { provider_externalId: { provider, externalId: event.externalId } },
      });

      if (!existingPayment) {
        await prisma.billingPayment.create({
          data: {
            subscriptionId,
            provider,
            externalId: event.externalId,
            status: paymentStatus,
            amount: event.amount ?? 0,
            currency: event.currency ?? 'BRL',
            paidAt: paymentStatus === BillingPaymentStatus.APPROVED ? new Date() : null,
          },
        });
      }

      if (subStatus) {
        const sub = await prisma.billingSubscription.findUnique({ where: { id: subscriptionId } });
        if (sub) {
          const expiresAt = sub.expiresAt ?? addPeriod(new Date(), 'MONTHLY');
          if (event.type.includes('renewed') || event.type.includes('approved')) {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          }
          await prisma.billingSubscription.update({
            where: { id: subscriptionId },
            data: { status: subStatus, expiresAt },
          });
          if (subStatus === BillingSubscriptionStatus.ACTIVE) {
            await prisma.billingLicense.updateMany({
              where: { subscriptionId, status: BillingLicenseStatus.ACTIVE },
              data: { expiresAt, status: BillingLicenseStatus.ACTIVE },
            });
          }
        }
      }

      await logBillingAudit('webhook.processed', 'webhook', { provider, type: event.type, externalId: event.externalId });
    }

    await prisma.billingWebhookLog.updateMany({
      where: { provider, externalId: event.externalId },
      data: { processed: true },
    });

    await prisma.billingEvent.create({
      data: { type: `webhook.${event.type}`, tenantId: event.tenantId, payload: event.raw as Prisma.InputJsonValue },
    });

    return { duplicate: false, event };
  },

  async getActiveLicense(tenantId: string) {
    return prisma.billingLicense.findFirst({
      where: { tenantId, status: BillingLicenseStatus.ACTIVE },
      include: { subscription: { include: { plan: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async runMaintenanceJobs() {
    const now = new Date();
    let expiredTrials = 0;
    let expiredSubs = 0;
    let expiredLicenses = 0;

    const trials = await prisma.billingTrial.findMany({ where: { active: true, expiresAt: { lt: now } } });
    for (const trial of trials) {
      await prisma.billingTrial.update({ where: { id: trial.id }, data: { active: false } });
      await prisma.billingSubscription.updateMany({
        where: { tenantId: trial.tenantId, status: BillingSubscriptionStatus.TRIAL },
        data: { status: BillingSubscriptionStatus.EXPIRED },
      });
      expiredTrials++;
    }

    const subs = await prisma.billingSubscription.findMany({
      where: {
        status: { in: [BillingSubscriptionStatus.ACTIVE, BillingSubscriptionStatus.TRIAL] },
        expiresAt: { lt: now },
      },
    });
    for (const sub of subs) {
      await prisma.billingSubscription.update({
        where: { id: sub.id },
        data: { status: BillingSubscriptionStatus.EXPIRED },
      });
      expiredSubs++;
    }

    const licenses = await prisma.billingLicense.findMany({
      where: { status: BillingLicenseStatus.ACTIVE, expiresAt: { lt: now } },
    });
    for (const lic of licenses) {
      await prisma.billingLicense.update({
        where: { id: lic.id },
        data: { status: BillingLicenseStatus.EXPIRED },
      });
      expiredLicenses++;
    }

    return { expiredTrials, expiredSubs, expiredLicenses };
  },
};
