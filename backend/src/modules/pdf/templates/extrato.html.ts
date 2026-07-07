import { StatusParcela } from '@prisma/client';
import { formatarData, formatarMoeda } from '../../../shared/utils/formatar.util';

type ContratoExtrato = {
  numero: string;
  valorTotal: { toString(): string } | number | string;
  numParcelas: number;
  dataInicio: Date;
  status: string;
  cliente: { nome: string; cpfCnpj: string | null; telefone?: string | null };
  empresa: { nome: string };
  parcelas: Array<{
    numero: number;
    dataVencimento: Date;
    valorOriginal: { toString(): string } | number | string;
    status: StatusParcela;
  }>;
};

const statusLabel: Record<StatusParcela, string> = {
  PENDENTE: 'Pendente',
  PAGA: 'Paga',
  VENCIDA: 'Vencida',
  CANCELADA: 'Cancelada',
};

export function extratoTemplate(contrato: ContratoExtrato): string {
  const linhasParcelas = contrato.parcelas
    .map(
      (p) => `
      <tr>
        <td>${p.numero}</td>
        <td>${formatarData(p.dataVencimento)}</td>
        <td>${formatarMoeda(p.valorOriginal)}</td>
        <td>${statusLabel[p.status]}</td>
      </tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 24px; }
        .section { margin: 16px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
        .rodape { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${contrato.empresa.nome}</h1>
        <h2>EXTRATO DO CONTRATO</h2>
      </div>
      <div class="section">
        <p><strong>Contrato:</strong> ${contrato.numero}</p>
        <p><strong>Cliente:</strong> ${contrato.cliente.nome}</p>
        <p><strong>CPF/CNPJ:</strong> ${contrato.cliente.cpfCnpj ?? '—'}</p>
        <p><strong>Data início:</strong> ${formatarData(contrato.dataInicio)}</p>
        <p><strong>Valor total:</strong> ${formatarMoeda(contrato.valorTotal)}</p>
        <p><strong>Parcelas:</strong> ${contrato.numParcelas}</p>
        <p><strong>Status:</strong> ${contrato.status}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Vencimento</th>
            <th>Valor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${linhasParcelas}
        </tbody>
      </table>
      <div class="rodape">
        Documento gerado em ${formatarData(new Date())}.
      </div>
    </body>
    </html>
  `;
}
