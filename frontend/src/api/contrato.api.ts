import api from './axios';
import { Contrato, PaginacaoResponse, StatusContrato } from './types';

export interface CriarContratoPayload {
  clienteId: string;
  numero: string;
  valorTotal: number;
  numParcelas: number;
  dataInicio: string;
  taxaJurosMes?: number;
  taxaMulta?: number;
  observacoes?: string;
  valorAntecipado?: number;
  modoAmortizacao?: 'TOTAL' | 'PARCELA_ESPECIFICA';
  parcelaAmortizacao?: number;
  parcelas?: { numero: number; valorOriginal: number; dataVencimento: string }[];
}

export const contratoApi = {
  listar: async (params?: {
    page?: number;
    limit?: number;
    status?: StatusContrato;
    clienteId?: string;
  }) => {
    const response = await api.get<PaginacaoResponse<Contrato>>('/contratos', { params });
    return response.data;
  },

  obter: async (id: string) => {
    const response = await api.get<Contrato>(`/contratos/${id}`);
    return response.data;
  },

  criar: async (data: CriarContratoPayload) => {
    const response = await api.post<Contrato>('/contratos', data);
    return response.data;
  },

  atualizar: async (id: string, data: { numero?: string; observacoes?: string }) => {
    const response = await api.put<Contrato>(`/contratos/${id}`, data);
    return response.data;
  },

  atualizarStatus: async (id: string, status: StatusContrato) => {
    const response = await api.patch<Contrato>(`/contratos/${id}/status`, { status });
    return response.data;
  },

  amortizar: async (
    id: string,
    data: { valor: number; modo: 'TOTAL' | 'PARCELA_ESPECIFICA'; parcelaAmortizacao?: number }
  ) => {
    const response = await api.post<Contrato>(`/contratos/${id}/amortizar`, data);
    return response.data;
  },
};
