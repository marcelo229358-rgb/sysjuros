import Badge from 'react-bootstrap/Badge';
import { StatusContrato, StatusParcela } from '../../api/types';

const coresContrato: Record<StatusContrato, string> = {
  ATIVO: 'success',
  INADIMPLENTE: 'danger',
  CANCELADO: 'secondary',
  QUITADO: 'primary',
};

const coresParcela: Record<StatusParcela, string> = {
  PENDENTE: 'warning',
  PAGA: 'success',
  VENCIDA: 'danger',
  CANCELADA: 'secondary',
};

interface Props {
  status: StatusContrato | StatusParcela | string;
  tipo?: 'contrato' | 'parcela';
}

export function BadgeStatus({ status, tipo = 'contrato' }: Props) {
  const cores = tipo === 'parcela' ? coresParcela : coresContrato;
  const bg = cores[status as keyof typeof cores] ?? 'secondary';

  return <Badge bg={bg} data-testid="badge-status">{status}</Badge>;
}
