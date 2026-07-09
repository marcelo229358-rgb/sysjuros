/**
 * Teste de segurança — mesmo payload do curl do usuário
 * Uso: npx tsx scripts/billing-security-test.ts
 */
import { BillingPaymentProvider } from '@prisma/client';
import { KiwifyProvider } from '../src/modules/billing/infrastructure/providers/payment.providers';

const PAYLOAD = { event: 'approved', plan_slug: 'premium' };

async function main() {
  console.log('=== TESTE DE SEGURANÇA WEBHOOK KIWIFY ===\n');
  console.log('Payload:', JSON.stringify(PAYLOAD));

  const provider = new KiwifyProvider();
  const event = await provider.handleWebhook({}, PAYLOAD);

  console.log('\n1. Parser Kiwify interpreta como:');
  console.log('   type:', event.type);
  console.log('   externalId:', event.externalId);
  console.log('   tenantId:', event.tenantId ?? '(ausente)');
  console.log('   planSlug:', event.planSlug ?? '(ausente)');

  console.log('\n2. verifySignature (simulação):');
  const prodSemSecret = process.env.NODE_ENV === 'production' && !process.env.KIWIFY_WEBHOOK_SECRET;
  console.log('   Produção SEM KIWIFY_WEBHOOK_SECRET =>', prodSemSecret ? 'REJEITA (401)' : 'ver abaixo');
  console.log('   Produção COM secret, sem header => REJEITA (401)');
  console.log('   Development sem secret => ACEITA (risco se exposto)');

  console.log('\n3. Efeito se passar na assinatura:');
  if (!event.tenantId) {
    console.log('   ✅ Sem tenant_id → NÃO cria assinatura nem pagamento');
    console.log('   ⚠️  Ainda grava billing_webhook_logs + billing_events (poluição de log)');
  }

  console.log('\n4. Resposta HTTP esperada em PRODUÇÃO (VPS):');
  console.log('   HTTP 401');
  console.log('   {"status":"error","message":"Assinatura webhook inválida"}');

  console.log('\n5. URL correta da API em produção:');
  console.log('   https://api-sysjuros.appdeploy.site/billing/webhooks/kiwify');
  console.log('   (api-syscontabel.appdeploy.site não responde — DNS/host inexistente)');

  console.log('\n6. Comando para você rodar na VPS ou máquina local:');
  console.log(`   curl -X POST https://api-sysjuros.appdeploy.site/billing/webhooks/kiwify \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '${JSON.stringify(PAYLOAD)}'`);
}

main();
