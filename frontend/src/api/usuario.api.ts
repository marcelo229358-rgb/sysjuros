import api from './axios';
import { PaginacaoResponse, PerfilUsuario, Usuario } from './types';

export const usuarioApi = {
  listar: async (params?: {
    page?: number;
    limit?: number;
    nome?: string;
    email?: string;
    incluirInativos?: boolean;
  }) => {
    const response = await api.get<PaginacaoResponse<Usuario>>('/usuarios', {
      params: {
        ...params,
        incluirInativos: params?.incluirInativos ? 'true' : undefined,
      },
    });
    return response.data;
  },

  obter: async (id: string) => {
    const response = await api.get<Usuario>(`/usuarios/${id}`);
    return response.data;
  },

  criar: async (data: {
    nome: string;
    email: string;
    senha: string;
    perfil: PerfilUsuario;
  }) => {
    const response = await api.post<Usuario>('/usuarios', data);
    return response.data;
  },

  atualizar: async (
    id: string,
    data: Partial<{ nome: string; email: string; perfil: PerfilUsuario; ativo: boolean }>
  ) => {
    const response = await api.put<Usuario>(`/usuarios/${id}`, data);
    return response.data;
  },

  redefinirSenha: async (id: string, senha: string) => {
    const response = await api.put<Usuario>(`/usuarios/${id}/redefinir-senha`, { senha });
    return response.data;
  },

  excluir: async (id: string) => {
    const response = await api.delete<Usuario>(`/usuarios/${id}`);
    return response.data;
  },
};
