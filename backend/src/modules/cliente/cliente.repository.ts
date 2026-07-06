import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { StatusContrato } from '@prisma/client';

export const clienteRepository = {
  async criar(empresaId: string, data: Prisma.ClienteCreateWithoutEmpresaInput) {
    return prisma.cliente.create({
      data: { ...data, empresaId },
    });
  },

  async listar(
    empresaId: string,
    params: {
      skip: number;
      take: number;
      nome?: string;
      cpfCnpj?: string;
      incluirInativos?: boolean;
    }
  ) {
    const where: Prisma.ClienteWhereInput = {
      empresaId,
      ...(params.incluirInativos ? {} : { ativo: true }),
      ...(params.nome ? { nome: { contains: params.nome, mode: 'insensitive' } } : {}),
      ...(params.cpfCnpj
        ? { cpfCnpj: { contains: params.cpfCnpj.replace(/\D/g, '') } }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { nome: 'asc' },
      }),
      prisma.cliente.count({ where }),
    ]);

    return { data, total };
  },

  async buscarPorId(id: string, empresaId: string) {
    return prisma.cliente.findFirst({
      where: { id, empresaId },
    });
  },

  async buscarPorCpfCnpj(cpfCnpj: string, empresaId: string, excludeId?: string) {
    return prisma.cliente.findFirst({
      where: {
        empresaId,
        cpfCnpj,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
  },

  async atualizar(id: string, empresaId: string, data: Prisma.ClienteUpdateInput) {
    const cliente = await this.buscarPorId(id, empresaId);
    if (!cliente) return null;

    return prisma.cliente.update({
      where: { id },
      data,
    });
  },

  async softDelete(id: string, empresaId: string) {
    const cliente = await this.buscarPorId(id, empresaId);
    if (!cliente) return null;

    return prisma.cliente.update({
      where: { id },
      data: { ativo: false },
    });
  },

  async contarContratosEmAberto(clienteId: string, empresaId: string) {
    return prisma.contrato.count({
      where: {
        empresaId,
        clienteId,
        status: { in: [StatusContrato.ATIVO, StatusContrato.INADIMPLENTE] },
      },
    });
  },

  async contarAtivos(empresaId: string) {
    return prisma.cliente.count({
      where: { empresaId, ativo: true },
    });
  },
};
