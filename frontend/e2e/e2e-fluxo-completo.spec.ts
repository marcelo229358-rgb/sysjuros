import { test, expect, Page } from '@playwright/test';

/**
 * Teste E2E do fluxo completo: login → dashboard → cliente → contrato → pagamento
 *
 * PRÉ-REQUISITOS:
 * - Backend rodando (ex: http://localhost:3333)
 * - Frontend rodando (ex: http://localhost:5173)
 * - Seed do banco já rodado (empresa de teste + usuário ADMIN)
 * - Variáveis em .env.e2e (E2E_EMAIL_ADMIN, E2E_SENHA_ADMIN, E2E_EMPRESA_ID)
 *
 * COMO RODAR:
 *   npx playwright install chromium
 *   npm run test:e2e
 */

const EMAIL_ADMIN = process.env.E2E_EMAIL_ADMIN ?? 'admin@empresademo.com.br';
const SENHA_ADMIN = process.env.E2E_SENHA_ADMIN ?? 'admin123';
const EMPRESA_ID = process.env.E2E_EMPRESA_ID ?? '';

const CLIENTE_TESTE = {
  nome: 'Cliente Teste E2E',
  cpf: '52998224725',
  email: 'cliente.teste@example.com',
};

const CONTRATO_TESTE = {
  valorTotal: '1000',
  numParcelas: '3',
};

let numeroContratoE2E = '';

test.describe.serial('Fluxo completo do sistema', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. Login', async () => {
    await page.goto('/login');

    await page.fill('[data-testid="input-email"]', EMAIL_ADMIN);
    await page.fill('[data-testid="input-senha"]', SENHA_ADMIN);
    if (EMPRESA_ID) {
      await page.fill('[data-testid="input-empresa-id"]', EMPRESA_ID);
    }
    await page.click('[data-testid="btn-login"]');

    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10_000 });

    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('2. Dashboard carrega sem erro (com ou sem dados)', async () => {
    const erros: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') erros.push(msg.text());
    });

    await page.goto('/dashboard');

    await expect(page.locator('[data-testid="card-total-a-receber"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-recebido-mes"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-total-vencido"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-taxa-inadimplencia"]')).toBeVisible();
    await expect(page.locator('[data-testid="grafico-recebimentos-mensais"]')).toBeVisible();
    await expect(page.locator('[data-testid="grafico-contratos-status"]')).toBeVisible();

    expect(erros, `Erros no console: ${erros.join(', ')}`).toHaveLength(0);
  });

  test('3a. Criar cliente com CPF inválido é bloqueado', async () => {
    await page.goto('/clientes');
    await page.click('[data-testid="btn-novo-cliente"]');

    await page.fill('[data-testid="input-nome-cliente"]', 'Cliente Inválido');
    await page.fill('[data-testid="input-cpf-cnpj"]', '11111111111');
    await page.click('[data-testid="btn-salvar-cliente"]');

    await expect(page.locator('[data-testid="erro-cpf-cnpj"]')).toBeVisible();
  });

  test('3b. Criar cliente com dados válidos', async () => {
    await page.fill('[data-testid="input-nome-cliente"]', CLIENTE_TESTE.nome);
    await page.fill('[data-testid="input-cpf-cnpj"]', CLIENTE_TESTE.cpf);
    await page.fill('[data-testid="input-email-cliente"]', CLIENTE_TESTE.email);
    await page.click('[data-testid="btn-salvar-cliente"]');

    await expect(page.locator(`text=${CLIENTE_TESTE.nome}`)).toBeVisible({ timeout: 5_000 });
  });

  test('4. Criar contrato com preview de parcelas correto', async () => {
    await page.goto('/contratos');
    await page.click('[data-testid="btn-novo-contrato"]');

    await page.selectOption('[data-testid="select-cliente"]', { label: CLIENTE_TESTE.nome });

    numeroContratoE2E = await page.locator('[data-testid="input-numero-contrato"]').inputValue();
    expect(numeroContratoE2E).toMatch(/^CT-\d{8}-\d{6}$/);

    await page.fill('[data-testid="input-valor-total"]', CONTRATO_TESTE.valorTotal);
    await page.fill('[data-testid="input-num-parcelas"]', CONTRATO_TESTE.numParcelas);

    const previewParcelas = page.locator('[data-testid="preview-parcela"]');
    await expect(previewParcelas).toHaveCount(3);
    await expect(previewParcelas.nth(0)).toContainText('333,33');
    await expect(previewParcelas.nth(1)).toContainText('333,33');
    await expect(previewParcelas.nth(2)).toContainText('333,34');

    await page.click('[data-testid="btn-salvar-contrato"]');
    await expect(page.locator(`text=${numeroContratoE2E}`)).toBeVisible({ timeout: 5_000 });
  });

  test('5. Dashboard reflete o novo contrato', async () => {
    await page.goto('/dashboard');

    const totalAReceberTexto = await page
      .locator('[data-testid="card-total-a-receber"] [data-testid="valor"]')
      .textContent();
    expect(totalAReceberTexto).toBeTruthy();

    const contratosAtivosTexto = await page
      .locator('[data-testid="card-contratos-ativos"] [data-testid="valor"]')
      .textContent();
    expect(Number(contratosAtivosTexto?.replace(/\D/g, ''))).toBeGreaterThan(0);
  });

  test('6. Registrar pagamento de uma parcela', async () => {
    await page.goto('/contratos');
    await page.click(`[data-testid="link-contrato-${numeroContratoE2E}"]`);

    const primeiraLinhaParcela = page.locator('[data-testid="linha-parcela"]').first();
    await primeiraLinhaParcela.locator('[data-testid="btn-registrar-pagamento"]').click();

    await expect(page.locator('[data-testid="modal-pagamento"]')).toBeVisible();
    await expect(page.locator('[data-testid="valor-atualizado-parcela"]')).toBeVisible();

    await page.click('[data-testid="btn-confirmar-pagamento"]');

    await expect(page.locator('[data-testid="modal-pagamento"]')).not.toBeVisible();
    await expect(primeiraLinhaParcela.locator('[data-testid="badge-status"]')).toContainText('PAGA');
  });

  test('7. Permissões: usuário não-ADMIN não vê Configurações/Usuários', async () => {
    test.skip(!process.env.E2E_EMAIL_OPERADOR, 'Sem usuário OPERADOR configurado no seed — pulando');

    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('token'));

    await page.fill('[data-testid="input-email"]', process.env.E2E_EMAIL_OPERADOR!);
    await page.fill('[data-testid="input-senha"]', process.env.E2E_SENHA_OPERADOR!);
    if (EMPRESA_ID) {
      await page.fill('[data-testid="input-empresa-id"]', EMPRESA_ID);
    }
    await page.click('[data-testid="btn-login"]');
    await expect(page).toHaveURL(/.*dashboard/);

    await expect(page.locator('[data-testid="menu-configuracoes"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="menu-usuarios"]')).not.toBeVisible();
  });

  test('8. Modo escuro persiste após reload', async () => {
    await page.goto('/dashboard');
    await page.click('[data-testid="toggle-modo-escuro"]');

    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');

    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
  });
});
