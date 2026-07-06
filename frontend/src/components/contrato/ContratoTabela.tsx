import { Link } from 'react-router-dom';

import { Contrato } from '../../api/types';

import { TabelaPaginada } from '../common/TabelaPaginada';

import { MobileDataCard } from '../common/MobileDataCard';

import { BadgeStatus } from '../common/BadgeStatus';

import { formatarMoeda } from '../../utils/formatarMoeda';

import { formatarData } from '../../utils/formatarData';

import { PaginacaoMeta } from '../../api/types';



interface Props {

  contratos: Contrato[];

  meta?: PaginacaoMeta;

  onPaginaChange: (pagina: number) => void;

}



export function ContratoTabela({ contratos, meta, onPaginaChange }: Props) {

  return (

    <TabelaPaginada

      colunas={['Número', 'Cliente', 'Valor', 'Parcelas', 'Início', 'Status', 'Ações']}

      meta={meta}

      onPaginaChange={onPaginaChange}

      mobileCards={contratos.map((contrato) => (

        <MobileDataCard

          key={contrato.id}

          titulo={

            <Link

              to={`/contratos/${contrato.id}`}

              data-testid={`link-contrato-${contrato.numero}`}

              className="text-decoration-none"

            >

              {contrato.numero}

            </Link>

          }

          campos={[

            { label: 'Cliente', valor: contrato.cliente?.nome ?? '—' },

            { label: 'Valor', valor: formatarMoeda(contrato.valorTotal) },

            { label: 'Parcelas', valor: contrato.numParcelas },

            { label: 'Início', valor: formatarData(contrato.dataInicio) },

            { label: 'Status', valor: <BadgeStatus status={contrato.status} /> },

          ]}

          acoes={

            <Link to={`/contratos/${contrato.id}`} className="btn btn-sm btn-outline-primary">

              Ver detalhe

            </Link>

          }

        />

      ))}

    >

      {contratos.map((contrato) => (

        <tr key={contrato.id}>

          <td>

            <Link

              to={`/contratos/${contrato.id}`}

              data-testid={`link-contrato-${contrato.numero}`}

              className="text-decoration-none fw-semibold"

            >

              {contrato.numero}

            </Link>

          </td>

          <td>{contrato.cliente?.nome ?? '—'}</td>

          <td>{formatarMoeda(contrato.valorTotal)}</td>

          <td>{contrato.numParcelas}</td>

          <td className="d-none d-lg-table-cell">{formatarData(contrato.dataInicio)}</td>

          <td>

            <BadgeStatus status={contrato.status} />

          </td>

          <td>

            <Link to={`/contratos/${contrato.id}`} className="btn btn-sm btn-outline-primary">

              Detalhe

            </Link>

          </td>

        </tr>

      ))}

    </TabelaPaginada>

  );

}

