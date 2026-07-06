import Card from 'react-bootstrap/Card';

export interface CampoMobile {
  label: string;
  valor: React.ReactNode;
}

interface Props {
  titulo?: React.ReactNode;
  campos: CampoMobile[];
  acoes?: React.ReactNode;
  testId?: string;
}

export function MobileDataCard({ titulo, campos, acoes, testId }: Props) {
  return (
    <Card className="mobile-data-card mb-2" data-testid={testId}>
      <Card.Body className="py-3">
        {titulo && <div className="fw-semibold mb-2">{titulo}</div>}
        <div className="mobile-data-card-campos">
          {campos.map((campo) => (
            <div key={campo.label} className="mobile-data-card-linha">
              <span className="mobile-data-card-label">{campo.label}</span>
              <span className="mobile-data-card-valor">{campo.valor}</span>
            </div>
          ))}
        </div>
        {acoes && <div className="mobile-data-card-acoes mt-3 d-flex gap-2 flex-wrap">{acoes}</div>}
      </Card.Body>
    </Card>
  );
}
