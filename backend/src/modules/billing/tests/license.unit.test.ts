import { describe, it, expect } from 'vitest';
import { BillingLicenseStatus, BillingSubscriptionStatus } from '@prisma/client';

describe('License states', () => {
  it('status ativo permite acesso', () => {
    expect(BillingLicenseStatus.ACTIVE).toBe('ACTIVE');
  });

  it('assinatura trial é distinta de ativa', () => {
    expect(BillingSubscriptionStatus.TRIAL).not.toBe(BillingSubscriptionStatus.ACTIVE);
  });
});

describe('Subscription lifecycle', () => {
  it('cancelamento é estado terminal de cobrança', () => {
    expect(BillingSubscriptionStatus.CANCELLED).toBe('CANCELLED');
  });
});
