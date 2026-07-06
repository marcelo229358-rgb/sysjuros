import Button from 'react-bootstrap/Button';

import { Cliente } from '../../api/types';

import { TabelaPaginada } from '../common/TabelaPaginada';

import { MobileDataCard } from '../common/MobileDataCard';

import { PaginacaoMeta } from '../../api/types';



interface Props {

  clientes: Cliente[];

  meta?: PaginacaoMeta;

  onPaginaChange: (pagina: number) => void;

  onEditar: (cliente: Cliente) => void;

  onExcluir?: (cliente: Cliente) => void;

}



export function ClienteTabela({ clientes, meta, onPaginaChange, onEditar, onExcluir }: Props) {

  return (

    <TabelaPaginada

      colunas={['Nome', 'CPF/CNPJ', 'E-mail', 'Telefone', 'Status', 'Ações']}

      meta={meta}

      onPaginaChange={onPaginaChange}

      mobileCards={clientes.map((cliente) => (

        <MobileDataCard

          key={cliente.id}

          titulo={cliente.nome}

          campos={[

            { label: 'CPF/CNPJ', valor: cliente.cpfCnpj },

            { label: 'E-mail', valor: cliente.email ?? '—' },

            { label: 'Telefone', valor: cliente.telefone ?? '—' },

            { label: 'Status', valor: cliente.ativo ? 'Ativo' : 'Inativo' },

          ]}

          acoes={

            <>

              <Button size="sm" variant="outline-primary" onClick={() => onEditar(cliente)}>

                Editar

              </Button>

              {onExcluir && cliente.ativo && (

                <Button size="sm" variant="outline-danger" onClick={() => onExcluir(cliente)}>

                  Excluir

                </Button>

              )}

            </>

          }

        />

      ))}

    >

      {clientes.map((cliente) => (

        <tr key={cliente.id}>

          <td>{cliente.nome}</td>

          <td>{cliente.cpfCnpj}</td>

          <td className="d-none d-lg-table-cell">{cliente.email ?? '—'}</td>

          <td>{cliente.telefone ?? '—'}</td>

          <td>{cliente.ativo ? 'Ativo' : 'Inativo'}</td>

          <td className="d-flex gap-2">

            <Button size="sm" variant="outline-primary" onClick={() => onEditar(cliente)}>

              Editar

            </Button>

            {onExcluir && cliente.ativo && (

              <Button size="sm" variant="outline-danger" onClick={() => onExcluir(cliente)}>

                Excluir

              </Button>

            )}

          </td>

        </tr>

      ))}

    </TabelaPaginada>

  );

}

