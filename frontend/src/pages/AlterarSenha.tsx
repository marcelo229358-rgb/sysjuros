import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { useAuth } from '../contexts/AuthContext';

export function AlterarSenha() {
  const { alterarSenha, usuario } = useAuth();
  const navigate = useNavigate();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    if (senhaNova.length < 6) {
      setErro('A nova senha deve ter ao menos 6 caracteres');
      return;
    }

    if (senhaNova !== confirmarSenha) {
      setErro('As senhas não conferem');
      return;
    }

    setCarregando(true);
    try {
      await alterarSenha(senhaAtual, senhaNova, confirmarSenha);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErro(msg ?? 'Não foi possível alterar a senha');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary px-3">
      <Card className="shadow w-100 login-card">
        <Card.Body className="p-4">
          <h3 className="text-center text-primary mb-1">Alterar senha</h3>
          <p className="text-center text-muted mb-4">
            Olá, {usuario?.nome}. Por segurança, defina uma nova senha antes de continuar.
          </p>

          {erro && <Alert variant="danger">{erro}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Senha atual</Form.Label>
              <Form.Control
                type="password"
                data-testid="input-senha-atual"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nova senha</Form.Label>
              <Form.Control
                type="password"
                data-testid="input-senha-nova"
                value={senhaNova}
                onChange={(e) => setSenhaNova(e.target.value)}
                minLength={6}
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Confirmar nova senha</Form.Label>
              <Form.Control
                type="password"
                data-testid="input-confirmar-senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                minLength={6}
                required
              />
            </Form.Group>
            <Button
              type="submit"
              className="w-100"
              disabled={carregando}
              data-testid="btn-alterar-senha"
            >
              {carregando ? 'Salvando...' : 'Salvar nova senha'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
