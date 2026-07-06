const BASE = 'http://localhost:3333';
const EMPRESA_ID = '1030c59f-503a-4dfc-ad8b-66c802060cd0';

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} → ${response.status}: ${body.message ?? JSON.stringify(body)}`);
  }

  return body;
}

async function main() {
  console.log('1. Login...');
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@empresademo.com.br',
      senha: 'admin123',
      empresaId: EMPRESA_ID,
    }),
  });

  const headers = { Authorization: `Bearer ${login.token}` };

  console.log('2. Criar cliente...');
  const cliente = await request('/clientes', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      nome: 'Teste Integração',
      cpfCnpj: '39053344705',
      email: 'integracao@test.com',
    }),
  });

  console.log('3. Criar contrato (3 parcelas, R$ 1000)...');
  const contrato = await request('/contratos', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      clienteId: cliente.id,
      numero: `CTR-TEST-${Date.now()}`,
      valorTotal: 1000,
      numParcelas: 3,
      dataInicio: '2025-06-01T00:00:00.000Z',
    }),
  });

  const detalhe = await request(`/contratos/${contrato.id}`, { headers });
  const parcelas = detalhe.parcelas.map((p: { valorOriginal: number }) => p.valorOriginal);
  const soma = parcelas.reduce((a: number, b: number) => a + b, 0);
  console.log(`   Parcelas: ${parcelas.join(' + ')} = ${soma}`);

  if (Math.abs(soma - 1000) > 0.001) {
    throw new Error(`Soma das parcelas incorreta: ${soma}`);
  }

  console.log('4. Listar vencidas...');
  const vencidas = await request('/parcelas/vencidas', { headers });
  console.log(`   ${vencidas.length} parcela(s) vencida(s)`);

  const parcelaId = detalhe.parcelas[0].id;
  const parcelaDetalhe = await request(`/parcelas/${parcelaId}`, { headers });

  console.log('5. Registrar pagamento integral...');
  await request('/pagamentos', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      parcelaId,
      valorPago: parcelaDetalhe.valorAtualizado,
      formaPagamento: 'pix',
    }),
  });

  console.log('6. Verificar contrato após 1ª parcela...');
  const contratoParcial = await request(`/contratos/${contrato.id}`, { headers });
  console.log(`   Status: ${contratoParcial.status}`);

  console.log('\n✅ Fase 2 validada com sucesso!');
}

main().catch((error) => {
  console.error('\n❌', error.message);
  process.exit(1);
});
