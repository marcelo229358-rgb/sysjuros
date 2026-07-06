import api from './axios';
import { Pagamento, PaginacaoResponse } from './types';

export const pagamentoApi = {
  registrar: async (data: {
    parcelaId: string;
    valorPago: number;
    formaPagamento: string;
    observacoes?: string;
  }) => {
    const response = await api.post<Pagamento>('/pagamentos', data);
    return response.data;
  },

  listar: async (params?: { page?: number; limit?: number; clienteId?: string }) => {
    const response = await api.get<PaginacaoResponse<Pagamento>>('/pagamentos', { params });
    return response.data;
  },
};
