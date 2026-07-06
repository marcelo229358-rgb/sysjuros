import Button from 'react-bootstrap/Button';

import { Parcela } from '../../api/types';

import { TabelaPaginada } from '../common/TabelaPaginada';

import { MobileDataCard } from '../common/MobileDataCard';

import { BadgeStatus } from '../common/BadgeStatus';

import { formatarMoeda } from '../../utils/formatarMoeda';

import { formatarData } from '../../utils/formatarData';

import { PaginacaoMeta } from '../../api/types';



interface Props {

  parcelas: Parcela[];

  meta?: PaginacaoMeta;

  onPaginaChange?: (pagina: number) => void;

  onRegistrarPagamento?: (parcela: Parcela) => void;

  onEnviarCobranca?: (parcela: Parcela) => void;

  mostrarPagamento?: boolean;

  mostrarCobranca?: boolean;

}



export function ParcelaTabela({

  parcelas,

  meta,

  onPaginaChange,

  onRegistrarPagamento,

  onEnviarCobranca,

  mostrarPagamento,

  mostrarCobranca,

}: Props) {

  const temAcoes = mostrarPagamento || mostrarCobranca;



  const acoesParcela = (parcela: Parcela) =>

    parcela.status === 'PENDENTE' ? (

      <>

        {mostrarPagamento && onRegistrarPagamento && (

          <Button size="sm" variant="success" onClick={() => onRegistrarPagamento(parcela)}>

            Pagar

          </Button>

        )}

        {mostrarCobranca && onEnviarCobranca && (

          <Button

            size="sm"

            variant="outline-primary"

            data-testid="btn-enviar-cobranca"

            onClick={() => onEnviarCobranca(parcela)}

          >

            Cobrar

          </Button>

        )}

      </>

    ) : undefined;



  return (

    <TabelaPaginada

      colunas={[

        'Cliente',

        'Contrato',

        'Parcela',

        'Vencimento',

        'Original',

        'Atualizado',

        'Status',

        ...(temAcoes ? ['Ações'] : []),

      ]}

      meta={meta}

      onPaginaChange={onPaginaChange}

      mobileCards={parcelas.map((parcela) => (

        <MobileDataCard

          key={parcela.id}

          titulo={parcela.contrato?.cliente.nome ?? '—'}

          campos={[

            { label: 'Contrato', valor: parcela.contrato?.numero ?? '—' },

            { label: 'Parcela', valor: parcela.numero },

            { label: 'Vencimento', valor: formatarData(parcela.dataVencimento) },

            { label: 'Original', valor: formatarMoeda(parcela.valorOriginal) },

            { label: 'Atualizado', valor: formatarMoeda(parcela.valorAtualizado) },

            { label: 'Status', valor: <BadgeStatus status={parcela.status} tipo="parcela" /> },

          ]}

          acoes={acoesParcela(parcela)}

        />

      ))}

    >

      {parcelas.map((parcela) => (

        <tr key={parcela.id}>

          <td>{parcela.contrato?.cliente.nome ?? '—'}</td>

          <td>{parcela.contrato?.numero ?? '—'}</td>

          <td>{parcela.numero}</td>

          <td>{formatarData(parcela.dataVencimento)}</td>

          <td className="d-none d-lg-table-cell">{formatarMoeda(parcela.valorOriginal)}</td>

          <td>{formatarMoeda(parcela.valorAtualizado)}</td>

          <td>

            <BadgeStatus status={parcela.status} tipo="parcela" />

          </td>

          {temAcoes && (

            <td>

              <div className="d-flex gap-1 flex-wrap">

                {parcela.status === 'PENDENTE' && mostrarPagamento && onRegistrarPagamento && (

                  <Button size="sm" variant="success" onClick={() => onRegistrarPagamento(parcela)}>

                    Registrar pagamento

                  </Button>

                )}

                {parcela.status === 'PENDENTE' && mostrarCobranca && onEnviarCobranca && (

                  <Button

                    size="sm"

                    variant="outline-primary"

                    data-testid="btn-enviar-cobranca"

                    onClick={() => onEnviarCobranca(parcela)}

                  >

                    Enviar cobrança

                  </Button>

                )}

              </div>

            </td>

          )}

        </tr>

      ))}

    </TabelaPaginada>

  );

}

