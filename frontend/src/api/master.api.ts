import axios from 'axios';

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
  ativo: boolean;
  criadoEm: string;
  admin: { email: string; nome: string } | null;
  totais: { usuarios: number; clientes: number; contratos: number };
  loginUrl: string;
}

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

  criarEmpresa: async (payload: {
    nome: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    taxaJurosMes?: number;
    taxaMulta?: number;
    adminNome?: string;
    adminEmail?: string;
    adminSenha?: string;
  }) => {
    const { data } = await masterApi.post('/master/empresas', payload);
    return data as {
      empresa: { id: string; nome: string; email: string; ativo: boolean };
      adminEmail: string | null;
      empresaId: string;
      loginUrl: string;
    };
  },

  atualizarEmpresa: async (
    id: string,
    payload: Partial<{
      nome: string;
      email: string;
      telefone: string | null;
      taxaJurosMes: number;
      taxaMulta: number;
      ativo: boolean;
    }>
  ) => {
    const { data } = await masterApi.patch(`/master/empresas/${id}`, payload);
    return data;
  },

  monitoramento: async () => {
    const { data } = await masterApi.get('/master/monitoramento');
    return data as {
      api: string;
      timestamp: string;
      stats: {
        empresas: number;
        empresasAtivas: number;
        usuarios: number;
        clientes: number;
        contratos: number;
      };
      memoria: { rssMb: number; heapUsedMb: number };
    };
  },
};

export default masterApi;
