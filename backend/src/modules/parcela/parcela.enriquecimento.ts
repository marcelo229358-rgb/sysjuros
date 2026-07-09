import { StatusParcela } from '@prisma/client';
import { empresaRepository } from '../empresa/empresa.repository';
import { parcelaRepository } from './parcela.repository';
import { calcularValorAtualizado } from './parcela.calculo';
import { AppError } from '../../shared/errors/AppError';
import { startOfDay } from '../../shared/utils/date.util';

export function arredondarMoeda(valor: number): number {
  return Math.round(valor * 100) / 100;
}

type ParcelaComContrato = NonNullable<Awaited<ReturnType<typeof parcelaRepository.buscarPorId>>>;

type ContratoComTaxas = {
  taxaJurosMes?: { toString(): string } | number | null;
  taxaMulta?: { toString(): string } | number | null;
};

export function resolverTaxasParcela(
  contrato: ContratoComTaxas | null | undefined,
  taxasEmpresa: { taxaJurosMes: number; taxaMulta: number }
) {
  return {
    taxaJurosMes:
      contrato?.taxaJurosMes != null ? Number(contrato.taxaJurosMes) : taxasEmpresa.taxaJurosMes,
    taxaMulta: contrato?.taxaMulta != null ? Number(contrato.taxaMulta) : taxasEmpresa.taxaMulta,
  };
}

export function enriquecerParcela(
  parcela: ParcelaComContrato,
  taxasEmpresa: { taxaJurosMes: number; taxaMulta: number },
  referencia: Date
) {
  const taxas = resolverTaxasParcela(parcela.contrato, taxasEmpresa);
  const valorOriginal = Number(parcela.valorOriginal);
  const base = {
    ...parcela,
    valorOriginal,
    valorMulta: Number(parcela.valorMulta),
    valorJuros: Number(parcela.valorJuros),
    valorAtualizado: Number(parcela.valorAtualizado),
  };

  if (parcela.status !== StatusParcela.PENDENTE) {
    return base;
  }

  const calculo = calcularValorAtualizado({
    valorOriginal,
    dataVencimento: parcela.dataVencimento,
    dataReferencia: referencia,
    taxaJurosMes: taxas.taxaJurosMes,
    taxaMulta: taxas.taxaMulta,
  });

  return {
    ...base,
    valorMulta: arredondarMoeda(calculo.valorMulta),
    valorJuros: arredondarMoeda(calculo.valorJuros),
    valorAtualizado: arredondarMoeda(calculo.valorAtualizado),
    diasAtraso: calculo.diasAtraso,
  };
}

export async function obterTaxasEmpresa(empresaId: string) {
  const empresa = await empresaRepository.findById(empresaId);

  if (!empresa) {
    throw new AppError('Empresa não encontrada', 404);
  }

  return {
    taxaJurosMes: Number(empresa.taxaJurosMes),
    taxaMulta: Number(empresa.taxaMulta),
  };
}

export async function buscarParcelasVencidasEnriquecidas(empresaId: string) {
  const referencia = startOfDay(new Date());
  const taxas = await obterTaxasEmpresa(empresaId);
  const parcelas = await parcelaRepository.buscarVencidas(empresaId, referencia);
  const agora = new Date();

  return parcelas.map((parcela) => enriquecerParcela(parcela, taxas, agora));
}
