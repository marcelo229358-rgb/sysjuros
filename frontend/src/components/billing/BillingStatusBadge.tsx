import Badge from 'react-bootstrap/Badge';

const STATUS_MAP: Record<string, { label: string; bg: string }> = {
  ACTIVE: { label: 'Ativa', bg: 'success' },
  TRIAL: { label: 'Trial', bg: 'info' },
  SUSPENDED: { label: 'Suspensa', bg: 'warning' },
  CANCELLED: { label: 'Cancelada', bg: 'secondary' },
  EXPIRED: { label: 'Expirada', bg: 'danger' },
  APPROVED: { label: 'Aprovado', bg: 'success' },
  PENDING: { label: 'Pendente', bg: 'warning' },
  FAILED: { label: 'Falhou', bg: 'danger' },
  REFUNDED: { label: 'Reembolsado', bg: 'secondary' },
  CHARGEBACK: { label: 'Chargeback', bg: 'danger' },
};

interface Props {
  status: string;
}

export function BillingStatusBadge({ status }: Props) {
  const cfg = STATUS_MAP[status] ?? { label: status, bg: 'light' };
  return (
    <Badge bg={cfg.bg} className="billing-status-badge">
      {cfg.label}
    </Badge>
  );
}
