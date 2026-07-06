import { Prisma, StatusParcela } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database';

export interface CriarParcelaInput {
  empresaId: string;
  contratoId: string;
  numero: number;
  valorOriginal: number;
  valorAtualizado: number;
  dataVencimento: Date;
  status: StatusParcela;
}

export const parcelaRepository = {
  async criarEmLote(parcelas: CriarParcelaInput[]) {
    return prisma.parcela.createMany({
      data: parcelas.map((parcela) => ({
        empresaId: parcela.empresaId,
        contratoId: parcela.contratoId,
        numero: parcela.numero,
        valorOriginal: new Decimal(parcela.valorOriginal),
        valorAtualizado: new Decimal(parcela.valorAtualizado),
        dataVencimento: parcela.dataVencimento,
        status: parcela.status,
      })),
    });
  },

  async buscarPorId(id: string, empresaId: string) {
    return prisma.parcela.findFirst({
      where: { id, empresaId },
      include: {
        contrato: {
          include: {
            cliente: { select: { id: true, nome: true, cpfCnpj: true, telefone: true } },
          },
        },
      },
    });
  },

  async buscarComRelacoes(id: string, empresaId: string) {
    return prisma.parcela.findFirst({
      where: { id, empresaId },
      include: {
        contrato: {
          include: {
            cliente: true,
            empresa: true,
          },
        },
      },
    });
  },

  async listar(
    empresaId: string,
    params: {
      skip: number;
      take: number;
      status?: StatusParcela;
      contratoId?: string;
      clienteId?: string;
      dataVencimentoInicio?: Date;
      dataVencimentoFim?: Date;
    }
  ) {
    const where: Prisma.ParcelaWhereInput = {
      empresaId,
      ...(params.status ? { status: params.status } : {}),
      ...(params.contratoId ? { contratoId: params.contratoId } : {}),
      ...(params.clienteId ? { contrato: { clienteId: params.clienteId } } : {}),
      ...(params.dataVencimentoInicio || params.dataVencimentoFim
        ? {
            dataVencimento: {
              ...(params.dataVencimentoInicio ? { gte: params.dataVencimentoInicio } : {}),
              ...(params.dataVencimentoFim ? { lte: params.dataVencimentoFim } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.parcela.findMany({
        where,
        skip: params.skip,
        take: params.take,
        include: {
          contrato: {
            include: {
              cliente: { select: { id: true, nome: true, cpfCnpj: true } },
            },
          },
        },
        orderBy: { dataVencimento: 'asc' },
      }),
      prisma.parcela.count({ where }),
    ]);

    return { data, total };
  },

  async listarVencidas(empresaId: string, referencia: Date) {
    return this.buscarVencidas(empresaId, referencia);
  },

  async buscarVencidas(empresaId: string, referencia: Date) {
    return prisma.parcela.findMany({
      where: {
        empresaId,
        status: StatusParcela.PENDENTE,
        dataVencimento: { lt: referencia },
      },
      include: {
        contrato: {
          include: {
            cliente: { select: { id: true, nome: true, cpfCnpj: true } },
          },
        },
      },
      orderBy: { dataVencimento: 'asc' },
    });
  },

  async listarProximosVencimentos(
    empresaId: string,
    dataInicio: Date,
    dataFim: Date
  ) {
    return prisma.parcela.findMany({
      where: {
        empresaId,
        status: StatusParcela.PENDENTE,
        dataVencimento: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      include: {
        contrato: {
          select: {
            numero: true,
            cliente: { select: { id: true, nome: true } },
          },
        },
      },
      orderBy: { dataVencimento: 'asc' },
    });
  },

  async somarValorOriginalPendentes(empresaId: string) {
    const result = await prisma.parcela.aggregate({
      where: {
        empresaId,
        status: StatusParcela.PENDENTE,
      },
      _sum: { valorOriginal: true },
    });

    return Number(result._sum.valorOriginal ?? 0);
  },

  async listarAVencer(empresaId: string, referencia: Date) {
    return prisma.parcela.findMany({
      where: {
        empresaId,
        status: StatusParcela.PENDENTE,
        dataVencimento: { gte: referencia },
      },
      include: {
        contrato: {
          include: {
            cliente: { select: { id: true, nome: true, cpfCnpj: true } },
          },
        },
      },
      orderBy: { dataVencimento: 'asc' },
    });
  },

  async atualizar(
    id: string,
    empresaId: string,
    data: {
      valorMulta?: number;
      valorJuros?: number;
      valorAtualizado?: number;
      status?: StatusParcela;
      dataPagamento?: Date | null;
    }
  ) {
    const parcela = await this.buscarPorId(id, empresaId);
    if (!parcela) return null;

    return prisma.parcela.update({
      where: { id },
      data: {
        ...(data.valorMulta !== undefined ? { valorMulta: new Decimal(data.valorMulta) } : {}),
        ...(data.valorJuros !== undefined ? { valorJuros: new Decimal(data.valorJuros) } : {}),
        ...(data.valorAtualizado !== undefined
          ? { valorAtualizado: new Decimal(data.valorAtualizado) }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.dataPagamento !== undefined ? { dataPagamento: data.dataPagamento } : {}),
      },
    });
  },

  async contarPendentesPorContrato(contratoId: string, empresaId: string) {
    return prisma.parcela.count({
      where: {
        contratoId,
        empresaId,
        status: StatusParcela.PENDENTE,
      },
    });
  },
};
