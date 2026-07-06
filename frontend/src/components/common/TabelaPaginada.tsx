import Pagination from 'react-bootstrap/Pagination';
import Table from 'react-bootstrap/Table';
import { PaginacaoMeta } from '../../api/types';

interface Props {
  colunas: string[];
  meta?: PaginacaoMeta;
  onPaginaChange?: (pagina: number) => void;
  children: React.ReactNode;
  mobileCards?: React.ReactNode;
}

function Paginacao({ meta, onPaginaChange }: { meta: PaginacaoMeta; onPaginaChange: (p: number) => void }) {
  return (
    <Pagination className="justify-content-center mt-3">
      <Pagination.Prev disabled={meta.page <= 1} onClick={() => onPaginaChange(meta.page - 1)} />
      {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
        .slice(Math.max(0, meta.page - 3), meta.page + 2)
        .map((pagina) => (
          <Pagination.Item
            key={pagina}
            active={pagina === meta.page}
            onClick={() => onPaginaChange(pagina)}
          >
            {pagina}
          </Pagination.Item>
        ))}
      <Pagination.Next
        disabled={meta.page >= meta.totalPages}
        onClick={() => onPaginaChange(meta.page + 1)}
      />
    </Pagination>
  );
}

export function TabelaPaginada({ colunas, meta, onPaginaChange, children, mobileCards }: Props) {
  return (
    <>
      <div className="d-none d-md-block">
        <Table responsive hover className="align-middle">
          <thead>
            <tr>
              {colunas.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </Table>
      </div>

      {mobileCards && <div className="d-md-none">{mobileCards}</div>}

      {meta && meta.totalPages > 1 && onPaginaChange && (
        <Paginacao meta={meta} onPaginaChange={onPaginaChange} />
      )}
    </>
  );
}
