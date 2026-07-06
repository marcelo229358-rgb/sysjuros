import api from './axios';
import {
  ContratoPorStatus,
  InadimplenciaResposta,
  ProximoVencimento,
  RecebimentoMensal,
  ResumoFinanceiro,
} from './types';

export const dashboardApi = {
  buscarResumo: async () => {
    const response = await api.get<ResumoFinanceiro>('/dashboard/resumo');
    return response.data;
  },

  buscarRecebimentosMensais: async () => {
    const response = await api.get<RecebimentoMensal[]>('/dashboard/recebimentos-mensais');
    return response.data;
  },

  buscarContratosPorStatus: async () => {
    const response = await api.get<ContratoPorStatus[]>('/dashboard/contratos-por-status');
    return response.data;
  },

  buscarProximosVencimentos: async (dias = 7) => {
    const response = await api.get<ProximoVencimento[]>('/dashboard/proximos-vencimentos', {
      params: { dias },
    });
    return response.data;
  },

  buscarInadimplencia: async (limite = 10) => {
    const response = await api.get<InadimplenciaResposta>('/dashboard/inadimplencia', {
      params: { limite },
    });
    return response.data;
  },
};
