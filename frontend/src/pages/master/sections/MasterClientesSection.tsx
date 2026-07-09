import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { masterApiClient } from '../../../api/master.api';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

interface Props {
  onAlert: (tipo: 'erro' | 'sucesso', msg: string) => void;
}

export function MasterClientesSection({ onAlert }: Props) {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [tab, setTab] = useState<'empresa' | 'usuario'>('empresa');
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('');
  const [itens, setItens] = useState<unknown[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    try {
      const [s, lista] = await Promise.all([
        masterApiClient.clientesStats(),
        masterApiClient.listarClientes({
          tipo: tab,
          search: busca || undefined,
          status: status || undefined,
        }),
      ]);
      setStats(s);
      setItens(lista.data);
    } catch {
      onAlert('erro', 'Erro ao carregar clientes');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [tab, busca, status]);

  async function atualizarEmpresa(id: string, payload: Record<string, unknown>) {
    try {
      await masterApiClient.atualizarCliente(id, payload);
      await carregar();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onAlert('erro', msg ?? 'Erro ao atualizar');
    }
  }

  return (
    <>
      {stats && (
        <Row className="g-3 mb-3">
          <Col md={3}>
            <div className="master-stat">
              <strong>{stats.empresas_total}</strong>
              <span>Empresas</span>
            </div>
          </Col>
          <Col md={3}>
            <div className="master-stat">
              <strong>{stats.empresas_ativas}</strong>
              <span>Ativas</span>
            </div>
          </Col>
          <Col md={3}>
            <div className="master-stat">
              <strong>{stats.usuarios_operacionais}</strong>
              <span>Usuários</span>
            </div>
          </Col>
          <Col md={3}>
            <div className="master-stat">
              <strong>{stats.admins_empresa}</strong>
              <span>Admins</span>
            </div>
          </Col>
        </Row>
      )}

      <div className="master-card">
        <div className="master-tabs mb-3">
          <button
            type="button"
            className={tab === 'empresa' ? 'active' : ''}
            onClick={() => setTab('empresa')}
          >
            Empresas (SaaS)
          </button>
          <button
            type="button"
            className={tab === 'usuario' ? 'active' : ''}
            onClick={() => setTab('usuario')}
          >
            Usuários da plataforma
          </button>
        </div>

        <Row className="g-2 mb-3">
          <Col md={6}>
            <Form.Control
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </Col>
          {tab === 'empresa' && (
            <Col md={4}>
              <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Todos os status</option>
                <option value="ativa">Ativas</option>
                <option value="inativa">Inativas</option>
              </Form.Select>
            </Col>
          )}
        </Row>

        {carregando ? (
          <LoadingSpinner />
        ) : tab === 'empresa' ? (
          <Table className="master-table table-dark table-borderless">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Plano</th>
                <th>Admin</th>
                <th>Clientes</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(itens as Array<Record<string, unknown>>).map((item) => (
                <tr key={String(item.id)}>
                  <td>
                    <strong>{String(item.nome)}</strong>
                    <div className="text-muted small">{String(item.email)}</div>
                  </td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={String(item.plano)}
                      onChange={(e) =>
                        atualizarEmpresa(String(item.id), { plano: e.target.value })
                      }
                    >
                      <option value="BASICO">Básico</option>
                      <option value="PRO">Pro</option>
                      <option value="PREMIUM">Premium</option>
                    </Form.Select>
                  </td>
                  <td className="small">
                    {(item.admin as { email?: string })?.email ?? '—'}
                  </td>
                  <td>{String(item.clientes_count)}</td>
                  <td>{item.ativo ? 'Ativa' : 'Inativa'}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-warning"
                      onClick={() =>
                        atualizarEmpresa(String(item.id), { ativo: !item.ativo })
                      }
                    >
                      {item.ativo ? 'Suspender' : 'Ativar'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Table className="master-table table-dark table-borderless">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Empresa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(itens as Array<Record<string, unknown>>).map((item) => (
                <tr key={String(item.id)}>
                  <td>{String(item.nome)}</td>
                  <td>{String(item.email)}</td>
                  <td>{String(item.perfil)}</td>
                  <td>{(item.empresa as { nome?: string })?.nome ?? '—'}</td>
                  <td>{item.ativo ? 'Ativo' : 'Inativo'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </>
  );
}
