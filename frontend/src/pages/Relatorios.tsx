import { useEffect, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { dashboardApi } from '../api/dashboard.api';
import { InadimplenciaResposta, RecebimentoMensal } from '../api/types';
import { GraficoRecebimentos } from '../components/dashboard/GraficoRecebimentos';
import { GraficoContratosStatus } from '../components/dashboard/GraficoContratosStatus';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import Card from 'react-bootstrap/Card';
import { formatarMoeda } from '../utils/formatarMoeda';

export function Relatorios() {
  const [recebimentos, setRecebimentos] = useState<RecebimentoMensal[]>([]);
  const [inadimplencia, setInadimplencia] = useState<InadimplenciaResposta | null>(null);
  const [contratosStatus, setContratosStatus] = useState<{ status: string; quantidade: number }[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.buscarRecebimentosMensais(),
      dashboardApi.buscarInadimplencia(20),
      dashboardApi.buscarContratosPorStatus(),
    ])
      .then(([rec, inad, cs]) => {
        setRecebimentos(rec);
        setInadimplencia(inad);
        setContratosStatus(cs);
      })
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return <LoadingSpinner />;

  return (
    <>
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Subtitle className="text-muted">Taxa de inadimplência</Card.Subtitle>
              <Card.Title className="fs-3">{inadimplencia?.taxaInadimplencia}%</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Subtitle className="text-muted">Total vencido (original)</Card.Subtitle>
              <Card.Title className="fs-3">
                {formatarMoeda(inadimplencia?.totalVencidoOriginal ?? 0)}
              </Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Subtitle className="text-muted">Encargos pendentes</Card.Subtitle>
              <Card.Title className="fs-3 text-danger">
                {formatarMoeda(inadimplencia?.totalEncargosVencidos ?? 0)}
              </Card.Title>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        <Col md={6}>
          <GraficoRecebimentos dados={recebimentos} />
        </Col>
        <Col md={6}>
          <GraficoContratosStatus dados={contratosStatus} />
        </Col>
      </Row>
    </>
  );
}
