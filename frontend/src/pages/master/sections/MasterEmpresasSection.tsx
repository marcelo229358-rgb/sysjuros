import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { masterApiClient, MasterEmpresa } from '../../../api/master.api';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

const DEMO_ID = '1030c59f-503a-4dfc-ad8b-66c802060cd0';

const formInicial = {
  nome: '',
  cnpj: '',
  email: '',
  telefone: '',
  taxaJurosMes: '30',
  taxaMulta: '2',
  plano: 'BASICO',
  adminNome: '',
  adminEmail: '',
  adminSenha: '',
};

interface Props {
  onAlert: (tipo: 'erro' | 'sucesso', msg: string) => void;
}

export function MasterEmpresasSection({ onAlert }: Props) {
  const [empresas, setEmpresas] = useState<MasterEmpresa[]>([]);
  const [form, setForm] = useState(formInicial);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [ultimaCriada, setUltimaCriada] = useState<{
    empresaId: string;
    adminEmail: string | null;
    loginUrl: string;
  } | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      setEmpresas(await masterApiClient.listarEmpresas());
    } catch {
      onAlert('erro', 'Erro ao carregar empresas');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      onAlert('erro', 'Informe o nome da empresa');
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
        plano: form.plano,
        ...(form.adminNome.trim() ? { adminNome: form.adminNome.trim() } : {}),
        ...(form.adminEmail.trim() ? { adminEmail: form.adminEmail.trim() } : {}),
        ...(form.adminSenha ? { adminSenha: form.adminSenha } : {}),
      });
      onAlert('sucesso', `Empresa "${result.empresa.nome}" criada.`);
      setUltimaCriada({
        empresaId: result.empresaId,
        adminEmail: result.adminEmail,
        loginUrl: result.loginUrl,
      });
      setForm(formInicial);
      await carregar();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onAlert('erro', msg ?? 'Erro ao criar empresa');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(empresa: MasterEmpresa) {
    try {
      await masterApiClient.atualizarEmpresa(empresa.id, { ativo: !empresa.ativo });
      await carregar();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onAlert('erro', msg ?? 'Erro ao atualizar');
    }
  }

  async function excluir(empresa: MasterEmpresa) {
    if (!confirm(`Excluir permanentemente a empresa "${empresa.nome}"?`)) return;
    try {
      await masterApiClient.excluirEmpresa(empresa.id);
      onAlert('sucesso', 'Empresa excluída.');
      await carregar();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onAlert('erro', msg ?? 'Erro ao excluir');
    }
  }

  function copiar(texto: string) {
    navigator.clipboard.writeText(texto);
    onAlert('sucesso', 'Copiado.');
  }

  return (
    <div className="master-grid">
      <div className="master-card">
        <h2>Empresas cadastradas</h2>
        {carregando ? (
          <LoadingSpinner />
        ) : (
          <div className="table-responsive">
            <Table className="master-table table-dark table-borderless align-middle mb-0">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Plano</th>
                  <th>Admin</th>
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
                    <td>{empresa.plano}</td>
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
                      <span
                        className={`master-badge ${
                          empresa.ativo ? 'master-badge--ativa' : 'master-badge--inativa'
                        }`}
                      >
                        {empresa.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="small text-muted">
                      {empresa.totais.usuarios} usu. · {empresa.totais.clientes} cli.
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
                        <Button
                          variant="outline-light"
                          size="sm"
                          onClick={() => copiar(empresa.id)}
                        >
                          ID
                        </Button>
                        {empresa.id !== DEMO_ID && (
                          <Button variant="outline-danger" size="sm" onClick={() => excluir(empresa)}>
                            Excluir
                          </Button>
                        )}
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
        <h2>Nova empresa</h2>
        <Form className="master-form" onSubmit={handleCriar}>
          <Form.Group>
            <Form.Label>Nome *</Form.Label>
            <Form.Control
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Plano</Form.Label>
            <Form.Select
              value={form.plano}
              onChange={(e) => setForm({ ...form, plano: e.target.value })}
            >
              <option value="BASICO">Básico — R$ 49,90</option>
              <option value="PRO">Pro — R$ 99,90</option>
              <option value="PREMIUM">Premium — R$ 149,90</option>
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>CNPJ</Form.Label>
            <Form.Control value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
          </Form.Group>
          <Form.Group>
            <Form.Label>E-mail empresa</Form.Label>
            <Form.Control
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Form.Group>
          <Row>
            <Col>
              <Form.Group>
                <Form.Label>Juros %</Form.Label>
                <Form.Control
                  value={form.taxaJurosMes}
                  onChange={(e) => setForm({ ...form, taxaJurosMes: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Multa %</Form.Label>
                <Form.Control
                  value={form.taxaMulta}
                  onChange={(e) => setForm({ ...form, taxaMulta: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>
          <hr className="border-secondary" />
          <p className="small text-muted">Admin (opcional)</p>
          <Form.Group>
            <Form.Label>Nome admin</Form.Label>
            <Form.Control
              value={form.adminNome}
              onChange={(e) => setForm({ ...form, adminNome: e.target.value })}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>E-mail admin</Form.Label>
            <Form.Control
              type="email"
              value={form.adminEmail}
              onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Senha admin</Form.Label>
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
          <div className="master-success-box mt-3">
            <div>
              <strong>ID:</strong> <code>{ultimaCriada.empresaId}</code>
            </div>
            <div className="mt-2">
              <a href={ultimaCriada.loginUrl} target="_blank" rel="noreferrer">
                {ultimaCriada.loginUrl}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
