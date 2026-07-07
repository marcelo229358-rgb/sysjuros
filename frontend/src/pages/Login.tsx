import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const isDev = import.meta.env.DEV;
  const [email, setEmail] = useState(isDev ? 'admin@empresademo.com.br' : '');
  const [senha, setSenha] = useState(isDev ? 'admin123' : '');
  const [empresaId, setEmpresaId] = useState(import.meta.env.VITE_EMPRESA_ID ?? '');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(email, senha, empresaId);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErro(msg ?? 'Credenciais inválidas');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary px-3">
      <Card className="shadow w-100 login-card">
        <Card.Body className="p-4">
          <h3 className="text-center text-primary mb-1">SysJuros</h3>
          <p className="text-center text-muted mb-4">Controle de cobranças e juros</p>
          {erro && <div className="alert alert-danger">{erro}</div>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>E-mail</Form.Label>
              <Form.Control
                type="email"
                data-testid="input-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Senha</Form.Label>
              <Form.Control
                type="password"
                data-testid="input-senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>ID da Empresa</Form.Label>
              <Form.Control
                data-testid="input-empresa-id"
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                required
              />
              <Form.Text className="text-muted">UUID da empresa (multi-tenant)</Form.Text>
            </Form.Group>
            <Button type="submit" className="w-100" disabled={carregando} data-testid="btn-login">
              {carregando ? 'Entrando...' : 'Entrar'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
