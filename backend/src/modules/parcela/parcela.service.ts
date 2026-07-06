import { StatusParcela } from '@prisma/client';
import { parcelaRepository } from './parcela.repository';
import { empresaRepository } from '../empresa/empresa.repository';
import { AppError } from '../../shared/errors/AppError';
import { buildPaginacaoMeta } from '../../shared/utils/pagination.util';
import { startOfDay } from '../../shared/utils/date.util';
import { ListarParcelasQuery, AtualizarStatusParcelaDTO } from './parcela.dto';
import {
  enriquecerParcela,
  obterTaxasEmpresa,
  buscarParcelasVencidasEnriquecidas,
} from './parcela.enriquecimento';

export const parcelaService = {
  async listar(empresaId: string, query: ListarParcelasQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const referencia = new Date();
    const taxas = await obterTaxasEmpresa(empresaId);

    const { data, total } = await parcelaRepository.listar(empresaId, {
      skip,
      take: limit,
      status: query.status,
      contratoId: query.contratoId,
      clienteId: query.clienteId,
      dataVencimentoInicio: query.vencimentoInicio,
      dataVencimentoFim: query.vencimentoFim,
    });

    return {
      data: data.map((parcela) => enriquecerParcela(parcela, taxas, referencia)),
      meta: buildPaginacaoMeta(total, page, limit),
    };
  },

  async listarVencidas(empresaId: string) {
    return buscarParcelasVencidasEnriquecidas(empresaId);
  },

  async listarAVencer(empresaId: string) {
    const referencia = startOfDay(new Date());
    const taxas = await obterTaxasEmpresa(empresaId);
    const parcelas = await parcelaRepository.listarAVencer(empresaId, referencia);

    return parcelas.map((parcela) => enriquecerParcela(parcela, taxas, new Date()));
  },

  async obterPorId(id: string, empresaId: string) {
    const parcela = await parcelaRepository.buscarPorId(id, empresaId);

    if (!parcela) {
      throw new AppError('Parcela não encontrada', 404);
    }

    const taxas = await obterTaxasEmpresa(empresaId);
    return enriquecerParcela(parcela, taxas, new Date());
  },

  async atualizarStatus(id: string, empresaId: string, input: AtualizarStatusParcelaDTO) {
    const parcela = await parcelaRepository.buscarPorId(id, empresaId);

    if (!parcela) {
      throw new AppError('Parcela não encontrada', 404);
    }

    if (parcela.status === StatusParcela.PAGA) {
      throw new AppError('Parcela paga não pode ter o status alterado', 400);
    }

    const atualizada = await parcelaRepository.atualizar(id, empresaId, {
      status: input.status,
    });

    if (!atualizada) {
      throw new AppError('Parcela não encontrada', 404);
    }

    const taxas = await obterTaxasEmpresa(empresaId);
    return enriquecerParcela(
      {
        ...atualizada,
        contrato: parcela.contrato,
      },
      taxas,
      new Date()
    );
  },

  async calcularValorParaPagamento(id: string, empresaId: string) {
    const parcela = await parcelaRepository.buscarPorId(id, empresaId);

    if (!parcela) {
      throw new AppError('Parcela não encontrada', 404);
    }

    if (parcela.status === StatusParcela.PAGA) {
      throw new AppError('Parcela já paga', 400);
    }

    const taxas = await obterTaxasEmpresa(empresaId);
    const enriquecida = enriquecerParcela(parcela, taxas, new Date());

    return {
      parcela,
      valorMulta: enriquecida.valorMulta,
      valorJuros: enriquecida.valorJuros,
      valorAtualizado: enriquecida.valorAtualizado,
    };
  },
};
