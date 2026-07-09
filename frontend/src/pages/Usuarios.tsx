import { useCallback, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import { usuarioApi } from '../api/usuario.api';
import { PaginacaoMeta, PerfilUsuario, Usuario } from '../api/types';
import { UsuarioForm } from '../components/usuario/UsuarioForm';
import { UsuarioTabela } from '../components/usuario/UsuarioTabela';
import { CampoBusca } from '../components/common/CampoBusca';
import { ModalConfirmacao } from '../components/common/ModalConfirmacao';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../contexts/AuthContext';

export function Usuarios() {
  const { usuario: usuarioLogado } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [meta, setMeta] = useState<PaginacaoMeta>();
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [incluirInativos, setIncluirInativos] = useState(false);
  const buscaDebounced = useDebounce(busca);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [usuarioSenha, setUsuarioSenha] = useState<Usuario | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [usuarioExcluir, setUsuarioExcluir] = useState<Usuario | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const result = await usuarioApi.listar({
        page: pagina,
        limit: 10,
        nome: buscaDebounced || undefined,
        incluirInativos,
      });
      setUsuarios(result.data);
      setMeta(result.meta);
    } finally {
      setCarregando(false);
    }
  }, [pagina, buscaDebounced, incluirInativos]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirNovo() {
    setUsuarioEditando(null);
    setModalAberto(true);
  }

  function abrirEditar(usuario: Usuario) {
    setUsuarioEditando(usuario);
    setModalAberto(true);
  }

  function abrirRedefinirSenha(usuario: Usuario) {
    setUsuarioSenha(usuario);
    setNovaSenha('');
    setErroSenha('');
    setModalSenhaAberto(true);
  }

  async function salvar(data: {
    nome: string;
    email: string;
    senha?: string;
    perfil: PerfilUsuario;
    ativo?: boolean;
  }) {
    if (usuarioEditando) {
      await usuarioApi.atualizar(usuarioEditando.id, {
        nome: data.nome,
        email: data.email,
        perfil: data.perfil,
        ativo: data.ativo,
      });
    } else {
      await usuarioApi.criar({
        nome: data.nome,
        email: data.email,
        senha: data.senha!,
        perfil: data.perfil,
      });
    }
    setModalAberto(false);
    carregar();
  }

  async function confirmarRedefinirSenha() {
    if (!usuarioSenha) return;
    if (novaSenha.length < 6) {
      setErroSenha('A senha deve ter ao menos 6 caracteres');
      return;
    }

    setSalvandoSenha(true);
    setErroSenha('');
    try {
      await usuarioApi.redefinirSenha(usuarioSenha.id, novaSenha);
      setModalSenhaAberto(false);
      carregar();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErroSenha(msg ?? 'Erro ao redefinir senha');
    } finally {
      setSalvandoSenha(false);
    }
  }

  async function confirmarExclusao() {
    if (!usuarioExcluir) return;
    await usuarioApi.excluir(usuarioExcluir.id);
    setUsuarioExcluir(null);
    carregar();
  }

  return (
    <>
      <div className="page-toolbar">
        <div className="page-toolbar-busca">
          <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar por nome..." />
        </div>
        <div className="page-toolbar-acao d-flex align-items-center gap-3">
          <Form.Check
            type="switch"
            id="incluir-inativos"
            label="Incluir inativos"
            checked={incluirInativos}
            onChange={(e) => {
              setPagina(1);
              setIncluirInativos(e.target.checked);
            }}
          />
          <Button onClick={abrirNovo} data-testid="btn-novo-usuario">
            + Novo usuário
          </Button>
        </div>
      </div>

      {carregando ? (
        <LoadingSpinner />
      ) : (
        <UsuarioTabela
          usuarios={usuarios}
          meta={meta}
          usuarioLogadoId={usuarioLogado?.id}
          onPaginaChange={setPagina}
          onEditar={abrirEditar}
          onRedefinirSenha={abrirRedefinirSenha}
          onExcluir={setUsuarioExcluir}
        />
      )}

      <Modal show={modalAberto} onHide={() => setModalAberto(false)} size="lg" centered fullscreen="sm-down">
        <Modal.Header closeButton>
          <Modal.Title>{usuarioEditando ? 'Editar usuário' : 'Novo usuário'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <UsuarioForm
            usuario={usuarioEditando}
            onSubmit={salvar}
            onCancelar={() => setModalAberto(false)}
          />
        </Modal.Body>
      </Modal>

      <Modal show={modalSenhaAberto} onHide={() => setModalSenhaAberto(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Redefinir senha</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Defina uma senha temporária para <strong>{usuarioSenha?.nome}</strong>. O usuário
            precisará trocá-la no próximo acesso.
          </p>
          {erroSenha && <Alert variant="danger">{erroSenha}</Alert>}
          <Form.Group>
            <Form.Label>Nova senha temporária</Form.Label>
            <Form.Control
              type="password"
              data-testid="input-nova-senha-usuario"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              minLength={6}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setModalSenhaAberto(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmarRedefinirSenha} disabled={salvandoSenha} data-testid="btn-confirmar-senha-usuario">
            {salvandoSenha ? 'Salvando...' : 'Redefinir senha'}
          </Button>
        </Modal.Footer>
      </Modal>

      <ModalConfirmacao
        show={!!usuarioExcluir}
        titulo="Inativar usuário"
        mensagem={`Deseja inativar o usuário ${usuarioExcluir?.nome}?`}
        onConfirmar={confirmarExclusao}
        onCancelar={() => setUsuarioExcluir(null)}
      />
    </>
  );
}
