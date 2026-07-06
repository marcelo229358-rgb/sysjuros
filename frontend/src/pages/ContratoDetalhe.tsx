import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { contratoApi } from '../api/contrato.api';
import { parcelaApi } from '../api/parcela.api';
import { pagamentoApi } from '../api/pagamento.api';
import { pdfApi } from '../api/pdf.api';
import { Contrato, Parcela, Pagamento } from '../api/types';
import { ContratoParcelasDetalhe } from '../components/contrato/ContratoParcelasDetalhe';
import { PagamentoModal } from '../components/pagamento/PagamentoModal';
import { BadgeStatus } from '../components/common/BadgeStatus';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { usePermissao } from '../hooks/usePermissao';
import { formatarMoeda } from '../utils/formatarMoeda';
import { formatarData } from '../utils/formatarData';

export function ContratoDetalhe() {
  const { id } = useParams();
  const { podeRegistrarPagamento } = usePermissao();
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [parcelaPagamento, setParcelaPagamento] = useState<Parcela | null>(null);
  const [exportandoExtrato, setExportandoExtrato] = useState(false);

  const carregar = useCallback(async () => {
    if (!id) return;
    setCarregando(true);
    try {
      setContrato(await contratoApi.obter(id));
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function abrirPagamento(parcelaId: string) {
    const parcela = await parcelaApi.obter(parcelaId);
    setParcelaPagamento(parcela);
  }

  async function registrarPagamento(data: Parameters<typeof pagamentoApi.registrar>[0]): Promise<Pagamento> {
    const pagamento = await pagamentoApi.registrar(data);
    await carregar();
    return pagamento;
  }

  async function exportarExtrato() {
    if (!id) return;
    setExportandoExtrato(true);
    try {
      await pdfApi.baixarExtrato(id);
    } finally {
      setExportandoExtrato(false);
    }
  }

  if (carregando) return <LoadingSpinner />;
  if (!contrato) return <div className="alert alert-warning">Contrato não encontrado</div>;

  return (
    <>
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h4 className="mb-1">{contrato.numero}</h4>
              <p className="text-muted mb-0">{contrato.cliente?.nome}</p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={exportarExtrato}
                disabled={exportandoExtrato}
                data-testid="btn-exportar-extrato"
              >
                {exportandoExtrato ? 'Gerando...' : 'Exportar extrato'}
              </Button>
              <BadgeStatus status={contrato.status} />
            </div>
          </div>
          <hr />
          <div className="row contrato-meta-grid">
            <div className="col-6 col-md-3">
              <small className="text-muted">Valor total</small>
              <div className="fw-semibold">{formatarMoeda(contrato.valorTotal)}</div>
            </div>
            <div className="col-6 col-md-3">
              <small className="text-muted">Parcelas</small>
              <div className="fw-semibold">{contrato.numParcelas}</div>
            </div>
            <div className="col-6 col-md-3">
              <small className="text-muted">Início</small>
              <div className="fw-semibold">{formatarData(contrato.dataInicio)}</div>
            </div>
            <div className="col-6 col-md-3">
              <small className="text-muted">Observações</small>
              <div className="text-truncate">{contrato.observacoes ?? '—'}</div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Parcelas</Card.Header>
        <Card.Body>
          <ContratoParcelasDetalhe
            parcelas={contrato.parcelas ?? []}
            mostrarPagamento={podeRegistrarPagamento}
            onRegistrarPagamento={abrirPagamento}
          />
        </Card.Body>
      </Card>

      <PagamentoModal
        show={!!parcelaPagamento}
        parcela={parcelaPagamento}
        onFechar={() => setParcelaPagamento(null)}
        onConfirmar={async (data) => {
          const pagamento = await registrarPagamento(data);
          return pagamento;
        }}
      />
    </>
  );
}
