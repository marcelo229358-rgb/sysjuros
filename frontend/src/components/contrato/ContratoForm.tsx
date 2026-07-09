import { useMemo, useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import { Cliente } from '../../api/types';
import { formatarMoeda } from '../../utils/formatarMoeda';
import { useAuth } from '../../contexts/AuthContext';
import { gerarParcelasComJuros } from '../../utils/gerarParcelasComJuros';
import { calcularAmortizacao, ModoAmortizacao } from '../../utils/amortizacao';

interface ParcelaPreview {
  numero: number;
  valorPrincipal: number;
  valorJuros: number;
  valor: number;
  vencimento: string;
}

interface Props {
  clientes: Cliente[];
  onSubmit: (data: {
    clienteId: string;
    numero: string;
    valorTotal: number;
    numParcelas: number;
    dataInicio: string;
    taxaJurosMes?: number;
    taxaMulta?: number;
    observacoes?: string;
    valorAntecipado?: number;
    modoAmortizacao?: ModoAmortizacao;
    parcelaAmortizacao?: number;
    parcelas?: { numero: number; valorOriginal: number; dataVencimento: string }[];
  }) => Promise<void>;
  onCancelar: () => void;
}

function gerarNumeroContrato(): string {
  const agora = new Date();
  const data = agora.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(agora.getTime()).slice(-6);
  return `CT-${data}-${seq}`;
}

export function ContratoForm({ clientes, onSubmit, onCancelar }: Props) {
  const { empresa } = useAuth();
  const [clienteId, setClienteId] = useState('');
  const [numero] = useState(gerarNumeroContrato);
  const [valorTotal, setValorTotal] = useState('');
  const [numParcelas, setNumParcelas] = useState('1');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [taxaJurosMes, setTaxaJurosMes] = useState(String(empresa?.taxaJurosMes ?? 30));
  const [taxaMulta, setTaxaMulta] = useState(String(empresa?.taxaMulta ?? 2));
  const [observacoes, setObservacoes] = useState('');
  const [valorAntecipado, setValorAntecipado] = useState('');
  const [modoAmortizacao, setModoAmortizacao] = useState<ModoAmortizacao>('TOTAL');
  const [parcelaAmortizacao, setParcelaAmortizacao] = useState('1');
  const [parcelasEditaveis, setParcelasEditaveis] = useState<ParcelaPreview[]>([]);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const previewBase = useMemo(() => {
    const total = parseFloat(valorTotal);
    const parcelas = parseInt(numParcelas, 10);
    const taxa = parseFloat(taxaJurosMes) || 0;
    if (!total || !parcelas || parcelas < 1) return [];

    const geradas = gerarParcelasComJuros(total, parcelas, new Date(dataInicio), taxa);
    let preview: ParcelaPreview[] = geradas.map((p) => ({
      numero: p.numero,
      valorPrincipal: p.valorPrincipal,
      valorJuros: p.valorJuros,
      valor: p.valorTotal,
      vencimento: p.vencimento,
    }));

    const antecipado = parseFloat(valorAntecipado);
    if (antecipado > 0) {
      const atualizacoes = calcularAmortizacao(
        preview.map((p) => ({ id: String(p.numero), numero: p.numero, valorOriginal: p.valor })),
        antecipado,
        modoAmortizacao,
        parseInt(parcelaAmortizacao, 10) || 1
      );
      preview = preview.map((p) => {
        const upd = atualizacoes.find((a) => a.id === String(p.numero));
        return upd ? { ...p, valor: upd.valorOriginal } : p;
      });
    }

    return preview;
  }, [valorTotal, numParcelas, dataInicio, taxaJurosMes, valorAntecipado, modoAmortizacao, parcelaAmortizacao]);

  useEffect(() => {
    setParcelasEditaveis(previewBase);
  }, [previewBase]);

  useEffect(() => {
    const max = parcelasEditaveis.length;
    if (max > 0 && parseInt(parcelaAmortizacao, 10) > max) {
      setParcelaAmortizacao(String(max));
    }
  }, [parcelasEditaveis.length, parcelaAmortizacao]);

  function atualizarVencimento(numeroParcela: number, novaData: string) {
    setParcelasEditaveis((atual) =>
      atual.map((p) => (p.numero === numeroParcela ? { ...p, vencimento: novaData } : p))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const antecipado = parseFloat(valorAntecipado);
      await onSubmit({
        clienteId,
        numero,
        valorTotal: parseFloat(valorTotal),
        numParcelas: parseInt(numParcelas, 10),
        dataInicio: new Date(dataInicio).toISOString(),
        taxaJurosMes: parseFloat(taxaJurosMes),
        taxaMulta: parseFloat(taxaMulta),
        observacoes: observacoes || undefined,
        ...(antecipado > 0
          ? {
              valorAntecipado: antecipado,
              modoAmortizacao,
              parcelaAmortizacao: parseInt(parcelaAmortizacao, 10),
            }
          : {}),
        parcelas: parcelasEditaveis.map((p) => ({
          numero: p.numero,
          valorOriginal: p.valor,
          dataVencimento: new Date(p.vencimento).toISOString(),
        })),
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErro(msg ?? 'Erro ao criar contrato');
    } finally {
      setSalvando(false);
    }
  }

  const totalParcelas = parcelasEditaveis.reduce((s, p) => s + p.valor, 0);

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
            <Form.Label>Número do contrato</Form.Label>
            <Form.Control data-testid="input-numero-contrato" value={numero} readOnly className="bg-light" />
            <Form.Text className="text-muted">Gerado automaticamente</Form.Text>
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
        <Col md={4}>
          <Form.Group>
            <Form.Label>Taxa de juros (% ao mês) *</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              min="0"
              value={taxaJurosMes}
              onChange={(e) => setTaxaJurosMes(e.target.value)}
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Multa (%)</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              min="0"
              value={taxaMulta}
              onChange={(e) => setTaxaMulta(e.target.value)}
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

      <div className="mt-3 p-3 border rounded bg-body-tertiary">
        <h6 className="mb-3">Amortização antecipada (opcional)</h6>
        <Row className="g-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Valor adiantado (R$)</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 200"
                value={valorAntecipado}
                onChange={(e) => setValorAntecipado(e.target.value)}
              />
              <Form.Text className="text-muted">Reduz o saldo após calcular as parcelas com juros</Form.Text>
            </Form.Group>
          </Col>
          <Col md={8}>
            <Form.Group>
              <Form.Label>Aplicar amortização em</Form.Label>
              <div className="d-flex flex-column gap-2 mt-1">
                <Form.Check
                  type="radio"
                  id="amort-total"
                  name="modoAmortizacao"
                  label="Saldo total (redistribui entre todas as parcelas)"
                  checked={modoAmortizacao === 'TOTAL'}
                  onChange={() => setModoAmortizacao('TOTAL')}
                />
                <Form.Check
                  type="radio"
                  id="amort-parcela"
                  name="modoAmortizacao"
                  label="Parcela específica (diminui só a parcela escolhida)"
                  checked={modoAmortizacao === 'PARCELA_ESPECIFICA'}
                  onChange={() => setModoAmortizacao('PARCELA_ESPECIFICA')}
                />
              </div>
            </Form.Group>
            {parseFloat(valorAntecipado) > 0 && modoAmortizacao === 'PARCELA_ESPECIFICA' && parcelasEditaveis.length > 0 && (
              <Form.Group className="mt-2">
                <Form.Label>Parcela</Form.Label>
                <Form.Select
                  value={parcelaAmortizacao}
                  onChange={(e) => setParcelaAmortizacao(e.target.value)}
                >
                  {parcelasEditaveis.map((p) => (
                    <option key={p.numero} value={p.numero}>
                      Parcela {p.numero} — {formatarMoeda(p.valor)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
          </Col>
        </Row>
      </div>

      {parcelasEditaveis.length > 0 && (
        <div className="mt-4">
          <h6>
            Parcelas — vencimento editável{' '}
            <small className="text-muted fw-normal">
              (total: {formatarMoeda(totalParcelas)})
            </small>
          </h6>
          <Table size="sm" bordered responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Principal</th>
                <th>Juros</th>
                <th>Total</th>
                <th>Vencimento</th>
              </tr>
            </thead>
            <tbody>
              {parcelasEditaveis.map((p) => (
                <tr key={p.numero} data-testid="preview-parcela">
                  <td>{p.numero}</td>
                  <td>{formatarMoeda(p.valorPrincipal)}</td>
                  <td>{formatarMoeda(p.valorJuros)}</td>
                  <td className="fw-semibold">{formatarMoeda(p.valor)}</td>
                  <td>
                    <Form.Control
                      type="date"
                      size="sm"
                      value={p.vencimento}
                      onChange={(e) => atualizarVencimento(p.numero, e.target.value)}
                    />
                  </td>
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
