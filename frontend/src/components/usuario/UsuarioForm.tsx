import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { PerfilUsuario, Usuario } from '../../api/types';

interface Props {
  usuario?: Usuario | null;
  onSubmit: (data: {
    nome: string;
    email: string;
    senha?: string;
    perfil: PerfilUsuario;
    ativo?: boolean;
  }) => Promise<void>;
  onCancelar: () => void;
}

const perfis: { value: PerfilUsuario; label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'OPERADOR', label: 'Operador' },
];

export function UsuarioForm({ usuario, onSubmit, onCancelar }: Props) {
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<PerfilUsuario>(usuario?.perfil ?? 'OPERADOR');
  const [ativo, setAtivo] = useState(usuario?.ativo ?? true);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSalvando(true);

    try {
      if (usuario) {
        await onSubmit({ nome, email, perfil, ativo });
      } else {
        if (senha.length < 6) {
          setErro('A senha deve ter ao menos 6 caracteres');
          setSalvando(false);
          return;
        }
        await onSubmit({ nome, email, senha, perfil });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErro(msg ?? 'Erro ao salvar usuário');
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
            <Form.Label>Nome *</Form.Label>
            <Form.Control
              data-testid="input-nome-usuario"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>E-mail *</Form.Label>
            <Form.Control
              type="email"
              data-testid="input-email-usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
        </Col>
        {!usuario && (
          <Col md={6}>
            <Form.Group>
              <Form.Label>Senha temporária *</Form.Label>
              <Form.Control
                type="password"
                data-testid="input-senha-usuario"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={6}
                required
              />
              <Form.Text className="text-muted">
                O usuário precisará trocar a senha no primeiro acesso.
              </Form.Text>
            </Form.Group>
          </Col>
        )}
        <Col md={usuario ? 6 : 6}>
          <Form.Group>
            <Form.Label>Perfil *</Form.Label>
            <Form.Select
              data-testid="select-perfil-usuario"
              value={perfil}
              onChange={(e) => setPerfil(e.target.value as PerfilUsuario)}
            >
              {perfis.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        {usuario && (
          <Col md={12}>
            <Form.Check
              type="switch"
              id="usuario-ativo"
              data-testid="switch-usuario-ativo"
              label="Usuário ativo"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
            />
          </Col>
        )}
      </Row>
      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button variant="outline-secondary" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando} data-testid="btn-salvar-usuario">
          {salvando ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </Form>
  );
}
