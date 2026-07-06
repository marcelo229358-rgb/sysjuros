import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import { ProximoVencimento } from '../../api/types';
import { formatarData } from '../../utils/formatarData';
import { formatarMoeda } from '../../utils/formatarMoeda';

interface Props {
  vencimentos: ProximoVencimento[];
}

export function ListaProximosVencimentos({ vencimentos }: Props) {
  return (
    <Card className="h-100">
      <Card.Header>Próximos vencimentos (7 dias)</Card.Header>
      <ListGroup variant="flush">
        {vencimentos.length === 0 && (
          <ListGroup.Item className="text-muted">Nenhum vencimento próximo</ListGroup.Item>
        )}
        {vencimentos.map((item) => (
          <ListGroup.Item key={item.parcelaId}>
            <div className="d-flex justify-content-between">
              <div>
                <strong>{item.clienteNome}</strong>
                <div className="small text-muted">
                  {item.contratoNumero} · Parcela {item.numero}
                </div>
              </div>
              <div className="text-end">
                <div>{formatarMoeda(item.valorOriginal)}</div>
                <small className="text-muted">{formatarData(item.dataVencimento)}</small>
              </div>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
}
