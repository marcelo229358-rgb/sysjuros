import { StatusContrato } from '@prisma/client';
import { dashboardRepository } from './dashboard.repository';
import { parcelaRepository } from '../parcela/parcela.repository';
import { clienteRepository } from '../cliente/cliente.repository';
import { contratoRepository } from '../contrato/contrato.repository';
import { buscarParcelasVencidasEnriquecidas } from '../parcela/parcela.enriquecimento';
import { startOfDay, endOfDay } from '../../shared/utils/date.util';
import {
  ResumoFinanceiro,
  RecebimentoMensal,
  ContratoPorStatus,
  ProximoVencimento,
  InadimplenciaResposta,
  DevedorRanking,
  PagadorSaude,
  SaudePagadorStatus,
} from './dashboard.dto';
import { prisma } from '../../config/database';
import { StatusParcela } from '@prisma/client';

type ParcelasVencidas = Awaited<ReturnType<typeof buscarParcelasVencidasEnriquecidas>>;

function arredondarMoeda(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function arredondarPercentual(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function calcularTotaisVencidos(parcelasVencidas: ParcelasVencidas) {
  const totalVencidoOriginal = parcelasVencidas.reduce(
    (soma, parcela) => soma + parcela.valorOriginal,
    0
  );
  const totalEncargosVencidos = parcelasVencidas.reduce(
    (soma, parcela) => soma + parcela.valorMulta + parcela.valorJuros,
    0
  );

  return {
    totalVencidoOriginal: arredondarMoeda(totalVencidoOriginal),
    totalEncargosVencidos: arredondarMoeda(totalEncargosVencidos),
    totalVencido: arredondarMoeda(totalVencidoOriginal + totalEncargosVencidos),
  };
}

function calcularTaxaInadimplencia(totalAReceber: number, totalVencidoOriginal: number): number {
  if (totalAReceber <= 0) {
    return 0;
  }

  return arredondarPercentual((totalVencidoOriginal / totalAReceber) * 100);
}

function agruparDevedores(parcelasVencidas: ParcelasVencidas, limite: number): DevedorRanking[] {
  const mapa = new Map<string, DevedorRanking>();

  for (const parcela of parcelasVencidas) {
    const clienteId = parcela.contrato.cliente.id;
    const clienteNome = parcela.contrato.cliente.nome;
    const existente = mapa.get(clienteId);

    if (existente) {
      existente.qtdParcelasVencidas += 1;
      existente.valorTotalVencido += parcela.valorAtualizado;
    } else {
      mapa.set(clienteId, {
        clienteId,
        clienteNome,
        qtdParcelasVencidas: 1,
        valorTotalVencido: parcela.valorAtualizado,
      });
    }
  }

  return Array.from(mapa.values())
    .map((devedor) => ({
      ...devedor,
      valorTotalVencido: arredondarMoeda(devedor.valorTotalVencido),
    }))
    .sort((a, b) => b.valorTotalVencido - a.valorTotalVencido)
    .slice(0, limite);
}

export const dashboardService = {
  async gerarResumo(empresaId: string): Promise<ResumoFinanceiro> {
    const [totalAReceber, totalRecebidoMes, parcelasVencidas, qtdClientesAtivos, qtdContratosAtivos] =
      await Promise.all([
        parcelaRepository.somarValorOriginalPendentes(empresaId),
        dashboardRepository.somarPagamentosDoMes(empresaId),
        buscarParcelasVencidasEnriquecidas(empresaId),
        clienteRepository.contarAtivos(empresaId),
        contratoRepository.contarPorStatus(empresaId, StatusContrato.ATIVO),
      ]);

    const { totalVencidoOriginal, totalEncargosVencidos, totalVencido } =
      calcularTotaisVencidos(parcelasVencidas);
    const totalAReceberArredondado = arredondarMoeda(totalAReceber);

    return {
      totalAReceber: totalAReceberArredondado,
      totalRecebidoMes: arredondarMoeda(totalRecebidoMes),
      totalVencidoOriginal,
      totalEncargosVencidos,
      totalVencido,
      qtdParcelasVencidas: parcelasVencidas.length,
      qtdClientesAtivos,
      qtdContratosAtivos,
      taxaInadimplencia: calcularTaxaInadimplencia(totalAReceberArredondado, totalVencidoOriginal),
    };
  },

  async recebimentosMensais(empresaId: string): Promise<RecebimentoMensal[]> {
    return dashboardRepository.recebimentosMensais(empresaId);
  },

  async contratosPorStatus(empresaId: string): Promise<ContratoPorStatus[]> {
    const agrupado = await contratoRepository.contarPorStatusAgrupado(empresaId);
    const mapa = new Map(agrupado.map((item) => [item.status, item._count.id]));

    return Object.values(StatusContrato).map((status) => ({
      status,
      quantidade: mapa.get(status) ?? 0,
    }));
  },

  async proximosVencimentos(empresaId: string, dias: number): Promise<ProximoVencimento[]> {
    const inicio = startOfDay(new Date());
    const fim = endOfDay(new Date(inicio.getTime() + dias * 24 * 60 * 60 * 1000));

    const parcelas = await parcelaRepository.listarProximosVencimentos(empresaId, inicio, fim);

    return parcelas.map((parcela) => ({
      parcelaId: parcela.id,
      clienteNome: parcela.contrato.cliente.nome,
      contratoNumero: parcela.contrato.numero,
      numero: parcela.numero,
      valorOriginal: Number(parcela.valorOriginal),
      dataVencimento: parcela.dataVencimento.toISOString().split('T')[0],
    }));
  },

  async inadimplencia(empresaId: string, limite: number): Promise<InadimplenciaResposta> {
    const [totalAReceber, parcelasVencidas] = await Promise.all([
      parcelaRepository.somarValorOriginalPendentes(empresaId),
      buscarParcelasVencidasEnriquecidas(empresaId),
    ]);

    const { totalVencidoOriginal, totalEncargosVencidos, totalVencido } =
      calcularTotaisVencidos(parcelasVencidas);
    const totalAReceberArredondado = arredondarMoeda(totalAReceber);

    return {
      taxaInadimplencia: calcularTaxaInadimplencia(totalAReceberArredondado, totalVencidoOriginal),
      totalVencidoOriginal,
      totalEncargosVencidos,
      totalVencido,
      totalAReceber: totalAReceberArredondado,
      devedores: agruparDevedores(parcelasVencidas, limite),
    };
  },

  async saudePagadores(empresaId: string): Promise<PagadorSaude[]> {
    const referencia = startOfDay(new Date());
    const parcelasVencidas = await buscarParcelasVencidasEnriquecidas(empresaId);

    const vencidasPorCliente = new Map<string, { qtd: number; valor: number }>();
    for (const p of parcelasVencidas) {
      const clienteId = p.contrato.cliente.id;
      const atual = vencidasPorCliente.get(clienteId) ?? { qtd: 0, valor: 0 };
      atual.qtd += 1;
      atual.valor += p.valorAtualizado;
      vencidasPorCliente.set(clienteId, atual);
    }

    const clientes = await prisma.cliente.findMany({
      where: { empresaId, ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    });

    const parcelasPagas = await prisma.parcela.findMany({
      where: {
        empresaId,
        status: StatusParcela.PAGA,
        dataPagamento: { not: null },
      },
      select: {
        dataVencimento: true,
        dataPagamento: true,
        contrato: { select: { clienteId: true } },
      },
    });

    const pagasPorCliente = new Map<string, { emDia: number; atraso: number; totalPago: number }>();

    const pagamentosPorCliente = await prisma.pagamento.findMany({
      where: { empresaId },
      select: {
        valorPago: true,
        parcela: { select: { contrato: { select: { clienteId: true } } } },
      },
    });

    for (const pg of pagamentosPorCliente) {
      const clienteId = pg.parcela.contrato.clienteId;
      const atual = pagasPorCliente.get(clienteId) ?? { emDia: 0, atraso: 0, totalPago: 0 };
      atual.totalPago += Number(pg.valorPago);
      pagasPorCliente.set(clienteId, atual);
    }

    for (const p of parcelasPagas) {
      const clienteId = p.contrato.clienteId;
      const atual = pagasPorCliente.get(clienteId) ?? { emDia: 0, atraso: 0, totalPago: 0 };
      if (p.dataPagamento! > p.dataVencimento) {
        atual.atraso += 1;
      } else {
        atual.emDia += 1;
      }
      pagasPorCliente.set(clienteId, atual);
    }

    return clientes
      .map((cliente) => {
        const vencidas = vencidasPorCliente.get(cliente.id) ?? { qtd: 0, valor: 0 };
        const pagas = pagasPorCliente.get(cliente.id) ?? { emDia: 0, atraso: 0, totalPago: 0 };

        let saude: SaudePagadorStatus = 'SAUDAVEL';
        if (vencidas.qtd > 0) {
          saude = 'CRITICO';
        } else if (pagas.atraso > 0) {
          saude = 'ATENCAO';
        }

        return {
          clienteId: cliente.id,
          clienteNome: cliente.nome,
          saude,
          qtdVencidas: vencidas.qtd,
          qtdPagasEmDia: pagas.emDia,
          qtdPagasAtraso: pagas.atraso,
          valorEmAtraso: arredondarMoeda(vencidas.valor),
          totalPago: arredondarMoeda(pagas.totalPago),
        };
      })
      .filter((c) => c.qtdVencidas > 0 || c.qtdPagasEmDia > 0 || c.qtdPagasAtraso > 0 || c.totalPago > 0);
  },
};
