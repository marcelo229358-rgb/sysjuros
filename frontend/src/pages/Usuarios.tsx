import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';

export function Usuarios() {
  return (
    <Card>
      <Card.Header>Gestão de usuários</Card.Header>
      <Card.Body>
        <Alert variant="info" className="mb-0">
          Módulo de usuários será implementado na Fase 5. Apenas administradores terão acesso
          a esta funcionalidade.
        </Alert>
      </Card.Body>
    </Card>
  );
}
