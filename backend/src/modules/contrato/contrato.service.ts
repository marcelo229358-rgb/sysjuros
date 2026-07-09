import { StatusContrato, StatusParcela } from '@prisma/client';
import { prisma } from '../../config/database';
import { contratoRepository } from './contrato.repository';
import { parcelaRepository } from '../parcela/parcela.repository';
import { clienteRepository } from '../cliente/cliente.repository';
import { AppError } from '../../shared/errors/AppError';
import { adicionarMeses } from '../../shared/utils/date.util';
import { buildPaginacaoMeta } from '../../shared/utils/pagination.util';
import {
  calcularAmortizacao,
  ModoAmortizacao,
} from '../../shared/utils/amortizacao.util';
import { gerarParcelasComJuros } from '../../shared/utils/parcelasComJuros.util';
import {
  CriarContratoDTO,
  AtualizarContratoDTO,
  AtualizarStatusContratoDTO,
  ListarContratosQuery,
  AmortizarContratoDTO,
} from './contrato.dto';

function gerarParcelasPadrao(
  dados: CriarContratoDTO,
  empresaId: string,
  contratoId: string,
  valorBase: number,
  taxaJurosMes: number
) {
  const geradas = gerarParcelasComJuros(
    valorBase,
    dados.numParcelas,
    dados.dataInicio,
    taxaJurosMes,
    adicionarMeses
  );

  return geradas.map((p) => ({
    empresaId,
    contratoId,
    numero: p.numero,
    valorOriginal: p.valorTotal,
    valorAtualizado: p.valorTotal,
    dataVencimento: p.vencimento,
    status: StatusParcela.PENDENTE,
  }));
}

function gerarParcelasCustomizadas(
  dados: CriarContratoDTO,
  empresaId: string,
  contratoId: string
) {
  if (!dados.parcelas?.length) return [];

  return dados.parcelas.map((p) => ({
    empresaId,
    contratoId,
    numero: p.numero,
    valorOriginal: p.valorOriginal,
    valorAtualizado: p.valorOriginal,
    dataVencimento: p.dataVencimento,
    status: StatusParcela.PENDENTE,
  }));
}

async function aplicarAmortizacaoNoContrato(
  contratoId: string,
  empresaId: string,
  valor: number,
  modo: ModoAmortizacao,
  excluirParcelaId?: string,
  parcelaNumero?: number
) {
  const pendentes = await parcelaRepository.listarPendentesPorContrato(contratoId, empresaId);
  const alvo = pendentes.filter((p) => p.id !== excluirParcelaId);

  const atualizacoes = calcularAmortizacao(
    alvo.map((p) => ({
      id: p.id,
      numero: p.numero,
      valorOriginal: Number(p.valorOriginal),
    })),
    valor,
    modo,
    parcelaNumero
  );

  for (const item of atualizacoes) {
    await parcelaRepository.atualizar(item.id, empresaId, {
      valorOriginal: item.valorOriginal,
      valorAtualizado: item.valorAtualizado,
    });
  }
}

export const contratoService = {
  async criar(empresaId: string, input: CriarContratoDTO) {
    const cliente = await clienteRepository.buscarPorId(input.clienteId, empresaId);

    if (!cliente || !cliente.ativo) {
      throw new AppError('Cliente não encontrado ou inativo', 404);
    }

    const numeroExistente = await contratoRepository.buscarPorNumero(input.numero, empresaId);

    if (numeroExistente) {
      throw new AppError('Número de contrato já cadastrado nesta empresa', 409);
    }

    const valorBase = input.valorTotal;

    const contrato = await prisma.$transaction(async () => {
      const novoContrato = await contratoRepository.criar({
        empresaId,
        clienteId: input.clienteId,
        numero: input.numero,
        valorTotal: input.valorTotal,
        numParcelas: input.numParcelas,
        dataInicio: input.dataInicio,
        taxaJurosMes: input.taxaJurosMes ?? null,
        taxaMulta: input.taxaMulta ?? null,
        observacoes: input.observacoes ?? null,
      });

      let parcelas =
        input.parcelas && input.parcelas.length > 0
          ? gerarParcelasCustomizadas(input, empresaId, novoContrato.id)
          : gerarParcelasPadrao(
              input,
              empresaId,
              novoContrato.id,
              valorBase,
              input.taxaJurosMes ?? 0
            );

      if (input.valorAntecipado && input.valorAntecipado > 0 && input.modoAmortizacao) {
        const atualizacoes = calcularAmortizacao(
          parcelas.map((p) => ({
            id: String(p.numero),
            numero: p.numero,
            valorOriginal: p.valorOriginal,
          })),
          input.valorAntecipado,
          input.modoAmortizacao,
          input.parcelaAmortizacao
        );

        parcelas = parcelas.map((p) => {
          const upd = atualizacoes.find((a) => a.id === String(p.numero));
          if (!upd) return p;
          return { ...p, valorOriginal: upd.valorOriginal, valorAtualizado: upd.valorAtualizado };
        });
      }

      await parcelaRepository.criarEmLote(parcelas);
      return novoContrato;
    });

    return contratoRepository.buscarPorId(contrato.id, empresaId);
  },

  async amortizar(id: string, empresaId: string, input: AmortizarContratoDTO) {
    const contrato = await contratoRepository.buscarPorId(id, empresaId);

    if (!contrato) {
      throw new AppError('Contrato não encontrado', 404);
    }

    if (contrato.status === StatusContrato.QUITADO) {
      throw new AppError('Contrato quitado não pode ser amortizado', 400);
    }

    await aplicarAmortizacaoNoContrato(
      id,
      empresaId,
      input.valor,
      input.modo,
      undefined,
      input.parcelaAmortizacao
    );
    return contratoRepository.buscarPorId(id, empresaId);
  },

  async listar(empresaId: string, query: ListarContratosQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const { data, total } = await contratoRepository.listar(empresaId, {
      skip,
      take: limit,
      status: query.status,
      clienteId: query.clienteId,
    });

    return {
      data: data.map((contrato) => ({
        ...contrato,
        valorTotal: Number(contrato.valorTotal),
        taxaJurosMes: contrato.taxaJurosMes != null ? Number(contrato.taxaJurosMes) : null,
        taxaMulta: contrato.taxaMulta != null ? Number(contrato.taxaMulta) : null,
      })),
      meta: buildPaginacaoMeta(total, page, limit),
    };
  },

  async obterPorId(id: string, empresaId: string) {
    const contrato = await contratoRepository.buscarPorId(id, empresaId);

    if (!contrato) {
      throw new AppError('Contrato não encontrado', 404);
    }

    return {
      ...contrato,
      valorTotal: Number(contrato.valorTotal),
      taxaJurosMes: contrato.taxaJurosMes != null ? Number(contrato.taxaJurosMes) : null,
      taxaMulta: contrato.taxaMulta != null ? Number(contrato.taxaMulta) : null,
      parcelas: contrato.parcelas.map((parcela) => ({
        ...parcela,
        valorOriginal: Number(parcela.valorOriginal),
        valorMulta: Number(parcela.valorMulta),
        valorJuros: Number(parcela.valorJuros),
        valorAtualizado: Number(parcela.valorAtualizado),
      })),
    };
  },

  async atualizar(id: string, empresaId: string, input: AtualizarContratoDTO) {
    const contrato = await contratoRepository.buscarPorId(id, empresaId);

    if (!contrato) {
      throw new AppError('Contrato não encontrado', 404);
    }

    if (input.numero && input.numero !== contrato.numero) {
      const numeroExistente = await contratoRepository.buscarPorNumero(input.numero, empresaId);

      if (numeroExistente && numeroExistente.id !== id) {
        throw new AppError('Número de contrato já cadastrado nesta empresa', 409);
      }
    }

    const atualizado = await contratoRepository.atualizar(id, empresaId, {
      ...(input.numero !== undefined ? { numero: input.numero } : {}),
      ...(input.observacoes !== undefined ? { observacoes: input.observacoes ?? null } : {}),
    });

    if (!atualizado) {
      throw new AppError('Contrato não encontrado', 404);
    }

    return {
      ...atualizado,
      valorTotal: Number(atualizado.valorTotal),
    };
  },

  async atualizarStatus(id: string, empresaId: string, input: AtualizarStatusContratoDTO) {
    const contrato = await contratoRepository.buscarPorId(id, empresaId);

    if (!contrato) {
      throw new AppError('Contrato não encontrado', 404);
    }

    if (contrato.status === StatusContrato.QUITADO && input.status !== StatusContrato.QUITADO) {
      throw new AppError('Contrato quitado não pode ter o status alterado', 400);
    }

    const atualizado = await contratoRepository.atualizarStatus(id, empresaId, input.status);

    if (!atualizado) {
      throw new AppError('Contrato não encontrado', 404);
    }

    return {
      ...atualizado,
      valorTotal: Number(atualizado.valorTotal),
    };
  },
};

export async function executarAmortizacaoAposPagamento(
  contratoId: string,
  empresaId: string,
  parcelaIdPaga: string,
  valor: number,
  modo: ModoAmortizacao,
  parcelaNumero?: number
) {
  await aplicarAmortizacaoNoContrato(
    contratoId,
    empresaId,
    valor,
    modo,
    parcelaIdPaga,
    parcelaNumero
  );
}
