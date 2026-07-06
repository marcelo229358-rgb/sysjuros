import { useCallback, useEffect, useState } from 'react';

import Nav from 'react-bootstrap/Nav';

import Tab from 'react-bootstrap/Tab';

import Alert from 'react-bootstrap/Alert';

import { parcelaApi } from '../api/parcela.api';

import { pagamentoApi } from '../api/pagamento.api';

import { notificacaoApi } from '../api/notificacao.api';

import { Parcela, Pagamento, PaginacaoMeta } from '../api/types';

import { ParcelaTabela } from '../components/parcela/ParcelaTabela';

import { PagamentoModal } from '../components/pagamento/PagamentoModal';

import { ModalConfirmacao } from '../components/common/ModalConfirmacao';

import { LoadingSpinner } from '../components/common/LoadingSpinner';

import { usePermissao } from '../hooks/usePermissao';



export function Parcelas() {

  const { podeRegistrarPagamento, podeEnviarCobrancaWhatsapp } = usePermissao();

  const [aba, setAba] = useState('vencidas');

  const [vencidas, setVencidas] = useState<Parcela[]>([]);

  const [aVencer, setAVencer] = useState<Parcela[]>([]);

  const [todas, setTodas] = useState<Parcela[]>([]);

  const [meta, setMeta] = useState<PaginacaoMeta>();

  const [pagina, setPagina] = useState(1);

  const [carregando, setCarregando] = useState(true);

  const [parcelaPagamento, setParcelaPagamento] = useState<Parcela | null>(null);

  const [parcelaCobranca, setParcelaCobranca] = useState<Parcela | null>(null);

  const [enviandoCobranca, setEnviandoCobranca] = useState(false);

  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erroCobranca, setErroCobranca] = useState('');



  const carregar = useCallback(async () => {

    setCarregando(true);

    try {

      if (aba === 'vencidas') {

        setVencidas(await parcelaApi.vencidas());

      } else if (aba === 'a-vencer') {

        setAVencer(await parcelaApi.aVencer());

      } else {

        const result = await parcelaApi.listar({ page: pagina, limit: 10 });

        setTodas(result.data);

        setMeta(result.meta);

      }

    } finally {

      setCarregando(false);

    }

  }, [aba, pagina]);



  useEffect(() => {

    carregar();

  }, [carregar]);



  async function registrarPagamento(data: Parameters<typeof pagamentoApi.registrar>[0]): Promise<Pagamento> {

    const pagamento = await pagamentoApi.registrar(data);

    carregar();

    return pagamento;

  }



  async function confirmarCobrancaWhatsapp() {
    if (!parcelaCobranca) return;
    setEnviandoCobranca(true);
    setErroCobranca('');
    try {
      await notificacaoApi.enviarCobrancaWhatsapp(parcelaCobranca.id);
      setMensagemSucesso(`Cobrança enviada para ${parcelaCobranca.contrato?.cliente.nome ?? 'o cliente'}.`);
      setParcelaCobranca(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErroCobranca(msg ?? 'Não foi possível enviar a cobrança via WhatsApp.');
      setParcelaCobranca(null);
    } finally {
      setEnviandoCobranca(false);
    }
  }



  const parcelasAtivas = aba === 'vencidas' ? vencidas : aba === 'a-vencer' ? aVencer : todas;



  return (

    <>

      {mensagemSucesso && (
        <Alert variant="success" dismissible onClose={() => setMensagemSucesso('')}>
          {mensagemSucesso}
        </Alert>
      )}

      {erroCobranca && (
        <Alert variant="danger" dismissible onClose={() => setErroCobranca('')}>
          {erroCobranca}
        </Alert>
      )}



      <Tab.Container activeKey={aba} onSelect={(k) => k && setAba(k)}>

        <Nav variant="tabs" className="mb-4 nav-tabs-scroll">

          <Nav.Item>

            <Nav.Link eventKey="vencidas">Vencidas</Nav.Link>

          </Nav.Item>

          <Nav.Item>

            <Nav.Link eventKey="a-vencer">A vencer</Nav.Link>

          </Nav.Item>

          <Nav.Item>

            <Nav.Link eventKey="todas">Todas</Nav.Link>

          </Nav.Item>

        </Nav>

      </Tab.Container>



      {carregando ? (

        <LoadingSpinner />

      ) : (

        <ParcelaTabela

          parcelas={parcelasAtivas}

          meta={aba === 'todas' ? meta : undefined}

          onPaginaChange={aba === 'todas' ? setPagina : undefined}

          mostrarPagamento={podeRegistrarPagamento}

          mostrarCobranca={podeEnviarCobrancaWhatsapp}

          onRegistrarPagamento={setParcelaPagamento}

          onEnviarCobranca={setParcelaCobranca}

        />

      )}



      <PagamentoModal

        show={!!parcelaPagamento}

        parcela={parcelaPagamento}

        onFechar={() => setParcelaPagamento(null)}

        onConfirmar={registrarPagamento}

      />



      <ModalConfirmacao

        show={!!parcelaCobranca}

        titulo="Enviar cobrança via WhatsApp"

        mensagem={

          parcelaCobranca

            ? `Deseja enviar mensagem de cobrança para ${parcelaCobranca.contrato?.cliente.nome ?? 'o cliente'}?`

            : ''

        }

        carregando={enviandoCobranca}

        onConfirmar={confirmarCobrancaWhatsapp}

        onCancelar={() => setParcelaCobranca(null)}

      />

    </>

  );

}

