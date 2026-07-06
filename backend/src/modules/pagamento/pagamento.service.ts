import { StatusContrato, StatusParcela } from '@prisma/client';
import { prisma } from '../../config/database';
import { pagamentoRepository } from './pagamento.repository';
import { parcelaRepository } from '../parcela/parcela.repository';
import { contratoRepository } from '../contrato/contrato.repository';
import { parcelaService } from '../parcela/parcela.service';
import { AppError } from '../../shared/errors/AppError';
import { buildPaginacaoMeta } from '../../shared/utils/pagination.util';
import { RegistrarPagamentoDTO, ListarPagamentosQuery } from './pagamento.dto';

function arredondarMoeda(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function serializarPagamento(
  pagamento: Awaited<ReturnType<typeof pagamentoRepository.criar>>
) {
  return {
    ...pagamento,
    valorPago: Number(pagamento.valorPago),
    parcela: {
      ...pagamento.parcela,
      valorOriginal: Number(pagamento.parcela.valorOriginal),
      valorMulta: Number(pagamento.parcela.valorMulta),
      valorJuros: Number(pagamento.parcela.valorJuros),
      valorAtualizado: Number(pagamento.parcela.valorAtualizado),
    },
  };
}

export const pagamentoService = {
  async registrar(empresaId: string, input: RegistrarPagamentoDTO) {
    const { parcela, valorMulta, valorJuros, valorAtualizado } =
      await parcelaService.calcularValorParaPagamento(input.parcelaId, empresaId);

    const valorAtualizadoArredondado = arredondarMoeda(valorAtualizado);
    const valorPagoArredondado = arredondarMoeda(input.valorPago);

    if (valorPagoArredondado !== valorAtualizadoArredondado) {
      throw new AppError(
        `Pagamento deve ser integral. Valor esperado: R$ ${valorAtualizadoArredondado.toFixed(2)}`,
        400
      );
    }

    const pagamento = await prisma.$transaction(async () => {
      await parcelaRepository.atualizar(parcela.id, empresaId, {
        valorMulta: arredondarMoeda(valorMulta),
        valorJuros: arredondarMoeda(valorJuros),
        valorAtualizado: valorAtualizadoArredondado,
        status: StatusParcela.PAGA,
        dataPagamento: new Date(),
      });

      const novoPagamento = await pagamentoRepository.criar({
        empresaId,
        parcelaId: parcela.id,
        valorPago: valorPagoArredondado,
        formaPagamento: input.formaPagamento,
        observacoes: input.observacoes ?? null,
      });

      const parcelasAbertas = await parcelaRepository.contarPendentesPorContrato(
        parcela.contratoId,
        empresaId
      );

      if (parcelasAbertas === 0) {
        await contratoRepository.atualizarStatus(
          parcela.contratoId,
          empresaId,
          StatusContrato.QUITADO
        );
      }

      return novoPagamento;
    });

    return serializarPagamento(pagamento);
  },

  async listar(empresaId: string, query: ListarPagamentosQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const { data, total } = await pagamentoRepository.listar(empresaId, {
      skip,
      take: limit,
      clienteId: query.clienteId,
      dataInicio: query.dataInicio,
      dataFim: query.dataFim,
    });

    return {
      data: data.map(serializarPagamento),
      meta: buildPaginacaoMeta(total, page, limit),
    };
  },

  async obterPorId(id: string, empresaId: string) {
    const pagamento = await pagamentoRepository.buscarPorId(id, empresaId);

    if (!pagamento) {
      throw new AppError('Pagamento não encontrado', 404);
    }

    return serializarPagamento(pagamento);
  },
};
