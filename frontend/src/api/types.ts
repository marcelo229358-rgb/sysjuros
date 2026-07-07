export type PerfilUsuario = 'ADMIN' | 'FINANCEIRO' | 'OPERADOR';
export type StatusContrato = 'ATIVO' | 'INADIMPLENTE' | 'CANCELADO' | 'QUITADO';
export type StatusParcela = 'PENDENTE' | 'PAGA' | 'VENCIDA' | 'CANCELADA';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  empresaId: string;
}

export interface Empresa {
  id: string;
  nome: string;
  taxaJurosMes: number;
  taxaMulta: number;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
  empresa: Empresa;
}

export interface PaginacaoMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginacaoResponse<T> {
  data: T[];
  meta: PaginacaoMeta;
}

export interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  ativo: boolean;
}

export interface Contrato {
  id: string;
  numero: string;
  valorTotal: number;
  numParcelas: number;
  dataInicio: string;
  status: StatusContrato;
  observacoes?: string | null;
  cliente?: { id: string; nome: string; cpfCnpj: string | null };
  parcelas?: Parcela[];
}

export interface Parcela {
  id: string;
  numero: number;
  valorOriginal: number;
  valorMulta: number;
  valorJuros: number;
  valorAtualizado: number;
  dataVencimento: string;
  dataPagamento?: string | null;
  status: StatusParcela;
  diasAtraso?: number;
  contrato?: {
    id: string;
    numero: string;
    cliente: { id: string; nome: string; cpfCnpj: string | null };
  };
}

export interface Pagamento {
  id: string;
  valorPago: number;
  formaPagamento: string;
  dataPagamento: string;
  observacoes?: string | null;
  parcela?: Parcela;
}

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
