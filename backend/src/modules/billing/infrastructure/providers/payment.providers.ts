import { env } from '../../../../config/env';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  BillingPaymentProvider,
  BillingPaymentStatus,
  BillingSubscriptionStatus,
} from '@prisma/client';
import {
  CheckoutParams,
  CheckoutResult,
  IPaymentProvider,
  WebhookEvent,
} from '../../application/ports/IPaymentProvider';

function checkoutUrl(provider: BillingPaymentProvider, planSlug: string): string | undefined {
  if (provider === BillingPaymentProvider.KIWIFY && env.KIWIFY_CHECKOUT_URL) {
    return `${env.KIWIFY_CHECKOUT_URL}?plan=${planSlug}`;
  }
  if (provider === BillingPaymentProvider.HOTMART && env.HOTMART_CHECKOUT_URL) {
    return `${env.HOTMART_CHECKOUT_URL}?plan=${planSlug}`;
  }
  return undefined;
}

function baseCheckout(params: CheckoutParams, provider: BillingPaymentProvider): CheckoutResult {
  const externalId = `${provider.toLowerCase()}_${params.subscriptionId}_${Date.now()}`;
  return {
    externalId,
    checkoutUrl: checkoutUrl(provider, params.planSlug),
    metadata: { provider, planSlug: params.planSlug, tenantId: params.tenantId },
  };
}

export class KiwifyProvider implements IPaymentProvider {
  readonly providerId = BillingPaymentProvider.KIWIFY;

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    return baseCheckout(params, this.providerId);
  }

  verifySignature(headers: Record<string, string>, rawBody: string): boolean {
    const secret = env.KIWIFY_WEBHOOK_SECRET;
    if (!secret) return env.NODE_ENV !== 'production';
    const signature = headers['x-kiwify-signature'] ?? headers['x-signature'] ?? '';
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    if (!signature || signature.length !== expected.length) return false;
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  async handleWebhook(_headers: Record<string, string>, body: unknown): Promise<WebhookEvent> {
    const data = body as Record<string, unknown>;
    const order = (data.order ?? data) as Record<string, unknown>;
    const status = String(order.status ?? data.event ?? data.type ?? 'unknown').toLowerCase();
    const externalId = String(order.id ?? data.id ?? `kiwify_${Date.now()}`);

    let type = 'unknown';
    if (status.includes('approved') || status.includes('paid')) type = 'payment.approved';
    else if (status.includes('cancel')) type = 'subscription.cancelled';
    else if (status.includes('refund')) type = 'payment.refunded';
    else if (status.includes('chargeback')) type = 'payment.chargeback';
    else if (status.includes('renew')) type = 'subscription.renewed';

    return {
      type,
      externalId,
      tenantId: order.tenant_id ? String(order.tenant_id) : undefined,
      planSlug: order.plan_slug ? String(order.plan_slug) : undefined,
      amount: order.amount ? Number(order.amount) : undefined,
      currency: order.currency ? String(order.currency) : 'BRL',
      raw: body,
    };
  }

  async cancelSubscription(_externalId: string): Promise<void> {
    // Integração futura com API Kiwify
  }
}

export class HotmartProvider implements IPaymentProvider {
  readonly providerId = BillingPaymentProvider.HOTMART;

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    return baseCheckout(params, this.providerId);
  }

  verifySignature(headers: Record<string, string>, rawBody: string): boolean {
    const secret = env.HOTMART_WEBHOOK_SECRET;
    if (!secret) return env.NODE_ENV !== 'production';
    const hottok = headers['x-hotmart-hottok'] ?? '';
    return hottok === secret || hottok === createHmac('sha256', secret).update(rawBody).digest('hex');
  }

  async handleWebhook(_headers: Record<string, string>, body: unknown): Promise<WebhookEvent> {
    const data = body as Record<string, unknown>;
    const event = String(data.event ?? data.status ?? 'unknown').toUpperCase();
    const purchase = (data.data ?? data) as Record<string, unknown>;
    const externalId = String(purchase.transaction ?? purchase.id ?? `hotmart_${Date.now()}`);

    let type = 'unknown';
    if (event.includes('PURCHASE_APPROVED') || event.includes('PURCHASE_COMPLETE')) {
      type = 'payment.approved';
    } else if (event.includes('CANCEL')) type = 'subscription.cancelled';
    else if (event.includes('REFUND')) type = 'payment.refunded';
    else if (event.includes('CHARGEBACK')) type = 'payment.chargeback';
    else if (event.includes('SUBSCRIPTION_RENEW')) type = 'subscription.renewed';

    return {
      type,
      externalId,
      tenantId: purchase.tenant_id ? String(purchase.tenant_id) : undefined,
      planSlug: purchase.plan_slug ? String(purchase.plan_slug) : undefined,
      amount: purchase.price ? Number(purchase.price) : undefined,
      currency: 'BRL',
      raw: body,
    };
  }

  async cancelSubscription(_externalId: string): Promise<void> {
    // Integração futura com API Hotmart
  }
}

export class ManualProvider implements IPaymentProvider {
  readonly providerId = BillingPaymentProvider.MANUAL;

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    return baseCheckout(params, this.providerId);
  }

  verifySignature(): boolean {
    return true;
  }

  async handleWebhook(): Promise<WebhookEvent> {
    return { type: 'payment.approved', externalId: `manual_${Date.now()}`, raw: {} };
  }

  async cancelSubscription(): Promise<void> {}
}

export const paymentProviders: Record<string, IPaymentProvider> = {
  KIWIFY: new KiwifyProvider(),
  HOTMART: new HotmartProvider(),
  MANUAL: new ManualProvider(),
};

export function getPaymentProvider(provider: BillingPaymentProvider): IPaymentProvider {
  const impl = paymentProviders[provider];
  if (!impl) throw new Error(`Provider não suportado: ${provider}`);
  return impl;
}

export function mapWebhookToPaymentStatus(type: string): BillingPaymentStatus {
  if (type.includes('approved') || type.includes('renewed')) return BillingPaymentStatus.APPROVED;
  if (type.includes('refund')) return BillingPaymentStatus.REFUNDED;
  if (type.includes('chargeback')) return BillingPaymentStatus.CHARGEBACK;
  if (type.includes('cancel')) return BillingPaymentStatus.FAILED;
  return BillingPaymentStatus.PENDING;
}

export function mapWebhookToSubscriptionStatus(type: string): BillingSubscriptionStatus | null {
  if (type.includes('approved') || type.includes('renewed')) return BillingSubscriptionStatus.ACTIVE;
  if (type.includes('cancel')) return BillingSubscriptionStatus.CANCELLED;
  if (type.includes('refund') || type.includes('chargeback')) return BillingSubscriptionStatus.SUSPENDED;
  return null;
}
