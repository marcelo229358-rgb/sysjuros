import { useMemo, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import { Cliente } from '../../api/types';
import { adicionarMeses, formatarData } from '../../utils/formatarData';
import { formatarMoeda } from '../../utils/formatarMoeda';

interface Props {
  clientes: Cliente[];
  onSubmit: (data: {
    clienteId: string;
    numero: string;
    valorTotal: number;
    numParcelas: number;
    dataInicio: string;
    observacoes?: string;
  }) => Promise<void>;
  onCancelar: () => void;
}

function gerarPreviewParcelas(valorTotal: number, numParcelas: number, dataInicio: Date) {
  const valorParcela = Math.round((valorTotal / numParcelas) * 100) / 100;
  const preview = [];
  let soma = 0;

  for (let i = 1; i <= numParcelas; i++) {
    const valor = i === numParcelas ? valorTotal - soma : valorParcela;
    soma += valor;
    preview.push({
      numero: i,
      valor,
      vencimento: adicionarMeses(dataInicio, i - 1),
    });
  }

  return preview;
}

export function ContratoForm({ clientes, onSubmit, onCancelar }: Props) {
  const [clienteId, setClienteId] = useState('');
  const [numero, setNumero] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [numParcelas, setNumParcelas] = useState('1');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const preview = useMemo(() => {
    const total = parseFloat(valorTotal);
    const parcelas = parseInt(numParcelas, 10);
    if (!total || !parcelas || parcelas < 1) return [];
    return gerarPreviewParcelas(total, parcelas, new Date(dataInicio));
  }, [valorTotal, numParcelas, dataInicio]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await onSubmit({
        clienteId,
        numero,
        valorTotal: parseFloat(valorTotal),
        numParcelas: parseInt(numParcelas, 10),
        dataInicio: new Date(dataInicio).toISOString(),
        observacoes: observacoes || undefined,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErro(msg ?? 'Erro ao criar contrato');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      {erro && <div className="alert alert-danger">{erro}</div>}
      <Row className="g-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Cliente *</Form.Label>
            <Form.Select
              data-testid="select-cliente"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Número do contrato *</Form.Label>
            <Form.Control
              data-testid="input-numero-contrato"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Valor total *</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              min="0.01"
              data-testid="input-valor-total"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Nº parcelas *</Form.Label>
            <Form.Control
              type="number"
              min="1"
              data-testid="input-num-parcelas"
              value={numParcelas}
              onChange={(e) => setNumParcelas(e.target.value)}
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Data início *</Form.Label>
            <Form.Control
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              required
            />
          </Form.Group>
        </Col>
        <Col md={12}>
          <Form.Group>
            <Form.Label>Observações</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      {preview.length > 0 && (
        <div className="mt-4">
          <h6>Preview das parcelas</h6>
          <Table size="sm" bordered responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Valor</th>
                <th>Vencimento</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((p) => (
                <tr key={p.numero} data-testid="preview-parcela">
                  <td>{p.numero}</td>
                  <td>{formatarMoeda(p.valor)}</td>
                  <td>{formatarData(p.vencimento)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <div className="d-flex gap-2 mt-4">
        <Button type="submit" disabled={salvando} data-testid="btn-salvar-contrato">
          {salvando ? 'Salvando...' : 'Criar contrato'}
        </Button>
        <Button variant="secondary" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </Form>
  );
}
