import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { masterApiClient } from '../../../api/master.api';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

type MonTab = 'status' | 'logs';

interface Props {
  onAlert: (tipo: 'erro' | 'sucesso', msg: string) => void;
}

export function MasterMonitoramentoSection({ onAlert }: Props) {
  const [tab, setTab] = useState<MonTab>('status');
  const [monitoramento, setMonitoramento] = useState<Awaited<
    ReturnType<typeof masterApiClient.monitoramento>
  > | null>(null);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [moduloFiltro, setModuloFiltro] = useState('');
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    try {
      if (tab === 'status') {
        setMonitoramento(await masterApiClient.monitoramento());
      } else {
        setLogs(
          await masterApiClient.listarLogs({
            limit: 50,
            modulo: moduloFiltro || undefined,
          })
        );
      }
    } catch {
      onAlert('erro', 'Erro ao carregar monitoramento');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [tab, moduloFiltro]);

  return (
    <div className="master-card">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="master-tabs">
          <button type="button" className={tab === 'status' ? 'active' : ''} onClick={() => setTab('status')}>
            Status
          </button>
          <button type="button" className={tab === 'logs' ? 'active' : ''} onClick={() => setTab('logs')}>
            Logs de auditoria
          </button>
        </div>
        <Button variant="outline-light" size="sm" onClick={carregar}>
          Atualizar
        </Button>
      </div>

      {tab === 'logs' && (
        <Form.Group className="mb-3" style={{ maxWidth: 280 }}>
          <Form.Control
            placeholder="Filtrar por módulo..."
            value={moduloFiltro}
            onChange={(e) => setModuloFiltro(e.target.value)}
          />
        </Form.Group>
      )}

      {carregando ? (
        <LoadingSpinner />
      ) : tab === 'status' && monitoramento ? (
        <Row className="g-3">
          <Col md={4}>
            <div className="master-stat">
              <strong>{monitoramento.api}</strong>
              <span>API</span>
            </div>
          </Col>
          <Col md={4}>
            <div className="master-stat">
              <strong>{monitoramento.stats.empresas}</strong>
              <span>Empresas</span>
            </div>
          </Col>
          <Col md={4}>
            <div className="master-stat">
              <strong>{monitoramento.stats.empresasAtivas}</strong>
              <span>Ativas</span>
            </div>
          </Col>
          <Col md={4}>
            <div className="master-stat">
              <strong>{monitoramento.stats.usuarios}</strong>
              <span>Usuários</span>
            </div>
          </Col>
          <Col md={4}>
            <div className="master-stat">
              <strong>{monitoramento.stats.clientes}</strong>
              <span>Clientes</span>
            </div>
          </Col>
          <Col md={4}>
            <div className="master-stat">
              <strong>{monitoramento.stats.contratos}</strong>
              <span>Contratos</span>
            </div>
          </Col>
          <Col md={4}>
            <div className="master-stat">
              <strong>{monitoramento.memoria.heapUsedMb} MB</strong>
              <span>Heap</span>
            </div>
          </Col>
          <Col md={4}>
            <div className="master-stat">
              <strong>{monitoramento.memoria.rssMb} MB</strong>
              <span>RSS</span>
            </div>
          </Col>
        </Row>
      ) : (
        <Table className="master-table table-dark table-borderless">
          <thead>
            <tr>
              <th>Data</th>
              <th>Módulo</th>
              <th>Ação</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={String(log.id)}>
                <td className="small">
                  {new Date(String(log.criadoEm)).toLocaleString('pt-BR')}
                </td>
                <td>{String(log.modulo)}</td>
                <td>{String(log.acao)}</td>
                <td className="small text-muted">
                  {log.detalhes ? JSON.stringify(log.detalhes) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
