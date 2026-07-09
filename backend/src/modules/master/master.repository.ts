import { prisma } from '../../config/database';
import { Prisma, StatusLancamentoMaster, TipoLancamentoMaster } from '@prisma/client';
import { PLATAFORMA_EMPRESA_NOMES } from './master.constants';

const empresaTenantWhere = { nome: { notIn: PLATAFORMA_EMPRESA_NOMES } } as const;

export const masterRepository = {
  async findMasterByEmail(email: string) {
    return prisma.usuario.findFirst({
      where: { email, isMaster: true, ativo: true },
      select: {
        id: true,
        nome: true,
        email: true,
        senhaHash: true,
        isMaster: true,
      },
    });
  },

  async listarEmpresas() {
    return prisma.empresa.findMany({
      where: empresaTenantWhere,
      orderBy: { criadoEm: 'desc' },
      include: {
        _count: {
          select: {
            usuarios: true,
            clientes: true,
            contratos: true,
          },
        },
        usuarios: {
          where: { perfil: 'ADMIN', isMaster: false },
          take: 1,
          select: { email: true, nome: true },
        },
      },
    });
  },

  async obterEmpresaPorId(id: string) {
    return prisma.empresa.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usuarios: true,
            clientes: true,
            contratos: true,
          },
        },
        usuarios: {
          where: { perfil: 'ADMIN', isMaster: false },
          take: 1,
          select: { email: true, nome: true },
        },
      },
    });
  },

  async criarEmpresaComAdmin(
    empresa: Prisma.EmpresaCreateInput,
    admin?: { nome: string; email: string; senhaHash: string }
  ) {
    return prisma.$transaction(async (tx) => {
      const novaEmpresa = await tx.empresa.create({ data: empresa });

      if (admin) {
        await tx.usuario.create({
          data: {
            empresaId: novaEmpresa.id,
            nome: admin.nome,
            email: admin.email,
            senhaHash: admin.senhaHash,
            perfil: 'ADMIN',
            deveAlterarSenha: true,
          },
        });
      }

      return novaEmpresa;
    });
  },

  async atualizarEmpresa(id: string, data: Prisma.EmpresaUpdateInput) {
    return prisma.empresa.update({
      where: { id },
      data,
    });
  },

  async contarPlataforma() {
    const [empresas, empresasAtivas, usuarios, clientes, contratos] = await Promise.all([
      prisma.empresa.count(),
      prisma.empresa.count({ where: { ativo: true } }),
      prisma.usuario.count({ where: { isMaster: false } }),
      prisma.cliente.count(),
      prisma.contrato.count(),
    ]);

    return { empresas, empresasAtivas, usuarios, clientes, contratos };
  },

  async emailAdminJaExiste(email: string) {
    const usuario = await prisma.usuario.findFirst({
      where: { email, isMaster: false },
      select: { id: true },
    });
    return !!usuario;
  },

  async clientesStats() {
    const [empresasTotal, empresasAtivas, usuarios, admins] = await Promise.all([
      prisma.empresa.count({ where: empresaTenantWhere }),
      prisma.empresa.count({ where: { ...empresaTenantWhere, ativo: true } }),
      prisma.usuario.count({ where: { isMaster: false, perfil: { not: 'ADMIN' } } }),
      prisma.usuario.count({ where: { isMaster: false, perfil: 'ADMIN' } }),
    ]);

    return {
      empresas_total: empresasTotal,
      empresas_ativas: empresasAtivas,
      usuarios_operacionais: usuarios,
      admins_empresa: admins,
    };
  },

  async listarClientesEmpresas(search?: string, status?: string) {
    const where: Prisma.EmpresaWhereInput = {
      ...empresaTenantWhere,
      ...(status === 'ativa' ? { ativo: true } : {}),
      ...(status === 'inativa' ? { ativo: false } : {}),
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { cnpj: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return prisma.empresa.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      include: {
        usuarios: {
          where: { perfil: 'ADMIN', isMaster: false },
          take: 1,
          select: { nome: true, email: true },
        },
        _count: { select: { clientes: true, usuarios: true } },
      },
    });
  },

  async listarUsuariosPlataforma(search?: string) {
    const where: Prisma.UsuarioWhereInput = {
      isMaster: false,
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return prisma.usuario.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      take: 200,
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        criadoEm: true,
        empresa: { select: { id: true, nome: true } },
      },
    });
  },

  async listarLancamentos(tipo: TipoLancamentoMaster) {
    return prisma.masterLancamento.findMany({
      where: { tipo },
      orderBy: [{ status: 'asc' }, { vencimento: 'asc' }],
      include: { empresa: { select: { id: true, nome: true } } },
    });
  },

  async criarLancamento(data: {
    tipo: TipoLancamentoMaster;
    descricao: string;
    valor: number;
    vencimento: Date;
    empresaId?: string | null;
  }) {
    return prisma.masterLancamento.create({
      data: {
        tipo: data.tipo,
        descricao: data.descricao,
        valor: data.valor,
        vencimento: data.vencimento,
        empresaId: data.empresaId ?? null,
      },
      include: { empresa: { select: { id: true, nome: true } } },
    });
  },

  async atualizarLancamento(
    id: string,
    data: Partial<{
      descricao: string;
      valor: number;
      vencimento: Date;
      status: StatusLancamentoMaster;
      empresaId: string | null;
    }>
  ) {
    return prisma.masterLancamento.update({
      where: { id },
      data,
      include: { empresa: { select: { id: true, nome: true } } },
    });
  },

  async excluirLancamento(id: string) {
    return prisma.masterLancamento.delete({ where: { id } });
  },

  async listarPagamentosMaster(limit = 30) {
    return prisma.masterLancamento.findMany({
      where: { status: 'PAGO' },
      orderBy: { vencimento: 'desc' },
      take: limit,
      include: { empresa: { select: { id: true, nome: true } } },
    });
  },

  async somarLancamentosPendentes(tipo: TipoLancamentoMaster) {
    const result = await prisma.masterLancamento.aggregate({
      where: { tipo, status: 'PENDENTE' },
      _sum: { valor: true },
    });
    return Number(result._sum.valor ?? 0);
  },

  async somarLancamentosPagosMes(tipo: TipoLancamentoMaster) {
    const now = new Date();
    const inicio = new Date(now.getFullYear(), now.getMonth(), 1);
    const fim = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const result = await prisma.masterLancamento.aggregate({
      where: {
        tipo,
        status: 'PAGO',
        vencimento: { gte: inicio, lte: fim },
      },
      _sum: { valor: true },
    });
    return Number(result._sum.valor ?? 0);
  },

  async listarPermissoesPerfil(perfil: string) {
    return prisma.masterPermissao.findMany({
      where: { perfil },
      orderBy: { modulo: 'asc' },
    });
  },

  async upsertPermissao(perfil: string, modulo: string, acoes: string[]) {
    return prisma.masterPermissao.upsert({
      where: { perfil_modulo: { perfil, modulo } },
      update: { acoes },
      create: { perfil, modulo, acoes },
    });
  },

  async listarAuditLogs(limit: number, modulo?: string) {
    return prisma.masterAuditLog.findMany({
      where: modulo ? { modulo } : undefined,
      orderBy: { criadoEm: 'desc' },
      take: limit,
    });
  },

  async excluirEmpresa(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.pagamento.deleteMany({ where: { empresaId: id } });
      await tx.parcela.deleteMany({ where: { empresaId: id } });
      await tx.contrato.deleteMany({ where: { empresaId: id } });
      await tx.logAuditoria.deleteMany({ where: { empresaId: id } });
      await tx.notificacao.deleteMany({ where: { empresaId: id } });
      await tx.cliente.deleteMany({ where: { empresaId: id } });
      await tx.usuario.deleteMany({ where: { empresaId: id } });
      await tx.empresa.delete({ where: { id } });
    });
  },
};
