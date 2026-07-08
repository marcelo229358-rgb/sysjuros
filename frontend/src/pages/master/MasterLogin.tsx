import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useMasterAuth } from '../../contexts/MasterAuthContext';
import '../../styles/master.scss';

export function MasterLogin() {
  const { login, user } = useMasterAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/master', { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(email, senha);
      navigate('/master');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErro(msg ?? 'E-mail ou senha incorretos');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="master-shell min-vh-100 d-flex align-items-center justify-content-center px-3">
      <Card className="master-login-card shadow w-100">
        <Card.Body className="p-4">
          <h3 className="text-center mb-1" style={{ color: '#c9a962' }}>
            SysJuros Master
          </h3>
          <p className="text-center text-muted mb-4">Painel da plataforma — criar novas empresas</p>
          {erro && <div className="alert alert-danger py-2">{erro}</div>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>E-mail master</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Senha</Form.Label>
              <Form.Control
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </Form.Group>
            <Button type="submit" className="w-100 master-btn-gold" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar no painel'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
