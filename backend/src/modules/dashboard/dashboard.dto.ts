import { z } from 'zod';

export const proximosVencimentosQuerySchema = z.object({
  dias: z.coerce.number().int().min(1).max(365).default(7),
});

export const inadimplenciaQuerySchema = z.object({
  limite: z.coerce.number().int().min(1).max(100).default(10),
});

export type ProximosVencimentosQuery = z.infer<typeof proximosVencimentosQuerySchema>;
export type InadimplenciaQuery = z.infer<typeof inadimplenciaQuerySchema>;

export interface ResumoFinanceiro {
  totalAReceber: number;
  totalRecebidoMes: number;
  totalVencidoOriginal: number;
  totalEncargosVencidos: number;
  totalVencido: number;
  qtdParcelasVencidas: number;
  qtdClientesAtivos: number;
  qtdContratosAtivos: number;
  taxaInadimplencia: number;
}

export interface RecebimentoMensal {
  mes: string;
  totalRecebido: number;
}

export interface ContratoPorStatus {
  status: string;
  quantidade: number;
}

export interface ProximoVencimento {
  parcelaId: string;
  clienteNome: string;
  contratoNumero: string;
  numero: number;
  valorOriginal: number;
  dataVencimento: string;
}

export interface DevedorRanking {
  clienteId: string;
  clienteNome: string;
  qtdParcelasVencidas: number;
  valorTotalVencido: number;
}

export interface InadimplenciaResposta {
  taxaInadimplencia: number;
  totalVencidoOriginal: number;
  totalEncargosVencidos: number;
  totalVencido: number;
  totalAReceber: number;
  devedores: DevedorRanking[];
}
