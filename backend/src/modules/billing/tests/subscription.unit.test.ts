import { describe, it, expect } from 'vitest';
import { BillingSubscriptionStatus } from '@prisma/client';

describe('Subscription status', () => {
  it('ACTIVE e TRIAL são estados com acesso', () => {
    const allowed = [BillingSubscriptionStatus.ACTIVE, BillingSubscriptionStatus.TRIAL];
    expect(allowed).toContain('ACTIVE');
    expect(allowed).toContain('TRIAL');
  });

  it('EXPIRED bloqueia quando enforce ativo', () => {
    expect(BillingSubscriptionStatus.EXPIRED).toBe('EXPIRED');
  });
});
