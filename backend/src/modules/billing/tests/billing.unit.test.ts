import { describe, it, expect } from 'vitest';
import { LegacyPlanoAdapter } from '../infrastructure/adapters/LegacyPlanoAdapter';
import {
  mapWebhookToPaymentStatus,
  mapWebhookToSubscriptionStatus,
} from '../infrastructure/providers/payment.providers';
import { BillingPaymentStatus, BillingSubscriptionStatus } from '@prisma/client';

describe('LegacyPlanoAdapter', () => {
  it('mapeia BASICO para basico', () => {
    expect(LegacyPlanoAdapter.toPlanSlug('BASICO')).toBe('basico');
  });

  it('mapeia slug pro para PRO', () => {
    expect(LegacyPlanoAdapter.toPlanoEmpresa('pro')).toBe('PRO');
  });
});

describe('Webhook mappers', () => {
  it('mapeia pagamento aprovado', () => {
    expect(mapWebhookToPaymentStatus('payment.approved')).toBe(BillingPaymentStatus.APPROVED);
  });

  it('mapeia cancelamento de assinatura', () => {
    expect(mapWebhookToSubscriptionStatus('subscription.cancelled')).toBe(
      BillingSubscriptionStatus.CANCELLED
    );
  });
});

describe('Billing plans config', () => {
  it('planos legados cobrem os três níveis', () => {
    expect(LegacyPlanoAdapter.toPlanSlug('PREMIUM')).toBe('premium');
    expect(LegacyPlanoAdapter.toPlanoEmpresa('basico')).toBe('BASICO');
  });
});
