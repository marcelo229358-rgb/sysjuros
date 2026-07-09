import { PlanoEmpresa } from '@prisma/client';

export const PLANOS_PRECO: Record<PlanoEmpresa, number> = {
  BASICO: 49.9,
  PRO: 99.9,
  PREMIUM: 149.9,
};

export const MASTER_PROFILES = ['master', 'admin', 'financeiro', 'operador'] as const;

export const MASTER_MODULES = [
  'empresas',
  'clientes',
  'assinaturas',
  'financeiro',
  'monitoramento',
  'permissoes',
  'usuarios',
  'contratos',
  'parcelas',
  'relatorios',
] as const;

export const PERM_ACTIONS = ['view', 'create', 'edit', 'delete', 'approve'] as const;

export const PLATAFORMA_EMPRESA_NOMES = ['Plataforma SysJuros', 'Plataforma SysContabel'];

export type MasterProfile = (typeof MASTER_PROFILES)[number];
export type MasterModule = (typeof MASTER_MODULES)[number];
export type PermAction = (typeof PERM_ACTIONS)[number];
