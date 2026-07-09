import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import { Parcela } from '../../api/types';
import { parcelaApi } from '../../api/parcela.api';
import { MobileDataCard } from '../common/MobileDataCard';
import { BadgeStatus } from '../common/BadgeStatus';
import { formatarMoeda } from '../../utils/formatarMoeda';
import { formatarData } from '../../utils/formatarData';

interface Props {
  parcelas: Parcela[];
  onRegistrarPagamento?: (parcelaId: string) => void;
  mostrarPagamento?: boolean;
  onParcelaAtualizada?: () => void;
}

export function ContratoParcelasDetalhe({
  parcelas,
  onRegistrarPagamento,
  mostrarPagamento,
  onParcelaAtualizada,
}: Props) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novaData, setNovaData] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvarVencimento(parcelaId: string) {
    setSalvando(true);
    try {
      await parcelaApi.atualizarVencimento(parcelaId, new Date(novaData).toISOString());
      setEditandoId(null);
      onParcelaAtualizada?.();
    } finally {
      setSalvando(false);
    }
  }

  function iniciarEdicao(parcela: Parcela) {
    setEditandoId(parcela.id);
    setNovaData(parcela.dataVencimento.split('T')[0]);
  }

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
              {(mostrarPagamento || onParcelaAtualizada) && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {parcelas.map((p) => (
              <tr key={p.id} data-testid="linha-parcela">
                <td>{p.numero}</td>
                <td>
                  {editandoId === p.id ? (
                    <div className="d-flex gap-1 align-items-center">
                      <Form.Control
                        type="date"
                        size="sm"
                        value={novaData}
                        onChange={(e) => setNovaData(e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={salvando}
                        onClick={() => salvarVencimento(p.id)}
                      >
                        OK
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditandoId(null)}>
                        ✕
                      </Button>
                    </div>
                  ) : (
                    formatarData(p.dataVencimento)
                  )}
                </td>
                <td>{formatarMoeda(p.valorOriginal)}</td>
                <td>{formatarMoeda(p.valorAtualizado)}</td>
                <td>
                  <BadgeStatus status={p.status} tipo="parcela" />
                </td>
                {(mostrarPagamento || onParcelaAtualizada) && (
                  <td className="d-flex gap-1">
                    {p.status === 'PENDENTE' && onParcelaAtualizada && editandoId !== p.id && (
                      <Button size="sm" variant="outline-secondary" onClick={() => iniciarEdicao(p)}>
                        Editar venc.
                      </Button>
                    )}
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
