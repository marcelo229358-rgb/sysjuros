import api from './axios';

export interface ConfiguracoesEmpresa {
  id: string;
  nome: string;
  taxaJurosMes: number;
  taxaMulta: number;
  modoEscuro?: boolean;
}

export const empresaApi = {
  obterConfiguracoes: async () => {
    const response = await api.get<ConfiguracoesEmpresa>('/empresa/configuracoes');
    return response.data;
  },

  atualizarConfiguracoes: async (data: { taxaJurosMes: number; taxaMulta: number }) => {
    const response = await api.put<ConfiguracoesEmpresa>('/empresa/configuracoes', data);
    return response.data;
  },
};
