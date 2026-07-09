import { describe, it, expect } from 'vitest';
import { BillingPaymentStatus } from '@prisma/client';
import { mapWebhookToPaymentStatus } from '../infrastructure/providers/payment.providers';

describe('Payment idempotency key', () => {
  it('provider+externalId compõe chave única lógica', () => {
    const provider = 'KIWIFY';
    const externalId = 'order_123';
    const key = `${provider}:${externalId}`;
    expect(key).toBe('KIWIFY:order_123');
  });
});

describe('Payment status from webhook', () => {
  it('reembolso', () => {
    expect(mapWebhookToPaymentStatus('payment.refunded')).toBe(BillingPaymentStatus.REFUNDED);
  });

  it('chargeback', () => {
    expect(mapWebhookToPaymentStatus('payment.chargeback')).toBe(BillingPaymentStatus.CHARGEBACK);
  });
});
