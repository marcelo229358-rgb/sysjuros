import { useCallback, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { contratoApi } from '../api/contrato.api';
import { clienteApi } from '../api/cliente.api';
import { Cliente, Contrato, PaginacaoMeta } from '../api/types';
import { ContratoForm } from '../components/contrato/ContratoForm';
import { ContratoTabela } from '../components/contrato/ContratoTabela';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function Contratos() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [meta, setMeta] = useState<PaginacaoMeta>();
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [contratosRes, clientesRes] = await Promise.all([
        contratoApi.listar({ page: pagina, limit: 10 }),
        clienteApi.listar({ limit: 100 }),
      ]);
      setContratos(contratosRes.data);
      setMeta(contratosRes.meta);
      setClientes(clientesRes.data.filter((c) => c.ativo));
    } finally {
      setCarregando(false);
    }
  }, [pagina]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function criar(data: Parameters<typeof contratoApi.criar>[0]) {
    await contratoApi.criar(data);
    setModalAberto(false);
    carregar();
  }

  return (
    <>
      <div className="d-flex justify-content-end mb-4">
        <Button onClick={() => setModalAberto(true)} data-testid="btn-novo-contrato">
          + Novo contrato
        </Button>
      </div>

      {carregando ? (
        <LoadingSpinner />
      ) : (
        <ContratoTabela contratos={contratos} meta={meta} onPaginaChange={setPagina} />
      )}

      <Modal show={modalAberto} onHide={() => setModalAberto(false)} size="lg" centered fullscreen="sm-down">
        <Modal.Header closeButton>
          <Modal.Title>Novo contrato</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ContratoForm
            clientes={clientes}
            onSubmit={criar}
            onCancelar={() => setModalAberto(false)}
          />
        </Modal.Body>
      </Modal>
    </>
  );
}
