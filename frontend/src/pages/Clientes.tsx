import { useCallback, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { clienteApi } from '../api/cliente.api';
import { Cliente, PaginacaoMeta } from '../api/types';
import { ClienteForm } from '../components/cliente/ClienteForm';
import { ClienteTabela } from '../components/cliente/ClienteTabela';
import { CampoBusca } from '../components/common/CampoBusca';
import { ModalConfirmacao } from '../components/common/ModalConfirmacao';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';
import { usePermissao } from '../hooks/usePermissao';

export function Clientes() {
  const { podeExcluirCliente } = usePermissao();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [meta, setMeta] = useState<PaginacaoMeta>();
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const buscaDebounced = useDebounce(busca);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [clienteExcluir, setClienteExcluir] = useState<Cliente | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const result = await clienteApi.listar({
        page: pagina,
        limit: 10,
        nome: buscaDebounced || undefined,
      });
      setClientes(result.data);
      setMeta(result.meta);
    } finally {
      setCarregando(false);
    }
  }, [pagina, buscaDebounced]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirNovo() {
    setClienteEditando(null);
    setModalAberto(true);
  }

  function abrirEditar(cliente: Cliente) {
    setClienteEditando(cliente);
    setModalAberto(true);
  }

  async function salvar(data: Partial<Cliente>) {
    if (clienteEditando) {
      await clienteApi.atualizar(clienteEditando.id, data);
    } else {
      await clienteApi.criar(data);
    }
    setModalAberto(false);
    carregar();
  }

  async function confirmarExclusao() {
    if (!clienteExcluir) return;
    await clienteApi.excluir(clienteExcluir.id);
    setClienteExcluir(null);
    carregar();
  }

  return (
    <>
      <div className="page-toolbar">
        <div className="page-toolbar-busca">
          <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar por nome..." />
        </div>
        <div className="page-toolbar-acao">
          <Button onClick={abrirNovo} data-testid="btn-novo-cliente">
            + Novo cliente
          </Button>
        </div>
      </div>

      {carregando ? (
        <LoadingSpinner />
      ) : (
        <ClienteTabela
          clientes={clientes}
          meta={meta}
          onPaginaChange={setPagina}
          onEditar={abrirEditar}
          onExcluir={podeExcluirCliente ? setClienteExcluir : undefined}
        />
      )}

      <Modal show={modalAberto} onHide={() => setModalAberto(false)} size="lg" centered fullscreen="sm-down">
        <Modal.Header closeButton>
          <Modal.Title>{clienteEditando ? 'Editar cliente' : 'Novo cliente'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ClienteForm
            cliente={clienteEditando}
            onSubmit={salvar}
            onCancelar={() => setModalAberto(false)}
          />
        </Modal.Body>
      </Modal>

      <ModalConfirmacao
        show={!!clienteExcluir}
        titulo="Excluir cliente"
        mensagem={`Deseja inativar o cliente ${clienteExcluir?.nome}?`}
        onConfirmar={confirmarExclusao}
        onCancelar={() => setClienteExcluir(null)}
      />
    </>
  );
}
