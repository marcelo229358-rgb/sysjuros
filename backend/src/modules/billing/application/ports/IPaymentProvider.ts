import { BillingPaymentProvider } from '@prisma/client';

export interface CheckoutParams {
  subscriptionId: string;
  tenantId: string;
  planSlug: string;
  amount: number;
  currency: string;
  customerEmail?: string;
}

export interface CheckoutResult {
  checkoutUrl?: string;
  externalId: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookEvent {
  type: string;
  externalId: string;
  tenantId?: string;
  subscriptionId?: string;
  planSlug?: string;
  amount?: number;
  currency?: string;
  raw: unknown;
}

export interface IPaymentProvider {
  readonly providerId: BillingPaymentProvider;
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  handleWebhook(headers: Record<string, string>, body: unknown): Promise<WebhookEvent>;
  verifySignature(headers: Record<string, string>, rawBody: string): boolean;
  cancelSubscription(externalId: string): Promise<void>;
}
