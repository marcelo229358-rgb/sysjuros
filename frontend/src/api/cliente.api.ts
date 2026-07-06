import api from './axios';
import { Cliente, PaginacaoResponse } from './types';

export const clienteApi = {
  listar: async (params?: { page?: number; limit?: number; nome?: string; cpfCnpj?: string }) => {
    const response = await api.get<PaginacaoResponse<Cliente>>('/clientes', { params });
    return response.data;
  },

  obter: async (id: string) => {
    const response = await api.get<Cliente>(`/clientes/${id}`);
    return response.data;
  },

  criar: async (data: Partial<Cliente>) => {
    const response = await api.post<Cliente>('/clientes', data);
    return response.data;
  },

  atualizar: async (id: string, data: Partial<Cliente>) => {
    const response = await api.put<Cliente>(`/clientes/${id}`, data);
    return response.data;
  },

  excluir: async (id: string) => {
    const response = await api.delete<Cliente>(`/clientes/${id}`);
    return response.data;
  },
};
