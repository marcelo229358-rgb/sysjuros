import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { masterApiClient, MasterEmpresa } from '../../../api/master.api';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

type FinTab = 'resumo' | 'pagar' | 'receber' | 'pagamentos';

interface Props {
  onAlert: (tipo: 'erro' | 'sucesso', msg: string) => void;
}

export function MasterFinanceiroSection({ onAlert }: Props) {
  const [tab, setTab] = useState<FinTab>('resumo');
  const [resumo, setResumo] = useState<Record<string, number> | null>(null);
  const [lancamentos, setLancamentos] = useState<Array<Record<string, unknown>>>([]);
  const [pagamentos, setPagamentos] = useState<Array<Record<string, unknown>>>([]);
  const [empresas, setEmpresas] = useState<MasterEmpresa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState({
    descricao: '',
    valor: '',
    vencimento: '',
    empresaId: '',
  });

  async function carregar() {
    setCarregando(true);
    try {
      if (tab === 'resumo') {
        setResumo(await masterApiClient.financeiroResumo());
      } else if (tab === 'pagamentos') {
        setPagamentos(await masterApiClient.listarPagamentos());
      } else {
        const tipo = tab === 'pagar' ? 'PAGAR' : 'RECEBER';
        setLancamentos(await masterApiClient.listarLancamentos(tipo));
        if (empresas.length === 0) {
          setEmpresas(await masterApiClient.listarEmpresas());
        }
      }
    } catch {
      onAlert('erro', 'Erro ao carregar financeiro');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [tab]);

  async function criarLancamento(e: React.FormEvent) {
    e.preventDefault();
    const tipo = tab === 'pagar' ? 'PAGAR' : 'RECEBER';
    try {
      await masterApiClient.criarLancamento({
        tipo,
        descricao: form.descricao,
        valor: parseFloat(form.valor),
        vencimento: form.vencimento,
        empresaId: form.empresaId || null,
      });
      setForm({ descricao: '', valor: '', vencimento: '', empresaId: '' });
      onAlert('sucesso', 'Lançamento criado.');
      await carregar();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onAlert('erro', msg ?? 'Erro ao criar');
    }
  }

  async function marcarPago(id: string) {
    try {
      await masterApiClient.atualizarLancamento(id, { status: 'PAGO' });
      await carregar();
    } catch {
      onAlert('erro', 'Erro ao atualizar');
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir lançamento?')) return;
    try {
      await masterApiClient.excluirLancamento(id);
      await carregar();
    } catch {
      onAlert('erro', 'Erro ao excluir');
    }
  }

  return (
    <div className="master-card">
      <div className="master-tabs mb-3">
        {(['resumo', 'pagar', 'receber', 'pagamentos'] as FinTab[]).map((t) => (
          <button key={t} type="button" className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t === 'resumo'
              ? 'Resumo'
              : t === 'pagar'
                ? 'Contas a pagar'
                : t === 'receber'
                  ? 'Contas a receber'
                  : 'Pagamentos'}
          </button>
        ))}
      </div>

      {carregando ? (
        <LoadingSpinner />
      ) : tab === 'resumo' && resumo ? (
        <Row className="g-3">
          {Object.entries({
            MRR: resumo.mrr,
            ARR: resumo.arr,
            'Recebido mês': resumo.recebido_mes,
            'Despesas mês': resumo.despesas_mes,
            'Lucro mês': resumo.lucro_mes,
            'A receber': resumo.contas_receber_pendentes,
            'A pagar': resumo.contas_pagar_pendentes,
          }).map(([label, valor]) => (
            <Col md={4} key={label}>
              <div className="master-stat">
                <strong>
                  {label.startsWith('MRR') || label.includes('mês') || label.startsWith('A ')
                    ? `R$ ${Number(valor).toFixed(2)}`
                    : Number(valor)}
                </strong>
                <span>{label}</span>
              </div>
            </Col>
          ))}
        </Row>
      ) : tab === 'pagamentos' ? (
        <Table className="master-table table-dark table-borderless">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Empresa</th>
            </tr>
          </thead>
          <tbody>
            {pagamentos.map((p) => (
              <tr key={String(p.id)}>
                <td>{String(p.descricao)}</td>
                <td>R$ {Number(p.valor).toFixed(2)}</td>
                <td>{new Date(String(p.vencimento)).toLocaleDateString('pt-BR')}</td>
                <td>{(p.empresa as { nome?: string })?.nome ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <>
          <Form className="master-form mb-3" onSubmit={criarLancamento}>
            <Row className="g-2">
              <Col md={4}>
                <Form.Control
                  placeholder="Descrição"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  required
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  required
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  type="date"
                  value={form.vencimento}
                  onChange={(e) => setForm({ ...form, vencimento: e.target.value })}
                  required
                />
              </Col>
              {tab === 'receber' && (
                <Col md={3}>
                  <Form.Select
                    value={form.empresaId}
                    onChange={(e) => setForm({ ...form, empresaId: e.target.value })}
                  >
                    <option value="">Empresa (opcional)</option>
                    {empresas.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nome}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              )}
              <Col md={1}>
                <Button type="submit" className="master-btn-gold w-100">
                  +
                </Button>
              </Col>
            </Row>
          </Form>
          <Table className="master-table table-dark table-borderless">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l) => (
                <tr key={String(l.id)}>
                  <td>{String(l.descricao)}</td>
                  <td>R$ {Number(l.valor).toFixed(2)}</td>
                  <td>{new Date(String(l.vencimento)).toLocaleDateString('pt-BR')}</td>
                  <td>{String(l.status)}</td>
                  <td className="d-flex gap-1">
                    {l.status === 'PENDENTE' && (
                      <Button size="sm" variant="outline-success" onClick={() => marcarPago(String(l.id))}>
                        Pago
                      </Button>
                    )}
                    <Button size="sm" variant="outline-danger" onClick={() => excluir(String(l.id))}>
                      ×
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
}
