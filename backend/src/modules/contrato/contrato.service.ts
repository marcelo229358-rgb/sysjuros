import { StatusContrato, StatusParcela } from '@prisma/client';
import { prisma } from '../../config/database';
import { contratoRepository } from './contrato.repository';
import { parcelaRepository } from '../parcela/parcela.repository';
import { clienteRepository } from '../cliente/cliente.repository';
import { AppError } from '../../shared/errors/AppError';
import { adicionarMeses } from '../../shared/utils/date.util';
import { buildPaginacaoMeta } from '../../shared/utils/pagination.util';
import {
  CriarContratoDTO,
  AtualizarContratoDTO,
  AtualizarStatusContratoDTO,
  ListarContratosQuery,
} from './contrato.dto';

function gerarParcelas(
  dados: CriarContratoDTO,
  empresaId: string,
  contratoId: string
) {
  const valorParcela = dados.valorTotal / dados.numParcelas;
  const valorParcelaArredondado = Math.round(valorParcela * 100) / 100;

  const parcelas = [];
  let somaGerada = 0;

  for (let i = 1; i <= dados.numParcelas; i++) {
    const dataVencimento = adicionarMeses(dados.dataInicio, i - 1);

    const valorOriginal =
      i === dados.numParcelas ? dados.valorTotal - somaGerada : valorParcelaArredondado;

    somaGerada += valorOriginal;

    parcelas.push({
      empresaId,
      contratoId,
      numero: i,
      valorOriginal,
      valorAtualizado: valorOriginal,
      dataVencimento,
      status: StatusParcela.PENDENTE,
    });
  }

  return parcelas;
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

    const contrato = await prisma.$transaction(async () => {
      const novoContrato = await contratoRepository.criar({
        empresaId,
        clienteId: input.clienteId,
        numero: input.numero,
        valorTotal: input.valorTotal,
        numParcelas: input.numParcelas,
        dataInicio: input.dataInicio,
        observacoes: input.observacoes ?? null,
      });

      const parcelas = gerarParcelas(input, empresaId, novoContrato.id);
      await parcelaRepository.criarEmLote(parcelas);

      return novoContrato;
    });

    return contratoRepository.buscarPorId(contrato.id, empresaId);
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
