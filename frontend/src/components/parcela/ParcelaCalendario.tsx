import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import { Parcela } from '../../api/types';
import { formatarData } from '../../utils/formatarData';
import { formatarMoeda } from '../../utils/formatarMoeda';

interface Props {
  parcelas: Parcela[];
}

export function ParcelaCalendario({ parcelas }: Props) {
  const agrupadas = parcelas.reduce<Record<string, Parcela[]>>((acc, parcela) => {
    const chave = parcela.dataVencimento.split('T')[0];
    acc[chave] = acc[chave] ?? [];
    acc[chave].push(parcela);
    return acc;
  }, {});

  const datas = Object.keys(agrupadas).sort();

  return (
    <div className="row g-3">
      {datas.length === 0 && (
        <div className="col-12 text-muted">Nenhum vencimento na agenda</div>
      )}
      {datas.map((data) => (
        <div className="col-md-6 col-lg-4" key={data}>
          <Card>
            <Card.Header>{formatarData(data)}</Card.Header>
            <ListGroup variant="flush">
              {agrupadas[data].map((p) => (
                <ListGroup.Item key={p.id}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong>{p.contrato?.cliente.nome}</strong>
                      <div className="small text-muted">
                        {p.contrato?.numero} · #{p.numero}
                      </div>
                    </div>
                    <span>{formatarMoeda(p.valorOriginal)}</span>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </div>
      ))}
    </div>
  );
}
