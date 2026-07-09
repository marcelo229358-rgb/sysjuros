import { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { masterApiClient } from '../../../api/master.api';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

interface Props {
  onAlert: (tipo: 'erro' | 'sucesso', msg: string) => void;
}

export function MasterAssinaturasSection({ onAlert }: Props) {
  const [dados, setDados] = useState<{
    assinaturas: Array<Record<string, unknown>>;
    mrr: number;
    arr: number;
    stats: { total: number; ativas: number; inativas: number };
  } | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    try {
      setDados(await masterApiClient.listarAssinaturas());
    } catch {
      onAlert('erro', 'Erro ao carregar assinaturas');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function alterarPlano(id: string, plano: string) {
    try {
      await masterApiClient.atualizarAssinatura(id, { plano });
      await carregar();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onAlert('erro', msg ?? 'Erro ao atualizar plano');
    }
  }

  if (carregando || !dados) return <LoadingSpinner />;

  return (
    <>
      <Row className="g-3 mb-3">
        <Col md={3}>
          <div className="master-stat">
            <strong>R$ {dados.mrr.toFixed(2)}</strong>
            <span>MRR</span>
          </div>
        </Col>
        <Col md={3}>
          <div className="master-stat">
            <strong>R$ {dados.arr.toFixed(2)}</strong>
            <span>ARR</span>
          </div>
        </Col>
        <Col md={3}>
          <div className="master-stat">
            <strong>{dados.stats.ativas}</strong>
            <span>Ativas</span>
          </div>
        </Col>
        <Col md={3}>
          <div className="master-stat">
            <strong>{dados.stats.inativas}</strong>
            <span>Inativas</span>
          </div>
        </Col>
      </Row>

      <div className="master-card">
        <h2>Assinaturas</h2>
        <Table className="master-table table-dark table-borderless">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Plano</th>
              <th>Valor/mês</th>
              <th>Status</th>
              <th>Criada em</th>
            </tr>
          </thead>
          <tbody>
            {dados.assinaturas.map((a) => (
              <tr key={String(a.id)}>
                <td>{String(a.nome)}</td>
                <td>
                  <Form.Select
                    size="sm"
                    value={String(a.plano)}
                    onChange={(e) => alterarPlano(String(a.id), e.target.value)}
                  >
                    <option value="BASICO">Básico — R$ 49,90</option>
                    <option value="PRO">Pro — R$ 99,90</option>
                    <option value="PREMIUM">Premium — R$ 149,90</option>
                  </Form.Select>
                </td>
                <td>R$ {Number(a.valor_mensal).toFixed(2)}</td>
                <td>{a.ativo ? 'Ativa' : 'Inativa'}</td>
                <td className="small text-muted">
                  {new Date(String(a.criadoEm)).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
}
