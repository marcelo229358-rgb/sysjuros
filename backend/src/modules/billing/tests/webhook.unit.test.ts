import { describe, it, expect } from 'vitest';
import { KiwifyProvider, HotmartProvider } from '../infrastructure/providers/payment.providers';

describe('KiwifyProvider webhook', () => {
  const provider = new KiwifyProvider();

  it('interpreta compra aprovada', async () => {
    const event = await provider.handleWebhook({}, { order: { id: 'k1', status: 'approved' } });
    expect(event.type).toBe('payment.approved');
    expect(event.externalId).toBe('k1');
  });
});

describe('HotmartProvider webhook', () => {
  const provider = new HotmartProvider();

  it('interpreta PURCHASE_APPROVED', async () => {
    const event = await provider.handleWebhook({}, { event: 'PURCHASE_APPROVED', data: { transaction: 'h1' } });
    expect(event.type).toBe('payment.approved');
    expect(event.externalId).toBe('h1');
  });
});
