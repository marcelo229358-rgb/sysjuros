import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import { BillingSecao, billingMasterApi } from '../../../api/billing.api';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { BillingStatCard } from '../../../components/billing/BillingStatCard';
import { BillingDashboardCharts } from '../../../components/billing/BillingDashboardCharts';
import { BillingPlanCards, BillingPlanItem } from '../../../components/billing/BillingPlanCards';
import { BillingSubscriptionTable, BillingSubscriptionRow } from '../../../components/billing/BillingSubscriptionTable';
import { BillingStatusBadge } from '../../../components/billing/BillingStatusBadge';
import '../../../styles/billing.scss';

const SUBMENUS: { id: BillingSecao; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'products', label: 'Produtos' },
  { id: 'plans', label: 'Planos' },
  { id: 'subscriptions', label: 'Assinaturas' },
  { id: 'payments', label: 'Pagamentos' },
  { id: 'licenses', label: 'Licenças' },
  { id: 'trials', label: 'Trials' },
  { id: 'coupons', label: 'Cupons' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'logs', label: 'Logs' },
];

interface Props {
  onAlert: (tipo: 'erro' | 'sucesso', msg: string) => void;
}

export function MasterBillingSection({ onAlert }: Props) {
  const [sub, setSub] = useState<BillingSecao>('dashboard');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<unknown>(null);
  const [billingDisabled, setBillingDisabled] = useState(false);

  async function load() {
    setLoading(true);
    try {
      let result: unknown;
      switch (sub) {
        case 'dashboard':
          result = await billingMasterApi.dashboard();
          break;
        case 'products':
          result = await billingMasterApi.products();
          break;
        case 'plans':
          result = await billingMasterApi.plans();
          break;
        case 'subscriptions':
          result = await billingMasterApi.subscriptions();
          break;
        case 'payments':
          result = await billingMasterApi.payments();
          break;
        case 'licenses':
          result = await billingMasterApi.licenses();
          break;
        case 'trials':
          result = await billingMasterApi.trials();
          break;
        case 'coupons':
          result = await billingMasterApi.coupons();
          break;
        case 'webhooks':
          result = await billingMasterApi.webhooks();
          break;
        case 'logs':
          result = await billingMasterApi.auditLogs();
          break;
      }
      setData(result);
      setBillingDisabled(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 503) {
        setBillingDisabled(true);
        setData(null);
      } else {
        onAlert('erro', 'Falha ao carregar dados do billing');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [sub]);

  if (billingDisabled) {
    return (
      <div className="alert alert-info">
        Módulo Billing desabilitado. Defina <code>BILLING_ENABLED=true</code> no backend para ativar.
      </div>
    );
  }

  return (
    <div className="billing-master">
      <div className="d-flex flex-wrap gap-2 mb-3 billing-nav-pills">
        {SUBMENUS.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={sub === item.id ? 'primary' : 'outline-secondary'}
            onClick={() => setSub(item.id)}
          >
            {item.label}
          </Button>
        ))}
        <Button size="sm" variant="outline-primary" onClick={load}>
          Atualizar
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : sub === 'dashboard' ? (
        <DashboardView data={data as Record<string, unknown>} />
      ) : sub === 'plans' ? (
        <BillingPlanCards plans={(data as BillingPlanItem[]) ?? []} />
      ) : sub === 'subscriptions' ? (
        <BillingSubscriptionTable data={(data as BillingSubscriptionRow[]) ?? []} />
      ) : (
        <GenericTable data={data as Record<string, unknown>[]} secao={sub} />
      )}
    </div>
  );
}

function DashboardView({ data }: { data: Record<string, unknown> }) {
  return (
    <div>
      <div className="row g-3">
        <div className="col-6 col-lg-4 col-xl">
          <BillingStatCard label="Receita mensal (MRR)" value={`R$ ${Number(data.mrr ?? 0).toFixed(2)}`} icon="💰" variant="primary" />
        </div>
        <div className="col-6 col-lg-4 col-xl">
          <BillingStatCard label="Assinaturas ativas" value={String(data.activeSubscriptions ?? 0)} icon="✅" variant="success" />
        </div>
        <div className="col-6 col-lg-4 col-xl">
          <BillingStatCard label="Trials ativos" value={String(data.activeTrials ?? 0)} icon="🎁" variant="info" />
        </div>
        <div className="col-6 col-lg-4 col-xl">
          <BillingStatCard label="Cancelamentos" value={String(data.cancellations ?? 0)} icon="❌" variant="danger" />
        </div>
        <div className="col-6 col-lg-4 col-xl">
          <BillingStatCard
            label="Receita total"
            value={`R$ ${Number(data.revenueTotal ?? 0).toFixed(2)}`}
            icon="📈"
            variant="warning"
            subtitle={`${data.paymentsCount ?? 0} pagamentos`}
          />
        </div>
      </div>
      <BillingDashboardCharts
        revenueChart={(data.revenueChart as { date: string; value: number }[]) ?? []}
        growthChart={(data.growthChart as { month: string; subscribers: number }[]) ?? []}
        plansChart={(data.plansChart as { name: string; value: number }[]) ?? []}
      />
    </div>
  );
}

function GenericTable({ data, secao }: { data: Record<string, unknown>[]; secao: BillingSecao }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-muted">Nenhum registro em {secao}.</p>;
  }

  const keys = Object.keys(data[0]).filter((k) => typeof data[0][k] !== 'object' || data[0][k] === null);

  return (
    <Table responsive hover className="billing-table align-middle">
      <thead>
        <tr>
          {keys.map((k) => (
            <th key={k}>{k}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.slice(0, 50).map((row, i) => (
          <tr key={i}>
            {keys.map((k) =>
              k === 'status' ? (
                <td key={k}>
                  <BillingStatusBadge status={String(row[k])} />
                </td>
              ) : (
                <td key={k}>{String(row[k] ?? '')}</td>
              )
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
