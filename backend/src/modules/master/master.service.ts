import { masterRepository } from './master.repository';
import { AppError } from '../../shared/errors/AppError';
import { comparePassword, hashPassword } from '../../shared/utils/hash.util';
import { signMasterToken } from '../../shared/utils/masterJwt.util';
import { getMasterEmail, isMasterConfigured } from '../../shared/utils/masterConfig';
import { PLANOS_PRECO } from './master.constants';
import { logMasterAudit } from './masterAudit.util';
import { bootstrapMasterPermissions, getPermissionsMeta } from './masterPermissions.seed';
import {
  MasterLoginInput,
  CriarEmpresaMasterInput,
  AtualizarEmpresaMasterInput,
} from './master.dto';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { PlanoEmpresa, TipoLancamentoMaster } from '@prisma/client';

const DEMO_EMPRESA_ID = '1030c59f-503a-4dfc-ad8b-66c802060cd0';

export const masterService = {
  async login(input: MasterLoginInput) {
    if (!isMasterConfigured()) {
      throw new AppError('Acesso master não configurado no servidor', 503);
    }

    const emailNorm = input.email.trim().toLowerCase();
    const masterEmail = getMasterEmail();

    if (emailNorm !== masterEmail) {
      throw new AppError('E-mail ou senha incorretos', 401);
    }

    const usuario = await masterRepository.findMasterByEmail(emailNorm);

    if (!usuario?.senhaHash) {
      throw new AppError('E-mail ou senha incorretos', 401);
    }

    const senhaValida = await comparePassword(input.senha, usuario.senhaHash);

    if (!senhaValida) {
      throw new AppError('E-mail ou senha incorretos', 401);
    }

    const token = signMasterToken({
      usuarioId: usuario.id,
      email: usuario.email,
      role: 'master',
    });

    return {
      token,
      user: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    };
  },

  async me(usuarioId: string) {
    const usuario = await prisma.usuario.findFirst({
      where: { id: usuarioId, isMaster: true, ativo: true },
      select: { id: true, nome: true, email: true },
    });

    if (!usuario) {
      throw new AppError('Usuário master não encontrado', 404);
    }

    return usuario;
  },

  async listarEmpresas() {
    const empresas = await masterRepository.listarEmpresas();

    return empresas.map((empresa) => mapEmpresa(empresa));
  },

  async criarEmpresa(input: CriarEmpresaMasterInput) {
    const cnpj = input.cnpj?.trim() || null;
    const adminEmail = input.adminEmail?.trim().toLowerCase() || '';
    const adminNome = input.adminNome?.trim() || '';
    const adminSenha = input.adminSenha?.trim() || '';
    const temAdmin = !!(adminEmail && adminSenha && adminNome);
    const masterEmail = getMasterEmail();

    if (temAdmin && masterEmail && adminEmail === masterEmail) {
      throw new AppError('Este e-mail é reservado ao master da plataforma', 400);
    }

    if (temAdmin && (await masterRepository.emailAdminJaExiste(adminEmail))) {
      throw new AppError('E-mail do admin já está em uso em outra empresa', 409);
    }

    if (cnpj) {
      const existente = await prisma.empresa.findUnique({ where: { cnpj } });
      if (existente) {
        throw new AppError('CNPJ já cadastrado', 409);
      }
    }

    const empresaEmail =
      input.email?.trim().toLowerCase() ||
      (temAdmin ? adminEmail : `contato-${Date.now()}@syscontabel.local`);

    const senhaHash = temAdmin ? await hashPassword(adminSenha) : undefined;
    const empresa = await masterRepository.criarEmpresaComAdmin(
      {
        nome: input.nome.trim(),
        cnpj,
        email: empresaEmail,
        telefone: input.telefone?.trim() || null,
        taxaJurosMes: input.taxaJurosMes ?? 30,
        taxaMulta: input.taxaMulta ?? 2,
        plano: input.plano ?? PlanoEmpresa.BASICO,
        ativo: true,
      },
      temAdmin && senhaHash
        ? {
            nome: adminNome,
            email: adminEmail,
            senhaHash,
          }
        : undefined
    );

    return {
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        email: empresa.email,
        ativo: empresa.ativo,
      },
      adminEmail: temAdmin ? adminEmail : null,
      empresaId: empresa.id,
      loginUrl: buildLoginHint(empresa.id),
    };
  },

  async atualizarEmpresa(id: string, input: AtualizarEmpresaMasterInput) {
    if (id === DEMO_EMPRESA_ID && input.ativo === false) {
      throw new AppError('A empresa demo não pode ser desativada', 400);
    }

    const existente = await masterRepository.obterEmpresaPorId(id);
    if (!existente) {
      throw new AppError('Empresa não encontrada', 404);
    }

    const empresa = await masterRepository.atualizarEmpresa(id, {
      ...(input.nome !== undefined ? { nome: input.nome } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.telefone !== undefined ? { telefone: input.telefone } : {}),
      ...(input.taxaJurosMes !== undefined ? { taxaJurosMes: input.taxaJurosMes } : {}),
      ...(input.taxaMulta !== undefined ? { taxaMulta: input.taxaMulta } : {}),
      ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
      ...(input.plano !== undefined ? { plano: input.plano } : {}),
    });

    return {
      id: empresa.id,
      nome: empresa.nome,
      ativo: empresa.ativo,
      taxaJurosMes: Number(empresa.taxaJurosMes),
      taxaMulta: Number(empresa.taxaMulta),
      plano: empresa.plano,
    };
  },

  async excluirEmpresa(id: string, masterUsuarioId?: string, ip?: string) {
    if (id === DEMO_EMPRESA_ID) {
      throw new AppError('A empresa demo não pode ser excluída', 400);
    }

    const existente = await masterRepository.obterEmpresaPorId(id);
    if (!existente) {
      throw new AppError('Empresa não encontrada', 404);
    }

    await masterRepository.excluirEmpresa(id);
    await logMasterAudit(masterUsuarioId, 'delete', 'empresas', { empresaId: id }, ip);
    return { ok: true, message: `Empresa "${existente.nome}" excluída.` };
  },

  async clientesStats() {
    return masterRepository.clientesStats();
  },

  async listarClientes(search?: string, status?: string, tipo: 'empresa' | 'usuario' = 'empresa') {
    if (tipo === 'usuario') {
      const data = await masterRepository.listarUsuariosPlataforma(search);
      return { data, tipo: 'usuario' as const };
    }

    const empresas = await masterRepository.listarClientesEmpresas(search, status);
    const data = empresas.map((empresa) => ({
      id: empresa.id,
      nome: empresa.nome,
      email: empresa.email,
      cnpj: empresa.cnpj,
      plano: empresa.plano,
      ativo: empresa.ativo,
      criadoEm: empresa.criadoEm,
      admin: empresa.usuarios[0] ?? null,
      clientes_count: empresa._count.clientes,
      usuarios_count: empresa._count.usuarios,
      loginUrl: buildLoginHint(empresa.id),
    }));

    return { data, tipo: 'empresa' as const };
  },

  async atualizarCliente(
    id: string,
    input: { nome?: string; ativo?: boolean; plano?: PlanoEmpresa },
    masterUsuarioId?: string,
    ip?: string
  ) {
    if (id === DEMO_EMPRESA_ID && input.ativo === false) {
      throw new AppError('A empresa demo não pode ser desativada', 400);
    }

    const empresa = await masterRepository.atualizarEmpresa(id, {
      ...(input.nome !== undefined ? { nome: input.nome } : {}),
      ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
      ...(input.plano !== undefined ? { plano: input.plano } : {}),
    });

    await logMasterAudit(masterUsuarioId, 'update', 'clientes', { empresaId: id, ...input }, ip);

    return {
      id: empresa.id,
      nome: empresa.nome,
      ativo: empresa.ativo,
      plano: empresa.plano,
    };
  },

  async listarAssinaturas() {
    const empresas = await masterRepository.listarEmpresas();
    const assinaturas = empresas.map((empresa) => ({
      id: empresa.id,
      nome: empresa.nome,
      plano: empresa.plano,
      ativo: empresa.ativo,
      criadoEm: empresa.criadoEm,
      valor_mensal: PLANOS_PRECO[empresa.plano],
    }));

    const ativas = assinaturas.filter((a) => a.ativo);
    const mrr = ativas.reduce((sum, a) => sum + a.valor_mensal, 0);

    return {
      assinaturas,
      mrr,
      arr: mrr * 12,
      stats: {
        total: assinaturas.length,
        ativas: ativas.length,
        inativas: assinaturas.length - ativas.length,
      },
      planos: PLANOS_PRECO,
    };
  },

  async atualizarAssinatura(
    id: string,
    input: { plano?: PlanoEmpresa; ativo?: boolean },
    masterUsuarioId?: string,
    ip?: string
  ) {
    if (id === DEMO_EMPRESA_ID && input.ativo === false) {
      throw new AppError('A empresa demo não pode ser desativada', 400);
    }

    const empresa = await masterRepository.atualizarEmpresa(id, {
      ...(input.plano !== undefined ? { plano: input.plano } : {}),
      ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
    });

    await logMasterAudit(masterUsuarioId, 'update', 'assinaturas', { empresaId: id, ...input }, ip);

    return {
      id: empresa.id,
      nome: empresa.nome,
      plano: empresa.plano,
      ativo: empresa.ativo,
      valor_mensal: PLANOS_PRECO[empresa.plano],
    };
  },

  async financeiroResumo() {
    const assinaturas = await this.listarAssinaturas();
    const [pagarPendente, receberPendente, recebidoMes, despesasMes] = await Promise.all([
      masterRepository.somarLancamentosPendentes(TipoLancamentoMaster.PAGAR),
      masterRepository.somarLancamentosPendentes(TipoLancamentoMaster.RECEBER),
      masterRepository.somarLancamentosPagosMes(TipoLancamentoMaster.RECEBER),
      masterRepository.somarLancamentosPagosMes(TipoLancamentoMaster.PAGAR),
    ]);

    return {
      mrr: assinaturas.mrr,
      arr: assinaturas.arr,
      empresas_ativas: assinaturas.stats.ativas,
      empresas_total: assinaturas.stats.total,
      contas_pagar_pendentes: pagarPendente,
      contas_receber_pendentes: receberPendente,
      recebido_mes: recebidoMes,
      despesas_mes: despesasMes,
      lucro_mes: recebidoMes - despesasMes,
    };
  },

  async listarLancamentos(tipo: TipoLancamentoMaster) {
    const data = await masterRepository.listarLancamentos(tipo);
    return data.map(mapLancamento);
  },

  async criarLancamento(
    input: {
      tipo: TipoLancamentoMaster;
      descricao: string;
      valor: number;
      vencimento: string;
      empresaId?: string | null;
    },
    masterUsuarioId?: string,
    ip?: string
  ) {
    const lancamento = await masterRepository.criarLancamento({
      ...input,
      vencimento: new Date(input.vencimento),
    });
    await logMasterAudit(masterUsuarioId, 'create', 'financeiro', { id: lancamento.id }, ip);
    return mapLancamento(lancamento);
  },

  async atualizarLancamento(
    id: string,
    input: {
      descricao?: string;
      valor?: number;
      vencimento?: string;
      status?: 'PENDENTE' | 'PAGO' | 'CANCELADO';
      empresaId?: string | null;
    },
    masterUsuarioId?: string,
    ip?: string
  ) {
    const lancamento = await masterRepository.atualizarLancamento(id, {
      ...(input.descricao !== undefined ? { descricao: input.descricao } : {}),
      ...(input.valor !== undefined ? { valor: input.valor } : {}),
      ...(input.vencimento !== undefined ? { vencimento: new Date(input.vencimento) } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.empresaId !== undefined ? { empresaId: input.empresaId } : {}),
    });
    await logMasterAudit(masterUsuarioId, 'update', 'financeiro', { id, ...input }, ip);
    return mapLancamento(lancamento);
  },

  async excluirLancamento(id: string, masterUsuarioId?: string, ip?: string) {
    await masterRepository.excluirLancamento(id);
    await logMasterAudit(masterUsuarioId, 'delete', 'financeiro', { id }, ip);
    return { ok: true };
  },

  async listarPagamentosFinanceiro(limit = 30) {
    const data = await masterRepository.listarPagamentosMaster(limit);
    return data.map(mapLancamento);
  },

  async permissoesMeta() {
    return getPermissionsMeta();
  },

  async listarPermissoes(perfil: string) {
    const rows = await masterRepository.listarPermissoesPerfil(perfil);
    return rows.map((row) => ({
      perfil: row.perfil,
      modulo: row.modulo,
      acoes: row.acoes as string[],
    }));
  },

  async atualizarPermissao(
    input: { perfil: string; modulo: string; acoes: string[] },
    masterUsuarioId?: string,
    ip?: string
  ) {
    const row = await masterRepository.upsertPermissao(input.perfil, input.modulo, input.acoes);
    await logMasterAudit(masterUsuarioId, 'update', 'permissoes', input, ip);
    return { perfil: row.perfil, modulo: row.modulo, acoes: row.acoes as string[] };
  },

  async listarLogs(limit = 40, modulo?: string) {
    return masterRepository.listarAuditLogs(limit, modulo);
  },

  async monitoramento() {
    const stats = await masterRepository.contarPlataforma();
    const mem = process.memoryUsage();

    return {
      api: 'online',
      timestamp: new Date().toISOString(),
      stats,
      memoria: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      },
    };
  },
};

function buildLoginHint(empresaId: string) {
  const base = (env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/login?empresaId=${empresaId}`;
}

function mapEmpresa(empresa: Awaited<ReturnType<typeof masterRepository.listarEmpresas>>[number]) {
  return {
    id: empresa.id,
    nome: empresa.nome,
    cnpj: empresa.cnpj,
    email: empresa.email,
    telefone: empresa.telefone,
    taxaJurosMes: Number(empresa.taxaJurosMes),
    taxaMulta: Number(empresa.taxaMulta),
    plano: empresa.plano,
    ativo: empresa.ativo,
    criadoEm: empresa.criadoEm,
    admin: empresa.usuarios[0] ?? null,
    totais: empresa._count,
    loginUrl: buildLoginHint(empresa.id),
    valor_mensal: PLANOS_PRECO[empresa.plano],
  };
}

function mapLancamento(
  lancamento: Awaited<ReturnType<typeof masterRepository.listarLancamentos>>[number]
) {
  return {
    id: lancamento.id,
    tipo: lancamento.tipo,
    descricao: lancamento.descricao,
    valor: Number(lancamento.valor),
    vencimento: lancamento.vencimento,
    status: lancamento.status,
    empresaId: lancamento.empresaId,
    empresa: lancamento.empresa,
    criadoEm: lancamento.criadoEm,
  };
}

export async function bootstrapMasterUser() {
  if (!isMasterConfigured()) {
    console.log('[Master] MASTER_EMAIL/MASTER_PASSWORD não configurados — bootstrap ignorado.');
    return;
  }

  const masterEmail = getMasterEmail();
  const senhaHash = await hashPassword(env.MASTER_PASSWORD!);

  await prisma.empresa.updateMany({
    where: { nome: 'Plataforma SysJuros' },
    data: { nome: 'Plataforma SysContabel' },
  });

  let empresaPlataforma = await prisma.empresa.findFirst({
    where: { nome: 'Plataforma SysContabel' },
    select: { id: true },
  });

  if (!empresaPlataforma) {
    empresaPlataforma = await prisma.empresa.create({
      data: {
        nome: 'Plataforma SysContabel',
        email: masterEmail,
        ativo: true,
      },
      select: { id: true },
    });
  }

  await prisma.usuario.updateMany({
    where: { isMaster: true, email: { not: masterEmail } },
    data: { isMaster: false },
  });

  await prisma.usuario.upsert({
    where: {
      empresaId_email: {
        empresaId: empresaPlataforma.id,
        email: masterEmail,
      },
    },
    update: {
      nome: 'Master SysContabel',
      senhaHash,
      isMaster: true,
      ativo: true,
      perfil: 'ADMIN',
    },
    create: {
      empresaId: empresaPlataforma.id,
      nome: 'Master SysContabel',
      email: masterEmail,
      senhaHash,
      isMaster: true,
      ativo: true,
      perfil: 'ADMIN',
    },
  });

  console.log('[Master] Usuário master sincronizado:', masterEmail);
  await bootstrapMasterPermissions();
}
