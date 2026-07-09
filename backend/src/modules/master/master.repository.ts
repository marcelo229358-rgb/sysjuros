import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

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
      where: { nome: { notIn: ['Plataforma SysJuros', 'Plataforma SysContabel'] } },
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
};
