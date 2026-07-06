import { useState } from 'react';

import Modal from 'react-bootstrap/Modal';

import Form from 'react-bootstrap/Form';

import Button from 'react-bootstrap/Button';

import { Parcela, Pagamento } from '../../api/types';

import { pdfApi } from '../../api/pdf.api';

import { formatarMoeda } from '../../utils/formatarMoeda';

import { formatarData } from '../../utils/formatarData';



interface Props {

  show: boolean;

  parcela: Parcela | null;

  onFechar: () => void;

  onConfirmar: (data: {

    parcelaId: string;

    valorPago: number;

    formaPagamento: string;

    observacoes?: string;

  }) => Promise<Pagamento>;

}



export function PagamentoModal({ show, parcela, onFechar, onConfirmar }: Props) {

  const [formaPagamento, setFormaPagamento] = useState('pix');

  const [observacoes, setObservacoes] = useState('');

  const [erro, setErro] = useState('');

  const [salvando, setSalvando] = useState(false);

  const [pagamentoRegistrado, setPagamentoRegistrado] = useState<Pagamento | null>(null);

  const [baixandoRecibo, setBaixandoRecibo] = useState(false);



  if (!parcela) return null;



  function fechar() {

    setPagamentoRegistrado(null);

    setErro('');

    setFormaPagamento('pix');

    setObservacoes('');

    onFechar();

  }



  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();

    setErro('');

    setSalvando(true);

    try {

      const pagamento = await onConfirmar({

        parcelaId: parcela!.id,

        valorPago: parcela!.valorAtualizado,

        formaPagamento,

        observacoes: observacoes || undefined,

      });

      setPagamentoRegistrado(pagamento);

    } catch (err: unknown) {

      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      setErro(msg ?? 'Erro ao registrar pagamento');

    } finally {

      setSalvando(false);

    }

  }



  async function baixarRecibo() {

    if (!pagamentoRegistrado) return;

    setBaixandoRecibo(true);

    try {

      await pdfApi.baixarRecibo(pagamentoRegistrado.id);

    } finally {

      setBaixandoRecibo(false);

    }

  }



  if (pagamentoRegistrado) {

    return (

      <Modal show={show} onHide={fechar} centered fullscreen="sm-down" data-testid="modal-pagamento-sucesso">

        <Modal.Header closeButton>

          <Modal.Title>Pagamento registrado</Modal.Title>

        </Modal.Header>

        <Modal.Body>

          <p className="text-success fw-semibold mb-3">Pagamento confirmado com sucesso!</p>

          <p>

            Valor: {formatarMoeda(pagamentoRegistrado.valorPago)} ·{' '}

            {formatarData(pagamentoRegistrado.dataPagamento)}

          </p>

        </Modal.Body>

        <Modal.Footer>

          <Button variant="outline-primary" onClick={baixarRecibo} disabled={baixandoRecibo} data-testid="btn-baixar-recibo">

            {baixandoRecibo ? 'Gerando PDF...' : 'Baixar recibo'}

          </Button>

          <Button variant="secondary" onClick={fechar}>

            Fechar

          </Button>

        </Modal.Footer>

      </Modal>

    );

  }



  return (

    <Modal show={show} onHide={fechar} centered fullscreen="sm-down" data-testid="modal-pagamento">

      <Modal.Header closeButton>

        <Modal.Title>Registrar pagamento</Modal.Title>

      </Modal.Header>

      <Form onSubmit={handleSubmit}>

        <Modal.Body>

          {erro && <div className="alert alert-danger">{erro}</div>}

          <p>

            <strong>Cliente:</strong> {parcela.contrato?.cliente.nome}

          </p>

          <p>

            <strong>Contrato:</strong> {parcela.contrato?.numero} · Parcela {parcela.numero}

          </p>

          <p>

            <strong>Vencimento:</strong> {formatarData(parcela.dataVencimento)}

          </p>

          <div className="bg-body-tertiary rounded p-3 mb-3">

            <div className="d-flex justify-content-between">

              <span>Valor original</span>

              <span>{formatarMoeda(parcela.valorOriginal)}</span>

            </div>

            {parcela.valorMulta > 0 && (

              <div className="d-flex justify-content-between text-danger">

                <span>Multa</span>

                <span>{formatarMoeda(parcela.valorMulta)}</span>

              </div>

            )}

            {parcela.valorJuros > 0 && (

              <div className="d-flex justify-content-between text-danger">

                <span>Juros</span>

                <span>{formatarMoeda(parcela.valorJuros)}</span>

              </div>

            )}

            <hr />

            <div className="d-flex justify-content-between fw-bold fs-5">

              <span>Total a pagar</span>

              <span className="text-success" data-testid="valor-atualizado-parcela">

                {formatarMoeda(parcela.valorAtualizado)}

              </span>

            </div>

          </div>

          <Form.Group className="mb-3">

            <Form.Label>Forma de pagamento</Form.Label>

            <Form.Select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>

              <option value="pix">PIX</option>

              <option value="boleto">Boleto</option>

              <option value="dinheiro">Dinheiro</option>

              <option value="cartao">Cartão</option>

            </Form.Select>

          </Form.Group>

          <Form.Group>

            <Form.Label>Observações</Form.Label>

            <Form.Control

              as="textarea"

              rows={2}

              value={observacoes}

              onChange={(e) => setObservacoes(e.target.value)}

            />

          </Form.Group>

        </Modal.Body>

        <Modal.Footer>

          <Button variant="secondary" onClick={fechar}>

            Cancelar

          </Button>

          <Button type="submit" variant="success" disabled={salvando} data-testid="btn-confirmar-pagamento">

            {salvando ? 'Registrando...' : `Confirmar ${formatarMoeda(parcela.valorAtualizado)}`}

          </Button>

        </Modal.Footer>

      </Form>

    </Modal>

  );

}

