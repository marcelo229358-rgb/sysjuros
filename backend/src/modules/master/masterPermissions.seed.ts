import { prisma } from '../../config/database';
import { MASTER_MODULES, MASTER_PROFILES } from './master.constants';

const DEFAULT_PERMISSIONS: Array<{ perfil: string; modulo: string; acoes: string[] }> = [
  { perfil: 'master', modulo: 'empresas', acoes: ['view', 'create', 'edit', 'delete'] },
  { perfil: 'master', modulo: 'clientes', acoes: ['view', 'create', 'edit', 'delete'] },
  { perfil: 'master', modulo: 'assinaturas', acoes: ['view', 'edit', 'delete'] },
  { perfil: 'master', modulo: 'financeiro', acoes: ['view', 'create', 'edit', 'delete'] },
  { perfil: 'master', modulo: 'monitoramento', acoes: ['view'] },
  { perfil: 'master', modulo: 'permissoes', acoes: ['view', 'edit'] },
  { perfil: 'admin', modulo: 'usuarios', acoes: ['view', 'create', 'edit', 'delete'] },
  { perfil: 'admin', modulo: 'clientes', acoes: ['view', 'create', 'edit', 'delete'] },
  { perfil: 'admin', modulo: 'contratos', acoes: ['view', 'create', 'edit', 'delete'] },
  { perfil: 'admin', modulo: 'parcelas', acoes: ['view', 'edit'] },
  { perfil: 'admin', modulo: 'relatorios', acoes: ['view'] },
  { perfil: 'financeiro', modulo: 'clientes', acoes: ['view'] },
  { perfil: 'financeiro', modulo: 'contratos', acoes: ['view'] },
  { perfil: 'financeiro', modulo: 'parcelas', acoes: ['view', 'edit', 'approve'] },
  { perfil: 'financeiro', modulo: 'relatorios', acoes: ['view'] },
  { perfil: 'operador', modulo: 'clientes', acoes: ['view', 'create', 'edit'] },
  { perfil: 'operador', modulo: 'contratos', acoes: ['view', 'create'] },
  { perfil: 'operador', modulo: 'parcelas', acoes: ['view'] },
];

export async function bootstrapMasterPermissions() {
  const count = await prisma.masterPermissao.count();
  if (count > 0) return;

  for (const item of DEFAULT_PERMISSIONS) {
    await prisma.masterPermissao.create({
      data: {
        perfil: item.perfil,
        modulo: item.modulo,
        acoes: item.acoes,
      },
    });
  }

  console.log('[Master] Permissões padrão inseridas');
}

export function getPermissionsMeta() {
  return {
    profiles: MASTER_PROFILES,
    modules: MASTER_MODULES,
    actions: ['view', 'create', 'edit', 'delete', 'approve'],
  };
}
