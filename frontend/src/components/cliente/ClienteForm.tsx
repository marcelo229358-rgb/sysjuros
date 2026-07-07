import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Cliente } from '../../api/types';
import { validarCpfCnpj, apenasDigitos } from '../../utils/validarCpfCnpj';

interface Props {
  cliente?: Cliente | null;
  onSubmit: (data: Partial<Cliente>) => Promise<void>;
  onCancelar: () => void;
}

export function ClienteForm({ cliente, onSubmit, onCancelar }: Props) {
  const [nome, setNome] = useState(cliente?.nome ?? '');
  const [cpfCnpj, setCpfCnpj] = useState(cliente?.cpfCnpj ?? '');
  const [email, setEmail] = useState(cliente?.email ?? '');
  const [telefone, setTelefone] = useState(cliente?.telefone ?? '');
  const [endereco, setEndereco] = useState(cliente?.endereco ?? '');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    const cpfInformado = cpfCnpj.trim();
    if (cpfInformado && !validarCpfCnpj(cpfInformado)) {
      setErro('CPF/CNPJ inválido');
      return;
    }

    setSalvando(true);
    try {
      await onSubmit({
        nome,
        ...(cpfInformado ? { cpfCnpj: apenasDigitos(cpfInformado) } : {}),
        email: email || undefined,
        telefone: telefone || undefined,
        endereco: endereco || undefined,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErro(msg ?? 'Erro ao salvar cliente');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      {erro && (
        <div
          className="alert alert-danger"
          data-testid={erro.toLowerCase().includes('cpf') ? 'erro-cpf-cnpj' : 'erro-formulario'}
        >
          {erro}
        </div>
      )}
      <Row className="g-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Nome *</Form.Label>
            <Form.Control
              data-testid="input-nome-cliente"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>CPF/CNPJ</Form.Label>
            <Form.Control
              data-testid="input-cpf-cnpj"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>E-mail</Form.Label>
            <Form.Control
              type="email"
              data-testid="input-email-cliente"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Telefone</Form.Label>
            <Form.Control value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Endereço</Form.Label>
            <Form.Control value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </Form.Group>
        </Col>
      </Row>
      <div className="d-flex gap-2 mt-4">
        <Button type="submit" disabled={salvando} data-testid="btn-salvar-cliente">
          {salvando ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button variant="secondary" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </Form>
  );
}
