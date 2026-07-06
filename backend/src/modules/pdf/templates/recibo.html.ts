import { formatarData, formatarMoeda } from '../../../shared/utils/formatar.util';

type PagamentoRecibo = {
  id: string;
  valorPago: { toString(): string } | number | string;
  formaPagamento: string;
  dataPagamento: Date;
  parcela: {
    numero: number;
    contrato: {
      numero: string;
      numParcelas: number;
      cliente: { nome: string; cpfCnpj: string };
      empresa: { nome: string };
    };
  };
};

export function reciboTemplate(pagamento: PagamentoRecibo): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .valor-destaque { font-size: 24px; font-weight: bold; color: #1a7a4a; }
        .rodape { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${pagamento.parcela.contrato.empresa.nome}</h1>
        <h2>RECIBO DE PAGAMENTO</h2>
      </div>
      <div class="section">
        <p><strong>Cliente:</strong> ${pagamento.parcela.contrato.cliente.nome}</p>
        <p><strong>CPF/CNPJ:</strong> ${pagamento.parcela.contrato.cliente.cpfCnpj}</p>
        <p><strong>Contrato:</strong> ${pagamento.parcela.contrato.numero}</p>
        <p><strong>Parcela:</strong> ${pagamento.parcela.numero}/${pagamento.parcela.contrato.numParcelas}</p>
        <p><strong>Data do pagamento:</strong> ${formatarData(pagamento.dataPagamento)}</p>
        <p><strong>Forma de pagamento:</strong> ${pagamento.formaPagamento}</p>
      </div>
      <div class="section">
        <p>Valor pago:</p>
        <p class="valor-destaque">${formatarMoeda(pagamento.valorPago)}</p>
      </div>
      <div class="rodape">
        Documento gerado em ${formatarData(new Date())} — válido como comprovante de quitação desta parcela.
      </div>
    </body>
    </html>
  `;
}
