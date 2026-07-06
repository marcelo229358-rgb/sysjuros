import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database';

export const pagamentoRepository = {
  async criar(data: {
    empresaId: string;
    parcelaId: string;
    valorPago: number;
    formaPagamento: string;
    observacoes?: string | null;
  }) {
    return prisma.pagamento.create({
      data: {
        empresaId: data.empresaId,
        parcelaId: data.parcelaId,
        valorPago: new Decimal(data.valorPago),
        formaPagamento: data.formaPagamento,
        observacoes: data.observacoes ?? null,
      },
      include: {
        parcela: {
          include: {
            contrato: {
              include: {
                cliente: { select: { id: true, nome: true, cpfCnpj: true } },
              },
            },
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
      clienteId?: string;
      dataInicio?: Date;
      dataFim?: Date;
    }
  ) {
    const where: Prisma.PagamentoWhereInput = {
      empresaId,
      ...(params.clienteId
        ? { parcela: { contrato: { clienteId: params.clienteId } } }
        : {}),
      ...(params.dataInicio || params.dataFim
        ? {
            dataPagamento: {
              ...(params.dataInicio ? { gte: params.dataInicio } : {}),
              ...(params.dataFim ? { lte: params.dataFim } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.pagamento.findMany({
        where,
        skip: params.skip,
        take: params.take,
        include: {
          parcela: {
            include: {
              contrato: {
                include: {
                  cliente: { select: { id: true, nome: true, cpfCnpj: true } },
                },
              },
            },
          },
        },
        orderBy: { dataPagamento: 'desc' },
      }),
      prisma.pagamento.count({ where }),
    ]);

    return { data, total };
  },

  async buscarPorId(id: string, empresaId: string) {
    return prisma.pagamento.findFirst({
      where: { id, empresaId },
      include: {
        parcela: {
          include: {
            contrato: {
              include: {
                cliente: { select: { id: true, nome: true, cpfCnpj: true } },
                empresa: true,
              },
            },
          },
        },
      },
    });
  },

  async buscarComRelacoes(id: string, empresaId: string) {
    return this.buscarPorId(id, empresaId);
  },
};
