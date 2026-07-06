import Card from 'react-bootstrap/Card';
import { formatarMoeda } from '../../utils/formatarMoeda';

interface Props {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  variant?: string;
  testId?: string;
}

export function CardIndicador({ titulo, valor, subtitulo, variant = 'primary', testId }: Props) {
  const valorFormatado = typeof valor === 'number' ? formatarMoeda(valor) : valor;

  return (
    <Card className={`border-${variant} h-100`} data-testid={testId}>
      <Card.Body>
        <Card.Subtitle className="text-muted mb-2">{titulo}</Card.Subtitle>
        <Card.Title className={`fs-4 text-${variant}`} data-testid="valor">
          {valorFormatado}
        </Card.Title>
        {subtitulo && <small className="text-muted">{subtitulo}</small>}
      </Card.Body>
    </Card>
  );
}
