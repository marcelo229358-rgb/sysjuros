export const e2e = {
  baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
  apiURL: process.env.E2E_API_URL ?? 'http://localhost:3333',
  empresaId: process.env.E2E_EMPRESA_ID ?? '',
  emailAdmin: process.env.E2E_EMAIL_ADMIN ?? 'admin@empresa-teste.com',
  senhaAdmin: process.env.E2E_SENHA_ADMIN ?? 'senha123',
};
