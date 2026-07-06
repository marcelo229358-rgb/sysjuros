import Button from 'react-bootstrap/Button';

import Table from 'react-bootstrap/Table';

import { Parcela } from '../../api/types';

import { MobileDataCard } from '../common/MobileDataCard';

import { BadgeStatus } from '../common/BadgeStatus';

import { formatarMoeda } from '../../utils/formatarMoeda';

import { formatarData } from '../../utils/formatarData';



interface Props {

  parcelas: Parcela[];

  onRegistrarPagamento?: (parcelaId: string) => void;

  mostrarPagamento?: boolean;

}



export function ContratoParcelasDetalhe({

  parcelas,

  onRegistrarPagamento,

  mostrarPagamento,

}: Props) {

  return (

    <>

      <div className="d-none d-md-block">

        <Table responsive hover>

          <thead>

            <tr>

              <th>#</th>

              <th>Vencimento</th>

              <th>Original</th>

              <th>Atualizado</th>

              <th>Status</th>

              {mostrarPagamento && <th>Ações</th>}

            </tr>

          </thead>

          <tbody>

            {parcelas.map((p) => (

              <tr key={p.id} data-testid="linha-parcela">

                <td>{p.numero}</td>

                <td>{formatarData(p.dataVencimento)}</td>

                <td>{formatarMoeda(p.valorOriginal)}</td>

                <td>{formatarMoeda(p.valorAtualizado)}</td>

                <td>

                  <BadgeStatus status={p.status} tipo="parcela" />

                </td>

                {mostrarPagamento && (

                  <td>

                    {p.status === 'PENDENTE' && onRegistrarPagamento && (

                      <Button

                        size="sm"

                        variant="success"

                        data-testid="btn-registrar-pagamento"

                        onClick={() => onRegistrarPagamento(p.id)}

                      >

                        Registrar pagamento

                      </Button>

                    )}

                  </td>

                )}

              </tr>

            ))}

          </tbody>

        </Table>

      </div>



      <div className="d-md-none">

        {parcelas.map((p) => (

          <MobileDataCard

            key={p.id}

            testId="linha-parcela"

            titulo={`Parcela ${p.numero}`}

            campos={[

              { label: 'Vencimento', valor: formatarData(p.dataVencimento) },

              { label: 'Original', valor: formatarMoeda(p.valorOriginal) },

              { label: 'Atualizado', valor: formatarMoeda(p.valorAtualizado) },

              { label: 'Status', valor: <BadgeStatus status={p.status} tipo="parcela" /> },

            ]}

            acoes={

              mostrarPagamento && p.status === 'PENDENTE' && onRegistrarPagamento ? (

                <Button

                  size="sm"

                  variant="success"

                  data-testid="btn-registrar-pagamento"

                  onClick={() => onRegistrarPagamento(p.id)}

                >

                  Pagar

                </Button>

              ) : undefined

            }

          />

        ))}

      </div>

    </>

  );

}

