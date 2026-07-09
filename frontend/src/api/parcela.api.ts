import api from './axios';
import { PaginacaoResponse, Parcela, StatusParcela } from './types';

export const parcelaApi = {
  listar: async (params?: {
    page?: number;
    limit?: number;
    status?: StatusParcela;
    contratoId?: string;
    clienteId?: string;
  }) => {
    const response = await api.get<PaginacaoResponse<Parcela>>('/parcelas', { params });
    return response.data;
  },

  vencidas: async () => {
    const response = await api.get<Parcela[]>('/parcelas/vencidas');
    return response.data;
  },

  aVencer: async () => {
    const response = await api.get<Parcela[]>('/parcelas/a-vencer');
    return response.data;
  },

  obter: async (id: string) => {
    const response = await api.get<Parcela>(`/parcelas/${id}`);
    return response.data;
  },

  atualizarVencimento: async (id: string, dataVencimento: string) => {
    const response = await api.patch<Parcela>(`/parcelas/${id}`, { dataVencimento });
    return response.data;
  },
};
