import axios from 'axios';
import { PlanoEmpresa } from './types';

const masterApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

masterApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('master_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

masterApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('master_token');
      localStorage.removeItem('master_user');
      if (!window.location.pathname.startsWith('/master/login')) {
        window.location.href = '/master/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface MasterUser {
  id: string;
  nome: string;
  email: string;
}

export interface MasterEmpresa {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string;
  telefone: string | null;
  taxaJurosMes: number;
  taxaMulta: number;
  plano: PlanoEmpresa;
  ativo: boolean;
  criadoEm: string;
  admin: { email: string; nome: string } | null;
  totais: { usuarios: number; clientes: number; contratos: number };
  loginUrl: string;
  valor_mensal?: number;
}

export type MasterSecao =
  | 'empresas'
  | 'clientes'
  | 'assinaturas'
  | 'financeiro'
  | 'permissoes'
  | 'monitoramento';

export const masterApiClient = {
  signin: async (email: string, senha: string) => {
    const { data } = await masterApi.post<{ token: string; user: MasterUser }>('/master/auth/signin', {
      email,
      senha,
    });
    return data;
  },

  me: async () => {
    const { data } = await masterApi.get<MasterUser>('/master/auth/me');
    return data;
  },

  listarEmpresas: async () => {
    const { data } = await masterApi.get<{ data: MasterEmpresa[] }>('/master/empresas');
    return data.data;
  },

  criarEmpresa: async (payload: Record<string, unknown>) => {
    const { data } = await masterApi.post('/master/empresas', payload);
    return data;
  },

  atualizarEmpresa: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await masterApi.patch(`/master/empresas/${id}`, payload);
    return data;
  },

  excluirEmpresa: async (id: string) => {
    const { data } = await masterApi.delete(`/master/empresas/${id}`);
    return data;
  },

  clientesStats: async () => {
    const { data } = await masterApi.get('/master/clientes/stats');
    return data as {
      empresas_total: number;
      empresas_ativas: number;
      usuarios_operacionais: number;
      admins_empresa: number;
    };
  },

  listarClientes: async (params?: { search?: string; status?: string; tipo?: 'empresa' | 'usuario' }) => {
    const { data } = await masterApi.get('/master/clientes', { params });
    return data;
  },

  atualizarCliente: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await masterApi.patch(`/master/clientes/${id}`, payload);
    return data;
  },

  listarAssinaturas: async () => {
    const { data } = await masterApi.get('/master/assinaturas');
    return data;
  },

  atualizarAssinatura: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await masterApi.patch(`/master/assinaturas/${id}`, payload);
    return data;
  },

  financeiroResumo: async () => {
    const { data } = await masterApi.get('/master/financeiro/resumo');
    return data;
  },

  listarLancamentos: async (tipo: 'PAGAR' | 'RECEBER') => {
    const { data } = await masterApi.get('/master/lancamentos', { params: { tipo } });
    return data.data;
  },

  criarLancamento: async (payload: Record<string, unknown>) => {
    const { data } = await masterApi.post('/master/lancamentos', payload);
    return data;
  },

  atualizarLancamento: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await masterApi.patch(`/master/lancamentos/${id}`, payload);
    return data;
  },

  excluirLancamento: async (id: string) => {
    const { data } = await masterApi.delete(`/master/lancamentos/${id}`);
    return data;
  },

  listarPagamentos: async () => {
    const { data } = await masterApi.get('/master/financeiro/pagamentos');
    return data.data;
  },

  permissoesMeta: async () => {
    const { data } = await masterApi.get('/master/permissions/modules');
    return data as { profiles: string[]; modules: string[]; actions: string[] };
  },

  listarPermissoes: async (perfil: string) => {
    const { data } = await masterApi.get(`/master/permissions/${perfil}`);
    return data.data as Array<{ perfil: string; modulo: string; acoes: string[] }>;
  },

  atualizarPermissao: async (payload: { perfil: string; modulo: string; acoes: string[] }) => {
    const { data } = await masterApi.put('/master/permissions', payload);
    return data;
  },

  monitoramento: async () => {
    const { data } = await masterApi.get('/master/monitoramento');
    return data;
  },

  listarLogs: async (params?: { limit?: number; modulo?: string }) => {
    const { data } = await masterApi.get('/master/monitoramento/logs', { params });
    return data.data;
  },
};

export default masterApi;
