import api from './axios';
import { LoginResponse, Usuario } from './types';

export const authApi = {
  login: async (data: { email: string; senha: string; empresaId?: string }) => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  me: async () => {
    const response = await api.get<Usuario>('/auth/me');
    return response.data;
  },

  alterarSenha: async (data: { senhaAtual: string; senhaNova: string; confirmarSenha: string }) => {
    const response = await api.post<Usuario>('/auth/alterar-senha', data);
    return response.data;
  },
};
