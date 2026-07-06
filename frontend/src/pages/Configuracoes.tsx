import { useEffect, useState } from 'react';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { empresaApi } from '../api/empresa.api';
import { calcularValorAtualizado } from '../utils/calcularPreview';
import { formatarMoeda } from '../utils/formatarMoeda';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function Configuracoes() {
  const [taxaJurosMes, setTaxaJurosMes] = useState('1');
  const [taxaMulta, setTaxaMulta] = useState('2');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    empresaApi
      .obterConfiguracoes()
      .then((config) => {
        setTaxaJurosMes(String(config.taxaJurosMes));
        setTaxaMulta(String(config.taxaMulta));
      })
      .finally(() => setCarregando(false));
  }, []);

  const preview = calcularValorAtualizado({
    valorOriginal: 500,
    dataVencimento: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    dataReferencia: new Date(),
    taxaJurosMes: parseFloat(taxaJurosMes) || 0,
    taxaMulta: parseFloat(taxaMulta) || 0,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);
    try {
      await empresaApi.atualizarConfiguracoes({
        taxaJurosMes: parseFloat(taxaJurosMes),
        taxaMulta: parseFloat(taxaMulta),
      });
      setSucesso('Configurações salvas com sucesso!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErro(msg ?? 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <LoadingSpinner />;

  return (
    <RowCenter>
      <Card style={{ maxWidth: 520 }}>
        <Card.Header>Taxas de juros e multa</Card.Header>
        <Card.Body>
          {sucesso && <Alert variant="success">{sucesso}</Alert>}
          {erro && <Alert variant="danger">{erro}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Juros ao mês (%)</Form.Label>
              <Form.Control
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={taxaJurosMes}
                onChange={(e) => setTaxaJurosMes(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Multa (%)</Form.Label>
              <Form.Control
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={taxaMulta}
                onChange={(e) => setTaxaMulta(e.target.value)}
                required
              />
            </Form.Group>
            <div className="bg-body-tertiary rounded p-3 mb-3 small">
              <strong>Prévia:</strong> uma parcela de {formatarMoeda(500)} vencida há 10 dias
              ficaria em <strong>{formatarMoeda(preview.valorAtualizado)}</strong> com essas taxas.
            </div>
            <Button type="submit" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar configurações'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </RowCenter>
  );
}

function RowCenter({ children }: { children: React.ReactNode }) {
  return <div className="d-flex justify-content-center">{children}</div>;
}
