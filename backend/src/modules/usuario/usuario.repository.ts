import { PerfilUsuario } from '@prisma/client';
import { prisma } from '../../config/database';

const usuarioSelect = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  empresaId: true,
  ativo: true,
  deveAlterarSenha: true,
  criadoEm: true,
} as const;

export const usuarioRepository = {
  async findByEmailAndEmpresa(email: string, empresaId: string) {
    return prisma.usuario.findUnique({
      where: {
        empresaId_email: { empresaId, email: email.trim().toLowerCase() },
      },
      include: { empresa: true },
    });
  },

  async findActiveByEmail(email: string) {
    return prisma.usuario.findMany({
      where: {
        email: email.trim().toLowerCase(),
        ativo: true,
        isMaster: false,
        empresa: { ativo: true },
      },
      include: { empresa: true },
    });
  },

  async findByIdAndEmpresa(id: string, empresaId: string) {
    return prisma.usuario.findFirst({
      where: { id, empresaId, ativo: true, isMaster: false },
      select: usuarioSelect,
    });
  },

  async findByIdIncluindoInativo(id: string, empresaId: string) {
    return prisma.usuario.findFirst({
      where: { id, empresaId, isMaster: false },
      select: usuarioSelect,
    });
  },

  async findByEmailInEmpresa(email: string, empresaId: string, excludeId?: string) {
    return prisma.usuario.findFirst({
      where: {
        empresaId,
        email: email.trim().toLowerCase(),
        isMaster: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
  },

  async criar(
    empresaId: string,
    data: {
      nome: string;
      email: string;
      senhaHash: string;
      perfil: PerfilUsuario;
      deveAlterarSenha?: boolean;
    }
  ) {
    return prisma.usuario.create({
      data: {
        empresaId,
        nome: data.nome.trim(),
        email: data.email.trim().toLowerCase(),
        senhaHash: data.senhaHash,
        perfil: data.perfil,
        deveAlterarSenha: data.deveAlterarSenha ?? true,
      },
      select: usuarioSelect,
    });
  },

  async listar(
    empresaId: string,
    opts: { skip: number; take: number; nome?: string; email?: string; incluirInativos?: boolean }
  ) {
    const where = {
      empresaId,
      isMaster: false,
      ...(opts.incluirInativos ? {} : { ativo: true }),
      ...(opts.nome
        ? { nome: { contains: opts.nome, mode: 'insensitive' as const } }
        : {}),
      ...(opts.email
        ? { email: { contains: opts.email.trim().toLowerCase(), mode: 'insensitive' as const } }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        skip: opts.skip,
        take: opts.take,
        orderBy: { nome: 'asc' },
        select: usuarioSelect,
      }),
      prisma.usuario.count({ where }),
    ]);

    return { data, total };
  },

  async atualizar(
    id: string,
    empresaId: string,
    data: Partial<{
      nome: string;
      email: string;
      perfil: PerfilUsuario;
      ativo: boolean;
      senhaHash: string;
      deveAlterarSenha: boolean;
    }>
  ) {
    const result = await prisma.usuario.updateMany({
      where: { id, empresaId, isMaster: false },
      data,
    });

    if (!result.count) return null;

    return this.findByIdIncluindoInativo(id, empresaId);
  },

  async contarAdminsAtivos(empresaId: string, excludeId?: string) {
    return prisma.usuario.count({
      where: {
        empresaId,
        isMaster: false,
        ativo: true,
        perfil: 'ADMIN',
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  async findAuthByIdAndEmpresa(id: string, empresaId: string) {
    return prisma.usuario.findFirst({
      where: { id, empresaId, ativo: true, isMaster: false },
      select: {
        ...usuarioSelect,
        senhaHash: true,
      },
    });
  },

  async atualizarSenha(id: string, empresaId: string, senhaHash: string, deveAlterarSenha: boolean) {
    return this.atualizar(id, empresaId, { senhaHash, deveAlterarSenha });
  },
};
