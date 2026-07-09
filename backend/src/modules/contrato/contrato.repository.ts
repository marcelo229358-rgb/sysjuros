import { Prisma, StatusContrato } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database';

export const contratoRepository = {
  async criar(data: {
    empresaId: string;
    clienteId: string;
    numero: string;
    valorTotal: number;
    numParcelas: number;
    dataInicio: Date;
    taxaJurosMes?: number | null;
    taxaMulta?: number | null;
    observacoes?: string | null;
  }) {
    return prisma.contrato.create({
      data: {
        empresaId: data.empresaId,
        clienteId: data.clienteId,
        numero: data.numero,
        valorTotal: new Decimal(data.valorTotal),
        numParcelas: data.numParcelas,
        dataInicio: data.dataInicio,
        taxaJurosMes: data.taxaJurosMes != null ? new Decimal(data.taxaJurosMes) : null,
        taxaMulta: data.taxaMulta != null ? new Decimal(data.taxaMulta) : null,
        observacoes: data.observacoes ?? null,
      },
    });
  },

  async buscarPorNumero(numero: string, empresaId: string) {
    return prisma.contrato.findFirst({
      where: { numero, empresaId },
    });
  },

  async listar(
    empresaId: string,
    params: {
      skip: number;
      take: number;
      status?: StatusContrato;
      clienteId?: string;
    }
  ) {
    const where: Prisma.ContratoWhereInput = {
      empresaId,
      ...(params.status ? { status: params.status } : {}),
      ...(params.clienteId ? { clienteId: params.clienteId } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.contrato.findMany({
        where,
        skip: params.skip,
        take: params.take,
        include: {
          cliente: { select: { id: true, nome: true, cpfCnpj: true } },
        },
        orderBy: { criadoEm: 'desc' },
      }),
      prisma.contrato.count({ where }),
    ]);

    return { data, total };
  },

  async buscarPorId(id: string, empresaId: string) {
    return prisma.contrato.findFirst({
      where: { id, empresaId },
      include: {
        cliente: { select: { id: true, nome: true, cpfCnpj: true } },
        parcelas: { orderBy: { numero: 'asc' } },
      },
    });
  },

  async buscarComRelacoesParaExtrato(id: string, empresaId: string) {
    return prisma.contrato.findFirst({
      where: { id, empresaId },
      include: {
        cliente: true,
        empresa: true,
        parcelas: { orderBy: { numero: 'asc' } },
      },
    });
  },

  async atualizar(id: string, empresaId: string, data: Prisma.ContratoUpdateInput) {
    const contrato = await this.buscarPorId(id, empresaId);
    if (!contrato) return null;

    return prisma.contrato.update({
      where: { id },
      data,
      include: {
        cliente: { select: { id: true, nome: true, cpfCnpj: true } },
      },
    });
  },

  async atualizarStatus(id: string, empresaId: string, status: StatusContrato) {
    const contrato = await this.buscarPorId(id, empresaId);
    if (!contrato) return null;

    return prisma.contrato.update({
      where: { id },
      data: { status },
      include: {
        cliente: { select: { id: true, nome: true, cpfCnpj: true } },
      },
    });
  },

  async contarPorStatus(empresaId: string, status: StatusContrato) {
    return prisma.contrato.count({
      where: { empresaId, status },
    });
  },

  async contarPorStatusAgrupado(empresaId: string) {
    return prisma.contrato.groupBy({
      by: ['status'],
      where: { empresaId },
      _count: { id: true },
    });
  },
};
