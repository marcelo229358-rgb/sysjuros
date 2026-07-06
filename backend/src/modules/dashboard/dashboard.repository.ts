import { prisma } from '../../config/database';
import { startOfMonth, endOfMonth, adicionarMeses } from '../../shared/utils/date.util';

export const dashboardRepository = {
  async somarPagamentosDoMes(empresaId: string) {
    const agora = new Date();
    const inicio = startOfMonth(agora);
    const fim = endOfMonth(agora);

    const result = await prisma.pagamento.aggregate({
      where: {
        empresaId,
        dataPagamento: {
          gte: inicio,
          lte: fim,
        },
      },
      _sum: { valorPago: true },
    });

    return Number(result._sum.valorPago ?? 0);
  },

  async recebimentosMensais(empresaId: string) {
    const agora = new Date();
    const inicio = startOfMonth(adicionarMeses(agora, -11));

    const pagamentos = await prisma.pagamento.findMany({
      where: {
        empresaId,
        dataPagamento: { gte: inicio },
      },
      select: {
        dataPagamento: true,
        valorPago: true,
      },
    });

    const totaisPorMes = new Map<string, number>();

    for (let i = 0; i < 12; i++) {
      const mes = adicionarMeses(inicio, i);
      const chave = `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`;
      totaisPorMes.set(chave, 0);
    }

    for (const pagamento of pagamentos) {
      const data = pagamento.dataPagamento;
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      if (totaisPorMes.has(chave)) {
        totaisPorMes.set(chave, (totaisPorMes.get(chave) ?? 0) + Number(pagamento.valorPago));
      }
    }

    return Array.from(totaisPorMes.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, totalRecebido]) => ({
        mes,
        totalRecebido: Math.round(totalRecebido * 100) / 100,
      }));
  },
};
