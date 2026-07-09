import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { billingTenantApi } from '../api/billing.api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { BillingPlanCards, BillingPlanItem } from '../components/billing/BillingPlanCards';
import { BillingStatusBadge } from '../components/billing/BillingStatusBadge';
import '../styles/billing.scss';

interface SubscriptionData {
  id: string;
  status: string;
  expiresAt?: string;
  plan?: { name: string; slug: string; price: number };
  licenses?: { features: string[]; limits: Record<string, number> }[];
  payments?: { amount: number; status: string; createdAt: string; provider: string; paidAt?: string }[];
}

export function MinhaAssinatura() {
  const [loading, setLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<BillingPlanItem[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [subscription, plansData] = await Promise.all([
        billingTenantApi.subscription(),
        billingTenantApi.plans(),
      ]);
      setSub(subscription);
      setPlans(Array.isArray(plansData) ? plansData : []);
      setDisabled(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 503) setDisabled(true);
      else setMsg('Não foi possível carregar sua assinatura.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpgrade(slug: string) {
    try {
      const result = await billingTenantApi.checkout(slug);
      if (result?.checkout?.checkoutUrl) {
        window.open(result.checkout.checkoutUrl, '_blank');
      }
      setMsg('Checkout iniciado com sucesso.');
      load();
    } catch {
      setMsg('Erro ao iniciar upgrade.');
    }
  }

  async function handleCancel() {
    if (!confirm('Deseja cancelar sua assinatura SaaS?')) return;
    try {
      await billingTenantApi.cancel();
      setMsg('Assinatura cancelada.');
      load();
    } catch {
      setMsg('Erro ao cancelar.');
    }
  }

  if (loading) return <LoadingSpinner />;

  if (disabled) {
    return (
      <div>
        <h2>Minha Assinatura</h2>
        <p className="text-muted">
          O módulo de billing está desabilitado no momento. Seu acesso continua normal pelo plano atual da empresa.
        </p>
      </div>
    );
  }

  const license = sub?.licenses?.[0];
  const features = (license?.features as string[]) ?? [];
  const currentSlug = sub?.plan?.slug;

  return (
    <div>
      <div className="billing-tenant-hero">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <small className="opacity-75">Plano atual</small>
            <h3>{sub?.plan?.name ?? 'Sem plano billing'}</h3>
          </div>
          <div className="text-end">
            <BillingStatusBadge status={sub?.status ?? 'PENDING'} />
            <div className="mt-2 fs-4 fw-bold">
              R$ {Number(sub?.plan?.price ?? 0).toFixed(2).replace('.', ',')}
              <small className="fs-6 fw-normal opacity-75">/mês</small>
            </div>
          </div>
        </div>
      </div>

      {msg && <div className="alert alert-info py-2">{msg}</div>}

      <Row className="g-3 mb-4">
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white fw-semibold">Detalhes da assinatura</Card.Header>
            <Card.Body>
              <p className="mb-2">
                <strong>Validade:</strong>{' '}
                {sub?.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('pt-BR') : '—'}
              </p>
              <p className="mb-0">
                <strong>ID:</strong> <code className="small">{sub?.id?.slice(0, 8) ?? '—'}...</code>
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white fw-semibold">Recursos liberados</Card.Header>
            <Card.Body>
              {features.length === 0 ? (
                <span className="text-muted">Nenhum recurso billing vinculado.</span>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {features.map((f) => (
                    <span key={f} className="badge bg-primary-subtle text-primary-emphasis">
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <h5 className="mb-3">Alterar plano</h5>
      <BillingPlanCards
        plans={plans}
        highlight={currentSlug}
        showSelect
        onSelect={handleUpgrade}
      />

      <div className="d-flex gap-2 mt-4 mb-4">
        <Button variant="outline-danger" onClick={handleCancel}>
          Cancelar assinatura
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white fw-semibold">Histórico de pagamentos</Card.Header>
        <Card.Body>
          {!sub?.payments?.length ? (
            <p className="text-muted mb-0">Sem pagamentos registrados.</p>
          ) : (
            sub.payments.map((p, i) => (
              <div key={i} className="billing-payment-item">
                <div>
                  <div className="fw-semibold">{p.provider}</div>
                  <small className="text-muted">
                    {new Date(p.paidAt ?? p.createdAt).toLocaleDateString('pt-BR')}
                  </small>
                </div>
                <div className="text-end">
                  <div>R$ {Number(p.amount).toFixed(2)}</div>
                  <BillingStatusBadge status={p.status} />
                </div>
              </div>
            ))
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
