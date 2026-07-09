import Card from 'react-bootstrap/Card';

interface Props {
  label: string;
  value: string;
  icon?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  subtitle?: string;
}

const VARIANT_CLASS: Record<string, string> = {
  primary: 'billing-stat-primary',
  success: 'billing-stat-success',
  warning: 'billing-stat-warning',
  danger: 'billing-stat-danger',
  info: 'billing-stat-info',
};

export function BillingStatCard({ label, value, icon, variant = 'primary', subtitle }: Props) {
  return (
    <Card className={`billing-stat-card ${VARIANT_CLASS[variant] ?? ''} h-100`}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="billing-stat-label">{label}</div>
            <div className="billing-stat-value">{value}</div>
            {subtitle && <small className="text-muted">{subtitle}</small>}
          </div>
          {icon && <span className="billing-stat-icon" aria-hidden>{icon}</span>}
        </div>
      </Card.Body>
    </Card>
  );
}
