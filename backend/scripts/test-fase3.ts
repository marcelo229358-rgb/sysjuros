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
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@empresademo.com.br',
      senha: 'admin123',
      empresaId: EMPRESA_ID,
    }),
  });

  const headers = { Authorization: `Bearer ${login.token}` };

  console.log('1. /dashboard/resumo');
  const resumo = await request('/dashboard/resumo', { headers });
  console.log(resumo);

  if (resumo.taxaInadimplencia > 100) {
    throw new Error(`taxaInadimplencia acima de 100%: ${resumo.taxaInadimplencia}`);
  }

  if (
    resumo.totalVencidoOriginal === undefined ||
    resumo.totalEncargosVencidos === undefined
  ) {
    throw new Error('Campos totalVencidoOriginal/totalEncargosVencidos ausentes no resumo');
  }

  console.log('\n2. /dashboard/recebimentos-mensais');
  const mensais = await request('/dashboard/recebimentos-mensais', { headers });
  console.log(`   ${mensais.length} meses retornados`);

  console.log('\n3. /dashboard/contratos-por-status');
  const status = await request('/dashboard/contratos-por-status', { headers });
  console.log(status);

  console.log('\n4. /dashboard/proximos-vencimentos?dias=30');
  const proximos = await request('/dashboard/proximos-vencimentos?dias=30', { headers });
  console.log(`   ${proximos.length} parcela(s) nos próximos 30 dias`);

  console.log('\n5. /dashboard/inadimplencia?limite=5');
  const inadimplencia = await request('/dashboard/inadimplencia?limite=5', { headers });
  console.log(inadimplencia);

  if (inadimplencia.taxaInadimplencia > 100) {
    throw new Error(`taxaInadimplencia acima de 100%: ${inadimplencia.taxaInadimplencia}`);
  }

  console.log('\n✅ Fase 3 validada com sucesso!');
}

main().catch((error) => {
  console.error('\n❌', error.message);
  process.exit(1);
});
