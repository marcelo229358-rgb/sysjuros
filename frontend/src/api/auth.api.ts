import api from './axios';
import { LoginResponse, Usuario } from './types';

export const authApi = {
  login: async (data: { email: string; senha: string; empresaId: string }) => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  me: async () => {
    const response = await api.get<Usuario>('/auth/me');
    return response.data;
  },
};
