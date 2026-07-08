import api from './axios';

export interface Notificacao {
  id: string;
  empresaId: string;
  usuarioId: string | null;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criadoEm: string;
}

export const notificacaoApi = {
  listar: async () => {
    const response = await api.get<Notificacao[]>('/notificacoes');
    return response.data;
  },

  marcarTodasComoLidas: async () => {
    const response = await api.patch<{ atualizadas: number }>('/notificacoes/ler');
    return response.data;
  },

  marcarComoLida: async (id: string) => {
    const response = await api.patch<Notificacao>(`/notificacoes/${id}/ler`);
    return response.data;
  },

  enviarCobrancaWhatsapp: async (parcelaId: string) => {
    const response = await api.post<{ enviado: boolean; parcelaId: string }>(
      '/notificacoes/whatsapp/cobranca',
      { parcelaId }
    );
    return response.data;
  },

  statusWhatsapp: async () => {
    const response = await api.get<{
      configurado: boolean;
      instancia: string;
      conectado: boolean;
      estado: string;
      managerUrl?: string;
    }>('/notificacoes/whatsapp/status');
    return response.data;
  },

  executarLembretes: async () => {
    const response = await api.post<{
      diasAntecedencia: number;
      parcelasEncontradas: number;
      notificacoesCriadas: number;
      whatsappEnviados: number;
      whatsappIgnorados: number;
      errosWhatsapp: number;
      whatsappConfigurado: boolean;
    }>('/notificacoes/lembretes/executar');
    return response.data;
  },
};
