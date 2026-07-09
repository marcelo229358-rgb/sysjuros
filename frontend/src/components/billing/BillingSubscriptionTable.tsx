import { useMemo, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import { BillingStatusBadge } from './BillingStatusBadge';

export interface BillingSubscriptionRow {
  id: string;
  tenantId: string;
  status: string;
  expiresAt?: string | null;
  createdAt: string;
  plan?: { name: string; slug: string; price: number | string };
  tenant?: { nome: string; email: string; plano: string } | null;
}

interface Props {
  data: BillingSubscriptionRow[];
  onSelect?: (row: BillingSubscriptionRow) => void;
}

export function BillingSubscriptionTable({ data, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const matchStatus = !statusFilter || row.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        row.tenant?.nome.toLowerCase().includes(q) ||
        row.tenant?.email.toLowerCase().includes(q) ||
        row.plan?.name.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [data, search, statusFilter]);

  return (
    <div>
      <div className="row g-2 mb-3">
        <div className="col-md-6">
          <Form.Control
            placeholder="Buscar empresa, e-mail ou plano..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativa</option>
            <option value="TRIAL">Trial</option>
            <option value="CANCELLED">Cancelada</option>
            <option value="EXPIRED">Expirada</option>
            <option value="SUSPENDED">Suspensa</option>
          </Form.Select>
        </div>
      </div>

      <Table responsive hover className="billing-table align-middle">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Plano</th>
            <th>Status</th>
            <th>Valor</th>
            <th>Validade</th>
            <th>Criada em</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-muted text-center py-4">
                Nenhuma assinatura encontrada.
              </td>
            </tr>
          ) : (
            filtered.map((row) => (
              <tr
                key={row.id}
                className={onSelect ? 'billing-table-row-click' : undefined}
                onClick={() => onSelect?.(row)}
              >
                <td>
                  <div className="fw-semibold">{row.tenant?.nome ?? row.tenantId.slice(0, 8)}</div>
                  <small className="text-muted">{row.tenant?.email}</small>
                </td>
                <td>{row.plan?.name ?? '—'}</td>
                <td>
                  <BillingStatusBadge status={row.status} />
                </td>
                <td>R$ {Number(row.plan?.price ?? 0).toFixed(2)}</td>
                <td>{row.expiresAt ? new Date(row.expiresAt).toLocaleDateString('pt-BR') : '—'}</td>
                <td>{new Date(row.createdAt).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}
