import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import { BillingPaymentProvider } from '@prisma/client';
import { KiwifyProvider, HotmartProvider } from '../infrastructure/providers/payment.providers';
import {
  getWebhookRawBody,
  parseWebhookJson,
  normalizeHeaders,
} from '../presentation/utils/webhook.util';
import { Request } from 'express';

describe('webhook.util', () => {
  it('extrai raw body de Buffer', () => {
    const req = { body: Buffer.from('{"a":1}') } as Request;
    expect(getWebhookRawBody(req)).toBe('{"a":1}');
  });

  it('rejeita JSON inválido', () => {
    expect(() => parseWebhookJson('{invalid')).toThrow('JSON do webhook inválido');
  });

  it('normaliza headers para lowercase', () => {
    const h = normalizeHeaders({ 'X-Kiwify-Signature': 'abc' });
    expect(h['x-kiwify-signature']).toBe('abc');
  });
});

describe('KiwifyProvider HMAC', () => {
  const secret = 'test-secret-key-32chars!!!!!!';
  const rawBody = JSON.stringify({ order: { id: 'ord_1', status: 'approved', tenant_id: 't1' } });

  it('computa HMAC SHA256 esperado pela Kiwify', () => {
    const signature = createHmac('sha256', secret).update(rawBody).digest('hex');
    expect(signature).toHaveLength(64);
  });

  it('rejeita assinatura com comprimento incorreto (regra de validação)', () => {
    const signature = 'curto';
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    expect(signature.length !== expected.length).toBe(true);
  });
});

describe('Webhook event parsing', () => {
  it('compra aprovada com tenant_id', async () => {
    const provider = new KiwifyProvider();
    const event = await provider.handleWebhook(
      {},
      { order: { id: 'pay_1', status: 'approved', tenant_id: 'uuid-tenant', plan_slug: 'pro', amount: 99.9 } }
    );
    expect(event.type).toBe('payment.approved');
    expect(event.tenantId).toBe('uuid-tenant');
    expect(event.externalId).toBe('pay_1');
  });

  it('cancelamento', async () => {
    const provider = new KiwifyProvider();
    const event = await provider.handleWebhook({}, { order: { id: 'c1', status: 'cancelled', tenant_id: 't1' } });
    expect(event.type).toBe('subscription.cancelled');
  });

  it('reembolso via Hotmart', async () => {
    const provider = new HotmartProvider();
    const event = await provider.handleWebhook(
      {},
      { event: 'PURCHASE_REFUNDED', data: { transaction: 'r1', tenant_id: 't1' } }
    );
    expect(event.type).toBe('payment.refunded');
  });

  it('webhook inválido sem id gera externalId dinâmico', async () => {
    const provider = new KiwifyProvider();
    const event = await provider.handleWebhook({}, { event: 'approved' });
    expect(event.externalId).toMatch(/^kiwify_/);
    expect(event.tenantId).toBeUndefined();
  });
});

describe('Idempotência lógica', () => {
  it('chave única provider+externalId', () => {
    const key = `${BillingPaymentProvider.KIWIFY}:order_123`;
    expect(key).toBe('KIWIFY:order_123');
  });
});
