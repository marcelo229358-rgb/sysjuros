import api from './axios';

function baixarBlob(blob: Blob, nomeArquivo: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  window.URL.revokeObjectURL(url);
}

export const pdfApi = {
  baixarRecibo: async (pagamentoId: string) => {
    const response = await api.get(`/pdf/recibo/${pagamentoId}`, { responseType: 'blob' });
    baixarBlob(response.data, `recibo-${pagamentoId}.pdf`);
  },

  baixarExtrato: async (contratoId: string) => {
    const response = await api.get(`/pdf/extrato/${contratoId}`, { responseType: 'blob' });
    baixarBlob(response.data, `extrato-${contratoId}.pdf`);
  },
};
