import { useEffect, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import { dashboardApi } from '../api/dashboard.api';
import {
  ContratoPorStatus,
  InadimplenciaResposta,
  ProximoVencimento,
  RecebimentoMensal,
  ResumoFinanceiro,
} from '../api/types';
import { CardIndicador } from '../components/dashboard/CardIndicador';
import { GraficoRecebimentos } from '../components/dashboard/GraficoRecebimentos';
import { GraficoContratosStatus } from '../components/dashboard/GraficoContratosStatus';
import { ListaProximosVencimentos } from '../components/dashboard/ListaProximosVencimentos';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatarMoeda } from '../utils/formatarMoeda';

export function Dashboard() {
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [recebimentos, setRecebimentos] = useState<RecebimentoMensal[]>([]);
  const [contratosStatus, setContratosStatus] = useState<ContratoPorStatus[]>([]);
  const [vencimentos, setVencimentos] = useState<ProximoVencimento[]>([]);
  const [inadimplencia, setInadimplencia] = useState<InadimplenciaResposta | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.buscarResumo(),
      dashboardApi.buscarRecebimentosMensais(),
      dashboardApi.buscarContratosPorStatus(),
      dashboardApi.buscarProximosVencimentos(7),
      dashboardApi.buscarInadimplencia(10),
    ])
      .then(([r, rec, cs, v, inad]) => {
        setResumo(r);
        setRecebimentos(rec);
        setContratosStatus(cs);
        setVencimentos(v);
        setInadimplencia(inad);
      })
      .finally(() => setCarregando(false));
  }, []);

  if (carregando || !resumo) return <LoadingSpinner />;

  return (
    <>
      <Row className="g-3 mb-4">
        <Col xs={6} md={6} lg={4} xl={2}>
          <CardIndicador
            titulo="Total a receber"
            valor={resumo.totalAReceber}
            variant="primary"
            testId="card-total-a-receber"
          />
        </Col>
        <Col xs={6} md={6} lg={4} xl={2}>
          <CardIndicador
            titulo="Recebido no mês"
            valor={resumo.totalRecebidoMes}
            variant="success"
            testId="card-recebido-mes"
          />
        </Col>
        <Col xs={6} md={6} lg={4} xl={2}>
          <CardIndicador
            titulo="Vencido (original)"
            valor={resumo.totalVencidoOriginal}
            subtitulo={`encargos: ${formatarMoeda(resumo.totalEncargosVencidos)}`}
            variant="danger"
            testId="card-total-vencido"
          />
        </Col>
        <Col xs={6} md={6} lg={4} xl={2}>
          <CardIndicador
            titulo="Taxa inadimplência"
            valor={`${resumo.taxaInadimplencia}%`}
            variant="warning"
            testId="card-taxa-inadimplencia"
          />
        </Col>
        <Col xs={6} md={6} lg={4} xl={2}>
          <CardIndicador
            titulo="Contratos ativos"
            valor={resumo.qtdContratosAtivos}
            variant="info"
            testId="card-contratos-ativos"
          />
        </Col>
        <Col xs={6} md={6} lg={4} xl={2}>
          <CardIndicador titulo="Clientes ativos" valor={resumo.qtdClientesAtivos} variant="secondary" />
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col md={6}>
          <GraficoRecebimentos dados={recebimentos} />
        </Col>
        <Col md={6}>
          <GraficoContratosStatus dados={contratosStatus} />
        </Col>
      </Row>

      <Row className="g-3">
        <Col md={6}>
          <ListaProximosVencimentos vencimentos={vencimentos} />
        </Col>
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>Piores devedores</Card.Header>
            <ListGroup variant="flush">
              {inadimplencia?.devedores.length === 0 && (
                <ListGroup.Item className="text-muted">Nenhum devedor</ListGroup.Item>
              )}
              {inadimplencia?.devedores.map((d) => (
                <ListGroup.Item key={d.clienteId}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong>{d.clienteNome}</strong>
                      <div className="small text-muted">{d.qtdParcelasVencidas} parcela(s)</div>
                    </div>
                    <span className="text-danger fw-semibold">
                      {formatarMoeda(d.valorTotalVencido)}
                    </span>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  );
}
