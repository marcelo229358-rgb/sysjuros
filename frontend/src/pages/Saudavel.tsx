import { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Card from 'react-bootstrap/Card';
import { dashboardApi } from '../api/dashboard.api';
import { PagadorSaude } from '../api/types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatarMoeda } from '../utils/formatarMoeda';

const SAUDE_CONFIG = {
  SAUDAVEL: { label: 'Saudável', variant: 'success' as const, desc: 'Pagamentos em dia' },
  ATENCAO: { label: 'Atenção', variant: 'warning' as const, desc: 'Histórico com atrasos' },
  CRITICO: { label: 'Inadimplente', variant: 'danger' as const, desc: 'Parcelas vencidas em aberto' },
};

export function Saudavel() {
  const [pagadores, setPagadores] = useState<PagadorSaude[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    dashboardApi
      .buscarSaudePagadores()
      .then(setPagadores)
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return <LoadingSpinner />;

  const contagem = {
    SAUDAVEL: pagadores.filter((p) => p.saude === 'SAUDAVEL').length,
    ATENCAO: pagadores.filter((p) => p.saude === 'ATENCAO').length,
    CRITICO: pagadores.filter((p) => p.saude === 'CRITICO').length,
  };

  return (
    <>
      <RowResumo contagem={contagem} />

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white fw-semibold">Histórico dos pagadores</Card.Header>
        <Card.Body className="p-0">
          {pagadores.length === 0 ? (
            <p className="text-muted p-4 mb-0">Nenhum pagador com histórico ainda.</p>
          ) : (
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Saúde</th>
                  <th>Pagas em dia</th>
                  <th>Pagas com atraso</th>
                  <th>Vencidas</th>
                  <th>Em atraso (R$)</th>
                  <th>Total pago</th>
                </tr>
              </thead>
              <tbody>
                {pagadores.map((p) => {
                  const cfg = SAUDE_CONFIG[p.saude];
                  return (
                    <tr key={p.clienteId}>
                      <td className="fw-semibold">{p.clienteNome}</td>
                      <td>
                        <Badge bg={cfg.variant}>{cfg.label}</Badge>
                        <div className="small text-muted">{cfg.desc}</div>
                      </td>
                      <td>{p.qtdPagasEmDia}</td>
                      <td>{p.qtdPagasAtraso}</td>
                      <td>{p.qtdVencidas}</td>
                      <td>{formatarMoeda(p.valorEmAtraso)}</td>
                      <td>{formatarMoeda(p.totalPago)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </>
  );
}

function RowResumo({ contagem }: { contagem: Record<keyof typeof SAUDE_CONFIG, number> }) {
  return (
    <div className="row g-3 mb-4">
      {(Object.keys(SAUDE_CONFIG) as Array<keyof typeof SAUDE_CONFIG>).map((key) => {
        const cfg = SAUDE_CONFIG[key];
        return (
          <div key={key} className="col-md-4">
            <Card className={`border-0 shadow-sm border-start border-4 border-${cfg.variant}`}>
              <Card.Body>
                <div className="text-muted small">{cfg.label}</div>
                <div className="fs-3 fw-bold">{contagem[key]}</div>
                <div className="small text-muted">{cfg.desc}</div>
              </Card.Body>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
