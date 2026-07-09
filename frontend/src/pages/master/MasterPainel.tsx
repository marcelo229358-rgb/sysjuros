import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useMasterAuth } from '../../contexts/MasterAuthContext';
import { masterApiClient, MasterEmpresa } from '../../api/master.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import '../../styles/master.scss';

type PainelSecao = 'empresas' | 'monitoramento';

const formInicial = {
  nome: '',
  cnpj: '',
  email: '',
  telefone: '',
  taxaJurosMes: '30',
  taxaMulta: '2',
  adminNome: '',
  adminEmail: '',
  adminSenha: '',
};

export function MasterPainel() {
  const { user, logout } = useMasterAuth();
  const navigate = useNavigate();
  const [secao, setSecao] = useState<PainelSecao>('empresas');
  const [empresas, setEmpresas] = useState<MasterEmpresa[]>([]);
  const [monitoramento, setMonitoramento] = useState<Awaited<
    ReturnType<typeof masterApiClient.monitoramento>
  > | null>(null);
  const [form, setForm] = useState(formInicial);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [ultimaCriada, setUltimaCriada] = useState<{
    empresaId: string;
    adminEmail: string | null;
    loginUrl: string;
  } | null>(null);

  async function carregarEmpresas() {
    setCarregando(true);
    try {
      const data = await masterApiClient.listarEmpresas();
      setEmpresas(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErro(msg ?? 'Erro ao carregar empresas');
    } finally {
      setCarregando(false);
    }
  }

  async function carregarMonitoramento() {
    try {
      const data = await masterApiClient.monitoramento();
      setMonitoramento(data);
    } catch {
      setErro('Erro ao carregar monitoramento');
    }
  }

  useEffect(() => {
    if (secao === 'empresas') {
      carregarEmpresas();
    } else {
      carregarMonitoramento();
    }
  }, [secao]);

  async function handleCriarEmpresa(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setUltimaCriada(null);

    if (!form.nome.trim() || form.nome.trim().length < 2) {
      setErro('Informe o nome da empresa (mín. 2 caracteres)');
      return;
    }

    setSalvando(true);

    try {
      const result = await masterApiClient.criarEmpresa({
        nome: form.nome.trim(),
        ...(form.cnpj.trim() ? { cnpj: form.cnpj.trim() } : {}),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        ...(form.telefone.trim() ? { telefone: form.telefone.trim() } : {}),
        taxaJurosMes: parseFloat(form.taxaJurosMes) || 30,
        taxaMulta: parseFloat(form.taxaMulta) || 2,
        ...(form.adminNome.trim() ? { adminNome: form.adminNome.trim() } : {}),
        ...(form.adminEmail.trim() ? { adminEmail: form.adminEmail.trim() } : {}),
        ...(form.adminSenha ? { adminSenha: form.adminSenha } : {}),
      });

      setSucesso(`Empresa "${result.empresa.nome}" criada com sucesso.`);
      setUltimaCriada({
        empresaId: result.empresaId,
        adminEmail: result.adminEmail,
        loginUrl: result.loginUrl,
      });
      setForm(formInicial);
      await carregarEmpresas();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErro(msg ?? 'Erro ao criar empresa');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(empresa: MasterEmpresa) {
    setErro('');
    try {
      await masterApiClient.atualizarEmpresa(empresa.id, { ativo: !empresa.ativo });
      await carregarEmpresas();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErro(msg ?? 'Erro ao atualizar empresa');
    }
  }

  function handleLogout() {
    logout();
    navigate('/master/login');
  }

  function copiar(texto: string) {
    navigator.clipboard.writeText(texto);
    setSucesso('Copiado para a área de transferência.');
  }

  return (
    <div className="master-shell">
      <header className="master-header">
        <h1>Plataforma Master — SysContabel</h1>
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">{user?.email}</span>
          <Button variant="outline-light" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      <div className="master-layout">
        <nav className="master-sidebar">
          <button
            type="button"
            className={`master-nav-btn ${secao === 'empresas' ? 'active' : ''}`}
            onClick={() => setSecao('empresas')}
          >
            Empresas
          </button>
          <button
            type="button"
            className={`master-nav-btn ${secao === 'monitoramento' ? 'active' : ''}`}
            onClick={() => setSecao('monitoramento')}
          >
            Monitoramento
          </button>
        </nav>

        <main className="master-main">
          {erro && <div className="alert alert-danger py-2">{erro}</div>}
          {sucesso && <div className="alert alert-success py-2">{sucesso}</div>}

          {secao === 'empresas' && (
            <div className="master-grid">
              <div className="master-card">
                <h2>Empresas cadastradas</h2>
                {carregando ? (
                  <LoadingSpinner />
                ) : empresas.length === 0 ? (
                  <p className="text-muted mb-0">Nenhuma empresa cadastrada ainda.</p>
                ) : (
                  <div className="table-responsive">
                    <Table className="master-table table-dark table-borderless align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Empresa</th>
                          <th>Admin</th>
                          <th>ID</th>
                          <th>Status</th>
                          <th>Dados</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {empresas.map((empresa) => (
                          <tr key={empresa.id}>
                            <td>
                              <strong>{empresa.nome}</strong>
                              <div className="text-muted small">{empresa.email}</div>
                            </td>
                            <td>
                              {empresa.admin ? (
                                <>
                                  <div>{empresa.admin.nome}</div>
                                  <div className="text-muted small">{empresa.admin.email}</div>
                                </>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              <code className="small">{empresa.id.slice(0, 8)}…</code>
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 ms-1 text-warning"
                                onClick={() => copiar(empresa.id)}
                              >
                                copiar
                              </Button>
                            </td>
                            <td>
                              <span
                                className={`master-badge ${
                                  empresa.ativo ? 'master-badge--ativa' : 'master-badge--inativa'
                                }`}
                              >
                                {empresa.ativo ? 'Ativa' : 'Inativa'}
                              </span>
                            </td>
                            <td className="small text-muted">
                              {empresa.totais.usuarios} usu. · {empresa.totais.clientes} cli. ·{' '}
                              {empresa.totais.contratos} contr.
                            </td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => alternarStatus(empresa)}
                                >
                                  {empresa.ativo ? 'Suspender' : 'Ativar'}
                                </Button>
                                <Button
                                  variant="outline-light"
                                  size="sm"
                                  onClick={() => window.open(empresa.loginUrl, '_blank')}
                                >
                                  Login
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="master-card">
                <h2>Nova empresa SysContabel</h2>
                <Form className="master-form" onSubmit={handleCriarEmpresa}>
                  <Form.Group>
                    <Form.Label>Nome da empresa</Form.Label>
                    <Form.Control
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>CNPJ</Form.Label>
                    <Form.Control
                      value={form.cnpj}
                      onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>E-mail da empresa</Form.Label>
                    <Form.Control
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Telefone</Form.Label>
                    <Form.Control
                      value={form.telefone}
                      onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    />
                  </Form.Group>
                  <Row>
                    <Col>
                      <Form.Group>
                        <Form.Label>Juros %/mês</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.1"
                          value={form.taxaJurosMes}
                          onChange={(e) => setForm({ ...form, taxaJurosMes: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group>
                        <Form.Label>Multa %</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.1"
                          value={form.taxaMulta}
                          onChange={(e) => setForm({ ...form, taxaMulta: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr className="border-secondary" />
                  <p className="small text-muted mb-2">Administrador da empresa</p>

                  <Form.Group>
                    <Form.Label>Nome do admin</Form.Label>
                    <Form.Control
                      value={form.adminNome}
                      onChange={(e) => setForm({ ...form, adminNome: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>E-mail do admin</Form.Label>
                    <Form.Control
                      type="email"
                      value={form.adminEmail}
                      onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Senha do admin</Form.Label>
                    <Form.Control
                      type="password"
                      value={form.adminSenha}
                      onChange={(e) => setForm({ ...form, adminSenha: e.target.value })}
                    />
                  </Form.Group>

                  <Button type="submit" className="master-btn-gold w-100" disabled={salvando}>
                    {salvando ? 'Criando...' : 'Criar empresa'}
                  </Button>
                </Form>

                {ultimaCriada && (
                  <div className="master-success-box">
                    <div>
                      <strong>ID da empresa:</strong>{' '}
                      <code>{ultimaCriada.empresaId}</code>
                    </div>
                    <div className="mt-2">
                      <strong>Admin:</strong> {ultimaCriada.adminEmail ?? 'não cadastrado'}
                    </div>
                    <div className="mt-2">
                      <strong>Link de login:</strong>{' '}
                      <a href={ultimaCriada.loginUrl} target="_blank" rel="noreferrer">
                        {ultimaCriada.loginUrl}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {secao === 'monitoramento' && (
            <div className="master-card">
              <h2>Monitoramento</h2>
              {!monitoramento ? (
                <LoadingSpinner />
              ) : (
                <Row className="g-3">
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
                      <span>Memória heap</span>
                    </div>
                  </Col>
                </Row>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
